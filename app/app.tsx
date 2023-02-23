import React from 'react'
import '@picocss/pico'

export default function App() {
  const [count, setCount] = React.useState(0)
  return (
    <section>
      <h1>Hello AgentConf with HMR!</h1>
      <button onClick={() => setCount(count + 1)}>Click me: {count}!</button>
    </section>
  )
}
