import { LogLevel, TransportItemType } from '@grafana/faro-core'
import { describe, expect, it } from 'vitest'

import { mockInternalLogger } from '../../test-utils'
import type { LogTransportItem } from '../../types'
import { getLogTransforms } from './transform'

const logItem: LogTransportItem = {
  type: TransportItemType.LOG,
  payload: {
    context: {},
    level: LogLevel.LOG,
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
const matchLogLabels = {
  level: 'log',
  user_id: 'user-abc123',
}

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
const matchErrorLog = {
  level: 'error',
  user_id: 'user-abc123',
}

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
const matchEventLog = {
  level: 'info',
  user_id: 'user-abc123',
}

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
const matchMeasurementLog = {
  level: 'info',
  user_id: 'user-abc123',
}

describe('toLogLabels - with default getLabelsFromMeta ', () => {
  it('log transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger)

    expect(toLogLabels(logItem)).toEqual(matchLogLabels)
  })

  it('error transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger)

    expect(toLogLabels(errorItem)).toEqual(matchErrorLog)
  })

  it('event transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger)

    expect(toLogLabels(eventItem)).toEqual(matchEventLog)
  })

  it('measurement transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger)

    expect(toLogLabels(measurementLog)).toEqual(matchMeasurementLog)
  })
})

describe('toLogLabels - with custom getLabelsFromMeta', () => {
  it('log transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger, meta => ({
      app: meta.app?.name ?? 'fallback',
      page_id: meta.page?.id ?? 'homepage',
    }))

    expect(toLogLabels(logItem)).toEqual({ level: 'log', app: 'fallback', page_id: 'page-id' })
  })

  it('error transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger, meta => ({
      app: meta.app?.name ?? 'fallback',
      page_id: meta.page?.id ?? 'homepage',
    }))

    expect(toLogLabels(errorItem)).toEqual({ level: 'error', app: 'fallback', page_id: 'page-id' })
  })

  it('event transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger, meta => ({
      app: meta.app?.name ?? 'fallback',
      page_id: meta.page?.id ?? 'homepage',
    }))

    expect(toLogLabels(eventItem)).toEqual({ level: 'info', app: 'fallback', page_id: 'page-id' })
  })

  it('measurement transport item type', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger, meta => ({
      app: meta.app?.name ?? 'fallback',
      page_id: meta.page?.id ?? 'homepage',
    }))

    expect(toLogLabels(measurementLog)).toEqual({
      level: 'info',
      app: 'fallback',
      page_id: 'page-id',
    })
  })
})

describe('toLogLabels - with invalid transport item', () => {
  it('should return undefined if an invalid transport item is provided', () => {
    const { toLogLabels } = getLogTransforms(mockInternalLogger, meta => ({
      app: meta.app?.name ?? 'fallback',
      page_id: meta.page?.id ?? 'homepage',
    }))

    // @ts-expect-error
    expect(toLogLabels({ type: 'MyFakeTransportType' })).toBeUndefined()
  })
})
