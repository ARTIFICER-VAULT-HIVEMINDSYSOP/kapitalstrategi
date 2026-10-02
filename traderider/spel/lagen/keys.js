/**
 * Gemensam tangentplan för NVDA Rider, Raket och Akademin (1P och 2P).
 * Byt hela planen med EN rad: KEY_SCHEME.
 *   direction (aktivt beslut): pilar följer riktning.
 *     ↑ / W = ett steg mot köp, ↓ / S = ett steg mot sälj (SÄLJ ↔ stängd ↔ KÖP, styrmotor.js).
 *     → / D = öka hävstång, ← / A = minska hävstång.
 *   sideways (ej aktiv): → / D = köp, ← / A = sälj, ↑ / W = öka, ↓ / S = minska.
 *   Mellanslag / 0 / numpad 0 = stäng (flat). P = paus. R = börja om.
 * 1P: alla tangenter styr samma spelare. 2P: spelare 1 = WASD + mellanslag, spelare 2 = pilar + 0.
 * P och R gäller båda (player 0). Inga tangenter när fokus ligger i ett textfält.
 * NVDA Rider-motorn (routes-*.js) anropar window.__trKeyAction, alltså samma tabell.
 */
export const KEY_SCHEME = 'direction'

const SCHEMES = {
  direction: {
    KeyW: { action: 'buy', group: 1 },
    ArrowUp: { action: 'buy', group: 2 },
    KeyS: { action: 'sell', group: 1 },
    ArrowDown: { action: 'sell', group: 2 },
    KeyA: { action: 'levDown', group: 1 },
    ArrowLeft: { action: 'levDown', group: 2 },
    KeyD: { action: 'levUp', group: 1 },
    ArrowRight: { action: 'levUp', group: 2 },
    Space: { action: 'flat', group: 1 },
    Digit0: { action: 'flat', group: 2 },
    Numpad0: { action: 'flat', group: 2 },
    KeyP: { action: 'pause', group: 0 },
    KeyR: { action: 'reset', group: 0 },
  },
  sideways: {
    KeyD: { action: 'buy', group: 1 },
    ArrowRight: { action: 'buy', group: 2 },
    KeyA: { action: 'sell', group: 1 },
    ArrowLeft: { action: 'sell', group: 2 },
    KeyW: { action: 'levUp', group: 1 },
    ArrowUp: { action: 'levUp', group: 2 },
    KeyS: { action: 'levDown', group: 1 },
    ArrowDown: { action: 'levDown', group: 2 },
    Space: { action: 'flat', group: 1 },
    Digit0: { action: 'flat', group: 2 },
    Numpad0: { action: 'flat', group: 2 },
    KeyP: { action: 'pause', group: 0 },
    KeyR: { action: 'reset', group: 0 },
  },
}

const GLYPH = {
  direction: {
    '1p': { buy: 'W/↑', sell: 'S/↓', levDown: 'A/←', levUp: 'D/→', flat: '␣/0' },
    p1: { buy: 'W', sell: 'S', levDown: 'A', levUp: 'D', flat: '␣' },
    p2: { buy: '↑', sell: '↓', levDown: '←', levUp: '→', flat: '0' },
  },
  sideways: {
    '1p': { buy: 'D/→', sell: 'A/←', levDown: 'S/↓', levUp: 'W/↑', flat: '␣/0' },
    p1: { buy: 'D', sell: 'A', levDown: 'S', levUp: 'W', flat: '␣' },
    p2: { buy: '→', sell: '←', levDown: '↓', levUp: '↑', flat: '0' },
  },
}

export const KEYMAP = SCHEMES[KEY_SCHEME]
export const HINTS = GLYPH[KEY_SCHEME]

export function isTypingTarget(el) {
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el.isContentEditable
}

/** → { action, player } | null. player: 1 eller 2 (i 1P alltid 1), 0 = gemensam (paus/omstart). */
export function keyAction(e, mode = '1p') {
  if (!e || e.ctrlKey || e.metaKey || e.altKey) return null
  if (isTypingTarget(e.target)) return null
  const hit = KEYMAP[e.code]
  if (!hit) return null
  const player = hit.group === 0 ? 0 : mode === '2p' ? hit.group : 1
  return { action: hit.action, player }
}

/** Tangenter där sidan annars skulle scrolla. */
export const PREVENT_DEFAULT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

if (typeof window !== 'undefined') window.__trKeyAction = (e, mode) => keyAction(e, mode)
