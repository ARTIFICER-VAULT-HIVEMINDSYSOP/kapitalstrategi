/**
 * Tangenter → avsikter via orientation.js.
 * W = FORWARD (öka hävstång), S = BACKWARD (minska hävstång), i varje riktning.
 * Pilar längs rörelsen gör samma sak. Den vinkelräta axeln tar ett steg SÄLJ ↔ FLAT ↔ KÖP.
 * Pilar vinner om en kod skulle kunna betyda två saker: arrowMap läses före WASD.
 * Mellanslag = FLAT, utom när fokus ligger i fält, knapp eller länk.
 */
import { MODES, keyToIntent, intentToAction, controlHints } from './orientation.js'

export const KEY_SCHEME = 'relative'

export function isTypingTarget(el) {
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el.isContentEditable
}

export function isSpaceControl(el) {
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  return isTypingTarget(el) || tag === 'BUTTON' || tag === 'A'
}

const GROUP = {
  KeyW: 1,
  KeyA: 1,
  KeyS: 1,
  KeyD: 1,
  KeyQ: 1,
  KeyE: 1,
  Space: 1,
  ArrowUp: 2,
  ArrowDown: 2,
  ArrowLeft: 2,
  ArrowRight: 2,
  Digit0: 2,
  Numpad0: 2,
  KeyP: 0,
  KeyR: 0,
}

export function keyAction(e, mode = '1p', orientation = MODES.trendRider.orientation) {
  if (!e || e.ctrlKey || e.metaKey || e.altKey) return null
  if (e.code === 'Space' && isSpaceControl(e.target)) return null
  if (isTypingTarget(e.target)) return null
  if (e.code === 'KeyP') return { action: 'pause', intent: null, player: 0 }
  if (e.code === 'KeyR') return { action: 'reset', intent: null, player: 0 }
  const intent = keyToIntent(e.code, orientation)
  if (!intent) return null
  const group = GROUP[e.code] ?? 1
  const player = group === 0 ? 0 : mode === '2p' ? group : 1
  return { action: intentToAction(intent), intent, player }
}

export const HINTS = {
  '1p': controlHints(MODES.trendRider.orientation, '1p'),
  p1: controlHints(MODES.trendRider.orientation, 'p1'),
  p2: controlHints(MODES.trendRider.orientation, 'p2'),
}

export const PREVENT_DEFAULT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

if (typeof window !== 'undefined') {
  window.__trKeyAction = (e, mode) => keyAction(e, mode, MODES.trendRider.orientation)
}
