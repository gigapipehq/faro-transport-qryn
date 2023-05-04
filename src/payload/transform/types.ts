import {
  type EventEvent,
  type ExceptionEvent,
  type LogEvent,
  type MeasurementEvent,
  type Meta,
  TraceEvent,
  type TransportItem as FaroTransportItem,
  TransportItemType,
} from '@grafana/faro-core'

export type LogTransportItem =
  | ({ type: TransportItemType.LOG } & FaroTransportItem<LogEvent>)
  | ({ type: TransportItemType.EXCEPTION } & FaroTransportItem<ExceptionEvent>)
  | ({ type: TransportItemType.EVENT } & FaroTransportItem<EventEvent>)
  | ({ type: TransportItemType.MEASUREMENT } & FaroTransportItem<MeasurementEvent>)

export type LogLabels = Record<string, string>
export type LogValue = [string, string]

export type LogsTransform = {
  toLogValue: (transportItem: LogTransportItem) => LogValue | undefined
  toLogLabels: (transportItem: LogTransportItem) => LogLabels | undefined
}
export type TraceTransform = {
  toSpanValue: (transportItem: TraceTransportItem) => undefined
}

export type TraceTransportItem = { type: TransportItemType.TRACE } & FaroTransportItem<TraceEvent>

export type TransportItem = LogTransportItem | TraceTransportItem

export type GetLabelsFromMeta = (meta: Meta) => LogLabels
