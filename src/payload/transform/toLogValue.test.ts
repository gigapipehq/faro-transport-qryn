import { LogLevel, TransportItemType } from '@grafana/faro-core'
import { describe, expect, it } from 'vitest'

import { mockInternalLogger } from '../../test-utils'
import { getLogTransforms } from './transform'
import { type LogTransportItem } from './types'

const logItem: LogTransportItem = {
  type: TransportItemType.LOG,
  payload: {
    context: {},
    level: LogLevel.INFO,
    message: 'Faro was initialized',
    timestamp: '2023-01-27T09:53:01.035Z',
    trace: {
      trace_id: 'trace-id',
      span_id: 'span-id',
    },
  },
  meta: {
    view: {
      name: 'view-default',
    },
    page: {
      id: 'page-id',
      url: 'http://localhost:5173',
      attributes: {
        pageAttribute1: 'one',
        pageAttribute2: 'two',
      },
    },
    session: {
      id: 'session-abcd1234',
      attributes: {
        sessionAttribute1: 'one',
        sessionAttribute2: 'two',
      },
    },
    user: {
      email: 'user@example.com',
      id: 'user-abc123',
      username: 'user-joe',
      attributes: {
        userAttribute1: 'one',
        userAttribute2: 'two',
      },
    },
  },
} as const
const matchLogValue = ['1674813181035000000', '{"context":{},"message":"Faro was initialized"}']

const errorItem: LogTransportItem = {
  type: TransportItemType.EXCEPTION,
  payload: {
    timestamp: '2023-01-27T09:53:01.035Z',
    type: 'Error',
    value: 'Error message',
    stacktrace: {
      frames: [
        {
          filename: 'filename-one',
          function: 'throwError',
          colno: 21,
          lineno: 11,
        },
        {
          filename: 'filename-two',
          function: 'HTMLUnknownElement.callCallback2',
          colno: 2345,
          lineno: 42,
        },
      ],
    },
    trace: {
      trace_id: 'trace-id',
      span_id: 'span-id',
    } as const,
  },
  meta: {
    view: {
      name: 'view-default',
    },
    page: {
      id: 'page-id',
      url: 'http://localhost:5173',
      attributes: {
        pageAttribute1: 'one',
        pageAttribute2: 'two',
      },
    },
    session: {
      id: 'session-abcd1234',
      attributes: {
        sessionAttribute1: 'one',
        sessionAttribute2: 'two',
      },
    },
    user: {
      email: 'user@example.com',
      id: 'user-abc123',
      username: 'user-joe',
      attributes: {
        userAttribute1: 'one',
        userAttribute2: 'two',
      },
    } as const,
  } as const,
}
const matchErrorLog = [
  '1674813181035000000',
  '{"type":"Error","value":"Error message","stacktrace":{"frames":[{"filename":"filename-one","function":"throwError","colno":21,"lineno":11},{"filename":"filename-two","function":"HTMLUnknownElement.callCallback2","colno":2345,"lineno":42}]}}',
]

const eventItem: LogTransportItem = {
  type: TransportItemType.EVENT,
  payload: {
    name: 'event-name',
    domain: 'event-domain',
    timestamp: '2023-01-27T09:53:01.035Z',
    attributes: {
      eventAttribute1: 'one',
      eventAttribute2: 'two',
    },
    trace: {
      trace_id: 'trace-id',
      span_id: 'span-id',
    } as const,
  },
  meta: {
    view: {
      name: 'view-default',
    },
    page: {
      id: 'page-id',
      url: 'http://localhost:5173',
      attributes: {
        pageAttribute1: 'one',
        pageAttribute2: 'two',
      },
    },
    session: {
      id: 'session-abcd1234',
      attributes: {
        sessionAttribute1: 'one',
        sessionAttribute2: 'two',
      },
    },
    user: {
      email: 'user@example.com',
      id: 'user-abc123',
      username: 'user-joe',
      attributes: {
        userAttribute1: 'one',
        userAttribute2: 'two',
      },
    } as const,
  } as const,
}
const matchEventLog = [
  '1674813181035000000',
  '{"name":"event-name","domain":"event-domain","attributes":{"eventAttribute1":"one","eventAttribute2":"two"}}',
]

const measurementLog: LogTransportItem = {
  type: TransportItemType.MEASUREMENT,
  payload: {
    type: 'web-vitals',
    timestamp: '2023-01-27T09:53:01.035Z',
    values: { fcp: 213.7000000011176 },
    trace: {
      trace_id: 'trace-id',
      span_id: 'span-id',
    } as const,
  },
  meta: {
    view: {
      name: 'view-default',
    },
    page: {
      id: 'page-id',
      url: 'http://localhost:5173',
      attributes: {
        pageAttribute1: 'one',
        pageAttribute2: 'two',
      },
    },
    session: {
      id: 'session-abcd1234',
      attributes: {
        sessionAttribute1: 'one',
        sessionAttribute2: 'two',
      },
    },
    user: {
      email: 'user@example.com',
      id: 'user-abc123',
      username: 'user-joe',
      attributes: {
        userAttribute1: 'one',
        userAttribute2: 'two',
      },
    } as const,
  } as const,
}
const matchMeasurementLog = [
  '1674813181035000000',
  '{"type":"web-vitals","values":{"fcp":213.7000000011176}}',
]

describe('toLogLogValue', () => {
  it('builds a log value given a transport item', () => {
    const { toLogValue } = getLogTransforms(mockInternalLogger)

    expect(toLogValue(logItem)).toEqual(matchLogValue)
  })
})

describe('toErrorLogValue', () => {
  it('builds a log value given a transport item', () => {
    const { toLogValue } = getLogTransforms(mockInternalLogger)

    expect(toLogValue(errorItem)).toEqual(matchErrorLog)
  })
})

describe('toEventLogValue', () => {
  it('builds a log value given a transport item', () => {
    const { toLogValue } = getLogTransforms(mockInternalLogger)

    expect(toLogValue(eventItem)).toEqual(matchEventLog)
  })
})

describe('toMeasurementLogValue', () => {
  it('builds a log value given a transport item', () => {
    const { toLogValue } = getLogTransforms(mockInternalLogger)

    expect(toLogValue(measurementLog)).toEqual(matchMeasurementLog)
  })
})

describe('toLogValue', () => {
  it('should return undefined if an invalid transport item is provided', () => {
    const { toLogValue } = getLogTransforms(mockInternalLogger)

    // @ts-expect-error
    expect(toLogValue({ type: 'MyFakeTransportType' })).toBeUndefined()
  })
})
