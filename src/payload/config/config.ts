import { Meta } from '@grafana/faro-core'

export function defaultLabels(meta: Meta) {
  return {
    ...(meta.app && {
      app: meta.app.name,
      environment: meta.app.environment,
      release: meta.app.release,
    }),
    ...(meta.browser && { browser_name: meta.browser.name }),
    ...(meta.user && { user_id: meta.user.id }),
  }
}
