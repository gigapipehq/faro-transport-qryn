import type { ContextManager, TextMapPropagator } from '@opentelemetry/api'
import type { InstrumentationOption } from '@opentelemetry/instrumentation'
import type { ResourceAttributes } from '@opentelemetry/resources'

import { type GetLabelsFromMeta } from './payload/transform'

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

export type TracingInstrumentationOptions = {
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
   * Resource attributes passed to the default Resource of `@opentelemetry/resources`
   */
  resourceAttributes?: ResourceAttributes
  /**
   * Propagator to use as the global propagator
   *
   * @default W3CTraceContextPropagator
   */
  propagator?: TextMapPropagator
  /**
   * Context manager to use as the global context manager
   *
   * @default ZoneContextManager
   */
  contextManager?: ContextManager
  /**
   * Customize the list of instrumentations
   *
   * @default
   * [ DocumentLoadInstrumentation, FetchInstrumentation, XMLHttpRequestInstrumentation, UserInteractionInstrumentation]`
   */
  instrumentations?: InstrumentationOption[]
  /**
   * Options used to configure the default `FetchInstrumentation` and `XMLHttpRequestInstrumentation`
   */
  instrumentationOptions?: {
    propagateTraceHeaderCorsUrls: MatchUrlDefinitions
  }
}

export type MatchUrlDefinitions = Array<string | RegExp>
export type ClockFn = () => number
