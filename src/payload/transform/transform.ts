/* eslint-disable consistent-return */
import {
  type EventEvent,
  type ExceptionEvent,
  type InternalLogger,
  type LogEvent,
  LogLevel,
  type MeasurementEvent,
  type TransportItem,
  TransportItemType,
} from '@grafana/faro-core'
import {
  SemanticResourceAttributes,
  TelemetrySdkLanguageValues,
} from '@opentelemetry/semantic-conventions'

import type { GetLabelsFromMeta, LogTransportItem, TraceTransportItem } from '../../types'
import { isAttribute, toAttribute } from '../attribute'
import { defaultLabels } from '../config'
import type { LogsTransform, LogValue, Resource, ResourceSpans, TraceTransform } from './types'
import { fmt } from './utils'

export function getLogTransforms(
  internalLogger: InternalLogger,
  getLabelsFromMeta: GetLabelsFromMeta = defaultLabels,
): LogsTransform {
  function toLogLogValue(payload: TransportItem<LogEvent>['payload']): LogValue {
    const { timestamp, trace, message, context } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [
      timeUnixNano.toString(),
      fmt.stringify({
        message,
        context: JSON.stringify(context),
        ...(trace && { traceId: trace.trace_id }),
      }),
    ]
  }

  function toErrorLogValue(payload: TransportItem<ExceptionEvent>['payload']): LogValue {
    const { timestamp, trace, type, value, stacktrace } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        value,
        stacktrace: JSON.stringify(stacktrace),
        ...(trace && { traceId: trace.trace_id }),
      }),
    ]
  }

  function toEventLogValue(payload: TransportItem<EventEvent>['payload']): LogValue {
    const { timestamp, trace, name, attributes, domain } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [
      timeUnixNano.toString(),
      fmt.stringify({
        name,
        attributes: JSON.stringify(attributes),
        ...(domain && { domain }),
        ...(trace && { traceId: trace.trace_id }),
      }),
    ]
  }

  function toMeasurementLogValue(payload: TransportItem<MeasurementEvent>['payload']): LogValue {
    const { timestamp, trace, type, values } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        values: JSON.stringify(values),
        ...(trace && { traceId: trace.trace_id }),
      }),
    ]
  }

  function toLogValue(transportItem: LogTransportItem) {
    const { type, payload } = transportItem
    switch (type) {
      case TransportItemType.LOG:
        return toLogLogValue(payload)
      case TransportItemType.EXCEPTION:
        return toErrorLogValue(payload)
      case TransportItemType.EVENT:
        return toEventLogValue(payload)
      case TransportItemType.MEASUREMENT:
        return toMeasurementLogValue(payload)
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`)
        return undefined
    }
  }

  function toLogLabels(transportItem: LogTransportItem) {
    const { type, payload, meta } = transportItem
    switch (type) {
      case TransportItemType.LOG:
        return {
          level: payload.level,
          ...getLabelsFromMeta(meta),
        }
      case TransportItemType.EXCEPTION:
        return {
          level: LogLevel.ERROR,
          ...getLabelsFromMeta(meta),
        }
      case TransportItemType.EVENT:
        return {
          level: LogLevel.INFO,
          ...getLabelsFromMeta(meta),
        }
      case TransportItemType.MEASUREMENT:
        return {
          level: LogLevel.INFO,
          ...getLabelsFromMeta(meta),
        }
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`)
        return undefined
    }
  }

  function toTimeUnixNano(timestamp: string): number {
    return Date.parse(timestamp) * 1e6
  }

  return { toLogValue, toLogLabels }
}

/**
 * Seems currently to be missing in the semantic-conventions npm package.
 * See: https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/resource/semantic_conventions/README.md#todos
 *
 * Attributes are as defined by the Otel docs
 */
const SemanticBrowserAttributes = {
  BROWSER_BRANDS: 'browser.brands',
  BROWSER_PLATFORM: 'browser.platform',
  BROWSER_MOBILE: 'browser.mobile',
  BROWSER_USER_AGENT: 'browser.user_agent',
  BROWSER_LANGUAGE: 'browser.language',
} as const

export function getTraceTransforms(_internalLogger: InternalLogger): TraceTransform {
  function toResourceSpan(transportItem: TraceTransportItem): ResourceSpans {
    const resource = toResource(transportItem)
    const scopeSpans = transportItem.payload.resourceSpans?.[0]?.scopeSpans

    return {
      resource,
      scopeSpans: scopeSpans ?? [],
    }
  }

  return { toResourceSpan }
}

/**
 * Function borrowed from @grafana/transport-otlp-http package
 *
 * source: https://github.com/grafana/faro-web-sdk/blob/ddf9dcbbe188c7184e03558bb27443e00042d9d4/experimental/transport-otlp-http/src/payload/transform/transform.ts#L201
 *
 */
function toResource(transportItem: TraceTransportItem): Readonly<Resource> {
  const { browser, sdk, app } = transportItem.meta
  return {
    attributes: [
      toAttribute(SemanticBrowserAttributes.BROWSER_MOBILE, browser?.mobile),
      toAttribute(SemanticBrowserAttributes.BROWSER_USER_AGENT, browser?.userAgent),
      toAttribute(SemanticBrowserAttributes.BROWSER_LANGUAGE, browser?.language),
      toAttribute(SemanticBrowserAttributes.BROWSER_BRANDS, browser?.brands),
      toAttribute('browser.os', browser?.os),
      toAttribute('browser.name', browser?.name),
      toAttribute('browser.version', browser?.version),

      toAttribute(SemanticResourceAttributes.TELEMETRY_SDK_NAME, sdk?.name),
      toAttribute(SemanticResourceAttributes.TELEMETRY_SDK_VERSION, sdk?.version),
      sdk
        ? toAttribute(
            SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE,
            TelemetrySdkLanguageValues.WEBJS,
          )
        : undefined,
      toAttribute(SemanticResourceAttributes.SERVICE_NAME, app?.name),
      toAttribute(SemanticResourceAttributes.SERVICE_VERSION, app?.version),
      toAttribute(SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT, app?.environment),
    ].filter(isAttribute),
  }
}
