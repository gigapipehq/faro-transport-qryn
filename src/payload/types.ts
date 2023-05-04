import { TraceEvent } from '@grafana/faro-core'

import type { LogLabels, LogValue } from './transform/types'

type LogRecord = {
  stream: LogLabels
  values: LogValue[]
}

export type QrynTransportPayload = {
  resourceLogs: { streams: LogRecord[] }
  // resourceSpans: SpanValue[]
  resourceSpans: Required<TraceEvent>['resourceSpans']
}
