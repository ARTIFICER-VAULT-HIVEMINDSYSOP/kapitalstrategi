/**
 * v1-renderare för faceDriver: tecknad pilot och åk-sprite.
 * Rutan byts i hela steg, cirka 9 bilder per sekund. Ingen interpolering mellan rutor.
 * Sprite-arken hämtas först när en avatar visas.
 */
import { sampleX } from './kurs.js'
import { createFaceDriver } from './face-driver.js'
import { readSide } from './styrmotor.js'
import { onLang, t } from './i18n.js'

export const RIDE_SHEETS = {
  ride: { src: '/traderider/spel/sprites/academy-robot-ride.webp', w: 320, h: 396 },
  high: { src: '/traderider/spel/sprites/academy-robot-ride-highlev.webp', w: 321, h: 396 },
}

const images = { ride: null, high: null }

export function sheetImage(id) {
  const key = id === 'high' ? 'high' : 'ride'
  if (!images[key] && typeof Image !== 'undefined') {
    const img = new Image()
    img.decoding = 'async'
    img.src = RIDE_SHEETS[key].src
    images[key] = img
  }
  return images[key]
}

export function sheetMeta(id) {
  return RIDE_SHEETS[id === 'high' ? 'high' : 'ride']
}

/** Öppen vinst i procent ur tågets egen pnl, som räknas på samma kurssteg. Flat ger 0. */
export function openPctFromTrain({ pnl, price, side, leverage }) {
  if (side !== 'buy' && side !== 'sell') return 0
  if (!(price > 0) || !(leverage > 0) || !Number.isFinite(pnl)) return 0
  const sign = side === 'buy' ? 1 : -1
  const delta = pnl / (sign * 10 * leverage)
  const entry = price - delta
  if (!(entry > 0)) return 0
  return sign * (price / entry - 1) * leverage * 100
}

/** Trade Rider: samma x-sampel som grafen, inte en egen serie. */
export function trainTick(engine) {
  const points = engine?.track?.points
  const x = engine?.train?.x
  const sample = sampleX(points, x)
  const side = readSide(engine?.train)
  const lev = engine?.leverage || 1
  const price = sample.price
  const openPct = openPctFromTrain({ pnl: engine?.train?.pnl, price, side, leverage: lev })
  return { price, index: sample.i, side, openPct, lev }
}

