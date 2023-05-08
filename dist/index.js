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
var import_faro_core4 = require("@grafana/faro-core");

// src/payload/QrynPayload.ts
var import_faro_core3 = require("@grafana/faro-core");
var import_just_compare = __toESM(require("just-compare"));

// src/payload/transform/transform.ts
var import_faro_core2 = require("@grafana/faro-core");
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");

// src/payload/attribute/attributeUtils.ts
var import_faro_core = require("@grafana/faro-core");
function toAttributeValue(value) {
  if ((0, import_faro_core.isString)(value)) {
    return { stringValue: value };
  }
  if ((0, import_faro_core.isInt)(value)) {
    return { intValue: value };
  }
  if ((0, import_faro_core.isNumber)(value)) {
    return { doubleValue: value };
  }
  if ((0, import_faro_core.isBoolean)(value)) {
    return { boolValue: value };
  }
  if ((0, import_faro_core.isArray)(value)) {
    return { arrayValue: { values: value.map(toAttributeValue) } };
  }
  if (value instanceof Uint8Array) {
    return { bytesValue: value };
  }
  if ((0, import_faro_core.isObject)(value)) {
    return {
      kvlistValue: {
        values: Object.entries(value).map(([attributeName, attributeValue]) => toAttribute(attributeName, attributeValue)).filter(isAttribute)
      }
    };
  }
  return {};
}
function toAttribute(attributeName, attributeValue) {
  if (attributeValue == null || attributeValue === "") {
    return void 0;
  }
  return {
    key: attributeName,
    value: toAttributeValue(attributeValue)
  };
}
function isAttribute(item) {
  return Boolean(item) && typeof item?.key === "string" && typeof item?.value !== "undefined";
}

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

