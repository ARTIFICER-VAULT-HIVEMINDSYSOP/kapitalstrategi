/**
 * Rabbit Hole. Samma styrmotor som de andra lägena.
 * Form A: framåt längs fallet är pil upp / W (snabbare fall). Bilden rullar ändå uppåt.
 * Bollingerbandens kanter är gränsen mellan tunnel och hål, på samma stängningar som priset.
 * RSI och MACD är jämförelsetal. Morot = stigande stapel, chili = fallande.
 * prefers-reduced-motion: spiralen, virveln, parallaxen och kamerans lerp står stilla, och hoppet hoppas över.
 * Start: kaninen står ovanför hålet. Enter eller knappen börjar fallet.
 */
import { isTypingTarget, keyAction, PREVENT_DEFAULT } from './keys.js'
import { MODES, createSteering, wheelToIntent } from './orientation.js'
import { t, onLang } from './i18n.js'
import { createGestureLock } from './styrmotor.js'
import { positionFor, steerLanes } from './spar.js'
import { rsi, rsiZone } from './rsi.js'
import {
  createWorld,
  createScore,
  fixedStep,
  coyoteLeft,
  rememberInput,
  readBuffered,
  STEP_SEC,
} from './world-stage.js'

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
.nlr-rh{display:none;position:fixed;inset:0;z-index:55;background:#07040c;color:#f4efe6;font-family:"IBM Plex Sans",system-ui,sans-serif}
.nlr-rh.on{display:block}
.nlr-rh canvas{position:absolute;inset:0;width:100%;height:100%;display:block;background:#07040c}
.nlr-rh-hud{position:absolute;left:16px;right:16px;top:14px;display:flex;justify-content:space-between;gap:12px;pointer-events:none;font:600 13px/1.3 "IBM Plex Sans",system-ui,sans-serif;color:#f4efe6;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.nlr-rh-hud b{color:#f0c14a;font-weight:650}
.nlr-rh-note{position:absolute;left:16px;right:16px;bottom:14px;font:500 12px/1.35 "IBM Plex Sans",system-ui,sans-serif;color:rgba(244,239,230,.88);pointer-events:none}
.nlr-rh[data-phase="home"] .nlr-rh-note,.nlr-rh[data-phase="jump"] .nlr-rh-note{bottom:auto;top:12px}
.nlr-rh[data-phase="race"] .nlr-rh-note{bottom:auto;top:40px}
.nlr-rh-home{position:absolute;left:50%;top:48px;transform:translateX(-50%);width:min(380px,calc(100% - 24px));pointer-events:none;z-index:2}
.nlr-rh-card{pointer-events:auto;background:rgba(14,10,20,.72);color:#f4efe6;border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:16px 16px 14px;box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(12px)}
.nlr-rh-claim{margin:0 0 6px;font:600 11px/1.35 "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.03em;color:#e7c27a}
.nlr-rh-card h2{margin:0 0 6px;font:650 22px/1.15 Fraunces,"IBM Plex Sans",serif}
.nlr-rh-card p{margin:0 0 8px;font:500 14px/1.4 "IBM Plex Sans",system-ui,sans-serif}
.nlr-rh-press{margin:0 0 8px;font:700 13px/1 "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.14em;color:#ffd56a;animation:nlr-rh-blink 1.1s steps(2,end) infinite}
.nlr-rh-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.nlr-rh-start,.nlr-rh-two,.nlr-rh-mute,.nlr-rh-resume,.nlr-rh-quality{border:0;border-radius:999px;font:650 13px/1 "IBM Plex Sans",system-ui,sans-serif;padding:10px 14px;cursor:pointer}
.nlr-rh-start,.nlr-rh-resume{background:#f0c14a;color:#24180c}
.nlr-rh-two,.nlr-rh-mute,.nlr-rh-quality{background:rgba(255,255,255,.08);color:#f4efe6;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.nlr-rh-start:focus-visible,.nlr-rh-two:focus-visible,.nlr-rh-mute:focus-visible,.nlr-rh-resume:focus-visible,.nlr-rh-quality:focus-visible{outline:2px solid #2ee6d6;outline-offset:2px}
.nlr-rh-keys{margin:8px 0 0;font:500 12px/1.4 "IBM Plex Sans",system-ui,sans-serif;color:rgba(244,239,230,.72)}
.nlr-rh-indicators{position:absolute;left:16px;right:16px;bottom:16px;display:grid;gap:8px;pointer-events:none;z-index:2}
.nlr-rh-indicators[data-players="1"]{grid-template-columns:minmax(0,1fr)}
.nlr-rh-indicators[data-players="2"]{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.nlr-rh-player{background:rgba(10,8,16,.72);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px 10px 10px;display:grid;gap:3px;color:#f4efe6;backdrop-filter:blur(10px)}
.nlr-rh-who{margin:0;font:650 11px/1.2 "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.08em;color:#f0c14a}
.nlr-rh-fall{margin:0;font:600 13px/1.3 "IBM Plex Sans",system-ui,sans-serif}
.nlr-rh-meter{height:8px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
.nlr-rh-meter > span{display:block;height:100%;width:0;background:linear-gradient(90deg,#2ee6d6,#f0c14a)}
.nlr-rh-lane-labels{display:flex;justify-content:space-between;gap:6px;font:650 12px/1.2 "IBM Plex Sans",system-ui,sans-serif}
.nlr-rh-lane-labels [data-on="sell"]{color:#ff4f9a}
.nlr-rh-lane-labels [data-on="flat"]{color:#f0c14a}
.nlr-rh-lane-labels [data-on="buy"]{color:#2ee6d6}
.nlr-rh-track{position:relative;height:8px;border-radius:99px;background:linear-gradient(90deg,#ff4f9a 0%,#f4efe6 50%,#2ee6d6 100%)}
.nlr-rh-marker{position:absolute;top:-4px;width:4px;height:16px;margin-left:-2px;border-radius:99px;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45)}
.nlr-rh-decision{margin:4px 0 0;font:700 22px/1 "IBM Plex Sans",system-ui,sans-serif}
.nlr-rh-decision[data-side="sell"]{color:#ff4f9a}
.nlr-rh-decision[data-side="flat"]{color:#f0c14a}
.nlr-rh-decision[data-side="buy"]{color:#2ee6d6}
.nlr-rh-cue,.nlr-rh-risk{margin:0;font:500 12px/1.35 "IBM Plex Sans",system-ui,sans-serif;color:rgba(244,239,230,.86)}
.nlr-rh-market{position:absolute;left:16px;top:64px;max-width:min(240px,46%);display:grid;gap:3px;pointer-events:none;z-index:2;font:600 13px/1.35 "IBM Plex Sans",system-ui,sans-serif;color:#f4efe6;background:rgba(10,8,16,.66);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:8px 10px;backdrop-filter:blur(10px)}
.nlr-rh-market p{margin:0}
.nlr-rh-market[hidden]{display:none}
.nlr-rh-signal{color:#f0c14a}
.nlr-rh-pause{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;display:grid;gap:8px;background:rgba(12,9,18,.88);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:16px;min-width:200px;backdrop-filter:blur(14px)}
.nlr-rh-pause[hidden]{display:none}
.nlr-rh-pause p{margin:0;font:650 18px/1 Fraunces,"IBM Plex Sans",serif;color:#f4efe6;text-align:center}
.nlr-rh-pad{display:none}
@keyframes nlr-rh-blink{50%{opacity:.35}}
@media (pointer:coarse){
  .nlr-rh-pad{display:grid;position:absolute;right:12px;bottom:12px;z-index:5;grid-template-columns:52px 52px 52px;grid-template-rows:52px 52px 52px;gap:6px}
  .nlr-rh-pad button{border:0;border-radius:14px;background:rgba(244,239,230,.92);color:#24180c;font:700 16px/1 "IBM Plex Sans",system-ui,sans-serif}
  .nlr-rh-pad [data-rh-pad="FORWARD"]{grid-column:2;grid-row:1}
  .nlr-rh-pad [data-rh-pad="STEER_TOWARD_LOW"]{grid-column:1;grid-row:2}
  .nlr-rh-pad [data-rh-pad="FLAT"]{grid-column:2;grid-row:2}
  .nlr-rh-pad [data-rh-pad="STEER_TOWARD_HIGH"]{grid-column:3;grid-row:2}
  .nlr-rh-pad [data-rh-pad="BACKWARD"]{grid-column:2;grid-row:3}
}
@media (max-width:640px){
  .nlr-rh-indicators[data-players="2"]{grid-template-columns:minmax(0,1fr)}
  .nlr-rh-card{padding:12px}
  .nlr-rh-card h2{font-size:18px}
  .nlr-rh-card p{font-size:13px}
  .nlr-rh-decision{font-size:18px}
}
@media (max-height:520px){
  .nlr-rh-home{top:8px;max-height:calc(100% - 16px);overflow:auto}
  .nlr-rh-card{padding:8px 10px}
  .nlr-rh-card p{font-size:12px}
  .nlr-rh-card [data-rh-home-body],.nlr-rh-keys{display:none}
  .nlr-rh-start,.nlr-rh-two,.nlr-rh-mute,.nlr-rh-resume,.nlr-rh-quality{padding:8px 10px}
  .nlr-rh-indicators{bottom:8px}
  .nlr-rh-risk{display:none}
  .nlr-rh-market{top:36px}
}
@media (prefers-reduced-motion: reduce){
  .nlr-rh,.nlr-rh canvas,.nlr-rh-marker,.nlr-rh-press{animation:none;transition:none;scroll-behavior:auto}
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

/** Fall per tick. Varje steg i hävstången syns. Reducerad rörelse står stilla. */
export function fallRate(leverage, reduced = false) {
  if (reduced) return 0
  const lev = Math.max(1, Number.isFinite(Number(leverage)) ? Number(leverage) : 1)
  return 1.15 + (lev - 1) * 0.55
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
  const groundY = Math.round(h * 0.7)
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

function lateralFromLanes(side, lanes) {
  const x = positionFor(side, lanes.buy, lanes.sell)
  const span = lanes.buy - lanes.sell || 1
  const t = (x - lanes.sell) / span
  return { x, t, offset: t - 0.5, lanes }
}

export function movementIndicators({ side = 'flat', leverage = 1, width = 800, reduced = false, lanes = null } = {}) {
  const decision = side === 'buy' || side === 'sell' ? side : 'flat'
  const read = lanes && Number.isFinite(lanes.buy) && Number.isFinite(lanes.sell)
    ? lateralFromLanes(decision, lanes)
    : lateralRead(decision, width)
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

export const BB_PERIOD = 20
export const BB_K = 2
export const MACD_FAST = 12
export const MACD_SLOW = 26
export const MACD_SIGNAL = 9
export const MARK_HOLD = 2.2
const PAD_DEADZONE = 0.35

export function closesOf(candles) {
  return (Array.isArray(candles) ? candles : []).map((candle) => {
    const value = Number(candle?.c ?? candle?.close)
    return Number.isFinite(value) ? value : NaN
  })
}

/** Population standard deviation, period 20, k = 2. Same definition as the app Bollinger helper. */
export function bollingerPoint(closes, index, period = BB_PERIOD, k = BB_K) {
  const src = Array.isArray(closes) ? closes : []
  const i = index | 0
  if (!Number.isInteger(period) || period < 2 || i < period - 1 || i >= src.length) return null
  let sum = 0
  for (let j = i - period + 1; j <= i; j++) {
    const v = src[j]
    if (!Number.isFinite(v)) return null
    sum += v
  }
  const sma = sum / period
  let varSum = 0
  for (let j = i - period + 1; j <= i; j++) {
    const d = src[j] - sma
    varSum += d * d
  }
  const stdev = Math.sqrt(varSum / period)
  return { sma, stdev, upper: sma + k * stdev, lower: sma - k * stdev }
}

export function bandTouch(close, band) {
  if (!band || !Number.isFinite(close) || !(band.upper > band.lower)) return null
  const pb = (close - band.lower) / (band.upper - band.lower)
  if (pb >= 0.95) return 'upper'
  if (pb <= 0.05) return 'lower'
  if (pb >= 0.9) return 'near-upper'
  if (pb <= 0.1) return 'near-lower'
  return null
}

function touchSide(kind) {
  if (kind === 'upper' || kind === 'near-upper') return 'high'
  if (kind === 'lower' || kind === 'near-lower') return 'low'
  return null
}

/** One mark when price enters a band edge, not again while it stays there. */
export function edgeSignal(prev, next) {
  const side = touchSide(next)
  if (!side || side === touchSide(prev)) return null
  return next
}

function ema(values, period) {
  const out = new Array(values.length).fill(null)
  const alpha = 2 / (period + 1)
  let sum = 0
  let n = 0
  let prev = null
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (!Number.isFinite(v)) {
      sum = 0
      n = 0
      prev = null
      continue
    }
    if (prev == null) {
      sum += v
      n += 1
      if (n === period) {
        prev = sum / period
        out[i] = prev
      }
    } else {
      prev = v * alpha + prev * (1 - alpha)
      out[i] = prev
    }
  }
  return out
}

export function macdSeries(closes) {
  const src = Array.isArray(closes) ? closes : []
  const fast = ema(src, MACD_FAST)
  const slow = ema(src, MACD_SLOW)
  const line = src.map((_, i) => (fast[i] != null && slow[i] != null ? fast[i] - slow[i] : null))
  const signal = new Array(src.length).fill(null)
  const hist = new Array(src.length).fill(null)
  const start = line.findIndex((v) => v != null)
  if (start < 0) return { line, signal, hist }
  const subset = []
  for (let i = start; i < line.length; i++) {
    if (line[i] == null) break
    subset.push(line[i])
  }
  const sig = ema(subset, MACD_SIGNAL)
  for (let i = 0; i < subset.length; i++) {
    signal[start + i] = sig[i]
    if (sig[i] != null) hist[start + i] = subset[i] - sig[i]
  }
  return { line, signal, hist }
}

export function macdCross(prev, next) {
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return null
  if (prev <= 0 && next > 0) return 'up'
  if (prev >= 0 && next < 0) return 'down'
  return null
}

export function macdPoint(closes, index) {
  const series = macdSeries(closes)
  const i = Math.max(0, index | 0)
  const hist = series.hist[i] ?? null
  const prev = i > 0 ? series.hist[i - 1] : null
  return {
    line: series.line[i] ?? null,
    signal: series.signal[i] ?? null,
    hist,
    cross: macdCross(prev, hist),
  }
}

export function marketReading(closes, index) {
  const src = Array.isArray(closes) ? closes : []
  const i = Math.max(0, Math.min(src.length - 1, index | 0))
  const band = src.length ? bollingerPoint(src, i) : null
  const close = src.length && Number.isFinite(src[i]) ? src[i] : null
  const rsiSeries = rsi(src)
  const rsiValue = rsiSeries[i] ?? null
  const macd = macdPoint(src, i)
  return {
    band,
    close,
    touch: bandTouch(close, band),
    rsi: rsiValue,
    rsiZone: rsiZone(rsiValue),
    macd,
  }
}

/**
 * Tunnel inside the bands, hole outside. Lower band is the left wall (SÄLJ), upper band the right wall (KÖP).
 * Narrow bandwidth draws a narrower shaft. Without a band yet, the lanes fall back to the fixed steer span.
 */
export function shaftBorder(width, band) {
  const w = Math.max(1, Number(width) || 1)
  if (!band || !(band.upper > band.lower)) {
    const lanes = steerLanes(w, 'right')
    return { ...lanes, hasBand: false }
  }
  const mid = band.sma > 0 ? band.sma : (band.upper + band.lower) / 2
  const bw = mid > 0 ? (band.upper - band.lower) / mid : 0.04
  const t = Math.min(1, Math.max(0, (bw - 0.008) / 0.1))
  const half = w * (0.16 + t * 0.26)
  const margin = Math.max(24, w * 0.06)
  let sell = w / 2 - half
  let buy = w / 2 + half
  if (sell < margin) {
    buy += margin - sell
    sell = margin
  }
  if (buy > w - margin) {
    sell -= buy - (w - margin)
    buy = w - margin
  }
  sell = Math.max(margin, sell)
  buy = Math.min(w - margin, Math.max(sell + 8, buy))
  return { buy, sell, flat: (buy + sell) / 2, hasBand: true, bandwidth: bw }
}

export function shaftRegion(x, walls) {
  if (!walls || !Number.isFinite(x) || !Number.isFinite(walls.sell) || !Number.isFinite(walls.buy)) return 'tunnel'
  const eps = 0.75
  if (Math.abs(x - walls.sell) <= eps || Math.abs(x - walls.buy) <= eps) return 'border'
  if (x < walls.sell || x > walls.buy) return 'hole'
  return 'tunnel'
}

export function priceOnShaft(close, band, walls) {
  if (!walls || !Number.isFinite(walls.sell) || !Number.isFinite(walls.buy)) return null
  if (!band || !Number.isFinite(close) || !(band.upper > band.lower)) return walls.flat
  return walls.sell + ((close - band.lower) / (band.upper - band.lower)) * (walls.buy - walls.sell)
}

/** Chase along the fall. Reduced motion keeps the camera fixed. */
export function chaseCamera(prev, offset, dt, reduced = false) {
  if (reduced) return { pan: 0, roll: 0 }
  const lateral = Number(offset) || 0
  const targetPan = -lateral * 56
  const targetRoll = lateral * 0.12
  const from = prev && Number.isFinite(prev.pan) ? prev : { pan: 0, roll: 0 }
  const step = 1 - Math.exp(-8 * Math.max(0, Number(dt) || 0))
  return {
    pan: from.pan + (targetPan - from.pan) * step,
    roll: from.roll + (targetRoll - from.roll) * step,
  }
}

/** First gamepad follows Form A. Button 0 confirms. Missing pads return null. */
export function gamepadIntent(pad, deadzone = PAD_DEADZONE) {
  if (!pad) return null
  const axes = pad.axes || []
  const buttons = pad.buttons || []
  const pressed = (i) => {
    const button = buttons[i]
    if (!button) return false
    return typeof button === 'object' ? !!button.pressed : !!button
  }
  const x = Number(axes[0])
  const y = Number(axes[1])
  const nx = Number.isFinite(x) ? x : 0
  const ny = Number.isFinite(y) ? y : 0
  let move = null
  if (ny < -deadzone || pressed(12)) move = 'FORWARD'
  else if (ny > deadzone || pressed(13)) move = 'BACKWARD'
  else if (nx > deadzone || pressed(15)) move = 'STEER_TOWARD_HIGH'
  else if (nx < -deadzone || pressed(14)) move = 'STEER_TOWARD_LOW'
  const confirm = pressed(0)
  if (!move && !confirm) return null
  return { move, confirm }
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

/* Äldre vektorritning. Den synliga bilden ritas av world-stage. */
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

function drawShaftBorder(c, w, h, walls, marks) {
  if (!walls?.hasBand) return
  const vpX = w / 2
  const vpY = h * 0.76
  const nearY = h * 0.4
  const at = (edge, y) => vpX + (edge - vpX) * ((y - vpY) / (nearY - vpY || 1))
  const l0 = at(walls.sell, 0)
  const l1 = at(walls.sell, h)
  const r0 = at(walls.buy, 0)
  const r1 = at(walls.buy, h)
  c.save()
  c.fillStyle = 'rgba(2, 1, 6, 0.78)'
  c.beginPath()
  c.moveTo(0, 0)
  c.lineTo(l0, 0)
  c.lineTo(l1, h)
  c.lineTo(0, h)
  c.closePath()
  c.fill()
  c.beginPath()
  c.moveTo(w, 0)
  c.lineTo(r0, 0)
  c.lineTo(r1, h)
  c.lineTo(w, h)
  c.closePath()
  c.fill()
  c.lineWidth = 3
  c.strokeStyle = PINK
  c.beginPath()
  c.moveTo(l0, 0)
  c.lineTo(l1, h)
  c.stroke()
  c.strokeStyle = CYAN
  c.beginPath()
  c.moveTo(r0, 0)
  c.lineTo(r1, h)
  c.stroke()
  c.font = '700 12px "IBM Plex Sans", sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = 'rgba(244,239,230,0.72)'
  c.fillText(t('rh.hole'), Math.max(22, walls.sell * 0.38), h * 0.58)
  c.fillText(t('rh.hole'), Math.min(w - 22, walls.buy + (w - walls.buy) * 0.55), h * 0.58)
  c.fillStyle = '#f4efe6'
  c.fillText(t('rh.tunnel'), w / 2, h * 0.18)
  c.fillStyle = PINK
  c.fillText(t('rh.wallLower'), walls.sell, h * 0.4 + 48)
  c.fillStyle = CYAN
  c.fillText(t('rh.wallUpper'), walls.buy, h * 0.4 + 48)
  if (marks?.band?.life > 0 && marks.band.key) {
    const x = marks.band.side === 'sell' ? walls.sell : walls.buy
    c.fillStyle = '#ffd27a'
    c.fillText(t(marks.band.key), x, h * 0.4 - 44)
  }
  c.restore()
}

function drawPricePip(c, x, y, region) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  c.save()
  c.fillStyle = region === 'hole' ? '#ffd27a' : '#f4efe6'
  c.strokeStyle = '#07060c'
  c.lineWidth = 2
  c.beginPath()
  c.arc(x, y, region === 'hole' ? 7 : 5, 0, Math.PI * 2)
  c.fill()
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
  for (const side of [-1, 1]) {
    const baseX = side * 10
    const baseY = -96
    c.fillStyle = FUR
    c.beginPath()
    c.moveTo(baseX - side * 7, baseY)
    c.quadraticCurveTo(baseX - side * 16, baseY - 34, baseX, baseY - 62)
    c.quadraticCurveTo(baseX + side * 18, baseY - 32, baseX + side * 8, baseY)
    c.closePath()
    c.fill()
    c.strokeStyle = FUR_SHADE
    c.lineWidth = 1.2
    c.stroke()
    c.fillStyle = INNER
    c.beginPath()
    c.moveTo(baseX - side * 2, baseY - 8)
    c.quadraticCurveTo(baseX - side * 7, baseY - 32, baseX + side * 1, baseY - 50)
    c.quadraticCurveTo(baseX + side * 9, baseY - 30, baseX + side * 3, baseY - 6)
    c.closePath()
    c.fill()
  }
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
    const label = t(key === 'sell' ? 'btn.sell' : key === 'buy' ? 'btn.buy' : 'btn.flat')
    c.lineWidth = 3
    c.strokeStyle = '#14301a'
    c.strokeText(label, x, groundY + 50)
    c.fillStyle = '#f4efe6'
    c.fillText(label, x, groundY + 50)
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
  const press = document.createElement('p')
  press.className = 'nlr-rh-press'
  press.dataset.rhPress = '1'
  const muteBtn = document.createElement('button')
  muteBtn.type = 'button'
  muteBtn.className = 'nlr-rh-mute'
  muteBtn.dataset.rhMute = '1'
  const qualityBtn = document.createElement('button')
  qualityBtn.type = 'button'
  qualityBtn.className = 'nlr-rh-quality'
  qualityBtn.dataset.rhQuality = '1'
  actions.append(startBtn, twoBtn, muteBtn, qualityBtn)
  card.append(claim, title, press, body, actions, keys)
  home.append(card)
  const pauseBox = document.createElement('div')
  pauseBox.className = 'nlr-rh-pause'
  pauseBox.dataset.rhPause = '1'
  pauseBox.hidden = true
  const pauseTitle = document.createElement('p')
  pauseTitle.dataset.rhPauseTitle = '1'
  const resumeBtn = document.createElement('button')
  resumeBtn.type = 'button'
  resumeBtn.className = 'nlr-rh-resume'
  resumeBtn.dataset.rhResume = '1'
  const pauseMute = document.createElement('button')
  pauseMute.type = 'button'
  pauseMute.className = 'nlr-rh-mute'
  pauseMute.dataset.rhMute = '1'
  const pauseQuality = document.createElement('button')
  pauseQuality.type = 'button'
  pauseQuality.className = 'nlr-rh-quality'
  pauseQuality.dataset.rhQuality = '1'
  pauseBox.append(pauseTitle, resumeBtn, pauseMute, pauseQuality)
  const pad = document.createElement('div')
  pad.className = 'nlr-rh-pad'
  pad.dataset.rhPad = '1'
  for (const [intent, glyph] of [
    ['FORWARD', '▲'],
    ['STEER_TOWARD_LOW', '◀'],
    ['FLAT', '●'],
    ['STEER_TOWARD_HIGH', '▶'],
    ['BACKWARD', '▼'],
  ]) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.rhPad = intent
    b.textContent = glyph
    b.setAttribute('aria-label', intent)
    pad.append(b)
  }
  const indicators = document.createElement('div')
  indicators.className = 'nlr-rh-indicators'
  indicators.dataset.rhIndicators = '1'
  const market = document.createElement('div')
  market.className = 'nlr-rh-market'
  market.dataset.rhMarket = '1'
  const bbLine = document.createElement('p')
  bbLine.dataset.rhBb = '1'
  const rsiLine = document.createElement('p')
  rsiLine.dataset.rhRsi = '1'
  const macdLine = document.createElement('p')
  macdLine.dataset.rhMacd = '1'
  const sigLine = document.createElement('p')
  sigLine.className = 'nlr-rh-signal'
  sigLine.dataset.rhSignal = '1'
  market.append(bbLine, rsiLine, macdLine, sigLine)
  root.append(canvas, home, indicators, market, hud, note, pauseBox, pad)
  document.body.appendChild(root)

  let visible = false
  let frozen = false
  let inFrame = false
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
    return { side: 'flat', leverage: 1, entry: null, result: null, y: 0, spin: 0, hp: 0, eatLeft: 0, floater: null, eaten: [], cam: { pan: 0, roll: 0 } }
  }
  let marks = { band: { life: 0, key: '', side: '' }, rsi: { life: 0, key: '' }, macd: { life: 0, key: '' } }
  let prevTouch = null
  let prevZone = 'saknas'
  let prevHist = null
  const padLock = [createGestureLock(480), createGestureLock(480)]
  let riders = [freshRider(), freshRider()]
  const world = createWorld(canvas)
  const audio = createScore()
  let acc = 0
  let clock = 0
  let frameCount = 0
  let airFrames = 0
  let jumpLock = 0
  let hitLeft = 0
  let shake = 0
  let paused = false
  let heard = false
  let inputBuf = null
  let bufPlayer = 0
  try {
    if (localStorage.getItem('tr-rh-sound') === '0') audio.setMuted(true)
  } catch {
    /* ljudet följer volymen om lagringen saknas */
  }

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
    press.textContent = t('rh.pressStart')
    pauseTitle.textContent = t('rh.pause')
    resumeBtn.textContent = t('rh.resume')
    const soundLabel = audio.muted() ? t('rh.soundOff') : t('rh.soundOn')
    muteBtn.textContent = soundLabel
    pauseMute.textContent = soundLabel
    const qualityLabel = t(world.quality() === 'low' ? 'rh.qualityLow' : 'rh.qualityHigh')
    qualityBtn.textContent = qualityLabel
    pauseQuality.textContent = qualityLabel
    root.dataset.view = world.mode()
    root.dataset.quality = world.quality()
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
      if (fall) fall.textContent = `${t('rh.fall')} ${info.fallRate.toFixed(1)} · ${t(bandKey(info.band))} · ×${rider.leverage}`
      const meter = indicators.querySelector(`[data-rh-meter="${n}"]`)
      const spanRate = fallRate(6, false)
      if (meter) meter.style.width = `${Math.round(Math.min(1, info.fallRate / spanRate) * 100)}%`
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

  function paintMarket() {
    const reading = marketReading(closesOf(series()), priceIndex)
    if (reading.band) {
      bbLine.textContent = `${t('rh.band')} ${reading.band.lower.toFixed(2)} – ${reading.band.upper.toFixed(2)} · ${t('rh.bandRole')}`
    } else {
      bbLine.textContent = `${t('rh.band')} · ${t('rh.bandWait')}`
    }
    const rsiText = reading.rsi == null ? '—' : reading.rsi.toFixed(0)
    let rsiLabel = `${t('rh.rsi')} ${rsiText}`
    if (reading.rsiZone === 'overkopt') rsiLabel += ` · ${t('rh.rsiHigh')}`
    if (reading.rsiZone === 'oversalt') rsiLabel += ` · ${t('rh.rsiLow')}`
    rsiLine.textContent = rsiLabel
    const hist = reading.macd.hist
    macdLine.textContent = `${t('rh.macd')} ${hist == null ? '—' : hist.toFixed(3)}`
    const bits = []
    if (reading.touch === 'upper') bits.push(t('rh.touchUpper'))
    else if (reading.touch === 'near-upper') bits.push(t('rh.nearUpper'))
    else if (reading.touch === 'lower') bits.push(t('rh.touchLower'))
    else if (reading.touch === 'near-lower') bits.push(t('rh.nearLower'))
    if (marks.rsi.life > 0 && marks.rsi.key) bits.push(t(marks.rsi.key))
    if (marks.macd.life > 0 && marks.macd.key) bits.push(t(marks.macd.key))
    sigLine.textContent = bits.join(' · ')
    sigLine.hidden = bits.length === 0
  }

  function baselineMarket() {
    const reading = marketReading(closesOf(series()), priceIndex)
    prevTouch = reading.touch
    prevZone = reading.rsiZone
    prevHist = reading.macd.hist
    marks = { band: { life: 0, key: '', side: '' }, rsi: { life: 0, key: '' }, macd: { life: 0, key: '' } }
  }

  function noteBar() {
    const reading = marketReading(closesOf(series()), priceIndex)
    const edge = edgeSignal(prevTouch, reading.touch)
    if (edge === 'upper' || edge === 'near-upper') {
      marks.band = { life: MARK_HOLD, key: edge === 'upper' ? 'rh.touchUpper' : 'rh.nearUpper', side: 'buy' }
    } else if (edge === 'lower' || edge === 'near-lower') {
      marks.band = { life: MARK_HOLD, key: edge === 'lower' ? 'rh.touchLower' : 'rh.nearLower', side: 'sell' }
    }
    prevTouch = reading.touch
    if (reading.rsiZone === 'overkopt' && prevZone !== 'overkopt') marks.rsi = { life: MARK_HOLD, key: 'rh.rsiHigh' }
    if (reading.rsiZone === 'oversalt' && prevZone !== 'oversalt') marks.rsi = { life: MARK_HOLD, key: 'rh.rsiLow' }
    prevZone = reading.rsiZone
    const cross = macdCross(prevHist, reading.macd.hist)
    if (cross === 'up') marks.macd = { life: MARK_HOLD, key: 'rh.macdUp' }
    if (cross === 'down') marks.macd = { life: MARK_HOLD, key: 'rh.macdDown' }
    prevHist = reading.macd.hist
  }

  function decayMarks(dt) {
    const step = Math.max(0, Number(dt) || 0)
    for (const key of ['band', 'rsi', 'macd']) {
      if (marks[key].life > 0) marks[key].life = Math.max(0, marks[key].life - step)
    }
  }

  function pollPads() {
    const nav = globalThis.navigator
    if (!nav || typeof nav.getGamepads !== 'function') return
    let pads = null
    try {
      pads = nav.getGamepads()
    } catch {
      return
    }
    if (!pads) return
    ;[pads[0], pads[1]].forEach((pad, i) => {
      if (!pad || phase === 'jump' || frozen || paused || hitLeft > 0) return
      const reading = gamepadIntent(pad)
      if (!reading || !padLock[i].allow()) return
      if (phase === 'home') {
        if (i === 1 && !reading.confirm) return
        if (reading.confirm) start(i === 1 ? 2 : 1)
        else if (i === 0 && (reading.move === 'STEER_TOWARD_HIGH' || reading.move === 'STEER_TOWARD_LOW')) applyTo(0, reading.move)
        return
      }
      if (i === 1 && players !== 2) return
      const index = players === 2 ? i : 0
      if (reading.confirm) applyTo(index, 'FLAT')
      else if (reading.move) applyTo(index, reading.move)
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

  function currentWalls(width) {
    const closes = closesOf(series())
    const band = bollingerPoint(closes, priceIndex)
    return { closes, band, walls: shaftBorder(width, band), reading: marketReading(closes, priceIndex) }
  }

  function armAudio() {
    heard = true
    audio.resume()
  }

  function togglePause(force) {
    const next = typeof force === 'boolean' ? force : !paused
    if (next === paused) return
    paused = next
    pauseBox.hidden = !paused
    armAudio()
    audio.sfx('menu')
    paint()
  }

  function setMuted(next) {
    audio.setMuted(next)
    try {
      localStorage.setItem('tr-rh-sound', next ? '0' : '1')
    } catch {
      /* volymen gäller bara den här sidan */
    }
    copyChrome()
    armAudio()
    audio.sfx('menu')
  }

  function syncRider(rider, width, height, reduced) {
    const view = currentWalls(width)
    const info = movementIndicators({ side: rider.side, leverage: rider.leverage, width, reduced, lanes: view.walls })
    const rabbitY = height * 0.4
    const items = collect(width, height, rider.y, reduced).map((item) => ({
      ...item,
      front: drawsInFront(item, info.x, rabbitY, 1),
    }))
    const picked = applyPickups(items, { x: info.x, y: rabbitY }, rider.hp, rider.eaten)
    if (picked.gained) {
      rider.hp = picked.hp
      rider.eatLeft = Math.max(rider.eatLeft, 0.9)
      rider.floater = { life: 1, x: info.x + 28, y: rabbitY - 18 }
      if (!reduced) {
        hitLeft = Math.max(hitLeft, 5)
        shake = 3
        rider.flash = true
        rider.bits = Array.from({ length: 6 }, (_, i) => ({
          x: info.x + (i - 2.5) * 6,
          y: rabbitY - 8,
          vx: (i - 2.5) * 16,
          vy: -28,
          life: 0.35,
          color: i % 2 ? [248, 208, 72] : [240, 128, 32],
        }))
        armAudio()
        audio.sfx('pickup')
      }
    } else if (hitLeft <= 0) rider.flash = false
    rider.eaten = picked.eaten.slice(-48)
    const priceX = view.walls.hasBand ? priceOnShaft(view.reading.close, view.band, view.walls) : null
    return {
      walls: view.walls,
      x: info.x,
      rabbitY,
      priceX,
      region: shaftRegion(priceX, view.walls),
      items,
      eating: rider.eatLeft > 0,
      scroll: rider.y,
      spin: rider.spin,
      pan: rider.cam?.pan || 0,
      roll: rider.cam?.roll || 0,
      juice: rider.eatLeft > 0.6 ? 'wide' : 'none',
      floater: rider.floater,
      hp: rider.hp,
      bits: rider.bits || [],
      flash: !!rider.flash,
      logicW: width,
      logicH: height,
    }
  }

  function paintRider(c, rider, box, h, reduced) {
    c.save()
    c.beginPath()
    c.rect(box.left, 0, box.width, h)
    c.clip()
    c.translate(box.left, 0)
    const cam = reduced ? { pan: 0, roll: 0 } : rider.cam || { pan: 0, roll: 0 }
    c.translate(box.width / 2, h * 0.4)
    c.rotate(cam.roll || 0)
    c.translate(-box.width / 2 + (cam.pan || 0), -h * 0.4)
    drawTunnel(c, box.width, h, rider.y, rider.spin, reduced)
    const view = currentWalls(box.width)
    drawShaftBorder(c, box.width, h, view.walls, marks)
    const info = movementIndicators({ side: rider.side, leverage: rider.leverage, width: box.width, reduced, lanes: view.walls })
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
    if (view.walls.hasBand) {
      const px = priceOnShaft(view.reading.close, view.band, view.walls)
      drawPricePip(c, px, rabbitY - 28, shaftRegion(px, view.walls))
    }
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
    root.dataset.paused = paused ? '1' : '0'
    home.hidden = phase !== 'home'
    indicators.hidden = phase !== 'race'
    market.hidden = phase !== 'race'
    hud.hidden = phase !== 'race'
    pauseBox.hidden = !paused
    copyChrome()
    const price = priceAt(priceIndex)
    hud.innerHTML = `<span><b>${t('sim.price')}</b> ${fmtPrice(price)}</span><span><b>${t('hud.result')}</b> ${fmtResult(riders[0].result)}</span>`
    if (phase === 'race') {
      paintIndicators(reduced)
      paintMarket()
    }
    const w = root.clientWidth || 800
    const h = root.clientHeight || 600
    const layout = homeLayout(w, h)
    const lanes = steerLanes(w, 'right')
    const jumpP = phase === 'jump' ? jumpProgress(jumpT, reduced) : 0
    const from = standPoint(riders[0].side, layout)
    const pose = phase === 'jump' ? jumpPose(jumpP, from, layout.hole) : null
    let rabbitPose = 'stand'
    let juice = 'none'
    if (phase === 'jump') {
      if (jumpP < 0.22) {
        rabbitPose = 'stretch'
        juice = 'tall'
      } else if (jumpP > 0.78) {
        rabbitPose = 'squash'
        juice = 'wide'
      }
    }
    const sideWord = t(riders[0].side === 'buy' ? 'btn.buy' : riders[0].side === 'sell' ? 'btn.sell' : 'btn.flat')
    const reading = marketReading(closesOf(series()), priceIndex)
    const hudLine = `${fmtPrice(price)} ${sideWord} x${riders[0].leverage} RSI ${reading.rsi == null ? '-' : reading.rsi.toFixed(0)}`
    const span = players === 2 ? w / 2 : w
    const sceneRiders = phase === 'race'
      ? activeRiders().map((rider) => syncRider(rider, span, h, reduced))
      : []
    if (phase === 'race') lastSprite = rabbitSprite({ eating: riders[0].eatLeft > 0 })
    world.render({
      phase: phase === 'race' ? 'race' : phase,
      players,
      reduced,
      paused,
      time: clock,
      shake: reduced ? 0 : shake,
      logicW: w,
      logicH: h,
      groundY: layout.groundY,
      hole: layout.hole,
      lanes,
      side: riders[0].side,
      stand: pose || standPoint(riders[0].side, layout),
      rabbitPose,
      juice,
      eating: riders[0].eatLeft > 0,
      jump: jumpP,
      hud: hudLine,
      riders: sceneRiders,
    }, w, h)
    root.dataset.view = world.mode()
    root.dataset.quality = world.quality()
  }

  function applyTo(index, intent) {
    const rider = riders[index] || riders[0]
    const next = steering.applyIntent({ side: rider.side, leverage: rider.leverage }, intent)
    const was = rider.side
    const prevLev = rider.leverage
    rider.side = next.side
    rider.leverage = next.leverage
    if (rider.side === 'flat') rider.entry = null
    else if (was !== rider.side) rider.entry = priceAt(priceIndex)
    else if (rider.entry == null) rider.entry = priceAt(priceIndex)
    if (heard && was !== rider.side) {
      if (rider.side === 'buy') audio.sfx('tp')
      else if (rider.side === 'sell') audio.sfx('sl')
    }
    if (heard && prevLev !== rider.leverage) audio.sfx('menu')
    paint()
  }

  function enterRace() {
    phase = 'race'
    const closes = closesOf(series())
    const ready = macdSeries(closes).hist.findIndex((v) => Number.isFinite(v))
    priceIndex = ready >= 0 ? ready : closes.length > BB_PERIOD ? BB_PERIOD - 1 : 0
    priceDebt = 0
    for (const rider of riders) {
      rider.y = 0
      rider.spin = 0
      rider.cam = { pan: 0, roll: 0 }
    }
    baselineMarket()
    audio.setArea('fall')
    if (!reducedMotion()) shake = 4
  }

  function start(count = 1) {
    if (!visible || phase !== 'home' || frozen || paused) return false
    players = count === 2 ? 2 : 1
    buildIndicators()
    armAudio()
    audio.sfx('jump')
    if (reducedMotion()) enterRace()
    else {
      phase = advancePhase('home', 'start')
      jumpT = 0
      jumpLock = 4
      airFrames = 0
    }
    paint()
    if (!inFrame) kick()
    return true
  }

  function onKey(e) {
    if (!visible || frozen) return
    if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat && !isTypingTarget(e.target)) {
      if (e.code === 'Escape' && phase === 'home' && !paused) return
      e.preventDefault()
      e.stopPropagation()
      togglePause()
      return
    }
    if (paused) {
      if (e.code === 'Enter' && !e.repeat) {
        e.preventDefault()
        togglePause(false)
      }
      return
    }
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
    const steer = a.intent === 'STEER_TOWARD_HIGH' || a.intent === 'STEER_TOWARD_LOW' || a.intent === 'FLAT'
    const locked = hitLeft > 0 || jumpLock > 0
    if (locked && !(phase === 'jump' && steer && coyoteLeft(airFrames) > 0)) {
      inputBuf = rememberInput(a.intent, frameCount)
      bufPlayer = index
      return
    }
    armAudio()
    applyTo(index, a.intent)
  }
  addEventListener('keydown', onKey, true)
  addEventListener('keyup', (e) => {
    if (visible && PREVENT_DEFAULT.has(e.code) && keyAction(e, '1p', O)) e.preventDefault()
  }, true)
  root.addEventListener('click', (e) => {
    armAudio()
    if (e.target.closest?.('[data-rh-resume]')) {
      togglePause(false)
      return
    }
    if (e.target.closest?.('[data-rh-mute]')) {
      setMuted(!audio.muted())
      return
    }
    if (e.target.closest?.('[data-rh-quality]')) {
      world.setQuality(world.quality() === 'high' ? 'low' : 'high')
      armAudio()
      audio.sfx('menu')
      copyChrome()
      paint()
      return
    }
    const padBtn = e.target.closest?.('[data-rh-pad]')
    if (padBtn && padBtn.dataset.rhPad && pad.contains(padBtn)) {
      const intent = padBtn.dataset.rhPad
      if (paused) return
      if (intent === 'FLAT' && phase === 'home') {
        start(1)
        return
      }
      const index = 0
      if (phase === 'home' && intent !== 'FORWARD' && intent !== 'BACKWARD' && intent !== 'FLAT') applyTo(index, intent)
      else if (phase !== 'home') applyTo(index, intent)
      else if (intent === 'FORWARD' || intent === 'BACKWARD') applyTo(index, intent)
      return
    }
    const btn = e.target.closest?.('[data-rh-start]')
    if (!btn) return
    start(btn.dataset.rhStart === '2' ? 2 : 1)
  })
  let touchX = null
  let touchY = null
  canvas.addEventListener('touchstart', (e) => {
    const p = e.changedTouches?.[0]
    if (!p) return
    touchX = p.clientX
    touchY = p.clientY
  }, { passive: true })
  canvas.addEventListener('touchend', (e) => {
    if (touchX == null || paused || frozen) {
      touchX = null
      touchY = null
      return
    }
    const p = e.changedTouches?.[0]
    if (!p) return
    const dx = p.clientX - touchX
    const dy = p.clientY - touchY
    touchX = null
    touchY = null
    armAudio()
    if (Math.hypot(dx, dy) < 28) {
      if (phase === 'home') start(1)
      else applyTo(0, 'FLAT')
      return
    }
    if (Math.abs(dx) > Math.abs(dy)) applyTo(0, dx > 0 ? 'STEER_TOWARD_HIGH' : 'STEER_TOWARD_LOW')
    else applyTo(0, dy < 0 ? 'FORWARD' : 'BACKWARD')
  }, { passive: true })
  root.addEventListener('wheel', (e) => {
    if (!visible || frozen || paused) return
    const intent = wheelToIntent(e.deltaY)
    if (!intent || !lock.allow()) return
    e.preventDefault()
    applyTo(0, intent)
  }, { passive: false })

  function tickRider(rider, dt, reduced) {
    const offset = rider.side === 'buy' ? 0.5 : rider.side === 'sell' ? -0.5 : 0
    rider.cam = chaseCamera(rider.cam, offset, dt, reduced)
    if (!reduced) {
      rider.y += fallRate(rider.leverage, false)
      rider.spin += dt
    }
    if (rider.eatLeft > 0) rider.eatLeft = Math.max(0, rider.eatLeft - dt)
    if (rider.bits?.length) {
      rider.bits = rider.bits
        .map((bit) => ({ ...bit, x: bit.x + bit.vx * dt, y: bit.y + bit.vy * dt, vy: bit.vy + 40 * dt, life: bit.life - dt }))
        .filter((bit) => bit.life > 0)
    }
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
      noteBar()
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

  function simTick(dt) {
    frameCount += 1
    const reduced = reducedMotion()
    if (!reduced) clock += dt
    if (shake > 0) shake = Math.max(0, shake - 1)
    if (hitLeft > 0) {
      hitLeft -= 1
      if (hitLeft === 0) {
        const pending = readBuffered(inputBuf, frameCount)
        if (pending) {
          inputBuf = null
          applyTo(bufPlayer, pending)
        }
      }
      return
    }
    if (phase === 'home') {
      airFrames = 0
      jumpLock = 0
      if (!reduced) glowT += dt
      return
    }
    if (phase === 'jump') {
      airFrames += 1
      if (jumpLock > 0) jumpLock -= 1
      jumpT += dt
      if (jumpProgress(jumpT, reduced) >= 1) enterRace()
      const pending = readBuffered(inputBuf, frameCount)
      if (pending && jumpLock <= 0) {
        inputBuf = null
        applyTo(bufPlayer, pending)
      }
      return
    }
    for (const rider of activeRiders()) tickRider(rider, dt, reduced)
    advancePrice(dt)
    decayMarks(dt)
    pollPads()
    const pending = readBuffered(inputBuf, frameCount)
    if (pending) {
      inputBuf = null
      applyTo(bufPlayer, pending)
    }
  }

  function frame(now) {
    if (!visible || frozen) return
    inFrame = true
    const stamp = typeof now === 'number' ? now : performance.now()
    const dt = lastFrame ? Math.min(0.05, (stamp - lastFrame) / 1000) : STEP_SEC
    lastFrame = stamp
    if (!paused) {
      const stepped = fixedStep(acc, dt)
      acc = stepped.accumulator
      for (let i = 0; i < stepped.steps; i++) simTick(STEP_SEC)
      if (heard) audio.tick()
    }
    if (phase === 'home' && !paused) pollPads()
    paint()
    inFrame = false
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
    acc = 0
    clock = 0
    frameCount = 0
    airFrames = 0
    jumpLock = 0
    hitLeft = 0
    shake = 0
    paused = false
    inputBuf = null
    pauseBox.hidden = true
    riders = [freshRider(), freshRider()]
    audio.setArea('meadow')
    buildIndicators()
    copyChrome()
    baselineMarket()
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
    pause(force) {
      togglePause(force)
    },
    anchor: () => 'bottom',
    step(n = 1) {
      const dt = Math.max(0, Number(n) || 0)
      const reduced = reducedMotion()
      if (!reduced) clock += dt
      const feelTicks = Math.max(1, Math.round((dt || STEP_SEC) / STEP_SEC))
      airFrames += phase === 'home' ? 0 : feelTicks
      if (jumpLock > 0) jumpLock = Math.max(0, jumpLock - feelTicks)
      frameCount += feelTicks
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
      decayMarks(dt)
      paint()
    },
    state() {
      const w = root.clientWidth || 800
      const h = root.clientHeight || 600
      const reduced = reducedMotion()
      const lead = riders[0]
      const span = players === 2 ? w / 2 : w
      const walls = shaftBorder(span, bollingerPoint(closesOf(series()), priceIndex))
      const info = movementIndicators({ side: lead.side, leverage: lead.leverage, width: span, reduced, lanes: walls })
      return {
        phase,
        players,
        started: phase === 'race',
        side: lead.side,
        leverage: lead.leverage,
        y: lead.y,
        hp: lead.hp,
        x: info.x,
        buy: walls.buy,
        sell: walls.sell,
        flat: walls.flat,
        border: walls,
        region: shaftRegion(info.x, walls),
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
          indicators: movementIndicators({ side: rider.side, leverage: rider.leverage, width: span, reduced, lanes: walls }),
        })),
      }
    },
  }
}
