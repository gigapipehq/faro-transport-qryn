import { type InternalLogger, type TransportItem, TransportItemType } from '@grafana/faro-core'
import compare from 'just-compare'

import { getLogTransforms, type LogsTransform, type LogTransportItem } from './transform'
import type { QrynTransportPayload } from './types'

export class QrynPayload {
  private resourceLogs = { streams: [] } as QrynTransportPayload['resourceLogs']

  // TODO: implement handling for TransportItemType.TRACE
  // private resourceSpans = [] as QrynTransportPayload['resourceSpans']

  private getLogTransforms: LogsTransform
  // TODO: implement handling for TransportItemType.TRACE
  // private getTraceTransforms: TraceTransform

  constructor(private internalLogger: InternalLogger, transportItem?: TransportItem) {
    this.internalLogger = internalLogger

    this.getLogTransforms = getLogTransforms(this.internalLogger)
    // TODO: implement handling for TransportItemType.TRACE
    // this.getTraceTransforms = getTraceTransforms(this.internalLogger);

    if (transportItem) {
      this.addResourceItem(transportItem)
    }
  }

  getPayload(): QrynTransportPayload {
    return {
      resourceLogs: this.resourceLogs,
    } as const
  }

  addResourceItem(transportItem: TransportItem): void {
    const { type } = transportItem

    try {
      switch (type) {
        case TransportItemType.LOG:
        case TransportItemType.EXCEPTION:
        case TransportItemType.EVENT:
        case TransportItemType.MEASUREMENT: {
          const { toLogValue, toLogLabels } = this.getLogTransforms

          const currentLogStream = toLogLabels(transportItem as LogTransportItem)

          const existingResourceLogs = this.resourceLogs.streams.find(({ stream }) =>
            compare(stream, currentLogStream),
          )

          if (existingResourceLogs) {
            // Push the transportItem to the existing resource log
            const logValue = toLogValue(transportItem as LogTransportItem)
            if (logValue) existingResourceLogs.values.push(logValue)
          } else {
            // Push the transportItem to a new resource log
            const logLabels = toLogLabels(transportItem as LogTransportItem)
            const logValue = toLogValue(transportItem as LogTransportItem)

            if (logLabels && logValue)
              this.resourceLogs.streams.push({ stream: logLabels, values: [logValue] })
          }

          break
        }
        case TransportItemType.TRACE: {
          this.internalLogger.error('Trace is not supported')
          break
        }
        default:
          this.internalLogger?.error(`Unknown TransportItemType: ${type}`)
          break
      }
    } catch (error) {
      this.internalLogger?.error(error)
    }
  }

  static hasPayload(value: any): boolean {
    if (value && value.streams && value.streams.length > 0) {
      return true
    }

    return false
  }
}
