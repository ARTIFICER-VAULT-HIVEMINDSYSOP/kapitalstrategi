/**
 * Relativ styrmotor. Fysiska tangenter blir avsikter via orientation.
 * movement: riktningen priset/banan rör sig. W = FORWARD, S = BACKWARD i varje riktning.
 * Pilen längs movement ökar hävstången. Den vinkelräta axeln styr SÄLJ ↔ FLAT ↔ KÖP.
 * Att vrida 90° är bara ett nytt movement-värde.
 */
import { stepSide } from './styrmotor.js'

export const INTENTS = ['FORWARD', 'BACKWARD', 'STEER_TOWARD_HIGH', 'STEER_TOWARD_LOW', 'FLAT']

export const MODES = {
  trendRider: {
    id: 'trend-rider',
    hash: 'trade-rider',
    aliases: ['nvda-rider', 'trend-rider', 'line-rider'],
    nameKey: 'mode.trendRider.name',
    orientation: { movement: 'right', highPriceSide: 'up' },
  },
  raket: {
    id: 'raket',
    hash: 'racex',
    aliases: ['raket'],
    nameKey: 'mode.raket.name',
    orientation: { movement: 'up', highPriceSide: 'right' },
  },
  akademin: {
    id: 'akademin',
    hash: 'academy',
    aliases: ['akademin'],
    nameKey: 'mode.akademin.name',
    orientation: { movement: 'right', highPriceSide: 'up' },
  },
  tra: {
    id: 'tra',
    hash: 'tra',
    aliases: ['trade-rider-academy'],
    nameKey: 'mode.tra.name',
    orientation: { movement: 'right', highPriceSide: 'up' },
  },
  rabbitHole: {
    id: 'rabbit-hole',
    hash: 'rabbit-hole',
    aliases: [],
    nameKey: 'mode.rabbitHole.name',
    orientation: { movement: 'down', highPriceSide: 'right' },
  },
}

const AXIS = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
}

export function travelVector(orientation) {
  return AXIS[orientation.movement] || AXIS.right
}

function highIsUp(orientation) {
  return orientation.highPriceSide !== 'down'
}

function highIsRight(orientation) {
  return orientation.highPriceSide !== 'left'
}

/** Pilkoder → avsikt. Pilar vinner: bokstäver läggs på efteråt och skriver inte över en pil. */
export function arrowMap(orientation) {
  const m = orientation.movement
  const map = {}
  if (m === 'right' || m === 'left') {
    const fwd = m === 'right' ? 'ArrowRight' : 'ArrowLeft'
    const back = m === 'right' ? 'ArrowLeft' : 'ArrowRight'
    map[fwd] = 'FORWARD'
    map[back] = 'BACKWARD'
    const upHigh = highIsUp(orientation)
    map.ArrowUp = upHigh ? 'STEER_TOWARD_HIGH' : 'STEER_TOWARD_LOW'
    map.ArrowDown = upHigh ? 'STEER_TOWARD_LOW' : 'STEER_TOWARD_HIGH'
    return map
  }
  const fwd = m === 'up' ? 'ArrowUp' : 'ArrowDown'
  const back = m === 'up' ? 'ArrowDown' : 'ArrowUp'
  map[fwd] = 'FORWARD'
  map[back] = 'BACKWARD'
  const rightHigh = highIsRight(orientation)
  map.ArrowRight = rightHigh ? 'STEER_TOWARD_HIGH' : 'STEER_TOWARD_LOW'
  map.ArrowLeft = rightHigh ? 'STEER_TOWARD_LOW' : 'STEER_TOWARD_HIGH'
  return map
}

export function keyToIntent(code, orientation) {
  if (code === 'Space' || code === 'Digit0' || code === 'Numpad0') return 'FLAT'
  const arrows = arrowMap(orientation)
  if (arrows[code]) return arrows[code]
  if (code === 'KeyW') return 'FORWARD'
  if (code === 'KeyS') return 'BACKWARD'
  if (code === 'KeyD') return arrows.ArrowRight
  if (code === 'KeyA') return arrows.ArrowLeft
  if (code === 'KeyE') return 'STEER_TOWARD_HIGH'
  if (code === 'KeyQ') return 'STEER_TOWARD_LOW'
  return null
}

/** Hjulet ligger alltid på styraxeln. Negativt deltaY = mot högre pris. */
export function wheelToIntent(deltaY) {
  if (typeof deltaY !== 'number' || deltaY === 0) return null
  return deltaY < 0 ? 'STEER_TOWARD_HIGH' : 'STEER_TOWARD_LOW'
}

export function intentToAction(intent) {
  if (intent === 'FORWARD') return 'levUp'
  if (intent === 'BACKWARD') return 'levDown'
  if (intent === 'STEER_TOWARD_HIGH') return 'buy'
  if (intent === 'STEER_TOWARD_LOW') return 'sell'
  if (intent === 'FLAT') return 'flat'
  return null
}

export function applyIntent(state, intent) {
  const side = state?.side === 'buy' || state?.side === 'sell' || state?.side === 'flat' ? state.side : 'flat'
  const leverage = Number.isFinite(state?.leverage) ? state.leverage : 1
  if (intent === 'FLAT') return { side: 'flat', leverage }
  if (intent === 'STEER_TOWARD_HIGH') return { side: stepSide(side, 1), leverage }
  if (intent === 'STEER_TOWARD_LOW') return { side: stepSide(side, -1), leverage }
  if (intent === 'FORWARD') return { side, leverage: leverage + 1 }
  if (intent === 'BACKWARD') return { side, leverage: Math.max(1, leverage - 1) }
  return { side, leverage }
}

