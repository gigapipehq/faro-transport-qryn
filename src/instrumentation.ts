import { BaseInstrumentation } from '@grafana/faro-core'
import { context, trace } from '@opentelemetry/api'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { Resource, type ResourceAttributes } from '@opentelemetry/resources'
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import { type TracingInstrumentationOptions } from './types'

export class TracingInstrumentation extends BaseInstrumentation {
  name = '@gigapipe/faro-web-tracing-zipkin'

  version = '1.0.0'

  static SCHEDULED_BATCH_DELAY_MS = 1000

  static MAX_EXPORT_BATCH_SIZE = 30

  constructor(private options: TracingInstrumentationOptions) {
    super()
  }

  initialize(): void {
    const { options } = this
    const attributes: ResourceAttributes = {}

    if (this.config.app.name) {
      attributes[SemanticResourceAttributes.SERVICE_NAME] = this.config.app.name
    }

    if (this.config.app.version) {
      attributes[SemanticResourceAttributes.SERVICE_VERSION] = this.config.app.version
    }

    Object.assign(attributes, options.resourceAttributes)

    const resource = Resource.default().merge(new Resource(attributes))

    const provider = new WebTracerProvider({ resource })

    provider.addSpanProcessor(
      new BatchSpanProcessor(
        new ZipkinExporter({
          headers: { 'x-api-token': this.options.apiToken },
          url: `${this.options.host}/tempo/spans`,
          serviceName: this.config.app.name,
        }),
        {
          scheduledDelayMillis: TracingInstrumentation.SCHEDULED_BATCH_DELAY_MS,
          maxExportBatchSize: TracingInstrumentation.MAX_EXPORT_BATCH_SIZE,
        },
      ),
    )

    provider.register({
      propagator: options.propagator ?? new W3CTraceContextPropagator(),
      contextManager: options.contextManager ?? new ZoneContextManager(),
    })

    registerInstrumentations({
      instrumentations: options.instrumentations ?? [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls:
            this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls,
        }),
        new XMLHttpRequestInstrumentation({
          ignoreUrls: this.getIgnoreUrls(),
          propagateTraceHeaderCorsUrls:
            this.options.instrumentationOptions?.propagateTraceHeaderCorsUrls,
        }),
        new UserInteractionInstrumentation(),
      ],
    })

    this.api.initOTEL(trace, context)
  }

  private getIgnoreUrls(): Array<string | RegExp> {
    return this.transports.transports.flatMap(transport => transport.getIgnoreUrls())
  }
}
