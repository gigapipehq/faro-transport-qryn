"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  QrynTransport: () => QrynTransport,
  TracingInstrumentation: () => TracingInstrumentation
});
module.exports = __toCommonJS(src_exports);

// src/instrumentation.ts
var import_faro_core = require("@grafana/faro-core");
var import_api = require("@opentelemetry/api");
var import_context_zone = require("@opentelemetry/context-zone");
var import_core = require("@opentelemetry/core");
var import_exporter_zipkin = require("@opentelemetry/exporter-zipkin");
var import_instrumentation = require("@opentelemetry/instrumentation");
var import_instrumentation_document_load = require("@opentelemetry/instrumentation-document-load");
var import_instrumentation_fetch = require("@opentelemetry/instrumentation-fetch");
var import_instrumentation_user_interaction = require("@opentelemetry/instrumentation-user-interaction");
var import_instrumentation_xml_http_request = require("@opentelemetry/instrumentation-xml-http-request");
var import_resources = require("@opentelemetry/resources");
var import_sdk_trace_web = require("@opentelemetry/sdk-trace-web");
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var _TracingInstrumentation = class extends import_faro_core.BaseInstrumentation {
  constructor(options) {
    super();
    this.options = options;
  }
  name = "@gigapipe/faro-web-tracing-zipkin";
  version = "1.0.0";
  initialize() {
    const { options } = this;
    const attributes = {};
    if (this.config.app.name) {
      attributes[import_semantic_conventions.SemanticResourceAttributes.SERVICE_NAME] = this.config.app.name;
    }
    if (this.config.app.version) {
      attributes[import_semantic_conventions.SemanticResourceAttributes.SERVICE_VERSION] = this.config.app.version;
    }
    Object.assign(attributes, options.resourceAttributes);
    const resource = import_resources.Resource.default().merge(new import_resources.Resource(attributes));
    const provider = new import_sdk_trace_web.WebTracerProvider({ resource });
    provider.addSpanProcessor(
      new import_sdk_trace_web.BatchSpanProcessor(
        new import_exporter_zipkin.ZipkinExporter({
          headers: { "x-api-token": this.options.apiToken },
          url: `${this.options.host}/tempo/spans`,
          serviceName: this.config.app.name
        }),
        {
          scheduledDelayMillis: _TracingInstrumentation.SCHEDULED_BATCH_DELAY_MS,
          maxExportBatchSize: _TracingInstrumentation.MAX_EXPORT_BATCH_SIZE
        }
      )
    );
    provider.register({
      propagator: options.propagator ?? new import_core.W3CTraceContextPropagator(),
      contextManager: options.contextManager ?? new import_context_zone.ZoneContextManager()
    });
    (0, import_instrumentation.registerInstrumentations)({
      instrumentations: options.instrumentations ?? [
        new import_instrumentation_document_load.DocumentLoadInstrumentation(),
        new import_instrumentation_fetch.FetchInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls: this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls
        }),
        new import_instrumentation_xml_http_request.XMLHttpRequestInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls: this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls
        }),
        new import_instrumentation_user_interaction.UserInteractionInstrumentation()
      ]
    });
    this.api.initOTEL(import_api.trace, import_api.context);
  }
  getIgnoreUrls() {
    return this.transports.transports.flatMap((transport) => transport.getIgnoreUrls());
  }
};
var TracingInstrumentation = _TracingInstrumentation;
__publicField(TracingInstrumentation, "SCHEDULED_BATCH_DELAY_MS", 1e3);
__publicField(TracingInstrumentation, "MAX_EXPORT_BATCH_SIZE", 30);

// src/transport.ts
var import_faro_core4 = require("@grafana/faro-core");

// src/payload/QrynPayload.ts
var import_faro_core3 = require("@grafana/faro-core");
var import_just_compare = __toESM(require("just-compare"));

// src/payload/transform/transform.ts
var import_faro_core2 = require("@grafana/faro-core");

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
    const { timestamp, trace: trace2, message, context: context2 } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        message,
        context: JSON.stringify(context2),
        ...trace2 && { traceId: trace2.trace_id }
      })
    ];
  }
  function toErrorLogValue(payload) {
    const { timestamp, trace: trace2, type, value, stacktrace } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        value,
        stacktrace: JSON.stringify(stacktrace),
        ...trace2 && { traceId: trace2.trace_id }
      })
    ];
  }
  function toEventLogValue(payload) {
    const { timestamp, trace: trace2, name, attributes, domain } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        name,
        attributes: JSON.stringify(attributes),
        ...domain && { domain },
        ...trace2 && { traceId: trace2.trace_id }
      })
    ];
  }
  function toMeasurementLogValue(payload) {
    const { timestamp, trace: trace2, type, values } = payload;
    const timeUnixNano = toTimeUnixNano(timestamp);
    return [
      timeUnixNano.toString(),
      fmt.stringify({
        type,
        values: JSON.stringify(values),
        ...trace2 && { traceId: trace2.trace_id }
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
function getTraceTransforms(internalLogger) {
  function toSpanValue(transportItem) {
    const { type } = transportItem;
    switch (type) {
      case import_faro_core2.TransportItemType.TRACE:
        return void 0;
      default:
        internalLogger?.error(`Unknown TransportItemType: ${type}`);
        return void 0;
    }
  }
  return { toSpanValue };
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
  QrynTransport,
  TracingInstrumentation
});
//# sourceMappingURL=index.js.map