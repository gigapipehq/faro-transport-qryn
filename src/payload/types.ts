import type { LogLabels, LogValue } from './transform/types'

export type LogRecord = {
  stream: LogLabels
  values: LogValue[]
}
export type QrynTransportPayload = {
  resourceLogs: { streams: LogRecord[] }
  // Making it optional for now until we add support for traces
  // resourceSpans?: unknown
}
