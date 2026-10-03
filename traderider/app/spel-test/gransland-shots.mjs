import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const require = createRequire(join(REPO, 'traderider/app/package.json'))
const OUT = process.env.GRANS_SHOTS || '/opt/cursor/artifacts/granslandet'
const PORT = 8765
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome'

const variants = ['trade-rider', 'racex', 'academy', 'rabbit']
const shots = ['choice', 'frozen', 'live', 'duo']
const widths = [
  { w: 1280, h: 800 },
  { w: 390, h: 844 },
]

const puppeteer = require('puppeteer-core')
mkdirSync(OUT, { recursive: true })
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: REPO, stdio: 'ignore' })
const base = `http://127.0.0.1:${PORT}/traderider/spel/gransland/preview.html`

await new Promise((resolve, reject) => {
  const started = Date.now()
  const ping = async () => {
    try {
      const res = await fetch(base)
      if (res.ok) return resolve()
    } catch {
      /* wait */
    }
    if (Date.now() - started > 8000) return reject(new Error('servern startade inte'))
    setTimeout(ping, 150)
  }
  ping()
})

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const notes = []
try {
  for (const variant of variants) {
    for (const shot of shots) {
      for (const size of widths) {
        const page = await browser.newPage()
        await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1 })
        const url = `${base}?variant=${variant}&shot=${shot}`
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 })
        await page.waitForSelector('[data-gl-ready="1"]', { timeout: 20000 })
        const state = await page.evaluate(() => {
          const root = document.querySelector('[data-gl-root]')
          const badge = document.querySelector('[data-gl-badge]')?.textContent || ''
          const choice = document.querySelector('[data-gl-enter]')?.textContent || ''
          const prices = [...document.querySelectorAll('[data-gl-price]')].map((node) => node.textContent)
          return {
            phase: root?.dataset.glPhase || '',
            unknown: root?.dataset.glUnknown || '',
            badge,
            choice,
            prices,
          }
        })
        const file = join(OUT, `${variant}-${shot}-${size.w}.png`)
        await page.screenshot({ path: file })
        notes.push({ file, variant, shot, width: size.w, ...state })
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
  server.kill()
}

console.log(JSON.stringify(notes, null, 2))
