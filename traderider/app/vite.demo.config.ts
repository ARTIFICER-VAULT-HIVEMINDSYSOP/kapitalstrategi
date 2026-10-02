import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'
// @ts-expect-error plain ESM helper shared with scripts/check-demo.mjs
import { demoRedirects, renderRedirect } from './scripts/demo-redirect.mjs'

const pages = resolve(__dirname, 'pages')

/**
 * Spärrad demoram: ägaren har stängt demoramen i src/demo/ permanent. Alla ingångar under /traderider/demo/
 * skrivs därför över efter bygget med en enkel omdirigering (scripts/demo-redirects.json):
 *   /traderider/demo/          -> /traderider/
 *   /traderider/demo/tag/      -> /traderider/spel/#nvda-rider
 *   /traderider/demo/raket/    -> /traderider/spel/#raket
 *   /traderider/demo/akademin/ -> /traderider/spel/#akademin
 * De byggda demobundlarna (assets/) tas bort efter bygget så att ingenting av demoramen hamnar på Pages.
 * scripts/check-demo.mjs fallerar om något annat än omdirigeringarna finns kvar i ../demo/.
 */
export const DEMO_REDIRECTS: Record<string, { namn: string; mal: string }> = demoRedirects()

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
      rmSync(resolve(out, 'assets'), { recursive: true, force: true })
      for (const [page, target] of Object.entries(DEMO_REDIRECTS)) writeFileSync(resolve(out, page), renderRedirect(target))
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
