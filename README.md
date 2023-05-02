# Qryn Transport for Grafana Faro SDK

Send logs, errors, events, metrics and traces captured by the faro-web-sdk instrumention directly to qryn without requiring a collector.

## Getting started

If you still don't have one [create your free account](https://app.gigapipe.com/signup) on Gigapipe and get access to [qryn Cloud](https://gigapipe.com/qryn/).

Create your first project, enable qryn and make sure to have a `API Token` with write permissions.

### Installation

TBD: let's see how do we want to distribute this

```bash
pnpm add @gigapipe/faro-transport-qryn
```

You will need also to install `@grafana/faro-web-sdk` or any other package that gives you access to the Faro SDK.

```bash
pnpm add @grafana/faro-web-sdk
```

### Usage

In your application main entrypoint initialize the sdk with our custom transport.

```typescript
initializeFaro({
  app: {
    name: 'frontend',
  },
  transports: [
    new QrynTransport({
      host: import.meta.env.VITE_QRYN_HOST,
      apiToken: import.meta.env.VITE_QRYN_API_TOKEN,
    }),
  ],
})
```

### Configuration

| Option                    | Description                                                                                                                      | Required | Default             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| host                      | The qryn Cloud host URL                                                                                                          | true     |                     |
| apiToken                  | The qryn Cloud token with write permissions.                                                                                     | true     |                     |
| requestOptions            | Aditional options to pass to the fetch API                                                                                       |          |                     |
| getLabelsFromMeta         | Function used to create the labels from the meta data.                                                                           |          | see `defaultLabels` |
| bufferSize                | Number of requests to buffer in total                                                                                            |          | 30                  |
| concurrency               | Number of requests to execute concurrently                                                                                       |          | 5                   |
| defaultRateLimitBackoffMs | If a rate limit response does not include a `Retry-After` header. How many milliseconds to back off before attempting a request. |          | 5000                |
