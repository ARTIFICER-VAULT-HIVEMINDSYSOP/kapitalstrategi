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
  { w: 390, h: 844, name: '390x844' },
  { w: 1280, h: 800, name: '1280x800' },
  { w: 1440, h: 900, name: '1440x900' },
]

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
  const widget = '.tr-snap, .nlr-rk-quote, .nlr-rk-pnl, .nlr-rk-who, .nlr-rk-start, .nlr-duo-who, .nlr-duo-pnl, .nlr-rh-hud, .tr-sim, [data-tr-badge]'
  const nodes = [...document.querySelectorAll(`button, a, input, select, textarea, h1, h2, h3, ${widget}, [data-tr-trade-title], .tr-chrome *`)]
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
    const r = el.getBoundingClientRect()
    return { el, text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48), x: r.x, y: r.y, w: r.width, h: r.height }
  })
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
  return { pairs, outside, priceLabels, badgeText }
}

let browser
let server
let base
let puppeteer

test('42 vyer: brickor, lägesrad och klickbara ytor håller sig isär och inne i fönstret', { timeout: 300000 }, async (t) => {
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
            await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 })
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
  assert.equal(checked, 42)
  assert.deepEqual(failures, [], `${checked} kontroller, ${failures.length} fel`)
})

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