function joinKeys(codes, arrows) {
  const parts = []
  for (const code of codes) {
    if (code === 'ArrowUp') parts.push('↑')
    else if (code === 'ArrowDown') parts.push('↓')
    else if (code === 'ArrowLeft') parts.push('←')
    else if (code === 'ArrowRight') parts.push('→')
  }
  return parts.join('/')
}

export function glyphs(orientation) {
  const arrows = arrowMap(orientation)
  const of = (intent) => Object.keys(arrows).filter((k) => arrows[k] === intent)
  const fwdArrows = joinKeys(of('FORWARD'))
  const backArrows = joinKeys(of('BACKWARD'))
  const highArrows = joinKeys(of('STEER_TOWARD_HIGH'))
  const lowArrows = joinKeys(of('STEER_TOWARD_LOW'))
  const horizontal = orientation.movement === 'left' || orientation.movement === 'right'
  return {
    steerHigh: horizontal ? highArrows : `${highArrows}/D`,
    steerLow: horizontal ? lowArrows : `${lowArrows}/A`,
    forward: horizontal ? `W eller ${fwdArrows}/D` : `W eller ${fwdArrows}`,
    backward: horizontal ? `S eller ${backArrows}/A` : `S eller ${backArrows}`,
    flat: '␣',
  }
}

const HINT_LETTER = {
  KeyW: 'W',
  KeyA: 'A',
  KeyS: 'S',
  KeyD: 'D',
  KeyQ: 'Q',
  KeyE: 'E',
  Space: '␣',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Digit0: '0',
  Numpad0: '0',
}
const HINT_P1 = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space']
const HINT_P2 = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Digit0', 'Numpad0']

/** Korta tangenttips som matchar keyToIntent. buy/sell/levUp/levDown är samma avsikter som glyphs. */
export function controlHints(orientation, player = '1p') {
  const codes = player === 'p1' ? HINT_P1 : player === 'p2' ? HINT_P2 : HINT_P1.concat(HINT_P2)
  const bucket = { buy: [], sell: [], levUp: [], levDown: [], flat: [] }
  const seen = new Set()
  for (const code of codes) {
    const action = intentToAction(keyToIntent(code, orientation))
    const letter = HINT_LETTER[code]
    if (!action || !bucket[action] || !letter || seen.has(action + letter)) continue
    seen.add(action + letter)
    bucket[action].push(letter)
  }
  const g = glyphs(orientation)
  return {
    ...g,
    buy: bucket.buy.join('/'),
    sell: bucket.sell.join('/'),
    levUp: bucket.levUp.join('/'),
    levDown: bucket.levDown.join('/'),
    flat: bucket.flat.join('/'),
  }
}

export function instructionText(orientation, translate) {
  const g = glyphs(orientation)
  const sell = translate('btn.sell')
  const flat = translate('btn.flat')
  const buy = translate('btn.buy')
  const steer = translate('instr.steer', { high: g.steerHigh, low: g.steerLow, sell, flat, buy })
  const space = translate('instr.space', { flat })
  const forward = translate('instr.forward', { keys: g.forward })
  const backward = translate('instr.backward', { keys: g.backward })
  const risk = translate('instr.risk')
  return `${steer} · ${space} · ${forward} · ${backward}. ${risk}`
}

export function createSteering(orientation) {
  return {
    orientation,
    stepSide,
    keyToIntent: (code) => keyToIntent(code, orientation),
    wheelToIntent,
    applyIntent,
    travel: travelVector(orientation),
  }
}

export const MODE_ORDER = ['line', 'raket', 'akademin', 'rabbit']

export function modeFromHash(hash) {
  const raw = String(hash || '').replace(/^#/, '').split('?')[0]
  const h = raw.replace(/-2p$/, '')
  if (h === 'tra' || h === 'trade-rider-academy') return 'tra'
  if (h === '4' || h.includes('rabbit')) return 'rabbit'
  if (h === '3' || h.includes('academy') || h.includes('akademin')) return 'akademin'
  if (h === '2' || h.includes('racex') || h.includes('raket')) return 'raket'
  return 'line'
}

export function hashForView(view) {
  if (view === 'rabbit') return 'rabbit-hole'
  if (view === 'raket') return 'racex'
  if (view === 'akademin') return 'academy'
  if (view === 'tra') return 'tra'
  return 'trade-rider'
}

/** Ett ställe för klick (1–4), tangent och hash, så testerna inte beror på DOM. */
export function selectMode({ via, value } = {}) {
  if (via === 'click' || via === 'index') {
    const n = Number(value)
    const i = n >= 1 && n <= MODE_ORDER.length ? n - 1 : n
    return MODE_ORDER[i] || null
  }
  if (via === 'key') {
    const digit = String(value || '').replace(/^Digit|^Numpad/, '')
    if (digit === '1') return 'line'
    if (digit === '2') return 'raket'
    if (digit === '3') return 'akademin'
    if (digit === '4') return 'rabbit'
    return null
  }
  if (via === 'hash') return modeFromHash(value)
  return null
}
