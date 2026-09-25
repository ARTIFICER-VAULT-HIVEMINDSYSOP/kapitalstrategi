import { mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'

const pages = resolve(__dirname, 'pages')

function hoistPages(): Plugin {
  return {
    name: 'hoist-demo-pages',
    apply: 'build',
    closeBundle() {
      const out = resolve(__dirname, '../demo')
      const moves = [
        ['pages/index.html', 'index.html'],
        ['pages/tag/index.html', 'tag/index.html'],
        ['pages/akademin/index.html', 'akademin/index.html'],
        ['pages/raket/index.html', 'raket/index.html'],
      ]
      for (const [from, to] of moves) {
        const dest = resolve(out, to)
        mkdirSync(dirname(dest), { recursive: true })
        renameSync(resolve(out, from), dest)
      }
      rmSync(resolve(out, 'pages'), { recursive: true, force: true })
    },
  }
}

export default defineConfig({
  base: '/traderider/demo/',
  plugins: [viteReact(), hoistPages()],
  build: {
    outDir: resolve(__dirname, '../demo'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        overview: resolve(pages, 'index.html'),
        tag: resolve(pages, 'tag/index.html'),
        akademin: resolve(pages, 'akademin/index.html'),
        raket: resolve(pages, 'raket/index.html'),
      },
    },
  },
  preview: {
    port: 3021,
    host: true,
  },
})