const css = `
.nlr-pilot{position:absolute;left:10px;top:10px;z-index:4;pointer-events:none;box-sizing:border-box;width:124px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:6px 6px 7px;border-radius:14px}
.nlr-pilot.is-fixed{position:fixed;z-index:36;top:calc(var(--tr-chrome-b, 76px) + 8px);left:12px}
.nlr-pilot[data-theme="paper"]{background:rgba(246,242,234,.94);color:#1c1915;border:1px solid rgba(28,25,21,.16);box-shadow:0 8px 18px rgba(28,25,21,.08)}
.nlr-pilot[data-theme="hud"]{background:rgba(10,15,46,.88);color:#eaf6ff;border:1px solid rgba(46,230,255,.42);box-shadow:0 0 16px rgba(46,230,255,.12)}
.nlr-pilot[hidden]{display:none !important}
.nlr-pilot-face{width:64px;height:64px;display:block}
.nlr-pilot-face .shell{fill:#f4f7fb;stroke:#0f172a;stroke-width:2}
.nlr-pilot[data-theme="hud"] .shell{fill:#171433;stroke:#2ee6ff}
.nlr-pilot-face .visor{fill:#24145a;stroke:#b388ff;stroke-width:1.2}
.nlr-pilot-face .eye{fill:#d7c4ff;transform-box:fill-box;transform-origin:center;transition:transform .22s ease}
.nlr-pilot-face .brow{fill:#f4e3b0;transform-box:fill-box;transform-origin:center;transition:transform .22s ease}
.nlr-pilot-face .mouth{fill:none;stroke:#1c1915;stroke-width:2.2;stroke-linecap:round;transition:opacity .22s ease}
.nlr-pilot[data-theme="hud"] .mouth{stroke:#f4f7fb}
.nlr-pilot[data-theme="paper"] .brow{fill:#3b2a12}
.nlr-pilot-face .strain path{fill:none;stroke:#ffb4e0;stroke-width:1.6;stroke-linecap:round}
.nlr-pilot-face .antenna{stroke:#e09a1a;stroke-width:2}
.nlr-pilot-face .tip{fill:#f5b942;stroke:#0f172a;stroke-width:1}
.nlr-pilot-ride{width:112px;height:138px;display:block;background:transparent}
.nlr-pilot small{font:600 11px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em}
.nlr-rk-2p .nlr-pilot{top:44px;width:104px;padding:4px}
.nlr-rk-2p .nlr-pilot-ride{width:94px;height:116px}
.nlr-rk-2p .nlr-pilot-face{width:52px;height:52px}
.nlr-duo-half .nlr-pilot{left:8px;top:auto;bottom:128px;width:108px}
@media (max-width:700px){
  .nlr-pilot.is-fixed{width:104px}
  .nlr-pilot-ride{width:92px;height:114px}
  .nlr-pilot-face{width:52px;height:52px}
  .nlr-duo-half .nlr-pilot{bottom:118px;width:96px}
}
@media (max-height:560px){
  .nlr-pilot small{display:none}
  .nlr-pilot-face{width:44px;height:44px}
  .nlr-pilot{width:96px;padding:4px}
}
@media (prefers-reduced-motion:reduce){
  .nlr-pilot-face .eye,.nlr-pilot-face .brow,.nlr-pilot-face .mouth{transition:none}
}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const el = document.createElement('style')
  el.dataset.pilotStyle = '1'
  el.textContent = css
  document.head.appendChild(el)
}

function faceMarkup() {
  return `<svg class="nlr-pilot-face" viewBox="0 0 80 80" aria-hidden="true">
    <line class="antenna" x1="40" y1="12" x2="40" y2="4"/>
    <circle class="tip" cx="40" cy="4" r="2.4"/>
    <rect class="shell" x="14" y="12" width="52" height="56" rx="16"/>
    <rect class="visor" x="22" y="26" width="36" height="18" rx="7"/>
    <ellipse class="eye leye" cx="32" cy="35" rx="4.2" ry="4.2"/>
    <ellipse class="eye reye" cx="48" cy="35" rx="4.2" ry="4.2"/>
    <rect class="brow lbrow" x="26" y="27" width="12" height="2.2" rx="1"/>
    <rect class="brow rbrow" x="42" y="27" width="12" height="2.2" rx="1"/>
    <path class="mouth smile" d="M30 52 q10 8 20 0"/>
    <path class="mouth flat" d="M30 54 h20"/>
    <path class="mouth frown" d="M30 58 q10 -7 20 0"/>
    <path class="mouth open" d="M33 50 h14 a7 6 0 0 1 0 10 h-14 a7 6 0 0 1 0 -10"/>
    <g class="strain"><path d="M16 32 l-5 2"/><path d="M64 32 l5 2"/></g>
  </svg>`
}

function applyFace(root, weights) {
  const svg = root.querySelector('.nlr-pilot-face')
  if (!svg || !weights) return
  const eyeY = weights.blink > 0.5 ? 0.12 : Math.max(0.28, 1 + weights.eyeWide * 0.35 - weights.eyeSquint * 0.72)
  svg.querySelectorAll('.eye').forEach((el) => {
    el.style.transform = `scaleY(${eyeY.toFixed(3)})`
  })
  const brow = (-weights.browUp * 3 + weights.browDown * 3).toFixed(2)
  const tilt = (weights.browDown * 8).toFixed(2)
  const left = svg.querySelector('.lbrow')
  const right = svg.querySelector('.rbrow')
  if (left) left.style.transform = `translateY(${brow}px) rotate(${tilt}deg)`
  if (right) right.style.transform = `translateY(${brow}px) rotate(${-tilt}deg)`
  const mouth = weights.mouthOpen > 0.55 ? 'open' : weights.smile > 0.45 ? 'smile' : weights.browDown > 0.55 && weights.smile < 0.2 ? 'frown' : 'flat'
  svg.querySelectorAll('.mouth').forEach((el) => {
    const on = el.classList.contains(mouth)
    el.style.opacity = on ? '1' : '0'
  })
  const strain = svg.querySelector('.strain')
  if (strain) strain.style.opacity = weights.strain > 0.5 ? '1' : '0'
}

function paintRide(canvas, snap) {
  if (!canvas || !snap?.ride) return
  const meta = sheetMeta(snap.ride.sheet)
  const img = sheetImage(snap.ride.sheet)
  const cssW = canvas.clientWidth || 0
  if (!cssW) {
    canvas.dataset.sig = ''
    const tries = Number(canvas.dataset.layoutTries || 0)
    if (tries < 8 && typeof requestAnimationFrame === 'function') {
      canvas.dataset.layoutTries = String(tries + 1)
      requestAnimationFrame(() => paintRide(canvas, snap))
    }
    return
  }
  canvas.dataset.layoutTries = '0'
  const sig = `${snap.ride.sheet}|${snap.ride.frame}|${cssW}`
  if (canvas.dataset.sig === sig) return
  canvas.dataset.sig = sig
  if (!img || !img.complete || !img.naturalWidth) {
    img?.addEventListener?.('load', () => {
      canvas.dataset.sig = ''
      paintRide(canvas, snap)
    }, { once: true })
    return
  }
  const cssH = cssW * (meta.h / meta.w)
  const dpr = Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)
  const w = Math.max(1, Math.round(cssW * dpr))
  const h = Math.max(1, Math.round(cssH * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  const frame = snap.ride.frame
  ctx.drawImage(img, frame * meta.w, 0, meta.w, meta.h, 0, 0, w, h)
  canvas.dataset.pilotReady = '1'
}

/** Ritar en ruta av åk-spriten på en spelkanvas. x,y är brädans ungefärliga läge. */
export function drawRideSprite(ctx, snap, x, y, height) {
  if (!ctx || !snap?.ride) return false
  const meta = sheetMeta(snap.ride.sheet)
  const img = sheetImage(snap.ride.sheet)
  if (!img || !img.complete || !img.naturalWidth) return false
  const fh = height
  const fw = fh * (meta.w / meta.h)
  ctx.drawImage(img, snap.ride.frame * meta.w, 0, meta.w, meta.h, x - fw * 0.4, y - fh * 0.74, fw, fh)
  return true
}

export function mountPilot(parent, { theme = 'paper', player = 1, placement = 'abs' } = {}) {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'nlr-pilot' + (placement === 'fixed' ? ' is-fixed' : '')
  root.dataset.pilot = String(player)
  root.dataset.theme = theme
  root.setAttribute('role', 'img')
  root.innerHTML = `${faceMarkup()}<canvas class="nlr-pilot-ride" aria-hidden="true"></canvas><small data-k="look"></small>`
  parent.appendChild(root)
  const driver = createFaceDriver()
  const canvas = root.querySelector('canvas')
  let lastKey = ''
  let on = true

  function label(snap) {
    const look = t('face.' + (snap?.expression || 'neutral'))
    const who = t('rk.player', { n: player })
    root.setAttribute('aria-label', t('face.aria', { who, look }))
    const cap = root.querySelector('[data-k="look"]')
    if (cap) cap.textContent = look
  }

  function sync(tick, now) {
    if (!on) return driver.snap()
    const snap = driver.update({ ...tick, now: now ?? (typeof performance !== 'undefined' ? performance.now() : 0) })
    const key = `${snap.expression}|${snap.tense ? 1 : 0}|${Math.round((snap.weights.blink || 0) * 10)}`
    if (key !== lastKey) {
      lastKey = key
      applyFace(root, snap.weights)
      label(snap)
    }
    root.dataset.expression = snap.expression
    root.dataset.ride = snap.ride.clip
    root.dataset.sheet = snap.ride.sheet
    root.dataset.frame = String(snap.ride.frame)
    root.dataset.tense = snap.tense ? '1' : '0'
    if (Number.isFinite(snap.price)) root.dataset.price = String(snap.price)
    sheetImage(snap.ride.sheet)
    paintRide(canvas, snap)
    return snap
  }

  const offLang = onLang(() => label(driver.snap() || { expression: 'neutral' }))
  label({ expression: 'neutral' })

  return {
    root,
    sync,
    snap: () => driver.snap(),
    setOn(next) {
      on = !!next
      root.hidden = !on
    },
    destroy() {
      offLang()
      root.remove()
    },
  }
}
