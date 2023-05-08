import type { LogValue, ResourceSpans } from './transform/types'

type LogRecord = {
  stream: Record<string, string>
  values: LogValue[]
}

export type QrynTransportPayload = {
  resourceLogs: { streams: LogRecord[] }
  resourceSpans: ResourceSpans[]
}
