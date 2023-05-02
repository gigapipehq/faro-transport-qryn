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

import type { GetLabelsFromMeta, LogsTransform, LogTransportItem, LogValue } from './types'

export function getLogTransforms(
  internalLogger: InternalLogger,
  getLabelsFromMeta: GetLabelsFromMeta,
): LogsTransform {
  function toLogLogValue(payload: TransportItem<LogEvent>['payload']): LogValue {
    // TODO: what to do with the trace?
    const { timestamp, trace, level, ...log } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [timeUnixNano.toString(), JSON.stringify(log)]
  }

  function toErrorLogValue(payload: TransportItem<ExceptionEvent>['payload']): LogValue {
    // TODO: what to do with the trace?
    const { timestamp, trace, ...error } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [timeUnixNano.toString(), JSON.stringify(error)]
  }

  function toEventLogValue(payload: TransportItem<EventEvent>['payload']): LogValue {
    // TODO: what to do with the trace?
    const { timestamp, trace, ...event } = payload
    const timeUnixNano = toTimeUnixNano(timestamp)

    return [timeUnixNano.toString(), JSON.stringify(event)]
  }

  function toMeasurementLogValue(payload: TransportItem<MeasurementEvent>['payload']): LogValue {
    // TODO: what to do with the trace?
    const { timestamp, trace, ...metric } = payload
    const timeUnixNano = toTimeUnixNano(payload.timestamp)

    return [timeUnixNano.toString(), JSON.stringify(metric)]
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
