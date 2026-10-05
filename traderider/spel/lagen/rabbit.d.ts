export const JUMP_SEC: number
export const PHASES: readonly string[]
export const CARROT_HP: number
export const HP_MAX: number

export function scrollDelta(fall0: number, fall1: number, reduced?: boolean): number
export function spiralAngle(time: number, reduced?: boolean): number
export function parallaxShift(fall: number, layer: number, reduced?: boolean): number
export function reducedMotion(): boolean
export function markerScreenY(fall: number, reduced?: boolean): number
export function fallRate(leverage: number, reduced?: boolean): number
export function fallBand(rate: number): string
export function advancePhase(phase: string, event: string): string
export function jumpProgress(elapsed: number, reduced?: boolean): number
export function homeLayout(width: number, height: number): {
  groundY: number
  hole: { x: number; y: number; rx: number; ry: number }
}
export function standPoint(side: string, layout: { groundY: number; hole: { x: number; rx: number } }): { x: number; y: number }
export function jumpPose(
  progress: number,
  from: { x: number; y: number },
  hole: { x: number; y: number },
): { x: number; y: number; drop: number; done: boolean }
export function splitLayout(width: number, players: number): { player: number; left: number; width: number }[]
export function lateralRead(side: string, width: number): {
  x: number
  t: number
  offset: number
  lanes: { buy: number; sell: number; flat: number }
}
export function movementIndicators(input?: {
  side?: string
  leverage?: number
  width?: number
  reduced?: boolean
  lanes?: { buy: number; sell: number; flat: number } | null
}): {
  fallRate: number
  band: string
  lateral: number
  offset: number
  decision: string
  x: number
  lanes: { buy: number; sell: number; flat: number }
}
export const BB_PERIOD: number
export const BB_K: number
export const MACD_FAST: number
export const MACD_SLOW: number
export const MACD_SIGNAL: number
export const MARK_HOLD: number
export function closesOf(candles: { c?: number; close?: number }[] | null | undefined): number[]
export function bollingerPoint(
  closes: number[],
  index: number,
  period?: number,
  k?: number,
): { sma: number; stdev: number; upper: number; lower: number } | null
export function bandTouch(close: number | null, band: { upper: number; lower: number } | null): string | null
export function edgeSignal(prev: string | null, next: string | null): string | null
export function macdSeries(closes: number[]): { line: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] }
export function macdCross(prev: number | null, next: number | null): string | null
export function macdPoint(
  closes: number[],
  index: number,
): { line: number | null; signal: number | null; hist: number | null; cross: string | null }
export function marketReading(
  closes: number[],
  index: number,
): {
  band: { sma: number; upper: number; lower: number; stdev: number } | null
  close: number | null
  touch: string | null
  rsi: number | null
  rsiZone: string
  macd: { line: number | null; signal: number | null; hist: number | null; cross: string | null }
}
export function shaftBorder(
  width: number,
  band: { sma?: number; upper: number; lower: number } | null,
): { buy: number; sell: number; flat: number; hasBand: boolean; bandwidth?: number }
export function shaftRegion(x: number, walls: { buy: number; sell: number } | null): string
export function priceOnShaft(
  close: number | null,
  band: { upper: number; lower: number } | null,
  walls: { buy: number; sell: number; flat: number } | null,
): number | null
export function chaseCamera(
  prev: { pan: number; roll: number } | null,
  offset: number,
  dt: number,
  reduced?: boolean,
): { pan: number; roll: number }
export function gamepadIntent(
  pad: { axes?: number[]; buttons?: { pressed?: boolean }[] } | null,
  deadzone?: number,
): { move: string | null; confirm: boolean } | null
export function eatCarrot(hp: number): number
export function candleKind(candle: { o?: number; c?: number; open?: number; close?: number } | null, index?: number): string
export function artLabels(): string[]
export function signLabel(index: number): string
export function projectItem(
  index: number,
  count: number,
  fall: number,
  width: number,
  height: number,
  reduced?: boolean,
): { x: number; y: number; index: number; generation: number; id: string; depth: number; scale: number }
export function passingCarrot(
  fall: number,
  width: number,
  height: number,
  reduced?: boolean,
): { x: number; y: number; kind: string; id: string; reach: number; depth: number; scale: number }
export function applyPickups(
  items: { kind?: string; id?: string; x?: number; y?: number; reach?: number }[],
  rabbit: { x?: number; y?: number },
  hp: number,
  eaten: string[],
): { hp: number; eaten: string[]; gained: number }
export function rabbitSprite(opts?: { eating?: boolean }): { pose: string; fall: string; parts: { kind: string; on?: string; x: number; y: number; id?: string; inner?: string; logo?: boolean; frame?: string; expression?: string }[] }
export function batteryBounds(part: { x: number; y: number }): { left: number; top: number; right: number; bottom: number }
export function torsoBounds(part: { x: number; y: number }): { left: number; top: number; right: number; bottom: number }
export function boundsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean
export function rabbitBodyBox(x: number, y: number, scale?: number): { left: number; top: number; right: number; bottom: number }
export function itemScreenBox(item: { x: number; y: number; scale?: number; kind?: string }): { left: number; top: number; right: number; bottom: number }
export function drawsInFront(item: { x: number; y: number; scale?: number; kind?: string } | null, rabbitX: number, rabbitY: number, scale: number): boolean
export function createRabbit(): {
  show: () => void
  hide: () => void
  freeze: () => void
  resume: () => void
  start: (count?: number) => boolean
  anchor: () => string
  step: (n?: number) => void
  state: () => {
    phase: string
    players: number
    started: boolean
    side: string
    leverage: number
    y: number
    hp: number
    x: number
    buy: number
    sell: number
    flat: number
    markerY: number
    spiral: number
    motion: string
    above: boolean
    jump: number
    indicators: {
      fallRate: number
      band: string
      lateral: number
      offset: number
      decision: string
      x: number
    }
    home: { groundY: number; hole: { x: number; y: number; rx: number; ry: number } }
    riders: { side: string; leverage: number; y: number; result: number | null }[]
  }
}
