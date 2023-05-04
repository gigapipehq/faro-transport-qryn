import { Meta, BaseInstrumentation, BaseTransport, TransportItem } from '@grafana/faro-core';
import { TextMapPropagator, ContextManager } from '@opentelemetry/api';
import { InstrumentationOption } from '@opentelemetry/instrumentation';
import { ResourceAttributes } from '@opentelemetry/resources';

type LogLabels = Record<string, string>;
type GetLabelsFromMeta = (meta: Meta) => LogLabels;

type QrynLokiTransportRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
    headers?: Record<string, string>;
};
type QrynLokiTransportOptions = {
    /**
     * The qryn Cloud host URL
     */
    host: string;
    /**
     * The qryn Cloud token with write permissions.
     *
     * It will be added as `X-API-Token` header
     */
    apiToken: string;
    /**
     * Aditional options to pass to the fetch API
     */
    requestOptions?: QrynLokiTransportRequestOptions;
    /**
     * Number of requests to buffer in total
     *
     * @default 30
     */
    bufferSize?: number;
    /**
     * Number of requests to execute concurrently
     *
     * @default 5
     */
    concurrency?: number;
    /**
     * If a rate limit response does not include a `Retry-After` header,
     * how many milliseconds to back off before attempting a request.
     * NOTE: intermediate events will be dropped, not buffered
     *
     * @default 5000
     */
    defaultRateLimitBackoffMs?: number;
    /**
     * Get current date for mocking purposes in tests
     */
    getNow?: ClockFn;
    /**
     * Function used to create the labels from the meta data.
     *
     * @default (meta) => ({
     *    app: meta.app.name,
     *    environment: meta.app.environment,
     *    release: meta.app.release,
     *    browser_name: meta.browser.name
     *    user_id: meta.user.id
     * })
     */
    getLabelsFromMeta?: GetLabelsFromMeta;
};
type TracingInstrumentationOptions = {
    /**
     * The qryn Cloud host URL
     */
    host: string;
    /**
     * The qryn Cloud token with write permissions.
     *
     * It will be added as `X-API-Token` header
     */
    apiToken: string;
    /**
     * Resource attributes passed to the default Resource of `@opentelemetry/resources`
     */
    resourceAttributes?: ResourceAttributes;
    /**
     * Propagator to use as the global propagator
     *
     * @default W3CTraceContextPropagator
     */
    propagator?: TextMapPropagator;
    /**
     * Context manager to use as the global context manager
     *
     * @default ZoneContextManager
     */
    contextManager?: ContextManager;
    /**
     * Customize the list of instrumentations
     *
     * @default
     * [ DocumentLoadInstrumentation, FetchInstrumentation, XMLHttpRequestInstrumentation, UserInteractionInstrumentation]`
     */
    instrumentations?: InstrumentationOption[];
    /**
     * Options used to configure the default `FetchInstrumentation` and `XMLHttpRequestInstrumentation`
     */
    instrumentationOptions?: {
        propagateTraceHeaderCorsUrls: MatchUrlDefinitions;
    };
};
type MatchUrlDefinitions = Array<string | RegExp>;
type ClockFn = () => number;

declare class TracingInstrumentation extends BaseInstrumentation {
    private options;
    name: string;
    version: string;
    static SCHEDULED_BATCH_DELAY_MS: number;
    static MAX_EXPORT_BATCH_SIZE: number;
    constructor(options: TracingInstrumentationOptions);
    initialize(): void;
    private getIgnoreUrls;
}

declare class QrynTransport extends BaseTransport {
    private options;
    readonly name = "@gigapipe/faro-transport-qryn";
    readonly version = "1.0.0";
    private readonly promiseBuffer;
    private readonly rateLimitBackoffMs;
    private readonly getNow;
    private sendingTracesDisabledUntil;
    private sendingLogsDisabledUntil;
    private logsURL;
    private tracesURL;
    private getLabelsFromMeta?;
    constructor(options: QrynLokiTransportOptions);
    send(item: TransportItem | TransportItem[]): void;
    private sendPayload;
    getIgnoreUrls(): Array<string | RegExp>;
    private getRetryAfterDate;
}

export { QrynLokiTransportOptions, QrynLokiTransportRequestOptions, QrynTransport, TracingInstrumentation };
