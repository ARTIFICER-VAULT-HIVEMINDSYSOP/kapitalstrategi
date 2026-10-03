/**
 * Skärmbilder av de riktiga spellägena efter loppet.
 * Kör: node traderider/app/scripts/gransland-shots.mjs
 * Ingår inte i node --test (ligger inte under spel-test/).
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const require = createRequire(join(REPO, 'traderider/app/package.json'))
const OUT = process.env.GRANS_SHOTS || '/opt/cursor/artifacts/granslandet'
const PORT = Number(process.env.GRANS_PORT || 8765)
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome'

const shots = [
  { name: 'trade-rider', hash: '#trade-rider', drive: 'line' },
  { name: 'trade-rider-duo', hash: '#trade-rider-2p', drive: 'duo' },
  { name: 'racex', hash: '#racex', drive: 'racex' },
  { name: 'academy', hash: '#academy', drive: 'academy' },
  { name: 'rabbit', hash: '#rabbit-hole', drive: 'rabbit' },
]
const widths = [
  { w: 1280, h: 800 },
  { w: 390, h: 844 },
]

const puppeteer = require('puppeteer-core')
mkdirSync(OUT, { recursive: true })
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: REPO, stdio: 'ignore' })
const base = `http://127.0.0.1:${PORT}/traderider/spel/`

await new Promise((resolve, reject) => {
  const started = Date.now()
  const ping = async () => {
    try {
      const res = await fetch(base)
      if (res.ok || res.status === 200) return resolve()
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

async function ready(page, kind) {
  await page.waitForFunction(() => window.__nvdaLineRsi && window.__trEngine, { timeout: 20000 })
  if (kind !== 'line') {
    await page.evaluate(() => {
      if (window.__trEngine?.playing) window.__trEngine.pause()
    })
    return
  }
  await page.evaluate(async () => {
    const deadline = Date.now() + 12000
    while (Date.now() < deadline) {
      const button = [...document.querySelectorAll('button')].find((node) => /Hoppa på tåget|Board the train|Сісти в потяг/.test(node.textContent || ''))
      if (!button) return
      if (!button.disabled) {
        button.click()
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  })
}

async function drive(page, kind) {
  if (kind === 'line') {
    await page.evaluate(() => {
      window.__trCommitEntry?.()
      const eng = window.__trEngine
      eng.train.x = Math.max(0, eng.track.finishX - 30)
      if (!eng.playing) eng.play()
    })
  } else if (kind === 'duo') {
    await page.evaluate(() => {
      const engines = window.__nvdaLineRsi.duo.engines().filter(Boolean)
      for (const eng of engines) {
        eng.train.x = Math.max(0, eng.track.finishX - 30)
        if (!eng.playing) eng.play()
      }
    })
  } else if (kind === 'racex') {
    await page.evaluate(() => {
      const raket = window.__nvdaLineRsi.raket
      raket.act(0, 'buy')
      raket.step(1e7)
    })
  } else if (kind === 'academy') {
    await page.evaluate(() => {
      const academy = window.__nvdaLineRsi.akademin
      academy.seek(1e9)
      academy.step(0.2)
    })
  } else if (kind === 'rabbit') {
    await page.evaluate(() => {
      const rabbit = window.__nvdaLineRsi.rabbit
      for (let i = 0; i < 800 && !document.querySelector('[data-gl-root]'); i++) rabbit.step(2)
    })
  }
  await page.waitForSelector('[data-gl-badge]', { timeout: 15000 })
  await page.waitForFunction(() => {
    const badge = document.querySelector('[data-gl-badge]')?.textContent || ''
    return badge.includes('SIMULERAD') && !badge.includes('VERKLIG')
  }, { timeout: 8000 })
}

async function still(page, kind) {
  return page.evaluate(async (mode) => {
    const pause = document.querySelector('[aria-label="Paus"]')
    const ride = document.querySelector('[aria-label="Kör"]')
    const before = {
      x: window.__trEngine?.train?.x ?? null,
      playing: !!window.__trEngine?.playing,
      duo: (window.__nvdaLineRsi?.duo?.engines?.() || []).map((eng) => eng?.playing),
      racex: window.__nvdaLineRsi?.raket?.state?.()?.playing ?? null,
      scroll: window.__nvdaLineRsi?.raket?.visuals?.()?.scroll ?? null,
    }
    await new Promise((resolve) => setTimeout(resolve, 450))
    const after = {
      x: window.__trEngine?.train?.x ?? null,
      playing: !!window.__trEngine?.playing,
      duo: (window.__nvdaLineRsi?.duo?.engines?.() || []).map((eng) => eng?.playing),
      racex: window.__nvdaLineRsi?.raket?.state?.()?.playing ?? null,
      scroll: window.__nvdaLineRsi?.raket?.visuals?.()?.scroll ?? null,
    }
    const badge = document.querySelector('[data-gl-badge]')?.textContent || ''
    const segments = [...document.querySelectorAll('[data-gl-segment]')].map((node) => ({
      kind: node.dataset.glSegment,
      text: node.textContent,
    }))
    const yard = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').trim() === 'Tillbaka till banan')
    let yardPeek = false
    if (yard) {
      let el = yard
      let hidden = false
      while (el && !hidden) {
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true
        el = el.parentElement
      }
      const rect = yard.getBoundingClientRect()
      const card = document.querySelector('.gl-card')?.getBoundingClientRect()
      const covered = !!(card && rect.top >= card.top && rect.bottom <= card.bottom && rect.left >= card.left && rect.right <= card.right)
      yardPeek = !hidden && !covered && rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.top < innerHeight
    }
    const scan = document.querySelector('.nlr-rk-scan')
    return {
      mode,
      pause: !!pause,
      ride: !!ride,
      before,
      after,
      badge,
      segments,
      claim: document.querySelector('[data-gl-claim]')?.textContent || '',
      simCount: [badge, ...segments.map((seg) => seg.text)].filter((text) => text.includes('SIMULERAD')).length,
      yardPeek,
      scan: scan ? getComputedStyle(scan).animationName : null,
    }
  }, kind)
}

async function changedPixels(page, selector) {
  const before = await page.screenshot({ encoding: 'base64' })
  const canvas = await page.evaluate(async (sel) => {
    const nodes = [...document.querySelectorAll(sel)]
    const snaps = nodes.map((canvas) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !canvas.width || !canvas.height) return null
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data
    })
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return snaps.map((snap, i) => {
      const canvas = nodes[i]
      const ctx = canvas.getContext('2d')
      if (!snap || !ctx) return null
      const next = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let changed = 0
      for (let p = 0; p < snap.length; p += 4) {
        if (snap[p] !== next[p] || snap[p + 1] !== next[p + 1] || snap[p + 2] !== next[p + 2] || snap[p + 3] !== next[p + 3]) changed += 1
      }
      return changed
    })
  }, selector)
  const after = await page.screenshot({ encoding: 'base64' })
  const pageChanged = await page.evaluate(async (a, b) => {
    const load = (src) => new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('png'))
      img.src = `data:image/png;base64,${src}`
    })
    const [ia, ib] = await Promise.all([load(a), load(b)])
    const board = document.createElement('canvas')
    board.width = ia.naturalWidth
    board.height = ia.naturalHeight
    const ctx = board.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(ia, 0, 0)
    const da = ctx.getImageData(0, 0, board.width, board.height).data
    ctx.drawImage(ib, 0, 0)
    const db = ctx.getImageData(0, 0, board.width, board.height).data
    let changed = 0
    for (let i = 0; i < da.length; i += 4) {
      if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) changed += 1
    }
    return changed
  }, before, after)
  return { canvas, page: pageChanged }
}

const notes = []
try {
  for (const shot of shots) {
    for (const size of widths) {
      const page = await browser.newPage()
      await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1 })
      await page.goto(`${base}${shot.hash}`, { waitUntil: 'networkidle0', timeout: 30000 })
      await ready(page, shot.drive)
      await drive(page, shot.drive)
      await new Promise((resolve) => setTimeout(resolve, 350))
      const state = await still(page, shot.drive)
      let motion = null
      if (shot.drive === 'duo' || shot.drive === 'racex') {
        const selector = shot.drive === 'duo' ? '.nlr-duo-play canvas' : '.nlr-raket > canvas'
        motion = await changedPixels(page, selector)
      }
      const file = join(OUT, `${shot.name}-choice-${size.w}.png`)
      await page.screenshot({ path: file })
      notes.push({ file, ...shot, width: size.w, ...state, motion })
      await page.close()
    }
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page.goto(`${base}#trade-rider`, { waitUntil: 'networkidle0', timeout: 30000 })
  await ready(page, 'line')
  await drive(page, 'line')
  await page.click('[data-gl-enter]')
  await page.waitForFunction(() => {
    const crypto = document.querySelector('[data-gl-crypto]')
    const live = document.querySelector('[data-gl-segment="live"]')
    return (crypto && !crypto.hidden) || live
  }, { timeout: 20000 })
  const crypto = await page.$('[data-gl-crypto]:not([hidden])')
  if (crypto) {
    await crypto.click()
    await page.waitForSelector('[data-gl-segment="live"]', { timeout: 20000 })
  }
  await new Promise((resolve) => setTimeout(resolve, 400))
  const live = await page.evaluate(() => ({
    badge: document.querySelector('[data-gl-badge]')?.textContent || '',
    segments: [...document.querySelectorAll('[data-gl-segment]')].map((node) => ({
      kind: node.dataset.glSegment,
      text: node.textContent,
    })),
    prices: [...document.querySelectorAll('[data-gl-price]')].map((node) => node.textContent),
  }))
  const liveFile = join(OUT, 'trade-rider-live-1280.png')
  await page.screenshot({ path: liveFile })
  notes.push({ file: liveFile, name: 'trade-rider', drive: 'live', width: 1280, ...live })
  await page.close()
} finally {
  await browser.close()
  server.kill()
}

const bad = notes.filter((note) => {
  if (note.drive === 'live') {
    const sim = (note.segments || []).find((seg) => seg.kind === 'simulerad')
    const live = (note.segments || []).find((seg) => seg.kind === 'live')
    return !sim || /VERKLIG/.test(sim.text) || !live || !/VERKLIG/.test(live.text)
  }
  if (!note.badge?.includes('SIMULERAD') || /VERKLIG/.test(note.badge || '')) return true
  if (note.simCount !== 1 || note.yardPeek) return true
  if (note.drive === 'line' && (note.pause || note.after?.playing || note.before?.x !== note.after?.x)) return true
  if (note.drive !== 'line' && note.drive !== 'live' && note.after?.playing) return true
  if (note.drive === 'duo' && (note.after?.duo || []).some(Boolean)) return true
  if (note.drive === 'duo' && (!(note.motion?.canvas || []).length || (note.motion?.canvas || []).some((n) => n !== 0) || note.motion?.page !== 0)) return true
  if (note.drive === 'racex' && (note.after?.racex || JSON.stringify(note.before?.scroll) !== JSON.stringify(note.after?.scroll))) return true
  if (note.drive === 'racex' && (note.scan !== 'none' || (note.motion?.canvas || []).some((n) => n !== 0) || note.motion?.page !== 0)) return true
  return false
})
console.log(JSON.stringify({ notes, bad }, null, 2))
if (bad.length) process.exitCode = 1
