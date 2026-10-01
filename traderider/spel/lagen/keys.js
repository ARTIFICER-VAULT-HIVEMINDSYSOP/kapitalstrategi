/**
 * Gemensam tangentplan för NVDA Line och Raket (1P och 2P).
 *   W / ↑  = BUY          S / ↓  = SELL
 *   A / ←  = lägre hävstång   D / →  = högre hävstång
 *   Mellanslag / 0 / numpad 0 = FLAT (stänger positionen)
 *   P = paus/kör (flyttad från mellanslag)   R = börja om
 * 1P: alla tangenter styr samma spelare. 2P: spelare 1 = WASD + mellanslag, spelare 2 = pilar + 0.
 * P och R gäller båda (player 0). Inga tangenter när fokus ligger i ett textfält.
 * NVDA Line-motorns egen onKey (routes-*.js) följer samma tabell i 1P; test/keys.test.mjs kör båda mot tabellen.
 */
export const KEYMAP = {
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
}

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

/** Hintar vid knapparna (1P visar båda, 2P visar spelarens egna). */
export const HINTS = {
  '1p': { buy: 'W/↑', sell: 'S/↓', levDown: 'A/←', levUp: 'D/→', flat: '␣/0 Flat' },
  p1: { buy: 'W', sell: 'S', levDown: 'A', levUp: 'D', flat: '␣ Flat' },
  p2: { buy: '↑', sell: '↓', levDown: '←', levUp: '→', flat: '0 Flat' },
}
