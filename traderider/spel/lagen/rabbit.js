/**
 * Rabbit Hole. Samma styrmotor som de andra lägena, orientation movement down.
 * Kaninen faller nedåt: tunneln, morötterna och chilin rullar uppåt förbi den.
 * Morot = stigande stapel, chili = fallande. Ett neutralt batteri utan logotyp.
 * prefers-reduced-motion: spiralen, virveln och parallaxen står stilla, och hoppet ned hoppas över.
 * Start: kaninen står ovanför hålet. Enter eller knappen börjar fallet.
 */
import { isTypingTarget, keyAction, PREVENT_DEFAULT } from './keys.js'
import { MODES, createSteering, wheelToIntent } from './orientation.js'
import { t, onLang } from './i18n.js'
import { createGestureLock } from './styrmotor.js'
import { positionFor, steerLanes } from './spar.js'

const O = MODES.rabbitHole.orientation
const steering = createSteering(O)

const PINK = '#ff4fa8'
const CYAN = '#2ee6d6'
const FUR = '#fffaf7'
const FUR_SHADE = '#f0e2dc'
const INNER = '#ffb3c8'
const NOSE = '#ff6f93'
const FRAME_RED = '#e10600'
const FRAME_BLACK = '#161616'

const css = `
.nlr-rh{display:none;position:fixed;inset:0;z-index:55;background:#07060c;color:#f4efe6}
.nlr-rh.on{display:block}
.nlr-rh canvas{width:100%;height:100%;display:block}
.nlr-rh-hud{position:absolute;left:12px;right:12px;top:12px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 12px;pointer-events:none;font:600 12px/1.35 "IBM Plex Sans",sans-serif}
.nlr-rh-hud b{color:#e7b15a}
.nlr-rh-note{position:absolute;left:12px;right:12px;bottom:12px;max-width:min(520px,calc(100% - 24px));font:500 12px/1.35 "IBM Plex Sans",sans-serif;color:#f4efe6;text-shadow:0 1px 2px #07060c;pointer-events:none}
.nlr-rh[data-phase="race"] .nlr-rh-note{bottom:auto;top:34px}
.nlr-rh-home{position:absolute;left:50%;top:12px;transform:translateX(-50%);width:min(360px,calc(100% - 24px));pointer-events:none;z-index:2}
.nlr-rh-card{pointer-events:auto;background:rgba(246,242,234,.97);color:#1c1915;border:1px solid rgba(28,25,21,.16);border-radius:16px;padding:12px 14px 14px;box-shadow:0 12px 28px rgba(7,6,12,.28)}
.nlr-rh-claim{margin:0 0 6px;font:700 11px/1.3 "IBM Plex Sans",sans-serif;letter-spacing:.04em;color:#8a5a22}
.nlr-rh-card h2{margin:0 0 6px;font:600 20px/1.15 Fraunces,Georgia,serif}
.nlr-rh-card p{margin:0 0 8px;font:500 13px/1.4 "IBM Plex Sans",sans-serif}
.nlr-rh-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.nlr-rh-start,.nlr-rh-two{border:0;border-radius:999px;font:700 14px/1 "IBM Plex Sans",sans-serif;padding:10px 14px;cursor:pointer}
.nlr-rh-start{background:#e7b15a;color:#1c1915}
.nlr-rh-two{background:#1c1915;color:#f4efe6}
.nlr-rh-start:focus-visible,.nlr-rh-two:focus-visible{outline:3px solid #2ee6d6;outline-offset:2px}
.nlr-rh-keys{margin:8px 0 0;font:500 12px/1.35 "IBM Plex Sans",sans-serif;color:#5c564c}
.nlr-rh-indicators{position:absolute;left:12px;right:12px;bottom:40px;display:grid;gap:8px;pointer-events:none;z-index:2}
.nlr-rh-indicators[data-players="1"]{grid-template-columns:minmax(0,1fr)}
.nlr-rh-indicators[data-players="2"]{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.nlr-rh-player{background:rgba(8,6,14,.82);border:1px solid rgba(46,230,214,.55);border-radius:14px;padding:8px 10px 10px;display:grid;gap:4px}
.nlr-rh-who{margin:0;font:700 11px/1.2 "IBM Plex Sans",sans-serif;letter-spacing:.06em;color:#e7b15a}
.nlr-rh-fall{margin:0;font:600 13px/1.3 "IBM Plex Sans",sans-serif}
.nlr-rh-meter{height:8px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden}
.nlr-rh-meter > span{display:block;height:100%;width:0;background:linear-gradient(90deg,#2ee6d6,#ff4fa8)}
.nlr-rh-lane-labels{display:flex;justify-content:space-between;gap:6px;font:700 11px/1.2 "IBM Plex Sans",sans-serif}
.nlr-rh-lane-labels [data-on="sell"]{color:#ff4fa8}
.nlr-rh-lane-labels [data-on="flat"]{color:#e7b15a}
.nlr-rh-lane-labels [data-on="buy"]{color:#2ee6d6}
.nlr-rh-track{position:relative;height:14px;border-radius:99px;background:linear-gradient(90deg,#ff4fa8 0%,#f4efe6 50%,#2ee6d6 100%)}
.nlr-rh-marker{position:absolute;top:-5px;width:8px;height:24px;margin-left:-4px;border-radius:4px;background:#1c1915;box-shadow:0 0 0 2px #fff;transition:left 120ms linear}
.nlr-rh-decision{margin:2px 0 0;font:700 22px/1 Fraunces,Georgia,serif}
.nlr-rh-decision[data-side="sell"]{color:#ff4fa8}
.nlr-rh-decision[data-side="flat"]{color:#e7b15a}
.nlr-rh-decision[data-side="buy"]{color:#2ee6d6}
.nlr-rh-cue,.nlr-rh-risk{margin:0;font:500 12px/1.35 "IBM Plex Sans",sans-serif;color:#f4efe6}
.nlr-rh-bat{width:28px;height:14px}
@media (max-width:640px){
  .nlr-rh-indicators[data-players="2"]{grid-template-columns:minmax(0,1fr)}
  .nlr-rh-card h2{font-size:18px}
  .nlr-rh-decision{font-size:18px}
}
@media (max-height:520px){
  .nlr-rh-home{left:12px;transform:none;width:min(280px,48vw)}
  .nlr-rh-card{padding:8px 10px}
  .nlr-rh-card p{font-size:12px}
  .nlr-rh-indicators{bottom:8px}
  .nlr-rh-risk{display:none}
  .nlr-rh[data-phase="race"] .nlr-rh-note{top:28px}
}
@media (prefers-reduced-motion: reduce){
  .nlr-rh,.nlr-rh canvas,.nlr-rh-marker{animation:none;transition:none;scroll-behavior:auto}
}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const s = document.createElement('style')
  s.textContent = css
  document.head.appendChild(s)
}

/** Negativt värde: världen flyttar sig uppåt på skärmen när fallet ökar. */
export function scrollDelta(fall0, fall1, reduced = false) {
  if (reduced) return 0
  const a = Number(fall0) || 0
  const b = Number(fall1) || 0
  return -(b - a)
}

export function spiralAngle(time, reduced = false) {
  if (reduced) return 0
  const n = Number(time) || 0
  return n * 0.65
}

export function parallaxShift(fall, layer, reduced = false) {
  if (reduced) return 0
  const f = Number(fall) || 0
  const k = Number(layer) > 0 ? Number(layer) : 1
  return -f * k
}

export function reducedMotion() {
  const ask = globalThis.matchMedia
  if (typeof ask !== 'function') return false
  try {
    return !!ask('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function markerScreenY(fall, reduced = false) {
  return 480 + scrollDelta(0, fall, reduced)
}

export const JUMP_SEC = 0.72
export const PHASES = ['home', 'jump', 'race']

/** Fall per tick. Högre hävstång ökar farten nedåt. Reducerad rörelse står stilla. */
export function fallRate(leverage, reduced = false) {
  if (reduced) return 0
  const lev = Number.isFinite(Number(leverage)) ? Number(leverage) : 1
  return 2.6 * Math.max(0.45, lev / 4)
}

export function fallBand(rate) {
  const n = Number(rate) || 0
  if (n <= 0) return 'still'
  if (n < 1.5) return 'slow'
  if (n < 2.4) return 'steady'
  return 'fast'
}

/** home → jump → race. Enter och knappen är start. */
export function advancePhase(phase, event) {
  if (phase === 'home' && (event === 'start' || event === 'jump')) return 'jump'
  if (phase === 'jump' && event === 'landed') return 'race'
  return phase
}

export function jumpProgress(elapsed, reduced = false) {
  if (reduced) return 1
  const t = Math.max(0, Number(elapsed) || 0)
  return Math.min(1, t / JUMP_SEC)
}

export function homeLayout(width, height) {
  const w = Math.max(1, Number(width) || 1)
  const h = Math.max(1, Number(height) || 1)
  const groundY = Math.round(h * 0.62)
  const hole = {
    x: w * 0.5,
    y: groundY + Math.min(28, h * 0.045),
    rx: Math.max(46, Math.min(110, w * 0.11)),
    ry: Math.max(16, Math.min(32, h * 0.04)),
  }
  return { groundY, hole }
}

/** Kaninen står på gräset. FLAT är ovanför hålet, SÄLJ till vänster, KÖP till höger. */
export function standPoint(side, layout) {
  const hole = layout.hole
  const gap = hole.rx + 64
  const x = side === 'sell' ? hole.x - gap : side === 'buy' ? hole.x + gap : hole.x
  return { x, y: layout.groundY - 4 }
}

export function jumpPose(progress, from, hole) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0))
  const arc = Math.sin(p * Math.PI) * 28
  return {
    x: from.x + (hole.x - from.x) * p,
    y: from.y + (hole.y + 36 - from.y) * p - arc,
    drop: p,
    done: p >= 1,
  }
}

export function splitLayout(width, players) {
  const w = Math.max(1, Number(width) || 1)
  if (players === 2) {
    const half = w / 2
    return [
      { player: 1, left: 0, width: half },
      { player: 2, left: half, width: half },
    ]
  }
  return [{ player: 1, left: 0, width: w }]
}

export function lateralRead(side, width) {
  const lanes = steerLanes(Math.max(1, Number(width) || 1), 'right')
  const x = positionFor(side, lanes.buy, lanes.sell)
  const span = lanes.buy - lanes.sell || 1
  const t = (x - lanes.sell) / span
  return { x, t, offset: t - 0.5, lanes }
}

export function movementIndicators({ side = 'flat', leverage = 1, width = 800, reduced = false } = {}) {
  const decision = side === 'buy' || side === 'sell' ? side : 'flat'
  const read = lateralRead(decision, width)
  const rate = fallRate(leverage, reduced)
  return {
    fallRate: rate,
    band: fallBand(rate),
    lateral: read.t,
    offset: read.offset,
    decision,
    x: read.x,
    lanes: read.lanes,
  }
}

export const CARROT_HP = 1
export const HP_MAX = 8

export function eatCarrot(hp) {
  const n = Number.isFinite(Number(hp)) ? Number(hp) : 0
  return Math.min(HP_MAX, n + CARROT_HP)
}

export function candleKind(candle, index = 0) {
  const open = Number(candle?.o ?? candle?.open)
  const close = Number(candle?.c ?? candle?.close)
  if (Number.isFinite(open) && Number.isFinite(close) && close !== open) return close > open ? 'carrot' : 'chili'
  return index % 3 === 0 ? 'chili' : 'carrot'
}

export function artLabels() {
  return ['RSI', 'MACD', '+HP']
}

export function signLabel(index) {
  return index % 2 === 0 ? 'RSI' : 'MACD'
}

function wrap(value, span) {
  const s = span || 1
  return ((value % s) + s) % s
}

export function projectItem(index, count, fall, width, height, reduced = false) {
  const span = Math.max(1, height + 160)
  const motion = reduced ? 0 : Number(fall) || 0
  const lane = ((index * 5) % 7) / 6
  const x = width * (0.14 + lane * 0.72)
  const world = ((index + 0.5) / Math.max(1, count)) * span
  const y = wrap(world + scrollDelta(0, motion, false), span) - 40
  const generation = Math.floor(Math.max(0, motion) / span)
  const depth = Math.min(1, Math.max(0, 1 - (y + 40) / span))
  return {
    x,
    y,
    index,
    generation,
    id: `item:${index}:${generation}`,
    depth,
    scale: 0.42 + depth * 0.9,
  }
}

const BITE_SPAN = 280

/** En morot som startar under kaninen och driver uppåt förbi munnen. */
export function passingCarrot(fall, width, height, reduced = false) {
  const motion = reduced ? 0 : Number(fall) || 0
  const generation = Math.floor(Math.max(0, motion) / BITE_SPAN)
  return {
    x: width * 0.5 + 28,
    y: height * 0.4 + 150 - (motion % BITE_SPAN),
    kind: 'carrot',
    id: `bite:${generation}`,
    reach: 50,
    depth: 0.8,
    scale: 1,
  }
}

export function applyPickups(items, rabbit, hp, eaten) {
  const skip = new Set(eaten || [])
  let next = Number(hp) || 0
  let gained = 0
  const rx = Number(rabbit?.x) || 0
  const ry = Number(rabbit?.y) || 0
  for (const item of items || []) {
    if (!item || item.kind !== 'carrot' || skip.has(item.id)) continue
    const reach = Number(item.reach) > 0 ? Number(item.reach) : 36
    const dx = item.x - rx
    const dy = item.y - ry
    if (dx * dx + dy * dy <= reach * reach) {
      next = eatCarrot(next)
      gained += 1
      skip.add(item.id)
    }
  }
  return { hp: next, eaten: [...skip], gained }
}

/**
 * Huvudet leder fallet (större y). Öronen sitter på huvudet och pekar uppåt
 * (mindre y). Två linser på huvudet, mellan öronen.
 */
export function rabbitSprite({ eating = false } = {}) {
  const frame = eating ? 'black' : 'red'
  return {
    pose: 'head-first-down',
    fall: 'down',
    parts: [
      { id: 'foot-l', kind: 'foot', on: 'leg-l', x: -28, y: -108 },
      { id: 'foot-r', kind: 'foot', on: 'leg-r', x: 26, y: -104 },
      { id: 'leg-l', kind: 'leg', on: 'body', x: -16, y: -82 },
      { id: 'leg-r', kind: 'leg', on: 'body', x: 18, y: -78 },
      { id: 'tail', kind: 'tail', on: 'body', x: 28, y: -62 },
      { id: 'body', kind: 'body', on: 'body', x: 0, y: -48 },
      { id: 'arm-l', kind: 'arm', on: 'body', x: -40, y: -74 },
      { id: 'arm-r', kind: 'arm', on: 'body', x: 42, y: -66 },
      { id: 'ear-l', kind: 'ear', on: 'head', x: -20, y: -96, inner: 'pink' },
      { id: 'ear-r', kind: 'ear', on: 'head', x: 22, y: -90, inner: 'pink' },
      { id: 'battery', kind: 'battery', on: 'arm-r', x: 62, y: -66, logo: false },
      { id: 'head', kind: 'head', on: 'head', x: 0, y: 10 },
      { id: 'eye-l', kind: 'eye', on: 'head', x: -12, y: 8, frame },
      { id: 'eye-r', kind: 'eye', on: 'head', x: 12, y: 8, frame },
      { id: 'glint-l', kind: 'glint', on: 'eye-l', x: -16, y: 4 },
      { id: 'glint-r', kind: 'glint', on: 'eye-r', x: 8, y: 4 },
      { id: 'cheek-l', kind: 'cheek', on: 'head', x: -18, y: 20 },
      { id: 'cheek-r', kind: 'cheek', on: 'head', x: 18, y: 20 },
      { id: 'nose', kind: 'nose', on: 'head', x: 0, y: 20 },
      { id: 'mouth', kind: 'mouth', on: 'head', x: 0, y: 28, expression: eating ? 'eating' : 'open' },
    ],
  }
}

function part(sprite, id) {
  return sprite.parts.find((p) => p.id === id)
}

function roundRect(c, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  c.beginPath()
  c.moveTo(x + radius, y)
  c.lineTo(x + w - radius, y)
  c.quadraticCurveTo(x + w, y, x + w, y + radius)
  c.lineTo(x + w, y + h - radius)
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  c.lineTo(x + radius, y + h)
  c.quadraticCurveTo(x, y + h, x, y + h - radius)
  c.lineTo(x, y + radius)
  c.quadraticCurveTo(x, y, x + radius, y)
  c.closePath()
}

function drawEar(c, tip, side) {
  const baseX = side * 10
  const baseY = -4
  c.fillStyle = FUR
  c.beginPath()
  c.moveTo(baseX - side * 8, baseY)
  c.bezierCurveTo(tip.x - side * 18, (baseY + tip.y) * 0.45, tip.x - side * 10, tip.y + 28, tip.x, tip.y)
  c.bezierCurveTo(tip.x + side * 16, tip.y + 26, baseX + side * 12, baseY - 16, baseX + side * 7, baseY)
  c.closePath()
  c.fill()
  c.strokeStyle = FUR_SHADE
  c.lineWidth = 1.25
  c.stroke()
  c.fillStyle = INNER
  c.beginPath()
  c.moveTo(baseX - side * 2, baseY - 8)
  c.bezierCurveTo(tip.x - side * 8, (baseY + tip.y) * 0.5, tip.x - side * 4, tip.y + 36, tip.x + side * 2, tip.y + 16)
  c.bezierCurveTo(tip.x + side * 10, tip.y + 34, baseX + side * 5, baseY - 10, baseX + side * 3, baseY - 4)
  c.closePath()
  c.fill()
}

/** Samma ruta som drawBattery: kroppen plus polen till höger. */
export function batteryBounds(part) {
  return { left: part.x - 16, top: part.y - 11, right: part.x + 21, bottom: part.y + 11 }
}

/** Bålens ellips, rx 26 och ry 30, samma mått som ritningen. */
export function torsoBounds(part) {
  return { left: part.x - 26, top: part.y - 30, right: part.x + 26, bottom: part.y + 30 }
}

export function boundsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

/** Bålen på skärmen: överkropp, öronrot och tassar, inte huvudet som leder fallet. */
export function rabbitBodyBox(x, y, scale = 1) {
  const s = Number(scale) > 0 ? Number(scale) : 1
  return {
    left: x - 40 * s,
    top: y - 120 * s,
    right: x + 40 * s,
    bottom: y - 18 * s,
  }
}

/** Ritad utbredning för en morot, chili eller skylt. */
export function itemScreenBox(item) {
  const s = Number(item?.scale) > 0 ? Number(item.scale) : 1
  const pad = item?.kind === 'sign' ? 34 * Math.max(0.55, s) : 22 * s
  return {
    left: item.x - pad,
    right: item.x + pad,
    top: item.y - pad,
    bottom: item.y + pad,
  }
}

/** Chili framför kaninen bara ovanför mitten och utanför bålen. */
export function drawsInFront(item, rabbitX, rabbitY, scale) {
  if (!item || item.kind !== 'chili') return false
  if (!(item.y < rabbitY - 30)) return false
  return !boundsIntersect(itemScreenBox(item), rabbitBodyBox(rabbitX, rabbitY, scale))
}

function drawBattery(c, p) {
  const box = batteryBounds(p)
  const x = box.left
  const y = box.top
  c.fillStyle = '#d08a3c'
  roundRect(c, x, y, 32, 22, 4)
  c.fill()
  c.strokeStyle = '#8a5a22'
  c.lineWidth = 1.4
  c.stroke()
  c.fillStyle = 'rgba(255,236,200,0.45)'
  c.fillRect(x + 3, y + 3, 7, 16)
  c.fillStyle = '#f4f1ea'
  c.fillRect(x + 32, y + 6, 5, 10)
  c.fillRect(x + 13, y + 5, 3, 12)
  c.fillRect(x + 9, y + 9, 12, 3)
}

function drawRabbit(c, x, y, scale, sprite) {
  const eating = part(sprite, 'mouth')?.expression === 'eating'
  const frame = eating ? FRAME_BLACK : FRAME_RED
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)

  c.strokeStyle = 'rgba(255,255,255,0.38)'
  c.lineWidth = 2
  c.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const lx = -16 + i * 8
    c.beginPath()
    c.moveTo(lx, -18)
    c.lineTo(lx * 0.4, -78 - i * 10)
    c.stroke()
  }

  const hip = part(sprite, 'body')
  for (const id of ['leg-l', 'leg-r']) {
    const leg = part(sprite, id)
    const foot = sprite.parts.find((p) => p.kind === 'foot' && p.on === id)
    c.strokeStyle = FUR
    c.lineWidth = 8
    c.beginPath()
    c.moveTo(hip.x + (id === 'leg-l' ? -8 : 8), hip.y - 8)
    c.quadraticCurveTo(leg.x, leg.y + 8, foot.x, foot.y)
    c.stroke()
    c.fillStyle = FUR
    c.beginPath()
    c.ellipse(foot.x, foot.y, 8, 5, id === 'leg-l' ? -0.4 : 0.4, 0, Math.PI * 2)
    c.fill()
  }

  const tail = part(sprite, 'tail')
  c.fillStyle = FUR
  c.beginPath()
  c.arc(tail.x, tail.y, 8, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = FUR_SHADE
  c.beginPath()
  c.arc(tail.x + 2, tail.y + 2, 4, 0, Math.PI * 2)
  c.fill()

  c.fillStyle = FUR
  c.beginPath()
  c.ellipse(hip.x, hip.y, 26, 30, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.55)'
  c.beginPath()
  c.ellipse(hip.x - 6, hip.y - 6, 10, 14, -0.3, 0, Math.PI * 2)
  c.fill()

  for (const id of ['arm-l', 'arm-r']) {
    const arm = part(sprite, id)
    const side = id === 'arm-l' ? -1 : 1
    c.strokeStyle = FUR
    c.lineWidth = 7
    c.beginPath()
    c.moveTo(hip.x + side * 14, hip.y + 4)
    c.quadraticCurveTo(arm.x * 0.6, arm.y + 16, arm.x, arm.y)
    c.stroke()
    c.fillStyle = FUR
    c.beginPath()
    c.arc(arm.x, arm.y, 6, 0, Math.PI * 2)
    c.fill()
  }

  drawEar(c, part(sprite, 'ear-l'), -1)
  drawEar(c, part(sprite, 'ear-r'), 1)

  const head = part(sprite, 'head')
  c.fillStyle = FUR
  c.beginPath()
  c.moveTo(-12, hip.y + 22)
  c.quadraticCurveTo(0, head.y - 18, 12, hip.y + 22)
  c.lineTo(14, head.y - 8)
  c.quadraticCurveTo(0, head.y - 2, -14, head.y - 8)
  c.closePath()
  c.fill()

  c.beginPath()
  c.ellipse(head.x, head.y, 26, 23, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.4)'
  c.beginPath()
  c.ellipse(head.x - 6, head.y - 4, 8, 7, -0.4, 0, Math.PI * 2)
  c.fill()

  for (const id of ['cheek-l', 'cheek-r']) {
    const cheek = part(sprite, id)
    c.fillStyle = 'rgba(255, 150, 176, 0.85)'
    c.beginPath()
    c.ellipse(cheek.x, cheek.y, 6, 4, 0, 0, Math.PI * 2)
    c.fill()
  }

  const nose = part(sprite, 'nose')
  c.fillStyle = NOSE
  c.beginPath()
  c.moveTo(nose.x, nose.y - 4)
  c.lineTo(nose.x + 5, nose.y + 3)
  c.lineTo(nose.x - 5, nose.y + 3)
  c.closePath()
  c.fill()

  const mouth = part(sprite, 'mouth')
  c.strokeStyle = '#c45b74'
  c.lineWidth = 1.6
  c.lineCap = 'round'
  c.beginPath()
  if (eating) {
    c.fillStyle = '#3a2428'
    c.beginPath()
    c.ellipse(mouth.x, mouth.y, 8, 5, 0, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = '#c45b74'
    c.beginPath()
    c.arc(mouth.x, mouth.y - 2, 9, 0.15, Math.PI - 0.15)
    c.stroke()
    c.fillStyle = '#ff8a2a'
    c.beginPath()
    c.moveTo(mouth.x + 4, mouth.y - 2)
    c.lineTo(mouth.x + 28, mouth.y + 6)
    c.lineTo(mouth.x + 22, mouth.y + 14)
    c.lineTo(mouth.x + 2, mouth.y + 4)
    c.closePath()
    c.fill()
    c.strokeStyle = '#2f9a55'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(mouth.x + 26, mouth.y + 8)
    c.lineTo(mouth.x + 34, mouth.y + 2)
    c.moveTo(mouth.x + 26, mouth.y + 10)
    c.lineTo(mouth.x + 36, mouth.y + 12)
    c.stroke()
  } else {
    c.moveTo(mouth.x - 5, mouth.y - 1)
    c.quadraticCurveTo(mouth.x, mouth.y + 4, mouth.x + 5, mouth.y - 1)
    c.stroke()
  }

  c.strokeStyle = frame
  c.lineWidth = 2.4
  c.beginPath()
  c.moveTo(-4, head.y - 2)
  c.lineTo(4, head.y - 2)
  c.stroke()
  for (const eye of sprite.parts.filter((p) => p.kind === 'eye')) {
    c.fillStyle = frame
    roundRect(c, eye.x - 12, eye.y - 8, 24, 16, 7)
    c.fill()
    c.fillStyle = '#140e16'
    c.beginPath()
    c.ellipse(eye.x, eye.y, 8.5, 6, 0, 0, Math.PI * 2)
    c.fill()
  }
  for (const glint of sprite.parts.filter((p) => p.kind === 'glint')) {
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.ellipse(glint.x, glint.y, 2.6, 1.6, -0.5, 0, Math.PI * 2)
    c.fill()
  }

  drawBattery(c, part(sprite, 'battery'))
  c.restore()
}

function drawCarrot(c, x, y, scale) {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  c.fillStyle = '#ff8a2a'
  c.beginPath()
  c.moveTo(0, -18)
  c.quadraticCurveTo(11, 0, 6, 16)
  c.quadraticCurveTo(0, 22, -6, 16)
  c.quadraticCurveTo(-11, 0, 0, -18)
  c.closePath()
  c.fill()
  c.strokeStyle = '#d86a14'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(-5, -2)
  c.lineTo(5, 0)
  c.moveTo(-6, 6)
  c.lineTo(6, 8)
  c.stroke()
  c.strokeStyle = '#2f9a55'
  c.lineWidth = 2
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(0, -16)
  c.lineTo(-8, -26)
  c.moveTo(0, -16)
  c.lineTo(1, -28)
  c.moveTo(0, -16)
  c.lineTo(8, -25)
  c.stroke()
  c.restore()
}

function drawChili(c, x, y, scale) {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  c.strokeStyle = '#e02626'
  c.lineWidth = 7
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-2, -16)
  c.quadraticCurveTo(16, 0, 1, 16)
  c.stroke()
  c.strokeStyle = '#ff8d8d'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(0, -8)
  c.quadraticCurveTo(8, 0, 2, 10)
  c.stroke()
  c.strokeStyle = '#2f9a55'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(-2, -16)
  c.quadraticCurveTo(4, -24, 9, -20)
  c.stroke()
  c.restore()
}

function drawSign(c, x, y, scale, label) {
  if (!artLabels().includes(label) || label === '+HP') return
  c.save()
  c.translate(x, y)
  c.scale(Math.max(0.55, scale), Math.max(0.55, scale))
  c.fillStyle = 'rgba(10, 8, 16, 0.9)'
  c.strokeStyle = PINK
  c.lineWidth = 2
  roundRect(c, -32, -16, 64, 32, 6)
  c.fill()
  c.stroke()
  c.fillStyle = CYAN
  c.font = '700 13px "IBM Plex Sans", sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(label, 0, 1)
  c.restore()
}

function drawTunnel(c, w, h, fall, spin, reduced) {
  const bg = c.createRadialGradient(w / 2, h * 0.72, 10, w / 2, h * 0.48, Math.max(w, h) * 0.75)
  bg.addColorStop(0, '#2a1230')
  bg.addColorStop(0.42, '#120814')
  bg.addColorStop(1, '#05030a')
  c.fillStyle = bg
  c.fillRect(0, 0, w, h)

  const vpX = w / 2
  const vpY = h * 0.76
  const angle = spiralAngle(spin, reduced)
  c.save()
  c.translate(vpX, vpY)
  c.rotate(angle)
  for (let arm = 0; arm < 3; arm++) {
    c.beginPath()
    for (let t = 0.04; t <= 1; t += 0.02) {
      const rad = 12 + t * Math.max(w, h) * 0.9
      const a = arm * ((Math.PI * 2) / 3) + t * Math.PI * 6.5
      const x = Math.cos(a) * rad
      const y = Math.sin(a) * rad * 0.58
      if (t <= 0.04) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.strokeStyle = arm === 1 ? 'rgba(46,230,214,0.28)' : 'rgba(255,79,168,0.26)'
    c.lineWidth = 10
    c.lineCap = 'round'
    c.stroke()
  }
  c.restore()

  const rings = 11
  for (let i = 0; i < rings; i++) {
    const p = projectItem(i + 3, rings, fall * 0.85, w, h, reduced)
    const closeness = Math.min(1, Math.max(0, 1 - p.y / h))
    const rx = 18 + closeness * Math.max(w, h) * 0.62
    const ry = 7 + closeness * 34
    c.beginPath()
    c.ellipse(vpX, p.y, rx, ry, 0, 0, Math.PI * 2)
    const pink = i % 2 === 0
    const alpha = 0.28 + closeness * 0.55
    c.strokeStyle = pink ? `rgba(255,79,168,${alpha})` : `rgba(46,230,214,${alpha})`
    c.lineWidth = 2 + closeness * 8
    c.stroke()
  }

  const hole = c.createRadialGradient(vpX, vpY, 2, vpX, vpY, 78)
  hole.addColorStop(0, '#000000')
  hole.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = hole
  c.beginPath()
  c.ellipse(vpX, vpY, 58, 24, 0, 0, Math.PI * 2)
  c.fill()

  c.save()
  c.strokeStyle = 'rgba(255,255,255,0.4)'
  c.lineWidth = 2
  c.setLineDash([7, 11])
  c.lineDashOffset = reduced ? 0 : -fall
  c.beginPath()
  c.moveTo(vpX, h * 0.16)
  c.lineTo(vpX, vpY)
  c.stroke()
  c.restore()
}

function drawFloater(c, floater) {
  if (!floater || floater.life <= 0) return
  c.save()
  c.globalAlpha = Math.max(0, Math.min(1, floater.life))
  c.translate(floater.x, floater.y)
  c.fillStyle = '#ff4fa8'
  c.strokeStyle = '#fff4fb'
  c.lineWidth = 4
  c.font = '800 28px "IBM Plex Sans", sans-serif'
  c.textAlign = 'left'
  c.textBaseline = 'middle'
  c.strokeText('+HP', 0, 0)
  c.fillText('+HP', 0, 0)
  c.restore()
}

const HP_DROP = 40

function hpRowTop(hud, root) {
  let top = 18 + HP_DROP
  try {
    const hb = hud.getBoundingClientRect()
    const rb = root.getBoundingClientRect()
    if (hb.height > 4 && rb.height > 4) top = Math.max(top, hb.bottom - rb.top + 8)
  } catch {
    /* mätningen saknas i testmiljön */
  }
  return top
}

function drawStandingRabbit(c, x, feetY, scale) {
  c.save()
  c.translate(x, feetY)
  c.scale(scale, scale)
  c.fillStyle = FUR
  c.beginPath()
  c.ellipse(-12, -4, 9, 5, -0.3, 0, Math.PI * 2)
  c.ellipse(12, -4, 9, 5, 0.3, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = FUR
  c.lineWidth = 7
  c.beginPath()
  c.moveTo(-8, -8)
  c.lineTo(-10, -28)
  c.moveTo(8, -8)
  c.lineTo(10, -28)
  c.stroke()
  c.fillStyle = FUR
  c.beginPath()
  c.ellipse(0, -48, 22, 24, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = FUR_SHADE
  c.beginPath()
  c.arc(16, -40, 7, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = FUR
  c.lineWidth = 6
  c.beginPath()
  c.moveTo(-14, -42)
  c.quadraticCurveTo(-28, -30, -34, -18)
  c.moveTo(14, -40)
  c.quadraticCurveTo(30, -28, 36, -16)
  c.stroke()
  c.beginPath()
  c.arc(-34, -18, 5, 0, Math.PI * 2)
  c.arc(36, -16, 5, 0, Math.PI * 2)
  c.fill()
  drawBattery(c, { x: 36, y: -16 })
  c.fillStyle = FUR
  c.beginPath()
  c.ellipse(0, -84, 20, 18, 0, 0, Math.PI * 2)
  c.fill()
  c.save()
  c.translate(0, -78)
  drawEar(c, { x: -12, y: -52 }, -1)
  drawEar(c, { x: 14, y: -48 }, 1)
  c.restore()
  c.fillStyle = 'rgba(255, 150, 176, 0.85)'
  c.beginPath()
  c.ellipse(-12, -78, 5, 3.2, 0, 0, Math.PI * 2)
  c.ellipse(12, -78, 5, 3.2, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = NOSE
  c.beginPath()
  c.moveTo(0, -76)
  c.lineTo(4, -70)
  c.lineTo(-4, -70)
  c.closePath()
  c.fill()
  c.strokeStyle = '#c45b74'
  c.lineWidth = 1.4
  c.beginPath()
  c.moveTo(-4, -66)
  c.quadraticCurveTo(0, -62, 4, -66)
  c.stroke()
  c.strokeStyle = FRAME_RED
  c.lineWidth = 2.2
  for (const eyeX of [-8, 8]) {
    c.fillStyle = FRAME_RED
    roundRect(c, eyeX - 9, -90, 18, 12, 5)
    c.fill()
    c.fillStyle = '#140e16'
    c.beginPath()
    c.ellipse(eyeX, -84, 6, 4.2, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#fff'
    c.beginPath()
    c.ellipse(eyeX - 2, -86, 1.8, 1.1, -0.4, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

function drawMeadow(c, w, h, layout, side, glow, showRabbit = true) {
  const { groundY, hole } = layout
  const sky = c.createLinearGradient(0, 0, 0, groundY)
  sky.addColorStop(0, '#7eb7e0')
  sky.addColorStop(0.55, '#d7f0ea')
  sky.addColorStop(1, '#c6e4a4')
  c.fillStyle = sky
  c.fillRect(0, 0, w, groundY)
  c.fillStyle = 'rgba(255,255,255,0.72)'
  c.beginPath()
  c.ellipse(w * 0.22, groundY * 0.28, 54, 16, 0, 0, Math.PI * 2)
  c.ellipse(w * 0.78, groundY * 0.2, 42, 13, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#3c7a46'
  c.fillRect(0, groundY, w, h - groundY)
  c.fillStyle = '#8fce73'
  c.fillRect(0, groundY, w, 8)
  const lanes = steerLanes(w, 'right')
  c.font = '700 12px "IBM Plex Sans", sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (const key of ['sell', 'flat', 'buy']) {
    const x = key === 'sell' ? lanes.sell : key === 'buy' ? lanes.buy : lanes.flat
    const on = side === key
    c.fillStyle = on ? (key === 'sell' ? PINK : key === 'buy' ? CYAN : '#e7b15a') : 'rgba(255,255,255,0.55)'
    c.beginPath()
    c.ellipse(x, groundY + 28, on ? 16 : 10, on ? 7 : 5, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#14301a'
    c.fillText(t(key === 'sell' ? 'btn.sell' : key === 'buy' ? 'btn.buy' : 'btn.flat'), x, groundY + 48)
  }
  if (showRabbit) {
    const stand = standPoint(side, layout)
    drawStandingRabbit(c, stand.x, stand.y, Math.max(0.95, Math.min(1.35, w / 720)))
  }
  c.save()
  c.translate(hole.x, hole.y)
  const rim = c.createRadialGradient(0, 0, 8, 0, 0, hole.rx)
  rim.addColorStop(0, '#050308')
  rim.addColorStop(0.72, '#1a0c18')
  rim.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = rim
  c.beginPath()
  c.ellipse(0, 0, hole.rx, hole.ry, 0, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = `rgba(255,79,168,${0.45 + glow * 0.35})`
  c.lineWidth = 4
  c.beginPath()
  c.ellipse(0, 0, hole.rx * 0.92, hole.ry * 0.86, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = `rgba(46,230,214,${0.35 + glow * 0.25})`
  c.lineWidth = 2
  c.beginPath()
  c.ellipse(0, 2, hole.rx * 0.7, hole.ry * 0.55, 0, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

function drawLaneGuides(c, w, h, read) {
  const lanes = read.lanes
  c.save()
  c.font = '700 13px "IBM Plex Sans", sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'top'
  const marks = [
    [lanes.sell, 'btn.sell', PINK],
    [lanes.flat, 'btn.flat', '#e7b15a'],
    [lanes.buy, 'btn.buy', CYAN],
  ]
  for (const [x, key, color] of marks) {
    c.strokeStyle = color
    c.globalAlpha = 0.45
    c.lineWidth = 2
    c.setLineDash([5, 8])
    c.beginPath()
    c.moveTo(x, 28)
    c.lineTo(x, h - 120)
    c.stroke()
    c.setLineDash([])
    c.globalAlpha = 1
    c.fillStyle = color
    c.fillText(t(key), x, 8)
  }
  c.restore()
}

function drawHp(c, hp, w, top) {
  const x0 = Math.max(16, w - 28 - HP_MAX * 16)
  const y = top
  for (let i = 0; i < HP_MAX; i++) {
    c.fillStyle = i < hp ? '#ff8a2a' : 'rgba(255,255,255,0.18)'
    c.beginPath()
    c.moveTo(x0 + i * 16, y)
    c.lineTo(x0 + i * 16 + 5, y + 10)
    c.lineTo(x0 + i * 16 - 5, y + 10)
    c.closePath()
    c.fill()
  }
}

export function createRabbit() {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'nlr-rh'
  root.setAttribute('role', 'region')
  const canvas = document.createElement('canvas')
  const hud = document.createElement('div')
  hud.className = 'nlr-rh-hud'
  const note = document.createElement('p')
  note.className = 'nlr-rh-note'
  note.setAttribute('data-tr-claim', '1')
  const home = document.createElement('div')
  home.className = 'nlr-rh-home'
  home.dataset.rhHome = '1'
  const card = document.createElement('div')
  card.className = 'nlr-rh-card'
  const claim = document.createElement('p')
  claim.className = 'nlr-rh-claim'
  claim.dataset.trClaim = '1'
  const title = document.createElement('h2')
  const body = document.createElement('p')
  body.dataset.rhHomeBody = '1'
  const actions = document.createElement('div')
  actions.className = 'nlr-rh-actions'
  const startBtn = document.createElement('button')
  startBtn.type = 'button'
  startBtn.className = 'nlr-rh-start'
  startBtn.dataset.rhStart = '1'
  const twoBtn = document.createElement('button')
  twoBtn.type = 'button'
  twoBtn.className = 'nlr-rh-two'
  twoBtn.dataset.rhStart = '2'
  const keys = document.createElement('p')
  keys.className = 'nlr-rh-keys'
  keys.dataset.rhKeys = '1'
  actions.append(startBtn, twoBtn)
  card.append(claim, title, body, actions, keys)
  home.append(card)
  const indicators = document.createElement('div')
  indicators.className = 'nlr-rh-indicators'
  indicators.dataset.rhIndicators = '1'
  root.append(canvas, home, indicators, hud, note)
  document.body.appendChild(root)

  let visible = false
  let frozen = false
  let raf = 0
  let phase = 'home'
  let players = 1
  let jumpT = 0
  let glowT = 0
  let priceIndex = 0
  let priceDebt = 0
  let lastFrame = 0
  let lastSprite = null
  const lock = createGestureLock(480)

  function freshRider() {
    return { side: 'flat', leverage: 1, entry: null, result: null, y: 0, spin: 0, hp: 0, eatLeft: 0, floater: null, eaten: [] }
  }
  let riders = [freshRider(), freshRider()]

  function activeRiders() {
    return players === 2 ? riders : [riders[0]]
  }
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
  function fmtPrice(price) {
    return price == null ? '—' : price.toFixed(2)
  }
  function fmtResult(value) {
    if (!Number.isFinite(value)) return '—'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }
  function bandKey(band) {
    if (band === 'slow') return 'rh.fallSlow'
    if (band === 'steady') return 'rh.fallSteady'
    if (band === 'fast') return 'rh.fallFast'
    return 'rh.fallStill'
  }
  function placeKey(offset) {
    if (offset < -0.2) return 'rh.left'
    if (offset > 0.2) return 'rh.right'
    return 'rh.center'
  }

  function buildIndicators() {
    indicators.replaceChildren()
    indicators.dataset.players = String(players)
    const count = players === 2 ? 2 : 1
    for (let n = 1; n <= count; n++) {
      const box = document.createElement('section')
      box.className = 'nlr-rh-player'
      box.dataset.rhPlayer = String(n)
      const who = document.createElement('p')
      who.className = 'nlr-rh-who'
      who.dataset.rhWho = String(n)
      const fall = document.createElement('p')
      fall.className = 'nlr-rh-fall'
      fall.dataset.rhFall = String(n)
      const meter = document.createElement('div')
      meter.className = 'nlr-rh-meter'
      const bar = document.createElement('span')
      bar.dataset.rhMeter = String(n)
      meter.append(bar)
      const laneName = document.createElement('p')
      laneName.className = 'nlr-rh-fall'
      laneName.dataset.rhLaneName = String(n)
      const labels = document.createElement('div')
      labels.className = 'nlr-rh-lane-labels'
      labels.dataset.rhLane = String(n)
      for (const key of ['sell', 'flat', 'buy']) {
        const lab = document.createElement('span')
        lab.dataset.lane = key
        labels.append(lab)
      }
      const track = document.createElement('div')
      track.className = 'nlr-rh-track'
      const marker = document.createElement('span')
      marker.className = 'nlr-rh-marker'
      marker.dataset.rhMarker = String(n)
      track.append(marker)
      const decision = document.createElement('p')
      decision.className = 'nlr-rh-decision'
      decision.dataset.rhDecision = String(n)
      const cue = document.createElement('p')
      cue.className = 'nlr-rh-cue'
      cue.dataset.rhCue = String(n)
      const result = document.createElement('p')
      result.className = 'nlr-rh-cue'
      result.dataset.rhResult = String(n)
      const risk = document.createElement('p')
      risk.className = 'nlr-rh-risk'
      risk.dataset.rhRisk = String(n)
      box.append(who, fall, meter, laneName, labels, track, decision, cue, result, risk)
      indicators.append(box)
    }
  }

  function copyChrome() {
    claim.textContent = t('sim.claim')
    title.textContent = t('rh.homeTitle')
    body.textContent = t('rh.homeBody')
    startBtn.textContent = t('rh.jump')
    twoBtn.textContent = t('rh.two')
    keys.textContent = `${t('rh.jumpKey')} · ${t('rh.twoHint')}`
    note.textContent = t('sim.claim')
    for (const el of indicators.querySelectorAll('[data-rh-who]')) {
      el.textContent = t(el.dataset.rhWho === '2' ? 'rh.p2' : 'rh.p1')
    }
    for (const el of indicators.querySelectorAll('[data-rh-risk]')) el.textContent = t('lev.risk')
    for (const el of indicators.querySelectorAll('[data-lane]')) {
      const key = el.dataset.lane
      el.textContent = t(key === 'sell' ? 'btn.sell' : key === 'buy' ? 'btn.buy' : 'btn.flat')
    }
    root.setAttribute('aria-label', t('mode.rabbitHole.name'))
  }

  function paintIndicators(reduced) {
    const w = root.clientWidth || 800
    const span = players === 2 ? w / 2 : w
    activeRiders().forEach((rider, i) => {
      const n = String(i + 1)
      const info = movementIndicators({ side: rider.side, leverage: rider.leverage, width: span, reduced })
      const fall = indicators.querySelector(`[data-rh-fall="${n}"]`)
      if (fall) fall.textContent = `${t('rh.fall')} ${info.fallRate.toFixed(1)} · ${t(bandKey(info.band))}`
      const meter = indicators.querySelector(`[data-rh-meter="${n}"]`)
      if (meter) meter.style.width = `${Math.round(Math.min(1, info.fallRate / 4) * 100)}%`
      const laneName = indicators.querySelector(`[data-rh-lane-name="${n}"]`)
      if (laneName) laneName.textContent = `${t('rh.lane')} · ${t(placeKey(info.offset))}`
      const labels = indicators.querySelector(`[data-rh-lane="${n}"]`)
      if (labels) {
        for (const lab of labels.querySelectorAll('[data-lane]')) {
          lab.dataset.on = lab.dataset.lane === info.decision ? info.decision : ''
        }
      }
      const marker = indicators.querySelector(`[data-rh-marker="${n}"]`)
      if (marker) marker.style.left = `${Math.round(info.lateral * 1000) / 10}%`
      const decision = indicators.querySelector(`[data-rh-decision="${n}"]`)
      if (decision) {
        decision.dataset.side = info.decision
        decision.textContent = t(info.decision === 'buy' ? 'btn.buy' : info.decision === 'sell' ? 'btn.sell' : 'btn.flat')
      }
      const cue = indicators.querySelector(`[data-rh-cue="${n}"]`)
      if (cue) cue.textContent = t(`rh.cue.${info.decision}`)
      const result = indicators.querySelector(`[data-rh-result="${n}"]`)
      if (result) result.textContent = `${t('hud.result')} ${fmtResult(rider.result)}`
    })
  }

  function collect(w, h, fall, reduced) {
    const candles = series()
    const count = 14
    const items = []
    for (let i = 0; i < count; i++) {
      const candle = candles.length ? candles[i % candles.length] : null
      const kind = i % 8 === 0 ? 'sign' : candleKind(candle, i)
      const projected = projectItem(i, count, fall, w, h, reduced)
      items.push({
        ...projected,
        kind,
        label: signLabel(i),
        reach: 28 + projected.scale * 18,
      })
    }
    items.push(passingCarrot(fall, w, h, reduced))
    return items
  }

  function paintRider(c, rider, box, h, reduced) {
    c.save()
    c.beginPath()
    c.rect(box.left, 0, box.width, h)
    c.clip()
    c.translate(box.left, 0)
    drawTunnel(c, box.width, h, rider.y, rider.spin, reduced)
    const info = movementIndicators({ side: rider.side, leverage: rider.leverage, width: box.width, reduced })
    drawLaneGuides(c, box.width, h, info)
    const rabbitY = h * 0.4
    const xPos = info.x
    const items = collect(box.width, h, rider.y, reduced)
    const picked = applyPickups(items, { x: xPos, y: rabbitY }, rider.hp, rider.eaten)
    if (picked.gained) {
      rider.hp = picked.hp
      rider.eatLeft = Math.max(rider.eatLeft, 0.9)
      rider.floater = { life: 1, x: xPos + 46, y: rabbitY - 10 }
    }
    rider.eaten = picked.eaten.slice(-48)
    const scale = Math.max(0.85, Math.min(1.5, box.width / 420))
    const sprite = rabbitSprite({ eating: rider.eatLeft > 0 })
    if (box.player === 1) lastSprite = sprite
    const inFront = (item) => drawsInFront(item, xPos, rabbitY, scale)
    for (const item of items) {
      if (inFront(item)) continue
      if (item.kind === 'carrot') drawCarrot(c, item.x, item.y, item.scale || 1)
      else if (item.kind === 'chili') drawChili(c, item.x, item.y, item.scale || 1)
      else drawSign(c, item.x, item.y, item.scale || 1, item.label)
    }
    drawRabbit(c, xPos, rabbitY, scale, sprite)
    for (const item of items) {
      if (!inFront(item)) continue
      drawChili(c, item.x, item.y, item.scale || 1)
    }
    drawFloater(c, rider.floater)
    drawHp(c, rider.hp, box.width, 58)
    if (players === 2) {
      c.fillStyle = '#e7b15a'
      c.font = '700 14px "IBM Plex Sans", sans-serif'
      c.textAlign = 'left'
      c.textBaseline = 'top'
      c.fillText(t(box.player === 2 ? 'rh.p2' : 'rh.p1'), 16, 36)
    }
    c.restore()
  }

  function paint() {
    const reduced = reducedMotion()
    root.dataset.phase = phase
    root.dataset.players = String(players)
    root.dataset.above = phase === 'home' ? '1' : '0'
    root.dataset.motion = phase === 'home' ? 'home' : phase === 'jump' ? 'jump' : reduced ? 'reduced' : 'fall'
    home.hidden = phase !== 'home'
    indicators.hidden = phase !== 'race'
    hud.hidden = phase !== 'race'
    copyChrome()
    const price = priceAt(priceIndex)
    hud.innerHTML = `<span><b>${t('sim.price')}</b> ${fmtPrice(price)}</span><span><b>${t('hud.result')}</b> ${fmtResult(riders[0].result)}</span>`
    if (phase === 'race') paintIndicators(reduced)
    const w = root.clientWidth || 800
    const h = root.clientHeight || 600
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const c = canvas.getContext('2d')
    if (!c) return
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (phase === 'home' || phase === 'jump') {
      const layout = homeLayout(w, h)
      const glow = reduced ? 0 : (Math.sin(glowT * 2) + 1) / 2
      drawMeadow(c, w, h, layout, riders[0].side, glow, phase === 'home')
      if (phase === 'jump') {
        const from = standPoint(riders[0].side, layout)
        const pose = jumpPose(jumpProgress(jumpT, reduced), from, layout.hole)
        const scale = Math.max(0.95, Math.min(1.35, w / 720))
        if (pose.drop > 0.42) drawRabbit(c, pose.x, pose.y, scale * (1 - pose.drop * 0.25), rabbitSprite())
        else drawStandingRabbit(c, pose.x, pose.y, scale)
      }
      return
    }
    const boxes = splitLayout(w, players)
    boxes.forEach((box, i) => paintRider(c, riders[i], box, h, reduced))
    if (players === 2) {
      c.strokeStyle = 'rgba(244,239,230,0.75)'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(w / 2, 0)
      c.lineTo(w / 2, h)
      c.stroke()
    }
  }

  function applyTo(index, intent) {
    const rider = riders[index] || riders[0]
    const next = steering.applyIntent({ side: rider.side, leverage: rider.leverage }, intent)
    const was = rider.side
    rider.side = next.side
    rider.leverage = next.leverage
    if (rider.side === 'flat') rider.entry = null
    else if (was !== rider.side) rider.entry = priceAt(priceIndex)
    else if (rider.entry == null) rider.entry = priceAt(priceIndex)
    paint()
  }

  function enterRace() {
    phase = 'race'
    for (const rider of riders) {
      rider.y = 0
      rider.spin = 0
    }
  }

  function start(count = 1) {
    if (!visible || phase !== 'home' || frozen) return false
    players = count === 2 ? 2 : 1
    buildIndicators()
    if (reducedMotion()) enterRace()
    else {
      phase = advancePhase('home', 'start')
      jumpT = 0
    }
    paint()
    kick()
    return true
  }

  function onKey(e) {
    if (!visible || frozen) return
    if (phase === 'home' && e.code === 'Enter' && !e.repeat) {
      const tag = (e.target?.tagName || '').toUpperCase()
      if (tag !== 'BUTTON' && tag !== 'A' && !isTypingTarget(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        start(e.shiftKey ? 2 : 1)
      }
      return
    }
    const racing = phase !== 'home'
    const a = keyAction(e, players === 2 && racing ? '2p' : '1p', O)
    if (!a?.intent) return
    e.preventDefault()
    e.stopPropagation()
    const index = players === 2 && racing && a.player === 2 ? 1 : 0
    applyTo(index, a.intent)
  }
  addEventListener('keydown', onKey, true)
  addEventListener('keyup', (e) => {
    if (visible && PREVENT_DEFAULT.has(e.code) && keyAction(e, '1p', O)) e.preventDefault()
  }, true)
  root.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-rh-start]')
    if (!btn) return
    start(btn.dataset.rhStart === '2' ? 2 : 1)
  })
  root.addEventListener('wheel', (e) => {
    if (!visible || frozen) return
    const intent = wheelToIntent(e.deltaY)
    if (!intent || !lock.allow()) return
    e.preventDefault()
    applyTo(0, intent)
  }, { passive: false })

  function tickRider(rider, dt, reduced) {
    if (!reduced) {
      rider.y += fallRate(rider.leverage, false)
      rider.spin += dt
    }
    if (rider.eatLeft > 0) rider.eatLeft = Math.max(0, rider.eatLeft - dt)
    if (rider.floater) {
      rider.floater.life -= dt
      rider.floater.y -= reduced ? 0 : 28 * dt
      if (rider.floater.life <= 0) rider.floater = null
    }
  }

  const BAR_SEC = 0.28
  function advancePrice(dt) {
    if (phase !== 'race' || !series().length) return
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
    for (const rider of activeRiders()) {
      if (price == null || rider.side === 'flat' || rider.entry == null || rider.entry === 0) continue
      const sign = rider.side === 'buy' ? 1 : -1
      rider.result = sign * (price / rider.entry - 1) * rider.leverage * 100
    }
  }

  function frame(now) {
    if (!visible || frozen) return
    const stamp = typeof now === 'number' ? now : performance.now()
    const dt = lastFrame ? Math.min(0.05, (stamp - lastFrame) / 1000) : 0.016
    lastFrame = stamp
    const reduced = reducedMotion()
    if (phase === 'home') {
      if (!reduced) glowT += dt
    } else if (phase === 'jump') {
      jumpT += dt
      if (jumpProgress(jumpT, reduced) >= 1) enterRace()
    } else {
      for (const rider of activeRiders()) tickRider(rider, dt, reduced)
      advancePrice(dt)
    }
    paint()
    raf = requestAnimationFrame(frame)
  }

  function kick() {
    cancelAnimationFrame(raf)
    if (!visible || frozen) return
    lastFrame = 0
    raf = requestAnimationFrame(frame)
  }

  function reset() {
    phase = 'home'
    players = 1
    jumpT = 0
    glowT = 0
    priceIndex = 0
    priceDebt = 0
    lastFrame = 0
    riders = [freshRider(), freshRider()]
    buildIndicators()
    copyChrome()
  }

  onLang(() => {
    copyChrome()
    if (visible) paint()
  })
  reset()

  return {
    show() {
      visible = true
      reset()
      root.classList.add('on')
      paint()
      kick()
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
      if (visible) kick()
    },
    start,
    anchor: () => 'bottom',
    step(n = 1) {
      const dt = Math.max(0, Number(n) || 0)
      const reduced = reducedMotion()
      if (phase === 'home') {
        if (!reduced) glowT += dt
        paint()
        return
      }
      if (phase === 'jump') {
        jumpT += dt
        if (jumpProgress(jumpT, reduced) >= 1) enterRace()
        paint()
        return
      }
      const ticks = Math.max(1, Math.min(12, Math.round((dt || 0.016) / 0.016) || 1))
      const slice = dt > 0 ? dt / ticks : 0.016
      for (let i = 0; i < ticks; i++) {
        for (const rider of activeRiders()) tickRider(rider, slice, reduced)
      }
      advancePrice(dt)
      paint()
    },
    state() {
      const w = root.clientWidth || 800
      const h = root.clientHeight || 600
      const reduced = reducedMotion()
      const lead = riders[0]
      const span = players === 2 ? w / 2 : w
      const lanes = steerLanes(span, 'right')
      const info = movementIndicators({ side: lead.side, leverage: lead.leverage, width: span, reduced })
      return {
        phase,
        players,
        started: phase === 'race',
        side: lead.side,
        leverage: lead.leverage,
        y: lead.y,
        hp: lead.hp,
        x: info.x,
        ...lanes,
        markerY: markerScreenY(lead.y, reduced),
        spiral: spiralAngle(lead.spin, reduced),
        sprite: lastSprite || rabbitSprite(),
        motion: phase === 'home' ? 'home' : phase === 'jump' ? 'jump' : reduced ? 'reduced' : 'fall',
        indicators: info,
        home: homeLayout(w, h),
        jump: phase === 'jump' ? jumpProgress(jumpT, reduced) : phase === 'race' ? 1 : 0,
        above: phase === 'home',
        riders: activeRiders().map((rider) => ({
          side: rider.side,
          leverage: rider.leverage,
          y: rider.y,
          result: rider.result,
          indicators: movementIndicators({ side: rider.side, leverage: rider.leverage, width: span, reduced }),
        })),
      }
    },
  }
}
