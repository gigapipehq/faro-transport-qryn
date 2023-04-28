import { LogRecord } from './transform/types'

export interface QrynTransportPayload {
  readonly resourceLogs: Readonly<{ streams: LogRecord[] }>
  // Making it optional for now until we add support for traces
  readonly resourceSpans?: Readonly<unknown[]>
}
