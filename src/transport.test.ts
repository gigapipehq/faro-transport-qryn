import { LogLevel, TransportItemType } from '@grafana/faro-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockInternalLogger } from './test-utils'
import { QrynTransport } from './transport'
import type { LogTransportItem, TraceTransportItem } from './types'

const logTransportItem: LogTransportItem = {
  type: TransportItemType.LOG,
  payload: {
    context: {},
    level: LogLevel.INFO,
    message: 'hi',
    timestamp: '2023-01-27T09:53:01.035Z',
  },
  meta: {
    app: {
      name: 'my-app',
    },
  },
} as const

const traceTransportItem: TraceTransportItem = {
  type: TransportItemType.TRACE,
  payload: {},
  meta: {},
} as const

const fetch = vi.fn(() => Promise.resolve({ status: 200 }))
vi.stubGlobal('fetch', fetch)

describe('QrynTransport', () => {
  afterEach(() => {
    fetch.mockClear()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it.each([
    {
      v: logTransportItem,
      type: 'resourceLogs',
      url: 'https://example.com/loki/api/v1/push',
      payload: {
        streams: [
          {
            stream: { level: 'info', app: 'my-app' },
            values: [['1674813181035000000', 'message=hi context={}']],
          },
        ],
      },
    },
    {
      v: traceTransportItem,
      type: 'resourceSpans',
      url: 'https://example.com/v1/traces',
      payload: [{ resource: { attributes: [] }, scopeSpans: [] }],
    },
  ])('Sends $type over fetch to the default endpoint', ({ v, url, payload }) => {
    const transport = new QrynTransport({
      host: 'https://example.com',
      apiToken: 'XXX',
    })
    transport.internalLogger = mockInternalLogger

    transport.send(v)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(url, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': 'XXX',
      },
      keepalive: true,
      method: 'POST',
    })
  })

  it('will not send events if the buffer size is exhausted', () => {
    const transport = new QrynTransport({
      host: 'https://example.com',
      apiToken: 'XXX',
      bufferSize: 3,
    })
    transport.internalLogger = mockInternalLogger

    for (let idx = 0; idx < 6; idx += 1) {
      transport.send(logTransportItem)
    }
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it.skip.each([
    { v: logTransportItem, type: 'resourceLogs' },
    { v: traceTransportItem, type: 'resourceSpans' },
  ])(
    'will back off on 429 for default interval if no retry-after header is present while sending $type',
    async ({ v, type }) => {
      vi.useFakeTimers()

      const transport = new QrynTransport({
        host: 'https://example.com',
        apiToken: 'XXX',
        defaultRateLimitBackoffMs: 3000,
      })
      transport.internalLogger = mockInternalLogger

      fetch.mockImplementationOnce(() =>
        Promise.resolve({ status: 429, headers: { get: () => '' } }),
      )

      await transport.send(v)
      expect(fetch).toHaveBeenCalledTimes(1)

      await transport.send(v)
      expect(fetch).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date(Date.now() + 1001).valueOf())
      await transport.send(v)
      expect(fetch).toHaveBeenCalledTimes(2)
    },
  )
})
