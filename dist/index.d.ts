import { BaseTransport, TransportItem } from '@grafana/faro-core';

interface QrynLokiTransportRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
    headers?: Record<string, string>;
}
interface QrynLokiTransportOptions {
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
}
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
    constructor(options: QrynLokiTransportOptions);
    send(item: TransportItem | TransportItem[]): void;
    private sendPayload;
    getIgnoreUrls(): Array<string | RegExp>;
    private getRetryAfterDate;
}

export { QrynLokiTransportOptions, QrynLokiTransportRequestOptions, QrynTransport };
