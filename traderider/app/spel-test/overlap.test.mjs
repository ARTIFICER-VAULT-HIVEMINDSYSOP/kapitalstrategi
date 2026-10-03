// Synliga knappar, brickor och lägesraden får inte skära varandra,
// och inget man kan klicka på får sticka ut ur fönstret.
// Skärmbilder: OVERLAP_SHOTS, annars en tillfällig katalog.
// Kör: node --test traderider/app/spel-test/overlap.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const require = createRequire(join(REPO, 'traderider/app/package.json'))
const SHOTS = process.env.OVERLAP_SHOTS || join(tmpdir(), 'tr-overlap')

const VIEWPORTS = [
  { w: 390, h: 844, dpr: 1, name: '390x844' },
  { w: 390, h: 844, dpr: 2, name: '390x844-dpr2' },
  { w: 390, h: 844, dpr: 3, name: '390x844-dpr3' },
  { w: 768, h: 1024, dpr: 1, name: '768x1024' },
  { w: 844, h: 390, dpr: 1, name: '844x390' },
  { w: 1280, h: 800, dpr: 1, name: '1280x800' },
  { w: 1440, h: 900, dpr: 1, name: '1440x900' },
]

const CLAIMS = {
  sv: 'Simulerade kurser – inte verkliga marknadsdata',
  en: 'Simulated prices – not real market data',
  uk: 'Симульовані курси – не реальні ринкові дані',
}

const MODES = [
  { id: 'tr-1p', hash: '#trade-rider', start: 'splash' },
  { id: 'tr-2p', hash: '#trade-rider-2p', start: 'duo' },
  { id: 'racex-1p', hash: '#racex', start: 'raket' },
  { id: 'racex-2p', hash: '#racex-2p', start: 'raket' },
  { id: 'rabbit', hash: '#rabbit-hole', start: 'rabbit' },
  { id: 'akademin', hash: '#academy', start: 'akademin' },
  { id: 'historia', hash: '#trade-rider', start: 'historia' },
]

function chromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  for (const p of ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (existsSync(p)) return p
  }
  return ''
}

