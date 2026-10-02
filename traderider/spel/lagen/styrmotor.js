/**
 * Styrmotor: en gemensam positionscykel för Trade Rider, Raket, Duo och Akademin.
 * Ordning nedifrån och upp: SÄLJ (0) ↔ stängd (1) ↔ KÖP (2).
 * dir > 0 tar ett steg mot KÖP.
 * dir < 0 tar ett steg mot SÄLJ.
 * Ingen rundgång: ↑ på KÖP och ↓ på SÄLJ stannar. Motorn föds på KÖP-rälsen
 * (side buy, flat false). Raket föds stängd (entry null). Ingångens snäpplista
 * börjar i mitten (stängd) tills användaren tar ett steg.
 */
export const CYCLE = ['sell', 'flat', 'buy']
export const ENTRY_SIDE = 'flat'
export const SNAP_TOP_TO_BOTTOM = ['buy', 'flat', 'sell']

export function cycleIndex(side) {
  if (side === 'buy' || side === 'long') return 2
  if (side === 'sell' || side === 'short') return 0
  return 1
}

/** Nästa läge. dir > 0 mot KÖP, dir < 0 mot SÄLJ, 0 lämnar läget. */
export function stepSide(side, dir) {
  const i = cycleIndex(side)
  const d = dir > 0 ? 1 : dir < 0 ? -1 : 0
  return CYCLE[Math.max(0, Math.min(2, i + d))]
}

/**
 * Ett hjul- eller svepdelta. Negativt delta = uppåt (mot KÖP), positivt = nedåt (mot SÄLJ).
 * Noll delta ändrar inget.
 */
export function stepFromDelta(side, delta) {
  if (typeof delta !== 'number' || delta === 0) return CYCLE[cycleIndex(side)]
  return stepSide(side, delta < 0 ? 1 : -1)
}

/** Läs läge ur tåg (flat-flagga) eller raket (entry null = stängd). */
export function readSide(state) {
  if (!state) return 'flat'
  if (state.flat === true) return 'flat'
  if (Object.prototype.hasOwnProperty.call(state, 'entry') && state.entry == null) return 'flat'
  return CYCLE[cycleIndex(state.side)]
}

/** Steg från `from` till `to`, ett index i taget. Tom lista om de redan är lika. */
export function alignSteps(from, to) {
  const a = cycleIndex(from)
  const b = cycleIndex(to)
  const dir = Math.sign(b - a)
  const out = []
  let i = a
  while (i !== b) {
    i += dir
    out.push(CYCLE[i])
  }
  return out
}

/** Ett gest (hjul/svep) får bara ta ett steg. Nästa släpps igen efter `ms`. */
export function createGestureLock(ms = 450) {
  let until = 0
  return {
    allow(now = Date.now()) {
      if (now < until) return false
      until = now + ms
      return true
    },
  }
}

if (typeof window !== 'undefined') window.__trStepSide = (side, dir) => stepSide(side, dir)
