import { InternalLogger } from '@grafana/faro-core'

function noop(): void {}

export const mockInternalLogger: InternalLogger = {
  prefix: 'Faro',
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
}