function collect() {
  const tileNames = [
    'På grafen', 'On chart', 'На графіку',
    'När', 'When', 'Коли',
    'Band', 'Bands', 'Смуги',
    'Övning', 'Practice', 'Тренування',
    'HÄVSTÅNG', 'LEVERAGE', 'ПЛЕЧЕ',
    'Simulerad kurs', 'Simulated price', 'Симульований курс',
    'Kurs', 'Price', 'Курс',
  ]
  const captions = new Set(['Simulerad kurs', 'Simulated price', 'Симульований курс', 'Kurs', 'Price', 'Курс'])
  const widget = '.tr-snap, .nlr-rk-quote, .nlr-rk-pnl, .nlr-rk-who, .nlr-rk-start, .nlr-duo-who, .nlr-duo-pnl, .nlr-rh-hud, .nlr-rsi, .tr-sim, [data-tr-badge]'
  const nodes = [...document.querySelectorAll(`button, a, input, select, textarea, h1, h2, h3, ${widget}, [data-tr-trade-title], .tr-chrome *`)]
  const kicker = document.querySelector('[data-tr-splash] p')
  if (kicker) nodes.push(kicker)
  for (const node of document.querySelectorAll('div')) {
    if (node.children.length) continue
    const text = (node.textContent || '').trim()
    if (!text) continue
    const hit = tileNames.find((name) => text === name || text.startsWith(`${name} `) || text.startsWith(`${name}·`) || text.startsWith(`${name} ·`))
    if (!hit) continue
    const tile = node.parentElement
    if (tile) nodes.push(tile)
  }
  const view = document.documentElement.dataset.nlrView || 'line'
  const active = view === 'raket' ? 'raket' : view === 'rabbit' ? 'rabbit' : view === 'akademin' ? 'akademin' : document.querySelector('.nlr-duo.on') ? 'duo' : 'line'
  function layer(el) {
    if (el.closest('.tr-chrome')) return 'chrome'
    if (el.closest('.tr-fas')) return 'fas'
    if (el.closest('.tr-instr')) return 'instr'
    if (el.closest('.nlr-raket')) return 'raket'
    if (el.closest('.nlr-duo')) return 'duo'
    if (el.closest('.nlr-rh')) return 'rabbit'
    if (el.closest('.nlr-ak')) return 'akademin'
    return 'line'
  }
  function painted(el) {
    for (let n = el; n; n = n.parentElement) {
      if (n.hidden) return false
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    }
    const r = el.getBoundingClientRect()
    return r.width >= 2 && r.height >= 2
  }
  const fasOn = !!document.querySelector('.tr-fas:not([hidden])')
  const kept = []
  for (const el of nodes) {
    if (!painted(el)) continue
    if (el.closest('.tr-snap') && !el.classList.contains('tr-snap')) continue
    const box = el.closest(widget)
    if (box && box !== el && !el.matches('button, a, input, select, textarea')) continue
    const where = layer(el)
    const ok = where === 'chrome' || where === active || (fasOn && (where === 'fas' || where === 'instr')) || (!fasOn && where === 'instr')
    if (!ok) continue
    kept.push(el)
  }
  const unique = [...new Set(kept)]
  function visibleBox(el) {
    const r = el.getBoundingClientRect()
    let top = r.top
    let left = r.left
    let right = r.right
    let bottom = r.bottom
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      const clipsY = ['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowY)
      const clipsX = ['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowX)
      if (!clipsY && !clipsX) continue
      const c = n.getBoundingClientRect()
      if (clipsY) {
        top = Math.max(top, c.top)
        bottom = Math.min(bottom, c.bottom)
      }
      if (clipsX) {
        left = Math.max(left, c.left)
        right = Math.min(right, c.right)
      }
    }
    return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) }
  }
  function scrollableY(el) {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 4) return true
    }
    const root = document.scrollingElement
    return !!root && root.scrollHeight > innerHeight + 4
  }
  const outside = []
  for (const el of unique) {
    if (!el.matches('button, a, input, select, textarea')) continue
    const r = el.getBoundingClientRect()
    const slop = 1
    const pastLeft = r.left < -slop
    const pastRight = r.right > innerWidth + slop
    const pastTop = r.top < -slop
    const pastBottom = r.bottom > innerHeight + slop
    if (!pastLeft && !pastRight && !pastTop && !pastBottom) continue
    const hitsX = r.right > 0 && r.left < innerWidth
    const hitsY = r.bottom > 0 && r.top < innerHeight
    const pinned = !!el.closest('.tr-chrome') || ['fixed', 'sticky'].includes(getComputedStyle(el).position)
    const onScreen = hitsX && hitsY
    const verticalOnly = (pastTop || pastBottom) && !pastLeft && !pastRight
    if (!onScreen && !pinned) continue
    if (onScreen && verticalOnly && !pinned && scrollableY(el)) continue
    outside.push(`${(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32)} @${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`)
  }
  const boxes = unique.map((el) => {
    const r = visibleBox(el)
    return { el, text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48), x: r.x, y: r.y, w: r.w, h: r.h }
  }).filter((b) => b.w >= 2 && b.h >= 2)
  const pairs = []
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const iw = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const ih = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (iw > 1 && ih > 1) pairs.push(`${a.text} ↔ ${b.text}`)
    }
  }
  const priceLabels = []
  for (const node of document.querySelectorAll('header div, .nlr-rk-quote small, .nlr-rh-hud b')) {
    if (node.children.length) continue
    const text = (node.textContent || '').trim()
    if (!text) continue
    let n = node
    let visible = true
    while (n) {
      if (n.hidden || getComputedStyle(n).display === 'none') visible = false
      n = n.parentElement
    }
    if (visible && captions.has(text)) priceLabels.push(text)
  }
  const badge = document.querySelector('[data-tr-badge]')
  const badgeText = badge && !badge.hidden && getComputedStyle(badge).display !== 'none' ? badge.textContent.trim() : ''
  function playBox() {
    const viewName = document.documentElement.dataset.nlrView || 'line'
    const duoOn = document.querySelector('.nlr-duo.on')
    let canvases
    if (duoOn) canvases = [...duoOn.querySelectorAll('canvas')]
    else if (viewName === 'raket') canvases = [...document.querySelectorAll('.nlr-raket.on canvas')]
    else if (viewName === 'rabbit') canvases = [...document.querySelectorAll('.nlr-rh.on canvas')]
    else if (viewName === 'akademin') canvases = [...document.querySelectorAll('.nlr-ak.on canvas')]
    else canvases = [...document.querySelectorAll('div.relative.h-dvh > canvas')]
    canvases = canvases.filter((c) => painted(c))
    if (!canvases.length) return null
    let x = Infinity
    let y = Infinity
    let right = -Infinity
    let bottom = -Infinity
    for (const canvas of canvases) {
      const r = visibleBox(canvas)
      if (r.w < 2 || r.h < 2) continue
      x = Math.min(x, r.x)
      y = Math.min(y, r.y)
      right = Math.max(right, r.x + r.w)
      bottom = Math.max(bottom, r.y + r.h)
    }
    if (!Number.isFinite(x)) return null
    if (viewName === 'line' && !duoOn) {
      const header = document.querySelector('header.pointer-events-none')
      if (header && painted(header)) {
        const h = header.getBoundingClientRect()
        if (h.bottom > y && h.top < bottom) y = Math.max(y, h.bottom)
      }
      const linebar = document.querySelector('[data-tr-linebar]')
      if (linebar && painted(linebar)) {
        const b = linebar.getBoundingClientRect()
        if (b.top > y && b.top < bottom) bottom = b.top
      }
    }
    if (bottom - y < 20 || right - x < 20) return null
    return { x, y, w: right - x, h: bottom - y }
  }
  const playHits = []
  const play = playBox()
  if (play) {
    for (const el of document.querySelectorAll('.tr-chrome button, .tr-chrome a, .tr-chrome input, .tr-sim')) {
      if (!painted(el)) continue
      const r = el.getBoundingClientRect()
      const iw = Math.min(r.right, play.x + play.w) - Math.max(r.left, play.x)
      const ih = Math.min(r.bottom, play.y + play.h) - Math.max(r.top, play.y)
      if (iw > 1 && ih > 1) {
        playHits.push(`${(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32)} på spelplanen`)
      }
    }
  }
  const sim = document.querySelector('.tr-sim')
  const simClip = sim && painted(sim) && sim.scrollWidth > sim.clientWidth + 2 ? `sim avklippt (${sim.clientWidth}/${sim.scrollWidth})` : ''
  const splashEl = document.querySelector('[data-tr-splash]')
  const splashOn = !!splashEl && painted(splashEl) && active === 'line'
  const surface = active === 'raket'
    ? document.querySelector('.nlr-raket.on')
    : active === 'rabbit'
      ? document.querySelector('.nlr-rh.on')
      : active === 'akademin'
        ? document.querySelector('.nlr-ak.on')
        : active === 'duo'
          ? document.querySelector('.nlr-duo.on')
          : document.querySelector('div.relative.h-dvh')
  const missed = []
  for (const el of document.querySelectorAll('button, a, input')) {
    if (!painted(el)) continue
    const inChrome = !!el.closest('.tr-chrome')
    const inSurface = !!(surface && surface.contains(el))
    const inSplash = !!(splashOn && el.closest('[data-tr-splash]'))
    if (!inChrome && !inSurface && !inSplash) continue
    if (splashOn && inSurface && !inSplash) continue
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    if (cx < 1 || cy < 1 || cx > innerWidth - 1 || cy > innerHeight - 1) continue
    let clip = false
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll' && cs.overflow !== 'hidden') continue
      const box = n.getBoundingClientRect()
      if (cy < box.top + 1 || cy > box.bottom - 1 || cx < box.left + 1 || cx > box.right - 1) clip = true
    }
    if (clip) continue
    const hit = document.elementFromPoint(cx, cy)
    if (hit && (hit === el || el.contains(hit))) continue
    const label = (el.innerText || el.getAttribute('aria-label') || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 24)
    const other = hit ? String(hit.innerText || hit.className || hit.tagName).replace(/\s+/g, ' ').trim().slice(0, 24) : 'tomt'
    missed.push(`${label} → ${other}`)
    if (missed.length >= 8) break
  }
  const giants = []
  const cap = innerHeight * 3
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.height <= cap) continue
    const pos = getComputedStyle(el).position
    if (pos !== 'fixed' && pos !== 'sticky') {
      let held = false
      for (let n = el.parentElement; n; n = n.parentElement) {
        const oy = getComputedStyle(n).overflowY
        if ((oy === 'auto' || oy === 'scroll' || oy === 'hidden') && n.clientHeight + 4 < r.height) {
          held = true
          break
        }
      }
      if (held) continue
    }
    giants.push(`${el.tagName}.${String(el.className).slice(0, 48)} ${Math.round(r.height)}`)
    if (giants.length >= 6) break
  }
  function claimShown(el) {
    if (!painted(el)) return false
    const where = layer(el)
    if (where !== active && !(splashOn && el.closest('[data-tr-splash]'))) return false
    const r = el.getBoundingClientRect()
    const slop = 0.5
    if (r.width < 8 || r.height < 8) return false
    if (r.top < slop || r.left < slop || r.bottom > innerHeight - slop || r.right > innerWidth - slop) return false
    const clips = (v) => v === 'auto' || v === 'scroll' || v === 'hidden' || v === 'clip'
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      const clipsY = clips(cs.overflowY)
      const clipsX = clips(cs.overflowX)
      if (!clipsY && !clipsX) continue
      const c = n.getBoundingClientRect()
      if (clipsY && (r.top < c.top - slop || r.bottom > c.bottom + slop)) return false
      if (clipsX && (r.left < c.left - slop || r.right > c.right + slop)) return false
    }
    const self = getComputedStyle(el)
    if (clips(self.overflowY) && el.scrollHeight > el.clientHeight + 2) return false
    if (clips(self.overflowX) && el.scrollWidth > el.clientWidth + 2) return false
    const pad = Math.min(2, r.width / 4, r.height / 4)
    const points = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + pad, r.top + pad],
      [r.right - pad, r.top + pad],
      [r.left + pad, r.bottom - pad],
      [r.right - pad, r.bottom - pad],
    ]
    const through = getComputedStyle(el).pointerEvents === 'none'
    const prev = el.style.pointerEvents
    if (through) el.style.pointerEvents = 'auto'
    let onTop = true
    for (const [px, py] of points) {
      const hit = document.elementFromPoint(px, py)
      if (!hit || (hit !== el && !el.contains(hit))) onTop = false
    }
    if (through) el.style.pointerEvents = prev
    return onTop
  }
  const claims = []
  for (const el of document.querySelectorAll('[data-tr-claim]')) {
    claims.push({ text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220), onScreen: claimShown(el) })
  }
  return { pairs, outside, priceLabels, badgeText, playHits, simClip, missed, giants, claims }
}

