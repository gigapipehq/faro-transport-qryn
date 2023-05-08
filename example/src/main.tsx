import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure the Faro SDK is imported at the root of you app so it is initialized
import { initializeFaro } from './faro.ts'

initializeFaro()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
