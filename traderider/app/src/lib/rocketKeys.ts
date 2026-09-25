import type { Command } from './keys'

/** Raket-läget: KÖP till höger, SÄLJ till vänster. Övriga tangenter som den mörka desken. */
export function commandFromRocketKey(key: string): Command | null {
  switch (key) {
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'buy'
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'sell'
    case 'f':
    case 'F':
      return 'flat'
    case '[':
      return 'lev_down'
    case ']':
      return 'lev_up'
    case ' ':
    case 'Spacebar':
      return 'pause'
    default:
      return null
  }
}
