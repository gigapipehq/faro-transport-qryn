import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk'
import { QrynTransport, TracingInstrumentation } from '@gigapipe/faro-transport-qryn'
import { BatchTransport } from '@grafana/faro-transport-batch'

// Initialize the SDK with your API Token in the root of your project
const faro = initializeFaro({
  app: {
    name: 'frontend',
    environment: 'local',
    release: '1.0.0',
  },
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
    new TracingInstrumentation({
      host: import.meta.env.VITE_QRYN_HOST,
      apiToken: import.meta.env.VITE_QRYN_API_TOKEN,
    }),
  ],
})

faro.api.pushLog(['Faro initialized'])

if (faro) {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