let browser
let server
let base
let puppeteer

test('vyer: brickor, lägesrad, klick och höjd håller sig inom fönstret', { timeout: 600000 }, async (t) => {
  const chrome = chromePath()
  if (!chrome) return t.skip('Chrome saknas (CHROME_PATH)')
  puppeteer = require('puppeteer-core')
  const port = 9876
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: REPO, stdio: 'ignore' })
  base = `http://127.0.0.1:${port}/traderider/spel/`
  await new Promise((resolve, reject) => {
    const started = Date.now()
    const ping = async () => {
      try {
        const res = await fetch(base)
        if (res.ok || res.status === 200) return resolve()
      } catch {
        /* not up */
      }
      if (Date.now() - started > 8000) return reject(new Error('statisk server startade inte'))
      setTimeout(ping, 150)
    }
    ping()
  })
  browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  mkdirSync(SHOTS, { recursive: true })
  const failures = []
  let checked = 0
  for (const mode of MODES) {
    for (const phase of ['before', 'after']) {
      for (const vp of VIEWPORTS) {
        checked += 1
        let result
        let lastErr
        for (let attempt = 0; attempt < 2 && !result; attempt++) {
          const page = await browser.newPage()
          try {
            await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
            await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr || 1 })
            await page.goto(base + mode.hash, { waitUntil: 'domcontentloaded', timeout: 30000 })
            await page.waitForSelector('.tr-skal', { timeout: 20000 })
            await new Promise((r) => setTimeout(r, 700))
            if (phase === 'after') await begin(page, mode.start)
            await new Promise((r) => setTimeout(r, 400))
            result = await page.evaluate(collect)
            await page.screenshot({ path: join(SHOTS, `${mode.id}-${phase}-${vp.name}.png`) })
          } catch (err) {
            lastErr = err
            result = null
          } finally {
            await page.close().catch(() => {})
          }
        }
        if (!result) throw lastErr
        if (result.pairs.length) failures.push(`${mode.id} ${phase} ${vp.name}: ${result.pairs.join(' | ')}`)
        if (result.outside.length) failures.push(`${mode.id} ${phase} ${vp.name} utanför: ${result.outside.join(' | ')}`)
        if (phase === 'after' && result.playHits.length) failures.push(`${mode.id} ${phase} ${vp.name} spelplan: ${result.playHits.join(' | ')}`)
        if (result.simClip) failures.push(`${mode.id} ${phase} ${vp.name}: ${result.simClip}`)
        if (result.missed.length) failures.push(`${mode.id} ${phase} ${vp.name} klick: ${result.missed.join(' | ')}`)
        if (result.giants.length) failures.push(`${mode.id} ${phase} ${vp.name} för hög: ${result.giants.join(' | ')}`)
        if (phase === 'before') {
          const shown = result.claims.some((c) => c.onScreen && c.text.includes(CLAIMS.sv))
          if (!shown) failures.push(`${mode.id} ${phase} ${vp.name}: simuleringsmeningen syns inte`)
        }
        if (mode.id === 'historia' && phase === 'after') {
          const simulated = result.priceLabels.filter((label) => /simuler|simulated|симульов/i.test(label))
          if (simulated.length) failures.push(`${mode.id} ${phase} ${vp.name}: kursbricka säger ${simulated.join(', ')}`)
          if (!/HISTORISK|HISTORICAL|ІСТОРИЧНЕ/.test(result.badgeText)) failures.push(`${mode.id} ${phase} ${vp.name}: historiemärke saknas`)
          const neutral = result.priceLabels.some((label) => label === 'Kurs' || label === 'Price' || label === 'Курс')
          if (!neutral) failures.push(`${mode.id} ${phase} ${vp.name}: neutral kursrad saknas (${result.priceLabels.join(', ') || 'tom'})`)
        }
      }
    }
  }
  for (const mode of MODES) {
    for (const lang of [
      { button: 'EN', phrase: CLAIMS.en },
      { button: 'UA', phrase: CLAIMS.uk },
    ]) {
      checked += 1
      const page = await browser.newPage()
      try {
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
        await page.goto(base + mode.hash, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('.tr-skal', { timeout: 20000 })
        await new Promise((r) => setTimeout(r, 500))
        const btn = await page.evaluateHandle((label) => [...document.querySelectorAll('.lang-switcher-btn')].find((el) => el.textContent.trim() === label), lang.button)
        const box = await btn.asElement()?.boundingBox()
        if (!box) throw new Error(`språkknapp ${lang.button} saknas`)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await new Promise((r) => setTimeout(r, 300))
        const result = await page.evaluate(collect)
        const shown = result.claims.some((c) => c.onScreen && c.text.includes(lang.phrase))
        if (!shown) failures.push(`${mode.id} before 390x844-dpr2 ${lang.button}: meningen syns inte`)
        if (result.giants.length) failures.push(`${mode.id} ${lang.button} för hög: ${result.giants.join(' | ')}`)
      } finally {
        await page.close().catch(() => {})
      }
    }
  }
  for (const vp of [
    { w: 844, h: 390, name: '844x390' },
    { w: 740, h: 360, name: '740x360' },
    { w: 667, h: 375, name: '667x375' },
  ]) {
    checked += 1
    const page = await browser.newPage()
    try {
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 })
      await page.goto(base + '#trade-rider', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForSelector('.tr-skal', { timeout: 20000 })
      await new Promise((r) => setTimeout(r, 500))
      await begin(page, 'splash')
      await new Promise((r) => setTimeout(r, 400))
      const hit = await page.evaluate(() => {
        const panel = document.querySelector('.nlr-rsi')
        if (!panel || getComputedStyle(panel).display === 'none') return 'dold'
        const pr = panel.getBoundingClientRect()
        if (pr.height < 8 || pr.top < 1 || pr.bottom > innerHeight - 1) return 'utanför'
        const hits = []
        for (const el of document.querySelectorAll('header.pointer-events-none button, header.pointer-events-none div')) {
          if (el.closest('.nlr-rsi')) continue
          const text = (el.innerText || '').replace(/\s+/g, ' ').trim()
          const interesting = el.tagName === 'BUTTON' || /^(Övning|Practice|Тренування|1D|5D|1M|6M|1Y|5Y|Max|Maks|Live)\b/.test(text)
          if (!interesting) continue
          const r = el.getBoundingClientRect()
          if (r.width < 2 || r.height < 2 || r.height > 160) continue
          const iw = Math.min(pr.right, r.right) - Math.max(pr.left, r.left)
          const ih = Math.min(pr.bottom, r.bottom) - Math.max(pr.top, r.top)
          if (iw > 1 && ih > 1) hits.push(text.slice(0, 28) || el.tagName)
        }
        return hits.length ? [...new Set(hits)].join(' | ') : ''
      })
      if (hit) failures.push(`tr-1p after ${vp.name} rsi: ${hit}`)
      await page.screenshot({ path: join(SHOTS, `tr-1p-rsi-${vp.name}.png`) })
    } finally {
      await page.close().catch(() => {})
    }
  }
  for (const phase of ['before', 'after']) {
    for (const vp of [
      { w: 568, h: 320, name: '568x320' },
      { w: 667, h: 375, name: '667x375' },
      { w: 740, h: 360, name: '740x360' },
      { w: 844, h: 390, name: '844x390' },
    ]) {
      checked += 1
      const page = await browser.newPage()
      try {
        await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 })
        await page.goto(base + '#trade-rider', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('.tr-skal', { timeout: 20000 })
        await new Promise((r) => setTimeout(r, 500))
        if (phase === 'after') await begin(page, 'splash')
        await new Promise((r) => setTimeout(r, 400))
        const hits = await page.evaluate(tradeHits)
        const bad = hits.filter((h) => h.state !== 'ok')
        if (phase === 'after') {
          if (bad.length) failures.push(`tr-1p ${phase} ${vp.name} träff: ${bad.map((h) => `${h.name}=${h.state}${h.other ? `:${h.other}` : ''}`).join(' | ')}`)
        } else if (hits.some((h) => h.state === 'ok' || h.state === 'miss') && bad.length) {
          failures.push(`tr-1p ${phase} ${vp.name} träff: ${bad.map((h) => `${h.name}=${h.state}${h.other ? `:${h.other}` : ''}`).join(' | ')}`)
        }
        await page.screenshot({ path: join(SHOTS, `tr-1p-${phase}-${vp.name}-flat.png`) })
      } finally {
        await page.close().catch(() => {})
      }
    }
  }
  assert.equal(checked, MODES.length * 2 * VIEWPORTS.length + MODES.length * 2 + 3 + 8)
  assert.deepEqual(failures, [], `${checked} kontroller, ${failures.length} fel`)
})

