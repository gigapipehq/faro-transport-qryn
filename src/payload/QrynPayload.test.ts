import { TransportItemType } from '@grafana/faro-core'
import { describe, expect, it } from 'vitest'

import { mockInternalLogger } from '../test-utils'
import { QrynPayload } from './QrynPayload'
import { LogTransportItem } from './transform'

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

  it('creates an instance with empty QrynPayload', () => {
    const qrynpayload = new QrynPayload(mockInternalLogger)
    const payload = qrynpayload.getPayload()

    expect(payload).toEqual({
      resourceLogs: { streams: [] },
    })
  })

  it('should create an instance containing the correct resourceLogs for the given TransportItem', () => {
    const qrynpayload = new QrynPayload(mockInternalLogger, undefined, logTransportItem)
    const payload = qrynpayload.getPayload()

    expect(payload.resourceLogs.streams.length).toBe(1)
    expect(payload.resourceLogs.streams[0]).toEqual({
      stream: { level: 'info' },
      values: [
        [
          '1674813181035000000',
          '{"name":"event-name","domain":"event-domain","attributes":{"eventAttribute1":"one","eventAttribute2":"two"}}',
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
    expect(payload.resourceLogs.streams[0].stream).not.toEqual(
      payload.resourceLogs.streams[1].stream,
    )
  })
})
