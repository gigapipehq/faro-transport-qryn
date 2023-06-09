import { type InternalLogger, TransportItemType } from '@grafana/faro-core'
import compare from 'just-compare'

import type { GetLabelsFromMeta, TransportItem } from '../types'
import {
  getLogTransforms,
  getTraceTransforms,
  type LogsTransform,
  type TraceTransform,
} from './transform'
import type { QrynTransportPayload } from './types'

export class QrynPayload {
  private resourceLogs = { streams: [] } as QrynTransportPayload['resourceLogs']

  private resourceSpans = [] as QrynTransportPayload['resourceSpans']

  private getLogTransforms: LogsTransform

  private getTraceTransforms: TraceTransform

  constructor(
    private internalLogger: InternalLogger,
    getLabelsFromMeta?: GetLabelsFromMeta,
    transportItem?: TransportItem,
  ) {
    this.internalLogger = internalLogger

    this.getLogTransforms = getLogTransforms(this.internalLogger, getLabelsFromMeta)
    this.getTraceTransforms = getTraceTransforms(this.internalLogger)

    if (transportItem) {
      this.addResourceItem(transportItem)
    }
  }

  getPayload(): QrynTransportPayload {
    return {
      resourceLogs: this.resourceLogs,
      resourceSpans: this.resourceSpans,
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

          const currentLogStream = toLogLabels(transportItem)

          const existingResourceLogs = this.resourceLogs.streams.find(({ stream }) =>
            compare(stream, currentLogStream),
          )

          if (existingResourceLogs) {
            // Push the transportItem to the existing resource log
            const logValue = toLogValue(transportItem)
            if (logValue) existingResourceLogs.values.push(logValue)
          } else {
            // Push the transportItem to a new resource log
            const logLabels = toLogLabels(transportItem)
            const logValue = toLogValue(transportItem)

            if (logLabels && logValue)
              this.resourceLogs.streams.push({ stream: logLabels, values: [logValue] })
          }

          break
        }
        case TransportItemType.TRACE: {
          const { toResourceSpan } = this.getTraceTransforms

          this.resourceSpans.push(toResourceSpan(transportItem))
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
    if (Array.isArray(value) && value.length > 0) {
      return true
    }
    return false
  }
}
