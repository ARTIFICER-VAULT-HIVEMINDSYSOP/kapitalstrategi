/**
 * Rabbit Hole. Samma styrmotor som de andra lägena, orientation movement down.
 * Kaninen faller nedåt: tunneln, morötterna och chilin rullar uppåt förbi den.
 * Morot = stigande stapel, chili = fallande. Ett neutralt batteri utan logotyp.
 * prefers-reduced-motion: spiralen, virveln och parallaxen står stilla.
 */
import { keyAction, PREVENT_DEFAULT } from './keys.js'
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
.nlr-rh-hud{position:absolute;left:12px;right:12px;top:calc(var(--tr-chrome-b, 96px) + 12px);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 12px;pointer-events:none;font:600 12px/1.35 "IBM Plex Sans",sans-serif}
.nlr-rh-hud b{color:#e7b15a}
.nlr-rh-note{position:absolute;left:12px;right:12px;bottom:12px;max-width:min(520px,calc(100% - 24px));font:500 12px/1.35 "IBM Plex Sans",sans-serif;color:#f4efe6;text-shadow:0 1px 2px #07060c;pointer-events:none}
.nlr-rh-bat{width:28px;height:14px}
@media (prefers-reduced-motion: reduce){.nlr-rh,.nlr-rh canvas{animation:none;scroll-behavior:auto}}
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
      { id: 'battery', kind: 'battery', on: 'body', x: 0, y: -22, logo: false },
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

function drawBattery(c, p) {
  const x = p.x - 16
  const y = p.y - 11
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

function drawHp(c, hp, w) {
  const x0 = Math.max(16, w - 28 - 8 * 16)
  for (let i = 0; i < HP_MAX; i++) {
    c.fillStyle = i < hp ? '#ff8a2a' : 'rgba(255,255,255,0.18)'
    c.beginPath()
    c.moveTo(x0 + i * 16, 18)
    c.lineTo(x0 + i * 16 + 5, 28)
    c.lineTo(x0 + i * 16 - 5, 28)
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
  root.append(canvas, hud, note)
  document.body.appendChild(root)

  let visible = false
  let frozen = false
  let raf = 0
  let y = 40
  let spin = 0
  let side = 'flat'
  let leverage = 1
  let lastX = null
  let priceIndex = 0
  let entry = null
  let result = null
  let hp = 0
  let eatLeft = 0
  let floater = null
  let eaten = []
  let lastSprite = null
  const lock = createGestureLock(480)

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
  function fallStep() {
    return 2.6 * Math.max(0.45, leverage / 4)
  }

  function collect(w, h, reduced) {
    const candles = series()
    const count = 14
    const items = []
    for (let i = 0; i < count; i++) {
      const candle = candles.length ? candles[i % candles.length] : null
      const kind = i % 8 === 0 ? 'sign' : candleKind(candle, i)
      const projected = projectItem(i, count, y, w, h, reduced)
      items.push({
        ...projected,
        kind,
        label: signLabel(i),
        reach: 28 + projected.scale * 18,
      })
    }
    items.push(passingCarrot(y, w, h, reduced))
    return items
  }

  function paint() {
    const reduced = reducedMotion()
    const eating = eatLeft > 0
    const sprite = rabbitSprite({ eating })
    lastSprite = sprite
    root.dataset.motion = reduced ? 'reduced' : 'fall'
    root.setAttribute('aria-label', t('mode.rabbitHole.name'))
    const price = priceAt(priceIndex)
    hud.innerHTML = `<span><b>${t('sim.price')}</b> ${fmtPrice(price)}</span><span><b>${t('hud.result')}</b> ${fmtResult(result)}</span><span>${side === 'buy' ? t('btn.buy') : side === 'sell' ? t('btn.sell') : t('btn.flat')} · ${t('lev.risk')}</span>`
    note.textContent = t('sim.claim')
    const w = root.clientWidth || 800
    const h = root.clientHeight || 600
    const lanes = steerLanes(w, 'right')
    const xPos = positionFor(side, lanes.buy, lanes.sell)
    lastX = xPos
    const rabbitY = h * 0.4
    const items = collect(w, h, reduced)
    const picked = applyPickups(items, { x: xPos, y: rabbitY }, hp, eaten)
    if (picked.gained) {
      hp = picked.hp
      eatLeft = Math.max(eatLeft, 0.9)
      floater = { life: 1, x: xPos + 46, y: rabbitY - 10 }
    }
    eaten = picked.eaten.slice(-48)

    const dpr = Math.min(2, globalThis.devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const c = canvas.getContext('2d')
    if (!c) return
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawTunnel(c, w, h, y, spin, reduced)
    const scale = Math.max(1.08, Math.min(1.5, w / 500))
    for (const item of items) {
      if (item.y < rabbitY - 30) continue
      if (item.kind === 'carrot') drawCarrot(c, item.x, item.y, item.scale || 1)
      else if (item.kind === 'chili') drawChili(c, item.x, item.y, item.scale || 1)
      else drawSign(c, item.x, item.y, item.scale || 1, item.label)
    }
    drawRabbit(c, xPos, rabbitY, scale, sprite)
    for (const item of items) {
      if (item.y >= rabbitY - 30) continue
      if (item.kind === 'carrot') drawCarrot(c, item.x, item.y, item.scale || 1)
      else if (item.kind === 'chili') drawChili(c, item.x, item.y, item.scale || 1)
      else drawSign(c, item.x, item.y, item.scale || 1, item.label)
    }
    drawFloater(c, floater)
    drawHp(c, hp, w)
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

  function tickMotion(dt) {
    const reduced = reducedMotion()
    if (!reduced) {
      y += fallStep()
      spin += dt
    }
    if (eatLeft > 0) eatLeft = Math.max(0, eatLeft - dt)
    if (floater) {
      floater.life -= dt
      floater.y -= reduced ? 0 : 28 * dt
      if (floater.life <= 0) floater = null
    }
  }

  function frame(now) {
    if (!visible || frozen) return
    const stamp = typeof now === 'number' ? now : performance.now()
    const dt = lastFrame ? Math.min(0.05, (stamp - lastFrame) / 1000) : 0.016
    lastFrame = stamp
    tickMotion(dt)
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
      const slice = dt > 0 ? dt / ticks : 0.016
      for (let i = 0; i < ticks; i++) tickMotion(slice)
      advancePrice(dt)
      paint()
    },
    state() {
      const w = root.clientWidth || 800
      const lanes = steerLanes(w, 'right')
      const reduced = reducedMotion()
      return {
        side,
        leverage,
        y,
        hp,
        x: positionFor(side, lanes.buy, lanes.sell),
        ...lanes,
        markerY: markerScreenY(y, reduced),
        spiral: spiralAngle(spin, reduced),
        sprite: lastSprite || rabbitSprite(),
        motion: reduced ? 'reduced' : 'fall',
      }
    },
  }
}
