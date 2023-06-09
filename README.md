# Qryn Transport for Grafana Faro SDK

Send logs, errors, events, metrics and traces captured by the faro-web-sdk instrumention directly to qryn without requiring a collector.

## Getting started

If you still don't have one [create your free account](https://app.gigapipe.com/signup) on Gigapipe and get access to [qryn Cloud](https://gigapipe.com/qryn/).

Create your first project, enable qryn and make sure to create an `API Token` with write permissions.

### Installation

> **Note:**
> The library hasn't been published to NPM yet. We are finishing the latest touches to offer the best DX.

```bash
pnpm add @gigapipe/faro-transport-qryn
```

You will need also to install `@grafana/faro-web-sdk` or any other package that gives you access to the Faro SDK.

```bash
pnpm add @grafana/faro-web-sdk
```

### Usage

In your application main entrypoint create an instance of our custom transport.

```typescript
const qrynTransport = new QrynTransport({
  host: YOUR_QRYN_HOST,
  apiToken: YOUR_QRYN_API_TOKEN,
})
```

**Configuration**

| Option                    | Description                                                                                                                      | Required | Default                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| host                      | The qryn Cloud host URL                                                                                                          | true     |                                                     |
| apiToken                  | The qryn Cloud token with write permissions.                                                                                     | true     |                                                     |
| requestOptions            | Aditional options to pass to the fetch API                                                                                       |          |                                                     |
| getLabelsFromMeta         | Function used to create the labels from the meta data.                                                                           |          | see [`defaultLabels`](src/payload/config/config.ts) |
| bufferSize                | Number of requests to buffer in total                                                                                            |          | 30                                                  |
| concurrency               | Number of requests to execute concurrently                                                                                       |          | 5                                                   |
| defaultRateLimitBackoffMs | If a rate limit response does not include a `Retry-After` header. How many milliseconds to back off before attempting a request. |          | 5000                                                |

If you want to support OpenTelemetry _traces_ create an instance of `TracingInstrumentation` from `@grafana/faro-web-tracing` [docs](https://github.com/grafana/faro-web-sdk/blob/main/packages/web-tracing/README.md).

```typescript
const tracingInstrumentation = new TracingInstrumentation()
```

Finally initialize Faro with your configuration.

> **Note:**
> qryn Cloud supports batch ingestion by default, but if you want also to minimize the number of requests done from your client you can use the experimental `@grafana/faro-transport-batch`.

```typescript
initializeFaro({
  app: {
    name: 'frontend',
  },
  transports: [
    new BatchTransport(qrynTransport, {
      batchSendCount: 10, // default is 50 signals.
      batchSendTimeout: 1000, // default is 250ms
    }),
  ],
  instrumentations: [
    // Default instrumentations from @grafana/faro-web-sdk
    ...getWebInstrumentations(),
    tracingInstrumentation,
  ],
})
```
