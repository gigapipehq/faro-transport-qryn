// src/transport.ts
import {
  BaseTransport,
  createPromiseBuffer
} from "@grafana/faro-core";

// src/payload/QrynPayload.ts
import { TransportItemType as TransportItemType2 } from "@grafana/faro-core";
import compare from "just-compare";

// src/payload/transform/transform.ts
import {
  LogLevel,
  TransportItemType
} from "@grafana/faro-core";

// src/payload/config/config.ts
function defaultLabels(meta) {
  return {
    ...meta.app && {
      app: meta.app.name,
      environment: meta.app.environment,
      release: meta.app.release
    },
    ...meta.browser && { browser_name: meta.browser.name },
    ...meta.user && { user_id: meta.user.id }
  };
}

// src/payload/transform/transform.ts
function getLogTransforms(internalLogger, getLabelsFromMeta = defaultLabels) {
  function toLogLogValue(payload) {
    const { timestamp, trace, level, ...log } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [timeUnixNano.toString(), JSON.stringify(log)];
  }
  function toErrorLogValue(payload) {
    const { timestamp, trace, ...error } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [timeUnixNano.toString(), JSON.stringify(error)];
  }
  function toEventLogValue(payload) {
    const { timestamp, trace, ...event } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [timeUnixNano.toString(), JSON.stringify(event)];
  }
  function toMeasurementLogValue(payload) {
    const { timestamp, trace, ...metric } = payload;
    const timeUnixNano = toTimeUnixNano(payload.timestamp);
    return [timeUnixNano.toString(), JSON.stringify(metric)];
  }
  function toLogValue(transportItem) {
    const { type, payload } = transportItem;
    switch (type) {
      case TransportItemType.LOG:
        return toLogLogValue(payload);
      case TransportItemType.EXCEPTION:
        return toErrorLogValue(payload);
      case TransportItemType.EVENT:
        return toEventLogValue(payload);
      case TransportItemType.MEASUREMENT:
        return toMeasurementLogValue(payload);
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  function toLogLabels(transportItem) {
    const { type, payload, meta } = transportItem;
    switch (type) {
      case TransportItemType.LOG:
        return {
          level: payload.level,
          ...getLabelsFromMeta(meta)
        };
      case TransportItemType.EXCEPTION:
        return {
          level: LogLevel.ERROR,
          ...getLabelsFromMeta(meta)
        };
      case TransportItemType.EVENT:
        return {
          level: LogLevel.INFO,
          ...getLabelsFromMeta(meta)
        };
      case TransportItemType.MEASUREMENT:
        return {
          level: LogLevel.INFO,
          ...getLabelsFromMeta(meta)
        };
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  function toTimeUnixNano(timestamp) {
    return Date.parse(timestamp) * 1e6;
  }
  return { toLogValue, toLogLabels };
}

// src/payload/QrynPayload.ts
var QrynPayload = class {
  // TODO: implement handling for TransportItemType.TRACE
  // private getTraceTransforms: TraceTransform
  constructor(internalLogger, getLabelsFromMeta, transportItem) {
    this.internalLogger = internalLogger;
    this.internalLogger = internalLogger;
    this.getLogTransforms = getLogTransforms(this.internalLogger, getLabelsFromMeta);
    if (transportItem) {
      this.addResourceItem(transportItem);
    }
  }
  resourceLogs = { streams: [] };
  // TODO: implement handling for TransportItemType.TRACE
  // private resourceSpans = [] as QrynTransportPayload['resourceSpans']
  getLogTransforms;
  getPayload() {
    return {
      resourceLogs: this.resourceLogs
    };
  }
  addResourceItem(transportItem) {
    const { type } = transportItem;
    try {
      switch (type) {
        case TransportItemType2.LOG:
        case TransportItemType2.EXCEPTION:
        case TransportItemType2.EVENT:
        case TransportItemType2.MEASUREMENT: {
          const { toLogValue, toLogLabels } = this.getLogTransforms;
          const currentLogStream = toLogLabels(transportItem);
          const existingResourceLogs = this.resourceLogs.streams.find(
            ({ stream }) => compare(stream, currentLogStream)
          );
          if (existingResourceLogs) {
            const logValue = toLogValue(transportItem);
            if (logValue)
              existingResourceLogs.values.push(logValue);
          } else {
            const logLabels = toLogLabels(transportItem);
            const logValue = toLogValue(transportItem);
            if (logLabels && logValue)
              this.resourceLogs.streams.push({ stream: logLabels, values: [logValue] });
          }
          break;
        }
        case TransportItemType2.TRACE: {
          this.internalLogger.error("Trace is not supported");
          break;
        }
        default:
          this.internalLogger?.error(`Unknown TransportItemType: ${type}`);
          break;
      }
    } catch (error) {
      this.internalLogger?.error(error);
    }
  }
  static hasPayload(value) {
    if (value && value.streams && value.streams.length > 0) {
      return true;
    }
    return false;
  }
};

// src/transport.ts
var DEFAULT_BUFFER_SIZE = 30;
var DEFAULT_CONCURRENCY = 5;
var DEFAULT_RATE_LIMIT_BACKOFF_MS = 5e3;
var LOKI_LOGS_ENDPOINT = "/loki/api/v1/push";
var OTLP_TRACES_ENDPOINT = "/v1/traces";
var QrynTransport = class extends BaseTransport {
  constructor(options) {
    super();
    this.options = options;
    this.rateLimitBackoffMs = options.defaultRateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.getNow = options.getNow ?? (() => Date.now());
    this.logsURL = `${options.host}${LOKI_LOGS_ENDPOINT}`;
    this.tracesURL = `${options.host}${OTLP_TRACES_ENDPOINT}`;
    this.getLabelsFromMeta = options.getLabelsFromMeta;
    this.promiseBuffer = createPromiseBuffer({
      size: options.bufferSize ?? DEFAULT_BUFFER_SIZE,
      concurrency: options.concurrency ?? DEFAULT_CONCURRENCY
    });
  }
  name = "@gigapipe/faro-transport-qryn";
  version = "1.0.0";
  promiseBuffer;
  rateLimitBackoffMs;
  getNow;
  sendingTracesDisabledUntil = /* @__PURE__ */ new Date();
  sendingLogsDisabledUntil = /* @__PURE__ */ new Date();
  logsURL;
  tracesURL;
  getLabelsFromMeta;
  send(item) {
    this.logDebug(`Sending item: ${JSON.stringify(item)}`);
    const qrynPayload = new QrynPayload(this.internalLogger, this.getLabelsFromMeta);
    const items = Array.isArray(item) ? item : [item];
    items.forEach((i) => qrynPayload.addResourceItem(i));
    this.logDebug("Current QrynPayload:", qrynPayload);
    this.sendPayload(qrynPayload.getPayload());
  }
  sendPayload(payload) {
    try {
      for (const [key, value] of Object.entries(payload)) {
        if (!QrynPayload.hasPayload(value)) {
          this.logWarn(`Dropping transport item due to missing payload: ${JSON.stringify(value)}`);
          continue;
        }
        let disabledUntil;
        let updateDisabledUntil = (_) => {
        };
        let url = "";
        switch (key) {
          case "resourceSpans":
            url = this.tracesURL;
            disabledUntil = this.sendingTracesDisabledUntil;
            updateDisabledUntil = (retryAfterDate) => {
              this.sendingTracesDisabledUntil = retryAfterDate;
            };
            break;
          case "resourceLogs":
            url = this.logsURL;
            disabledUntil = this.sendingLogsDisabledUntil;
            updateDisabledUntil = (retryAfterDate) => {
              this.sendingLogsDisabledUntil = retryAfterDate;
            };
            break;
          default:
            break;
        }
        if (disabledUntil && disabledUntil > new Date(Date.now())) {
          this.logWarn(
            `Dropping transport item due to too many requests. Backoff until ${disabledUntil}`
          );
          return void 0;
        }
        this.logDebug(`Sending value: ${JSON.stringify(value)}`, `to ${url}`);
        const body = JSON.stringify(value);
        const { requestOptions, apiToken } = this.options;
        const { headers, ...restOfRequestOptions } = requestOptions ?? {};
        this.promiseBuffer.add(
          () => fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-token": apiToken,
              ...headers ?? {}
            },
            body,
            keepalive: true,
            ...restOfRequestOptions ?? {}
          }).then((response) => {
            if (response.status === 429) {
              updateDisabledUntil(this.getRetryAfterDate(response));
              this.logWarn(`Too many requests, backing off until ${disabledUntil}`);
            }
            return response;
          }).catch((error) => {
            this.logError("Failed sending payload to the receiver\n", JSON.parse(body), error);
          })
        );
      }
    } catch (error) {
      this.logError(error);
    }
  }
  getIgnoreUrls() {
    const { tracesURL, logsURL } = this;
    return [tracesURL, logsURL].filter(Boolean);
  }
  getRetryAfterDate(response) {
    const now = Date.now();
    const retryAfterHeader = response.headers.get("Retry-After");
    if (retryAfterHeader) {
      const delay = Number(retryAfterHeader);
      if (!Number.isNaN(delay)) {
        return new Date(delay * 1e3 + now);
      }
      const date = Date.parse(retryAfterHeader);
      if (!Number.isNaN(date)) {
        return new Date(date);
      }
    }
    return new Date(now + this.rateLimitBackoffMs);
  }
};
export {
  QrynTransport
};
//# sourceMappingURL=index.mjs.map