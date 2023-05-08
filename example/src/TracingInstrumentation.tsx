import { faro } from './faro'

export function TracingInstrumentation() {
  const fetchSuccess = () => {
    fetch('/your-endpoint')
  }

  const traceWithLog = () => {
    const otel = faro?.api.getOTEL()
    if (otel) {
      const span = otel.trace.getTracer('frontend').startSpan('trace with log')

      otel.context.with(otel.trace.setSpan(otel.context.active(), span), () => {
        faro?.api.pushLog(['trace with log button clicked'])
        span.end()
      })
    }
  }

  return (
    <>
      <h3>Tracing Instrumentation</h3>
      <div>
        <button onClick={fetchSuccess}>Fetch Success</button>
        <button onClick={traceWithLog}>Trace with Log</button>
      </div>
    </>
  )
}
