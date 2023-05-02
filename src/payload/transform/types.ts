import {
  type EventEvent,
  type ExceptionEvent,
  type LogEvent,
  type MeasurementEvent,
  type Meta,
  type TransportItem,
  TransportItemType,
} from '@grafana/faro-core'

export type LogTransportItem =
  | ({ type: TransportItemType.LOG } & TransportItem<LogEvent>)
  | ({ type: TransportItemType.EXCEPTION } & TransportItem<ExceptionEvent>)
  | ({ type: TransportItemType.EVENT } & TransportItem<EventEvent>)
  | ({ type: TransportItemType.MEASUREMENT } & TransportItem<MeasurementEvent>)

export type LogLabels = Record<string, string>
export type LogValue = [string, string]

export type LogsTransform = {
  toLogValue: (transportItem: LogTransportItem) => LogValue | undefined
  toLogLabels: (transportItem: LogTransportItem) => LogLabels | undefined
}

export type GetLabelsFromMeta = (meta: Meta) => LogLabels
