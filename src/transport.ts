/* eslint-disable no-restricted-syntax */
import {
  BaseTransport,
  createPromiseBuffer,
  PromiseBuffer,
  TransportItem,
} from '@grafana/faro-core'

import { QrynPayload, QrynTransportPayload } from './payload'
import { QrynLokiTransportOptions } from './types'

const DEFAULT_BUFFER_SIZE = 30
const DEFAULT_CONCURRENCY = 5 // chrome supports 10 total, firefox 17
const DEFAULT_RATE_LIMIT_BACKOFF_MS = 5000
const LOKI_LOGS_ENDPOINT = '/loki/api/v1/push'
const OTLP_TRACES_ENDPOINT = '/v1/traces'
export class QrynTransport extends BaseTransport {
  readonly name = '@gigapipe/faro-transport-qryn'

  readonly version = '1.0.0'

  private readonly promiseBuffer: PromiseBuffer<Response | void>

  private readonly rateLimitBackoffMs: number

  private readonly getNow: () => number

  private sendingTracesDisabledUntil: Date = new Date()

  private sendingLogsDisabledUntil: Date = new Date()

  private logsURL: string

  private tracesURL: string

  constructor(private options: QrynLokiTransportOptions) {
    super()
    this.rateLimitBackoffMs = options.defaultRateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS
    this.getNow = options.getNow ?? (() => Date.now())

    // TODO: make this configurable through an option that controls the prefered ingestion API for each signal
    this.logsURL = `${options.host}${LOKI_LOGS_ENDPOINT}`
    this.tracesURL = `${options.host}${OTLP_TRACES_ENDPOINT}`

    this.promiseBuffer = createPromiseBuffer({
      size: options.bufferSize ?? DEFAULT_BUFFER_SIZE,
      concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
    })
  }

  send(item: TransportItem | TransportItem[]): void {
    this.logDebug(`Sending item: ${JSON.stringify(item)}`)
    const qrynPayload = new QrynPayload(this.internalLogger)
    const items = Array.isArray(item) ? item : [item]

    items.forEach(i => qrynPayload.addResourceItem(i))
    this.logDebug('Current QrynPayload:', qrynPayload)
    this.sendPayload(qrynPayload.getPayload())
  }

  private sendPayload(payload: QrynTransportPayload): void {
    try {
      for (const [key, value] of Object.entries(payload)) {
        if (!QrynPayload.hasPayload(value)) {
          this.logWarn(`Dropping transport item due to missing payload: ${JSON.stringify(value)}`)
          // eslint-disable-next-line no-continue
          continue
        }

        let disabledUntil: Date | undefined
        let updateDisabledUntil = (_: Date) => {}
        let url = ''

        switch (key) {
          case 'resourceSpans':
            url = this.tracesURL
            disabledUntil = this.sendingTracesDisabledUntil
            updateDisabledUntil = (retryAfterDate: Date) => {
              this.sendingTracesDisabledUntil = retryAfterDate
            }
            break
          case 'resourceLogs':
            url = this.logsURL
            disabledUntil = this.sendingLogsDisabledUntil
            updateDisabledUntil = (retryAfterDate: Date) => {
              this.sendingLogsDisabledUntil = retryAfterDate
            }
            break
          default:
            break
        }

        if (disabledUntil && disabledUntil > new Date(Date.now())) {
          this.logWarn(
            `Dropping transport item due to too many requests. Backoff until ${disabledUntil}`,
          )
          return undefined
        }
        this.logDebug(`Sending value: ${JSON.stringify(value)}`, `to ${url}`)

        const body = JSON.stringify(value)

        const { requestOptions, apiToken } = this.options
        const { headers, ...restOfRequestOptions } = requestOptions ?? {}

        this.promiseBuffer.add(() =>
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-token': apiToken,
              ...(headers ?? {}),
            },
            body,
            keepalive: true,
            ...(restOfRequestOptions ?? {}),
          })
            .then(response => {
              if (response.status === 429) {
                updateDisabledUntil(this.getRetryAfterDate(response))
                this.logWarn(`Too many requests, backing off until ${disabledUntil}`)
              }

              return response
            })
            .catch(error => {
              this.logError('Failed sending payload to the receiver\n', JSON.parse(body), error)
            }),
        )
      }
    } catch (error) {
      this.logError(error)
    }
  }

  override getIgnoreUrls(): Array<string | RegExp> {
    const { tracesURL, logsURL } = this
    return [tracesURL, logsURL].filter(Boolean)
  }

  private getRetryAfterDate(response: Response): Date {
    const now = Date.now()
    const retryAfterHeader = response.headers.get('Retry-After')

    if (retryAfterHeader) {
      const delay = Number(retryAfterHeader)

      if (!Number.isNaN(delay)) {
        return new Date(delay * 1000 + now)
      }

      const date = Date.parse(retryAfterHeader)

      if (!Number.isNaN(date)) {
        return new Date(date)
      }
    }

    return new Date(now + this.rateLimitBackoffMs)
  }
}
