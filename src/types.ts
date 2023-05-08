import {
  type EventEvent,
  type ExceptionEvent,
  type LogEvent,
  type MeasurementEvent,
  Meta,
  TraceEvent,
  type TransportItem as FaroTransportItem,
  TransportItemType,
} from '@grafana/faro-core'

export type QrynLokiTransportRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  headers?: Record<string, string>
}

export type QrynLokiTransportOptions = {
  /**
   * The qryn Cloud host URL
   */
  host: string
  /**
   * The qryn Cloud token with write permissions.
   *
   * It will be added as `X-API-Token` header
   */
  apiToken: string
  /**
   * Aditional options to pass to the fetch API
   */
  requestOptions?: QrynLokiTransportRequestOptions
  /**
   * Number of requests to buffer in total
   *
   * @default 30
   */
  bufferSize?: number
  /**
   * Number of requests to execute concurrently
   *
   * @default 5
   */
  concurrency?: number
  /**
   * If a rate limit response does not include a `Retry-After` header,
   * how many milliseconds to back off before attempting a request.
   * NOTE: intermediate events will be dropped, not buffered
   *
   * @default 5000
   */
  defaultRateLimitBackoffMs?: number
  /**
   * Get current date for mocking purposes in tests
   */
  getNow?: ClockFn
  /**
   * Function used to create the labels from the meta data.
   *
   * This will be used for logs, errors, events and measurements.
   *
   * @default (meta) => ({
   *    app: meta.app.name,
   *    environment: meta.app.environment,
   *    release: meta.app.release,
   *    browser_name: meta.browser.name
   *    user_id: meta.user.id
   * })
   */
  getLabelsFromMeta?: GetLabelsFromMeta
}

export type LogTransportItem =
  | ({ type: TransportItemType.LOG } & FaroTransportItem<LogEvent>)
  | ({ type: TransportItemType.EXCEPTION } & FaroTransportItem<ExceptionEvent>)
  | ({ type: TransportItemType.EVENT } & FaroTransportItem<EventEvent>)
  | ({ type: TransportItemType.MEASUREMENT } & FaroTransportItem<MeasurementEvent>)
export type TraceTransportItem = { type: TransportItemType.TRACE } & FaroTransportItem<TraceEvent>

export type TransportItem = LogTransportItem | TraceTransportItem

export type GetLabelsFromMeta = (meta: Meta) => Record<string, string>
export type MatchUrlDefinitions = Array<string | RegExp>
export type ClockFn = () => number
