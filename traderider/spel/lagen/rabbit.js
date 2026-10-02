/**
 * Rabbit Hole. Samma styrmotor som de andra lägena, orientation movement down.
 * Världen rullar nedåt. Morot = stigande stapel, chili = fallande. Eget batteri med plus.
 */
import { keyAction, PREVENT_DEFAULT } from './keys.js'
import { MODES, createSteering, wheelToIntent } from './orientation.js'
import { t, onLang } from './i18n.js'
import { createGestureLock } from './styrmotor.js'
import { positionFor, steerLanes } from './spar.js'

const O = MODES.rabbitHole.orientation
const steering = createSteering(O)

const css = `
.nlr-rh{display:none;position:fixed;inset:0;z-index:55;background:#140e0c;color:#f4efe6}
.nlr-rh.on{display:block}
.nlr-rh canvas{width:100%;height:100%;display:block}
.nlr-rh-hud{position:absolute;left:12px;right:12px;top:calc(var(--tr-chrome-b, 96px) + 12px);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 12px;pointer-events:none;font:600 12px/1.35 "IBM Plex Sans",sans-serif}
.nlr-rh-hud b{color:#e7b15a}
.nlr-rh-note{position:absolute;left:12px;bottom:16px;max-width:min(520px,92vw);font:500 12px/1.4 "IBM Plex Sans",sans-serif;color:#f4efe6}
.nlr-rh-bat{width:28px;height:14px}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const s = document.createElement('style')
  s.textContent = css
  document.head.appendChild(s)
}

function carrot(c, x, y) {
  c.fillStyle = '#e07a2f'
  c.beginPath()
  c.moveTo(x, y - 16)
  c.lineTo(x + 7, y + 10)
  c.lineTo(x - 7, y + 10)
  c.closePath()
  c.fill()
  c.strokeStyle = '#2f8f7a'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(x, y - 16)
  c.lineTo(x - 6, y - 22)
  c.moveTo(x, y - 16)
  c.lineTo(x + 6, y - 22)
  c.stroke()
}

function chili(c, x, y) {
  c.strokeStyle = '#d45d75'
  c.lineWidth = 4
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(x, y - 14)
  c.quadraticCurveTo(x + 10, y, x, y + 12)
  c.stroke()
  c.strokeStyle = '#2f8f7a'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(x, y - 14)
  c.lineTo(x + 6, y - 20)
  c.stroke()
}

function battery(c, x, y) {
  c.strokeStyle = '#e7b15a'
  c.lineWidth = 1.5
  c.strokeRect(x, y, 22, 12)
  c.fillStyle = '#e7b15a'
  c.fillRect(x + 22, y + 3, 3, 6)
  c.fillRect(x + 10, y + 3, 2, 6)
  c.fillRect(x + 7, y + 5, 8, 2)
}

export function createRabbit() {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'nlr-rh'
  root.setAttribute('role', 'region')
  const canvas = document.createElement('canvas')
  const hud = document.createElement('div')
  hud.className = 'nlr-rh-hud'
  root.append(canvas, hud)
  document.body.appendChild(root)

  let visible = false
  let frozen = false
  let raf = 0
  let y = 40
  let side = 'flat'
  let leverage = 1
  let lastX = null
  let priceIndex = 0
  let entry = null
  let result = null
  const lock = createGestureLock(480)
  const decorations = Array.from({ length: 18 }, (_, i) => (i % 3 === 0 ? -1 : 1))

  function series() {
    const candles = window.__trEngine?.quote?.candles
    return Array.isArray(candles) ? candles : []
  }
  function priceAt(index) {
    const candles = series()
    if (!candles.length) return null
    const candle = candles[((index % candles.length) + candles.length) % candles.length]
    const value = Number(candle?.c ?? candle?.close)
    return Number.isFinite(value) ? value : null
  }
  function markEntry() {
    if (side === 'flat') return
    const price = priceAt(priceIndex)
    if (entry == null && price != null) entry = price
  }
  let priceDebt = 0
  let lastFrame = 0
  // Samma takttid som Historiens staplar, inte en stapel per bildruta.
  const BAR_SEC = 0.28
  function advancePrice(dt) {
    if (!series().length) return
    priceDebt += Math.max(0, Number(dt) || 0)
    let guard = 0
    let moved = false
    while (priceDebt >= BAR_SEC && guard++ < 4) {
      priceDebt -= BAR_SEC
      priceIndex = (priceIndex + 1) % series().length
      moved = true
    }
    if (!moved) return
    const price = priceAt(priceIndex)
    if (price == null || side === 'flat' || entry == null || entry === 0) return
    const sign = side === 'buy' ? 1 : -1
    result = sign * (price / entry - 1) * leverage * 100
  }
  function fmtPrice(price) {
    return price == null ? '—' : price.toFixed(2)
  }
  function fmtResult(value) {
    if (!Number.isFinite(value)) return '—'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  function paint() {
    root.setAttribute('aria-label', t('mode.rabbitHole.name'))
    const price = priceAt(priceIndex)
    hud.innerHTML = `<span><b>${t('sim.price')}</b> ${fmtPrice(price)}</span><span><b>${t('hud.result')}</b> ${fmtResult(result)}</span><span>${side === 'buy' ? t('btn.buy') : side === 'sell' ? t('btn.sell') : t('btn.flat')} · ${t('lev.risk')}</span>`
    const w = root.clientWidth || 800
    const h = root.clientHeight || 600
    const dpr = Math.min(2, devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const c = canvas.getContext('2d')
    if (!c) return
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.fillStyle = '#140e0c'
    c.fillRect(0, 0, w, h)
    const travel = steering.travel.y
    for (let i = 0; i < 8; i++) {
      const py = ((i * 90 + y * travel) % (h + 80)) - 40
      c.fillStyle = i % 2 ? '#6a3a28' : '#8a5a32'
      c.fillRect(36, py, w - 72, 28)
      c.fillStyle = '#2f8f7a'
      c.fillRect(48, py + 8, 18, 8)
      if (i % 4 === 0) {
        c.fillStyle = '#d45d75'
        c.fillRect(w - 80, py + 6, 10, 10)
      }
    }
    decorations.forEach((dir, i) => {
      const x = 80 + (i % 6) * ((w - 160) / 6)
      const cy = ((i * 70 + y * travel) % (h + 40)) - 10
      if (dir > 0) carrot(c, x, cy)
      else chili(c, x, cy)
    })
    const lanes = steerLanes(w, 'right')
    const xPos = positionFor(side, lanes.buy, lanes.sell)
    lastX = xPos
    c.fillStyle = '#f7f4ef'
    c.beginPath()
    c.ellipse(xPos, h * 0.42, 26, 34, 0, 0, Math.PI * 2)
    c.fill()
    c.fillRect(xPos - 16, h * 0.42 - 8, 32, 8)
    c.fillStyle = '#1a1a1a'
    c.fillRect(xPos - 14, h * 0.42 - 6, 10, 5)
    c.fillRect(xPos + 4, h * 0.42 - 6, 10, 5)
    battery(c, w - 64, 72)
  }

  function apply(intent) {
    const next = steering.applyIntent({ side, leverage }, intent)
    const was = side
    side = next.side
    leverage = next.leverage
    if (side === 'flat') entry = null
    else if (was !== side) entry = priceAt(priceIndex)
    else markEntry()
    paint()
  }

  function onKey(e) {
    if (!visible) return
    const a = keyAction(e, '1p', O)
    if (!a || !a.intent) return
    e.preventDefault()
    e.stopPropagation()
    apply(a.intent)
  }
  addEventListener('keydown', onKey, true)
  addEventListener('keyup', (e) => {
    if (visible && PREVENT_DEFAULT.has(e.code) && keyAction(e, '1p', O)) e.preventDefault()
  }, true)
  root.addEventListener('wheel', (e) => {
    if (!visible) return
    const intent = wheelToIntent(e.deltaY)
    if (!intent || !lock.allow()) return
    e.preventDefault()
    apply(intent)
  }, { passive: false })

  function frame(now) {
    if (!visible || frozen) return
    const t = typeof now === 'number' ? now : performance.now()
    const dt = lastFrame ? Math.min(0.05, (t - lastFrame) / 1000) : 0.016
    lastFrame = t
    y += 1.2 * Math.max(0.4, leverage / 4)
    advancePrice(dt)
    paint()
    raf = requestAnimationFrame(frame)
  }
  onLang(paint)

  return {
    show() {
      visible = true
      root.classList.add('on')
      paint()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    },
    hide() {
      visible = false
      root.classList.remove('on')
      cancelAnimationFrame(raf)
    },
    freeze() {
      frozen = true
      cancelAnimationFrame(raf)
    },
    resume() {
      frozen = false
      if (visible) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(frame)
      }
    },
    anchor: () => 'bottom',
    step(n = 1) {
      const dt = Math.max(0, Number(n) || 0)
      const ticks = Math.max(1, Math.min(12, Math.round((dt || 0.016) / 0.016) || 1))
      for (let i = 0; i < ticks; i++) y += 1.2 * Math.max(0.4, leverage / 4)
      advancePrice(dt)
      paint()
    },
    state() {
      const w = root.clientWidth || 800
      const lanes = steerLanes(w, 'right')
      return { side, leverage, y, x: positionFor(side, lanes.buy, lanes.sell), ...lanes }
    },
  }
}
