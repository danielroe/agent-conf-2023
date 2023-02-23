/// <reference types="vite/client" />

import React from 'react'
import { hydrateRoot, Root } from 'react-dom/client'
import App from './app'

export { App }

window.$root = window.$root || hydrateRoot(document.querySelector('#root')!, <App />)

if (import.meta.hot) {
  import.meta.hot.accept(mod => {
    window.$root?.render(<mod.App />)
  })
}

declare global {
  interface Window {
    $root?: Root
  }
}
