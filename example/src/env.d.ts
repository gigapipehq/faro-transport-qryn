/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Public env variables exposed to client bundle
  readonly VITE_QRYN_HOST: string
  readonly VITE_QRYN_API_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
