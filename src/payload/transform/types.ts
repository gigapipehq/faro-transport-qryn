import type { IKeyValue, IResource, IResourceSpans } from '@opentelemetry/otlp-transformer'

import { LogTransportItem, TraceTransportItem } from '../../types'

export type LogValue = [string, string]

export interface Resource extends Partial<Pick<IResource, 'droppedAttributesCount'>> {
  attributes: IKeyValue[]
}
export interface ResourceSpans extends Omit<IResourceSpans, 'resource'> {
  resource: Resource
}

export type LogsTransform = {
  toLogValue: (transportItem: LogTransportItem) => LogValue | undefined
  toLogLabels: (transportItem: LogTransportItem) => Record<string, string> | undefined
}
export type TraceTransform = {
  toResourceSpan: (transportItem: TraceTransportItem) => ResourceSpans
}
