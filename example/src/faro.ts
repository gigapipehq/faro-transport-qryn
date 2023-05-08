import { QrynTransport } from '@gigapipe/faro-transport-qryn'
import { BatchTransport } from '@grafana/faro-transport-batch'
import { Faro, getWebInstrumentations, initializeFaro as coreInit } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

export let faro: Faro
export function initializeFaro(): Faro | undefined {
  if (!import.meta.env.PROD) {
    faro = coreInit({
      app: {
        name: 'frontend',
        environment: 'local',
        release: '1.0.0',
      },
      preventGlobalExposure: true,
      transports: [
        new BatchTransport(
          new QrynTransport({
            host: import.meta.env.VITE_QRYN_HOST,
            apiToken: import.meta.env.VITE_QRYN_API_TOKEN,
          }),
          {
            batchSendCount: 10, // default is 50 signals.
            batchSendTimeout: 1000, // default is 250ms
          },
        ),
      ],
      instrumentations: [
        ...getWebInstrumentations({ captureConsole: false }),
        new TracingInstrumentation(),
      ],
    })

    faro.api.pushLog(['Faro initialized'])
    return faro
  } else {
    return undefined
  }
}
