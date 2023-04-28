import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk'
import { QrynTransport } from '@gigapipe/faro-transport-qryn'

// Initialize the SDK with your API Token in the root of your project
const faro = initializeFaro({
  app: {
    name: 'frontend',
    environment: 'local',
    release: '1.0.0',
  },
  transports: [
    new QrynTransport({
      host: import.meta.env.VITE_QRYN_HOST,
      apiToken: import.meta.env.VITE_QRYN_API_TOKEN,
    }),
  ],
  instrumentations: [...getWebInstrumentations({ captureConsole: false })],
})
faro.api.pushLog(['Faro initialized'])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
