export const INTENTS: readonly string[]
export const MODES: {
  trendRider: { orientation: { movement: string; highPriceSide?: string }; nameKey: string; hash: string }
  raket: { orientation: { movement: string; highPriceSide?: string }; nameKey: string; hash: string }
  rabbitHole: { orientation: { movement: string; highPriceSide?: string }; nameKey: string; hash: string }
}
export function travelVector(orientation: { movement: string }): { x: number; y: number }
export function arrowMap(orientation: { movement: string; highPriceSide?: string }): Record<string, string>
export function keyToIntent(code: string, orientation: { movement: string; highPriceSide?: string }): string | null
export function wheelToIntent(deltaY: number): string | null
export function intentToAction(intent: string): string | null
export function applyIntent(
  state: { side?: string; leverage?: number },
  intent: string,
): { side: string; leverage: number }
export function glyphs(orientation: { movement: string; highPriceSide?: string }): Record<string, string>
export function instructionText(
  orientation: { movement: string; highPriceSide?: string },
  translate: (key: string, vars?: Record<string, string>) => string,
): string
export function createSteering(orientation: { movement: string; highPriceSide?: string }): {
  stepSide: (side: string, dir: number) => string
  travel: { x: number; y: number }
}
export function modeFromHash(hash: string): string
export function hashForView(view: string): string
