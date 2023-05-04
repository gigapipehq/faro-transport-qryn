/* eslint-disable consistent-return */
import {
  EventEvent,
  ExceptionEvent,
  InternalLogger,
  LogEvent,
  LogLevel,
  MeasurementEvent,
  TransportItem,
  TransportItemType,
} from '@grafana/faro-core'

import { defaultLabels } from '../config'
import type {
  GetLabelsFromMeta,
  LogsTransform,
  LogTransportItem,
  LogValue,
  TraceTransportItem,
} from './types'
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

export function getTraceTransforms(internalLogger: InternalLogger) {
  function toSpanValue(transportItem: TraceTransportItem): undefined {
    const { type } = transportItem
    switch (type) {
      case TransportItemType.TRACE:
        return undefined

      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`)
        return undefined
    }
  }
  return { toSpanValue }
}
