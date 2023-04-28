"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  QrynTransport: () => QrynTransport
});
module.exports = __toCommonJS(src_exports);

// src/transport.ts
var import_faro_core3 = require("@grafana/faro-core");

// src/payload/QrynPayload.ts
var import_faro_core2 = require("@grafana/faro-core");
var import_just_compare = __toESM(require("just-compare"));

// src/payload/transform/transform.ts
var import_faro_core = require("@grafana/faro-core");
function getLogTransforms(internalLogger) {
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
      case import_faro_core.TransportItemType.LOG:
        return toLogLogValue(payload);
      case import_faro_core.TransportItemType.EXCEPTION:
        return toErrorLogValue(payload);
      case import_faro_core.TransportItemType.EVENT:
        return toEventLogValue(payload);
      case import_faro_core.TransportItemType.MEASUREMENT:
        return toMeasurementLogValue(payload);
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  function toLogLabels(transportItem) {
    const { type, payload, meta } = transportItem;
    switch (type) {
      case import_faro_core.TransportItemType.LOG:
        return {
          level: payload.level,
          ...getBaseLabels(meta)
        };
      case import_faro_core.TransportItemType.EXCEPTION:
        return {
          level: import_faro_core.LogLevel.ERROR,
          ...getBaseLabels(meta)
        };
      case import_faro_core.TransportItemType.EVENT:
        return {
          level: import_faro_core.LogLevel.INFO,
          ...getBaseLabels(meta)
        };
      case import_faro_core.TransportItemType.MEASUREMENT:
        return {
          level: import_faro_core.LogLevel.INFO,
          ...getBaseLabels(meta)
        };
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  function toTimeUnixNano(timestamp) {
    return Date.parse(timestamp) * 1e6;
  }
  function getBaseLabels(meta) {
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
  return { toLogValue, toLogLabels };
}

// src/payload/QrynPayload.ts
var QrynPayload = class {
  // TODO: implement handling for TransportItemType.TRACE
  // private getTraceTransforms: TraceTransform
  constructor(internalLogger, transportItem) {
    this.internalLogger = internalLogger;
    this.internalLogger = internalLogger;
    this.getLogTransforms = getLogTransforms(this.internalLogger);
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
        case import_faro_core2.TransportItemType.LOG:
        case import_faro_core2.TransportItemType.EXCEPTION:
        case import_faro_core2.TransportItemType.EVENT:
        case import_faro_core2.TransportItemType.MEASUREMENT: {
          const { toLogValue, toLogLabels } = this.getLogTransforms;
          const currentLogStream = toLogLabels(transportItem);
          const existingResourceLogs = this.resourceLogs.streams.find(
            ({ stream }) => (0, import_just_compare.default)(stream, currentLogStream)
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
        case import_faro_core2.TransportItemType.TRACE: {
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
var QrynTransport = class extends import_faro_core3.BaseTransport {
  constructor(options) {
    super();
    this.options = options;
    this.rateLimitBackoffMs = options.defaultRateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.getNow = options.getNow ?? (() => Date.now());
    this.logsURL = `${options.host}${LOKI_LOGS_ENDPOINT}`;
    this.tracesURL = `${options.host}${OTLP_TRACES_ENDPOINT}`;
    this.promiseBuffer = (0, import_faro_core3.createPromiseBuffer)({
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
  send(item) {
    this.logDebug(`Sending item: ${JSON.stringify(item)}`);
    const qrynPayload = new QrynPayload(this.internalLogger);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QrynTransport
});
//# sourceMappingURL=index.js.map