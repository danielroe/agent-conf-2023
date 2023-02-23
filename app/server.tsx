import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './app.tsx'

export default defineEventHandler(async event => {
  const template = (await useStorage().getItem('templates:index.html')) as string
  try {
    const html = renderToString(<App />)
    return template.replace(
      '<main id="root" class="container"></main>',
      `<main id="root" class="container">${html}</main>`
    )
  } catch {
    return template
  }
})
