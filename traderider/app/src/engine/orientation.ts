/**
 * Typad ingång till samma styrmotor som Pages kör (`traderider/spel/lagen/orientation.js`).
 * En framtida 90-graders vridning är ett nytt `movement`-värde, inte ny logik.
 */
export type Movement = 'right' | 'left' | 'up' | 'down'
export type HighPriceSide = 'up' | 'down' | 'right' | 'left'
export type Intent = 'FORWARD' | 'BACKWARD' | 'STEER_TOWARD_HIGH' | 'STEER_TOWARD_LOW' | 'FLAT'

export interface Orientation {
  movement: Movement
  highPriceSide?: HighPriceSide
}

export {
  INTENTS,
  MODES,
  travelVector,
  arrowMap,
  keyToIntent,
  wheelToIntent,
  intentToAction,
  applyIntent,
  glyphs,
  instructionText,
  createSteering,
  modeFromHash,
  hashForView,
} from '../../../spel/lagen/orientation.js'