function tradeHits() {
  const names = ['buy', 'sell', 'flat']
  return names.map((name) => {
    const el = document.querySelector(`button[data-tr="${name}"]`)
    if (!el) return { name, state: 'missing' }
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) return { name, state: 'hidden' }
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    if (cx < 1 || cy < 1 || cx > innerWidth - 1 || cy > innerHeight - 1) return { name, state: 'offscreen' }
    const hit = document.elementFromPoint(cx, cy)
    if (hit && (hit === el || el.contains(hit))) return { name, state: 'ok' }
    const other = hit ? String(hit.innerText || hit.className || hit.tagName).replace(/\s+/g, ' ').trim().slice(0, 40) : 'tomt'
    return { name, state: 'miss', other }
  })
}

async function userClick(page, selector) {
  const handle = await page.waitForSelector(selector, { visible: true, timeout: 8000 })
  let box = await handle.boundingBox()
  if (!box) throw new Error(`ingen ruta för ${selector}`)
  const vp = page.viewport()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  if (cx < 2 || cy < 2 || cx > vp.width - 2 || cy > vp.height - 2) {
    await handle.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }))
    box = await handle.boundingBox()
    if (!box) throw new Error(`ingen ruta efter scroll för ${selector}`)
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

async function begin(page, kind) {
  if (kind === 'splash') {
    await userClick(page, '[data-tr-splash] button')
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-tr-splash]')
      return !el || el.hidden || getComputedStyle(el).display === 'none'
    }, { timeout: 8000 })
  } else if (kind === 'duo') {
    await userClick(page, '.nlr-duo [data-k="buy"]')
  } else if (kind === 'raket') {
    await userClick(page, '.nlr-raket .nlr-rk-side.buy')
  } else if (kind === 'rabbit') {
    const field = await page.waitForSelector('.nlr-rh', { visible: true, timeout: 8000 })
    const box = await field.boundingBox()
    if (box) await page.mouse.click(Math.min(box.x + 24, box.x + box.width / 2), Math.min(box.y + box.height - 24, box.y + box.height / 2))
    await page.keyboard.press('Space')
  } else if (kind === 'akademin') {
    const read = await page.$('.nlr-ak.on [data-act="read"]')
    await userClick(page, read ? '.nlr-ak.on [data-act="read"]' : '.nlr-ak.on [data-act="play"]')
  } else if (kind === 'historia') {
    await userClick(page, '[data-tr-instr-open]')
    await page.waitForSelector('[data-tr-instr-start]', { visible: true, timeout: 5000 })
    await userClick(page, '[data-tr-instr-start]')
    await page.waitForFunction(() => {
      const badge = document.querySelector('[data-tr-badge]')
      return !!badge && !badge.hidden && getComputedStyle(badge).display !== 'none'
    }, { timeout: 8000 })
  }
}

test.after(async () => {
  await browser?.close()
  server?.kill()
})
