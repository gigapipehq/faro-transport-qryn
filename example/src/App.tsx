import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ThrowError } from './ThrowError'
import { TracingInstrumentation } from './TracingInstrumentation'
import { faro } from './faro'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() => {
            // logger?.pushEvent('Count pressed', { count: count.toString() }, 'example')
            faro?.api.pushEvent('Count pressed', { count: count.toString() }, 'example')

            setCount(count => count + 1)
          }}
        >
          count is {count}
        </button>
        {/* Once the <ThrowError /> renders an error would be thrown blowing up the application. This will be captured and send to qryn */}
        {count > 5 && <ThrowError />}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      <TracingInstrumentation />
    </>
  )
}

export default App
