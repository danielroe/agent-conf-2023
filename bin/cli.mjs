#!/usr/bin/env node
import mri from 'mri'
import { resolve } from 'path'
import {
  createNitro,
  createDevServer,
  prepare,
  build,
  copyPublicAssets,
  prerender,
} from 'nitropack'
import { loadConfig } from 'c12'
import { createServer, build as buildVite } from 'vite'
import { defineLazyEventHandler, defineEventHandler, fromNodeMiddleware } from 'h3'

async function main() {
  const args = mri(process.argv.slice(2))
  const command = args._[0]
  const rootDir = resolve(args._[1] || '.')

  const { config } = await loadConfig({
    configFile: 'agent.config.ts',
    defaultConfig: {
      vite: {
        resolve: {
          alias: {
            react: 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react-dom': 'preact/compat', // Must be below test-utils
            'react/jsx-runtime': 'preact/jsx-runtime',
          },
        },
      },
      nitro: {
        typescript: { internalPaths: true },
        esbuild: {
          options: {
            loaders: {
              '.tsx': 'tsx',
            },
          },
        },
        publicAssets: [
          {
            dir: './.nitro/client/assets',
            baseURL: '/assets',
            maxAge: 31536000,
          },
        ],
        handlers: [
          {
            handler: './app/server.tsx',
            route: '/**',
          },
        ],
        devHandlers: [
          {
            route: '/__vite',
            handler: defineLazyEventHandler(async () => {
              const viteDevServer = await createServer({
                base: '/__vite/',
                appType: 'custom',
                server: { middlewareMode: true },
              })

              return defineEventHandler(fromNodeMiddleware(viteDevServer.middlewares))
            }),
          },
        ],
      },
    },
  })

  if (command === 'dev') {
    const nitro = await createNitro({
      rootDir,
      dev: true,
      preset: 'nitro-dev',
      ...(config.nitro ?? {}),
    })

    const template = await nitro.storage.getItem('root:index.html')
    await nitro.storage.setItem(
      'templates:index.html',
      template.replace(
        '<script type="module" src="./app/client"></script>',
        `<script type="module" src="/__vite/app/client"></script>
    <script type="module" src="/__vite/@vite/client"></script>`
      )
    )
    const server = createDevServer(nitro)
    await server.listen({})
    await prepare(nitro)
    await build(nitro)
    return
  }

  if (command === 'build') {
    const nitro = await createNitro({
      rootDir,
      dev: false,
      bundledStorage: ['templates'],
      devStorage: {
        templates: {
          driver: 'fs',
          base: '.nitro/templates',
        },
      },
      ...(config.nitro ?? {}),
    })

    await buildVite({
      build: {
        outDir: '.nitro/client',
      },
      ...(config.vite ?? {}),
    })

    const template = await nitro.storage.getItem('build:client:index.html')
    await nitro.storage.setItem('templates:index.html', template)
    await prepare(nitro)
    await copyPublicAssets(nitro)

    await prerender(nitro)
    await build(nitro)
    await nitro.close()
    process.exit(0)
  }
  console.error(`Unknown command ${command}! Usage: nitro dev|build|prepare [rootDir]`)
  process.exit(1)
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
