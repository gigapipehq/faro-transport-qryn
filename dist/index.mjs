var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/instrumentation.ts
import { BaseInstrumentation } from "@grafana/faro-core";
import { context, trace } from "@opentelemetry/api";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor, WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
var _TracingInstrumentation = class extends BaseInstrumentation {
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
      attributes[SemanticResourceAttributes.SERVICE_NAME] = this.config.app.name;
    }
    if (this.config.app.version) {
      attributes[SemanticResourceAttributes.SERVICE_VERSION] = this.config.app.version;
    }
    Object.assign(attributes, options.resourceAttributes);
    const resource = Resource.default().merge(new Resource(attributes));
    const provider = new WebTracerProvider({ resource });
    provider.addSpanProcessor(
      new BatchSpanProcessor(
        new ZipkinExporter({
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
      propagator: options.propagator ?? new W3CTraceContextPropagator(),
      contextManager: options.contextManager ?? new ZoneContextManager()
    });
    registerInstrumentations({
      instrumentations: options.instrumentations ?? [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls: this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls
        }),
        new XMLHttpRequestInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls: this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls
        }),
        new UserInteractionInstrumentation()
      ]
    });
    this.api.initOTEL(trace, context);
  }
  getIgnoreUrls() {
    return this.transports.transports.flatMap((transport) => transport.getIgnoreUrls());
  }
};
var TracingInstrumentation = _TracingInstrumentation;
__publicField(TracingInstrumentation, "SCHEDULED_BATCH_DELAY_MS", 1e3);
__publicField(TracingInstrumentation, "MAX_EXPORT_BATCH_SIZE", 30);

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
function getTraceTransforms(internalLogger) {
  function toSpanValue(transportItem) {
    const { type } = transportItem;
    switch (type) {
      case TransportItemType.TRACE:
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
var QrynTransport = class extends BaseTransport {
  constructor(options) {
    super();
    this.options = options;
    this.rateLimitBackoffMs = options.defaultRateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.getNow = options.getNow ?? (() => Date.now());
    this.logsURL = `${options.host}${LOKI_LOGS_ENDPOINT}`;
    this.tracesURL = `${options.host}${TEMPO_TRACES_ENDPOINT}`;
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
  QrynTransport,
  TracingInstrumentation
};
//# sourceMappingURL=index.mjs.map