// src/payload/transform/utils.ts
function stringify(data) {
  let line = "";
  Object.keys(data).forEach((key) => {
    let value = "";
    let isNull = false;
    if (data[key] == null) {
      isNull = true;
      value = "";
    } else {
      value = data[key].toString();
    }
    const needsQuoting = value.indexOf(" ") > -1 || value.indexOf("=") > -1;
    const needsEscaping = value.indexOf('"') > -1 || value.indexOf("\\") > -1;
    if (needsEscaping)
      value = value.replace(/["\\]/g, "\\$&");
    if (needsQuoting)
      value = `"${value}"`;
    if (value === "" && !isNull)
      value = '""';
    line += `${key}=${value} `;
  });
  return line.substring(0, line.length - 1);
}
var fmt = {
  stringify
};

// src/payload/transform/transform.ts
function getLogTransforms(internalLogger, getLabelsFromMeta = defaultLabels) {
  function toLogLogValue(payload) {
    const { timestamp, trace, message, context } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        message,
        context: JSON.stringify(context),
        ...trace && { traceId: trace.trace_id }
      })
    ];
  }
  function toErrorLogValue(payload) {
    const { timestamp, trace, type, value, stacktrace } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        value,
        stacktrace: JSON.stringify(stacktrace),
        ...trace && { traceId: trace.trace_id }
      })
    ];
  }
  function toEventLogValue(payload) {
    const { timestamp, trace, name, attributes, domain } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        name,
        attributes: JSON.stringify(attributes),
        ...domain && { domain },
        ...trace && { traceId: trace.trace_id }
      })
    ];
  }
  function toMeasurementLogValue(payload) {
    const { timestamp, trace, type, values } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        values: JSON.stringify(values),
        ...trace && { traceId: trace.trace_id }
      })
    ];
  }
  function toLogValue(transportItem) {
    const { type, payload } = transportItem;
    switch (type) {
      case import_faro_core2.TransportItemType.LOG:
        return toLogLogValue(payload);
      case import_faro_core2.TransportItemType.EXCEPTION:
        return toErrorLogValue(payload);
      case import_faro_core2.TransportItemType.EVENT:
        return toEventLogValue(payload);
      case import_faro_core2.TransportItemType.MEASUREMENT:
        return toMeasurementLogValue(payload);
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  function toLogLabels(transportItem) {
    const { type, payload, meta } = transportItem;
    switch (type) {
      case import_faro_core2.TransportItemType.LOG:
        return {
          level: payload.level,
          ...getLabelsFromMeta(meta)
        };
      case import_faro_core2.TransportItemType.EXCEPTION:
        return {
          level: import_faro_core2.LogLevel.ERROR,
          ...getLabelsFromMeta(meta)
        };
      case import_faro_core2.TransportItemType.EVENT:
        return {
          level: import_faro_core2.LogLevel.INFO,
          ...getLabelsFromMeta(meta)
        };
      case import_faro_core2.TransportItemType.MEASUREMENT:
        return {
          level: import_faro_core2.LogLevel.INFO,
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
var SemanticBrowserAttributes = {
  BROWSER_BRANDS: "browser.brands",
  BROWSER_PLATFORM: "browser.platform",
  BROWSER_MOBILE: "browser.mobile",
  BROWSER_USER_AGENT: "browser.user_agent",
  BROWSER_LANGUAGE: "browser.language"
};
function getTraceTransforms(_internalLogger) {
  function toResourceSpan(transportItem) {
    const resource = toResource(transportItem);
    const scopeSpans = transportItem.payload.resourceSpans?.[0]?.scopeSpans;
    return {
      resource,
      scopeSpans: scopeSpans ?? []
    };
  }
  return { toResourceSpan };
}
function toResource(transportItem) {
  const { browser, sdk, app } = transportItem.meta;
  return {
    attributes: [
      toAttribute(SemanticBrowserAttributes.BROWSER_MOBILE, browser?.mobile),
      toAttribute(SemanticBrowserAttributes.BROWSER_USER_AGENT, browser?.userAgent),
      toAttribute(SemanticBrowserAttributes.BROWSER_LANGUAGE, browser?.language),
      toAttribute(SemanticBrowserAttributes.BROWSER_BRANDS, browser?.brands),
      toAttribute("browser.os", browser?.os),
      toAttribute("browser.name", browser?.name),
      toAttribute("browser.version", browser?.version),
      toAttribute(import_semantic_conventions.SemanticResourceAttributes.TELEMETRY_SDK_NAME, sdk?.name),
      toAttribute(import_semantic_conventions.SemanticResourceAttributes.TELEMETRY_SDK_VERSION, sdk?.version),
      sdk ? toAttribute(
        import_semantic_conventions.SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE,
        import_semantic_conventions.TelemetrySdkLanguageValues.WEBJS
      ) : void 0,
      toAttribute(import_semantic_conventions.SemanticResourceAttributes.SERVICE_NAME, app?.name),
      toAttribute(import_semantic_conventions.SemanticResourceAttributes.SERVICE_VERSION, app?.version),
      toAttribute(import_semantic_conventions.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT, app?.environment)
    ].filter(isAttribute)
  };
}

// src/payload/QrynPayload.ts
var QrynPayload = class {
  constructor(internalLogger, getLabelsFromMeta, transportItem) {
    this.internalLogger = internalLogger;
    this.internalLogger = internalLogger;
    this.getLogTransforms = getLogTransforms(this.internalLogger, getLabelsFromMeta);
    this.getTraceTransforms = getTraceTransforms(this.internalLogger);
    if (transportItem) {
      this.addResourceItem(transportItem);
    }
  }
  resourceLogs = { streams: [] };
  resourceSpans = [];
  getLogTransforms;
  getTraceTransforms;
  getPayload() {
    return {
      resourceLogs: this.resourceLogs,
      resourceSpans: this.resourceSpans
    };
  }
  addResourceItem(transportItem) {
    const { type } = transportItem;
    try {
      switch (type) {
        case import_faro_core3.TransportItemType.LOG:
        case import_faro_core3.TransportItemType.EXCEPTION:
        case import_faro_core3.TransportItemType.EVENT:
        case import_faro_core3.TransportItemType.MEASUREMENT: {
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
        case import_faro_core3.TransportItemType.TRACE: {
          const { toResourceSpan } = this.getTraceTransforms;
          this.resourceSpans.push(toResourceSpan(transportItem));
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
    if (Array.isArray(value) && value.length > 0) {
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
var TEMPO_TRACES_ENDPOINT = "/v1/traces";
var QrynTransport = class extends import_faro_core4.BaseTransport {
  constructor(options) {
    super();
    this.options = options;
    this.rateLimitBackoffMs = options.defaultRateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.getNow = options.getNow ?? (() => Date.now());
    this.logsURL = `${options.host}${LOKI_LOGS_ENDPOINT}`;
    this.tracesURL = `${options.host}${TEMPO_TRACES_ENDPOINT}`;
    this.getLabelsFromMeta = options.getLabelsFromMeta;
    this.promiseBuffer = (0, import_faro_core4.createPromiseBuffer)({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QrynTransport
});
//# sourceMappingURL=index.js.map