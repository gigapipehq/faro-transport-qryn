import { TransportItemType } from '@grafana/faro-core'
import { describe, expect, it } from 'vitest'

import { mockInternalLogger } from '../test-utils'
import type { LogTransportItem, TraceTransportItem } from '../types'
import { QrynPayload } from './QrynPayload'

describe('QrynPayload', () => {
  const logTransportItem: LogTransportItem = {
    type: TransportItemType.EVENT,
    payload: {
      name: 'event-name',
      domain: 'event-domain',
      timestamp: '2023-01-27T09:53:01.035Z',
      attributes: {
        eventAttribute1: 'one',
        eventAttribute2: 'two',
      },
    },
    meta: {},
  }

  const traceTransportItem: TraceTransportItem = {
    type: TransportItemType.TRACE,
    payload: {
      resourceSpans: [
        {
          resource: {
            attributes: [
              // Otel resource attributes left empty in this test because they are replaced by Faro Meta Attributes (these contain the Otel ones and add a few more)
            ],
            droppedAttributesCount: 0,
          },
          scopeSpans: [
            {
              scope: {
                name: '@opentelemetry/instrumentation-document-load',
                version: '0.31.0',
              },
              spans: [
                {
                  traceId: 'd6bba34860089d3a4ee58df0811b2f5f',
                  spanId: '22c85dd7b7c674e8',
                  parentSpanId: '16cff06b28240ca6',
                  name: 'resourceFetch',
                  kind: 1,
                  startTimeUnixNano: 1679329154423000000,
                  endTimeUnixNano: 1679329154449000000,
                  attributes: [
                    {
                      key: 'session_id',
                      value: {
                        stringValue: 'KBw5UzUuvF',
                      },
                    },
                    {
                      key: 'component',
                      value: {
                        stringValue: 'document-load',
                      },
                    },
                    {
                      key: 'http.url',
                      value: {
                        stringValue:
                          'http://localhost:5173/@fs/Users/marcoschaefer/Code/faro-web-sdk/packages/web-sdk/dist/esm/transports/otlp/index.js?t=1679329135042',
                      },
                    },
                    {
                      key: 'http.response_content_length',
                      value: {
                        intValue: 671,
                      },
                    },
                  ],
                  droppedAttributesCount: 0,
                  events: [
                    {
                      attributes: [],
                      name: 'test-event',
                      timeUnixNano: 1679329154423000000,
                      droppedAttributesCount: 0,
                    },
                  ],
                  droppedEventsCount: 0,
                  status: {
                    code: 0,
                  },
                  links: [],
                  droppedLinksCount: 0,
                },
              ],
            },
          ],
        },
      ],
    },
    meta: {
      browser: {
        name: 'browser-name',
        version: 'browser-v109.0',
        // …
      },
    },
  }

  it('creates an instance with empty QrynPayload', () => {
    const qrynpayload = new QrynPayload(mockInternalLogger)
    const payload = qrynpayload.getPayload()

    expect(payload).toEqual({
      resourceLogs: { streams: [] },
      resourceSpans: [],
    })
    expect(QrynPayload.hasPayload(payload.resourceLogs)).toBe(false)
  })

  it('should create an instance containing the correct resourceLogs for the given TransportItem', () => {
    const qrynpayload = new QrynPayload(mockInternalLogger, undefined, logTransportItem)
    const payload = qrynpayload.getPayload()

    expect(payload.resourceLogs.streams.length).toBe(1)
    expect(QrynPayload.hasPayload(payload.resourceLogs)).toBe(true)
    expect(payload.resourceLogs.streams[0]).toEqual({
      stream: {
        level: 'info',
      },
      values: [
        [
          '1674813181035000000',
          'name=event-name attributes={\\"eventAttribute1\\":\\"one\\",\\"eventAttribute2\\":\\"two\\"} domain=event-domain',
        ],
      ],
    })
  })

  it('should add a new value to an existing resource log because they have the same labels', () => {
    const transportItem = {
      ...logTransportItem,
      meta: { browser: { name: 'Firefox' } },
    }

    const qrynpayload = new QrynPayload(mockInternalLogger, undefined, transportItem)
    qrynpayload.addResourceItem({
      ...transportItem,
      payload: { ...transportItem.payload, name: 'event-name-2' },
    })
    const payload = qrynpayload.getPayload()

    expect(payload.resourceLogs.streams).toHaveLength(1)
    expect(QrynPayload.hasPayload(payload.resourceLogs)).toBe(true)
    expect(payload.resourceLogs.streams[0].values).toHaveLength(2)
  })

  it('should add the log value to a different resource log because they have different labels', () => {
    const transportItem = {
      ...logTransportItem,
      meta: { browser: { name: 'Firefox' } },
    }

    const qrynpayload = new QrynPayload(mockInternalLogger, undefined, transportItem)
    qrynpayload.addResourceItem({
      ...transportItem,
      meta: { browser: { name: 'Chrome' } },
      payload: { ...transportItem.payload, name: 'event-name-2' },
    })
    const payload = qrynpayload.getPayload()

    expect(payload.resourceLogs.streams).toHaveLength(2)
    expect(QrynPayload.hasPayload(payload.resourceLogs)).toBe(true)
    expect(payload.resourceLogs.streams[0].stream).not.toEqual(
      payload.resourceLogs.streams[1].stream,
    )
  })

  it('should add a ResourceSpan', () => {
    const otelPayload = new QrynPayload(mockInternalLogger, undefined, traceTransportItem)
    const payload = otelPayload.getPayload()

    expect(payload.resourceLogs.streams).toHaveLength(0)
    expect(payload.resourceSpans).toHaveLength(1)
    expect(payload.resourceSpans?.[0]).toMatchObject({
      resource: {
        attributes: [
          {
            key: 'browser.name',
            value: { stringValue: 'browser-name' },
          },
          {
            key: 'browser.version',
            value: { stringValue: 'browser-v109.0' },
          },
        ],
      }, // empty array because Trace TransportItem doesn't contain any Metas and we drop resources set by Otel and use the Faro Metas instead to derive the resource!
      // @ts-expect-error
      scopeSpans: traceTransportItem.payload.resourceSpans[0]?.scopeSpans,
    })
  })
})
