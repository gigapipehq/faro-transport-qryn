import { Meta, BaseTransport, TransportItem } from '@grafana/faro-core';

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
     * This will be used for logs, errors, events and measurements.
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
type GetLabelsFromMeta = (meta: Meta) => Record<string, string>;
type ClockFn = () => number;

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

export { QrynLokiTransportOptions, QrynLokiTransportRequestOptions, QrynTransport };
