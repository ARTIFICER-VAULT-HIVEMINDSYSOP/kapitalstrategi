/**
 * Tre lägen — "status bar face" logic (Doom-style reactive HUD portrait), shared by all three modes.
 * Pure functions + a small stateful driver. Everything here is an educational cue for the practice desk:
 * it reacts to the simulated session P/L and to indicator risk (RSI 14, Bollinger 20/2 bandwidth).
 * No advice, no money wording.
 */
import { rsi as rsiSeries, RSI_OVERBOUGHT, RSI_OVERSOLD, RSI_PERIOD } from '../lib/rsi'

export type FaceSide = 'long' | 'short' | 'flat'
export type FacePhase = 'idle' | 'ride' | 'done'

export type FaceInput = {
  /** Session P/L (realized + unrealized) in the mode's own unit. */
  pnl: number
  /** Basis for P/L %: mode 1/2 = 10 shares × start price, mode 3 = starting practice cash. */
  basis: number
  side: FaceSide
  leverage: number
  maxLeverage: number
  /** Close series the ride runs on (real historical NVDA). */
  closes: number[]
  /** Current candle index into `closes`. */
  index: number
  /** Current mark (may be between candles). */
  price: number
  phase: FacePhase
}

/** Thresholds — documented in the report and in PATCHES/LASMIG. */
export const FACE_T = {
  /** P/L % → health tier (0 healthy … 4 battered), like Doom's health faces. */
  tiers: [-1, -2.5, -5, -8] as const,
  smilePct: 0.5,
  grinPct: 2.5,
  /** Leverage at/above this share of max = strained look (3 of 4, 8 of 10). */
  highLevShare: 0.75,
  bbPeriod: 20,
  bbK: 2,
  /** Price within 0.1 % of the band against the position counts as touching. */
  bandTouch: 0.001,
  /** Bandwidth vs median of the last 40 candles. */
  volSpike: 1.5,
  volElevated: 1.25,
  squeeze: 0.6,
  /** Bandwidth jump vs 5 candles earlier. */
  bwJump: 0.25,
  /** Big candle against the position: |Δ| ≥ max(0.75 %, 2.5 × median |Δ| of the last 30). */
  bigMovePct: 0.75,
  bigMoveMult: 2.5,
  rsiPeriod: RSI_PERIOD,
  rsiHigh: RSI_OVERBOUGHT,
  rsiLow: RSI_OVERSOLD,
}

export function healthTier(pct: number): 0 | 1 | 2 | 3 | 4 {
  const [a, b, c, d] = FACE_T.tiers
  if (pct > a) return 0
  if (pct > b) return 1
  if (pct > c) return 2
  if (pct > d) return 3
  return 4
}

export type Indicators = { rsi: (number | null)[]; bw: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] }

export function computeIndicators(closes: number[]): Indicators {
  const n = FACE_T.bbPeriod
  const bw: (number | null)[] = []
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i + 1 < n) {
      bw.push(null)
      upper.push(null)
      lower.push(null)
      continue
    }
    let s = 0
    for (let j = i - n + 1; j <= i; j++) s += closes[j]
    const m = s / n
    let v = 0
    for (let j = i - n + 1; j <= i; j++) v += (closes[j] - m) ** 2
    const sd = Math.sqrt(v / n)
    upper.push(m + FACE_T.bbK * sd)
    lower.push(m - FACE_T.bbK * sd)
    bw.push(m > 0 ? (2 * FACE_T.bbK * sd) / m : null)
  }
  return { rsi: rsiSeries(closes), bw, upper, lower }
}

function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

export type RiskFlags = {
  rsi: number | null
  bwRatio: number | null
  rsiAlert: boolean
  bandAlarm: boolean
  volTense: boolean
  volElevated: boolean
  squeeze: boolean
  highLev: boolean
  sweatRisk: boolean
}

export function riskFlags(input: FaceInput, ind: Indicators): RiskFlags {
  const i = Math.max(0, Math.min(input.closes.length - 1, Math.floor(input.index)))
  const r = ind.rsi[i] ?? null
  const bw = ind.bw[i] ?? null
  const hist: number[] = []
  for (let j = Math.max(0, i - 40); j < i; j++) {
    const b = ind.bw[j]
    if (b != null) hist.push(b)
  }
  const med = median(hist)
  const bwRatio = bw != null && med > 0 && hist.length >= 5 ? bw / med : null
  const prev = i >= 5 ? ind.bw[i - 5] : null
  const jump = bw != null && prev != null && prev > 0 ? bw / prev - 1 >= FACE_T.bwJump : false
  const up = ind.upper[i]
  const lo = ind.lower[i]
  const p = input.price
  const bandAlarm =
    (input.side === 'long' && lo != null && p <= lo * (1 + FACE_T.bandTouch)) ||
    (input.side === 'short' && up != null && p >= up * (1 - FACE_T.bandTouch))
  const rsiAlert = r != null && ((input.side === 'long' && r > FACE_T.rsiHigh) || (input.side === 'short' && r < FACE_T.rsiLow))
  const squeeze = bwRatio != null && bwRatio <= FACE_T.squeeze
  const volTense = (bwRatio != null && bwRatio >= FACE_T.volSpike) || jump || squeeze
  const volElevated = (bwRatio != null && bwRatio >= FACE_T.volElevated) || jump
  const highLev = input.leverage >= Math.max(2, Math.ceil(input.maxLeverage * FACE_T.highLevShare))
  return { rsi: r, bwRatio, rsiAlert, bandAlarm, volTense, volElevated, squeeze, highLev, sweatRisk: highLev && volElevated }
}

export type Eyes = 'open' | 'wide' | 'blink' | 'happy' | 'squeeze' | 'droop'
export type Brows = 'flat' | 'worried' | 'angry' | 'raised' | 'low'
export type Mouth = 'neutral' | 'smile' | 'grin' | 'frown' | 'grimace' | 'open' | 'rueful' | 'wobbly' | 'celebrate' | 'tight'
export type Alert = 'none' | 'rsi' | 'band' | 'vol'

export type Expr = {
  tier: 0 | 1 | 2 | 3 | 4
  eyes: Eyes
  brows: Brows
  mouth: Mouth
  /** Pupils: -1 left, 0 centre, 1 right. */
  look: -1 | 0 | 1
  sweat: 0 | 1 | 2 | 3
  flash: number
  celebrate: boolean
  alert: Alert
  pct: number
  /** Label for QA/screenshots (not shown in the UI). */
  key: string
}

/** Base expression from the P/L health tier (no events, no overlay). */
export function baseExpr(pct: number, phase: FacePhase, highLev: boolean, rising: boolean): Expr {
  const tier = healthTier(pct)
  const e: Expr = { tier, eyes: 'open', brows: 'flat', mouth: 'neutral', look: 0, sweat: 0, flash: 0, celebrate: false, alert: 'none', pct, key: 'neutral' }
  if (phase === 'done') {
    if (pct > 0) return { ...e, eyes: 'happy', brows: 'raised', mouth: 'celebrate', celebrate: true, key: 'celebrate' }
    if (pct < 0) return { ...e, eyes: 'droop', brows: 'worried', mouth: 'rueful', sweat: tier >= 2 ? 1 : 0, key: 'rueful' }
    return e
  }
  if (tier === 0) {
    if (pct >= FACE_T.grinPct || (rising && pct >= FACE_T.smilePct)) Object.assign(e, { mouth: 'grin', key: 'grin' })
    else if (pct >= FACE_T.smilePct) Object.assign(e, { mouth: 'smile', key: 'smile' })
  } else if (tier === 1) Object.assign(e, { brows: 'worried', key: 'tier1' })
  else if (tier === 2) Object.assign(e, { brows: 'worried', mouth: 'frown', sweat: 1, key: 'tier2' })
  else if (tier === 3) Object.assign(e, { brows: 'worried', mouth: 'wobbly', eyes: 'droop', sweat: 2, key: 'tier3' })
  else Object.assign(e, { brows: 'worried', mouth: 'wobbly', eyes: 'droop', sweat: 3, key: 'tier4' })
  if (highLev) {
    e.brows = 'angry'
    if (e.mouth === 'neutral' || e.mouth === 'frown') e.mouth = 'grimace'
    e.key += '+lev'
  }
  return e
}

/** Indicator overlay: eyes/brows/sweat on top of the health tier. Priority band > rsi > vol. */
export function applyOverlay(e: Expr, f: RiskFlags, t: number): Expr {
  const o = { ...e }
  if (e.celebrate || e.key === 'rueful') return o
  if (f.bandAlarm) {
    Object.assign(o, { eyes: 'wide', brows: 'raised', mouth: 'open', alert: 'band' })
    o.key += '+band'
  } else if (f.rsiAlert) {
    o.brows = 'worried'
    o.alert = 'rsi'
    o.look = Math.floor(t / 600) % 2 === 0 ? -1 : 1
    if (o.eyes === 'open') o.eyes = 'wide'
    o.key += '+rsi'
  } else if (f.volTense) {
    o.brows = o.brows === 'worried' ? 'worried' : 'low'
    if (o.mouth === 'neutral' || o.mouth === 'smile') o.mouth = 'tight'
    o.alert = 'vol'
    o.key += '+vol'
  }
  if (f.sweatRisk) {
    o.sweat = Math.max(o.sweat, 2) as Expr['sweat']
    o.key += '+sweat'
  }
  return o
}

/** Stateful driver: events (switch glance, big candle flash, blink, idle eye shift, rising profit). */
export class FaceDriver {
  private ind: Indicators | null = null
  private closesRef: number[] | null = null
  private lastSide: FaceSide | null = null
  private glanceUntil = 0
  private glanceDir: -1 | 0 | 1 = 0
  private lastIndex = -1
  private flashUntil = 0
  private nextBlink = 0
  private blinkUntil = 0
  private nextShift = 0
  private shiftUntil = 0
  private shiftDir: -1 | 1 = 1
  private pnlHist: { t: number; pct: number }[] = []
  private moveMedian = 0
  flags: RiskFlags | null = null

  update(input: FaceInput, now: number): Expr {
    if (input.closes !== this.closesRef) {
      this.closesRef = input.closes
      this.ind = computeIndicators(input.closes)
      this.lastIndex = -1
      this.pnlHist = []
    }
    const ind = this.ind as Indicators
    const pct = input.basis > 0 ? (input.pnl / input.basis) * 100 : 0
    const idx = Math.max(0, Math.min(input.closes.length - 1, Math.floor(input.index)))

    // rail switch → glance toward the side (buy = right, sell = left)
    if (this.lastSide !== null && input.side !== this.lastSide) {
      this.glanceDir = input.side === 'long' ? 1 : input.side === 'short' ? -1 : 0
      this.glanceUntil = now + 700
    }
    this.lastSide = input.side

    // big candle against the position → flash
    if (idx !== this.lastIndex && idx > 0 && this.lastIndex >= 0) {
      const a = input.closes[idx - 1]
      const b = input.closes[idx]
      const mv = a > 0 ? ((b - a) / a) * 100 : 0
      const moves: number[] = []
      for (let j = Math.max(1, idx - 30); j < idx; j++) moves.push(Math.abs((input.closes[j] - input.closes[j - 1]) / input.closes[j - 1]) * 100)
      this.moveMedian = median(moves)
      const big = Math.abs(mv) >= Math.max(FACE_T.bigMovePct, FACE_T.bigMoveMult * this.moveMedian)
      const against = (input.side === 'long' && mv < 0) || (input.side === 'short' && mv > 0)
      if (big && against && input.phase === 'ride') this.flashUntil = now + 450
    }
    this.lastIndex = idx

    // rising profit (last 1.5 s)
    this.pnlHist.push({ t: now, pct })
    while (this.pnlHist.length && this.pnlHist[0].t < now - 1500) this.pnlHist.shift()
    const rising = this.pnlHist.length > 1 && pct - this.pnlHist[0].pct > 0.15

    const flags = riskFlags(input, ind)
    this.flags = flags
    let e = applyOverlay(baseExpr(pct, input.phase, flags.highLev, rising), flags, now)

    // blink + idle eye shift
    if (!this.nextBlink) this.nextBlink = now + 1500 + Math.random() * 2000
    if (now >= this.nextBlink) {
      this.blinkUntil = now + 140
      this.nextBlink = now + 2600 + Math.random() * 2600
    }
    if (!this.nextShift) this.nextShift = now + 3500
    if (now >= this.nextShift) {
      this.shiftUntil = now + 550
      this.shiftDir = Math.random() < 0.5 ? -1 : 1
      this.nextShift = now + 4000 + Math.random() * 3500
    }
    if (now < this.glanceUntil) e = { ...e, look: this.glanceDir, key: e.key + '+glance' }
    else if (now < this.shiftUntil && e.alert === 'none') e = { ...e, look: this.shiftDir }
    if (now < this.flashUntil) {
      e = { ...e, eyes: 'squeeze', mouth: 'open', flash: (this.flashUntil - now) / 450, key: e.key + '+ouch' }
    }
    if (now < this.blinkUntil && (e.eyes === 'open' || e.eyes === 'wide' || e.eyes === 'droop')) e = { ...e, eyes: 'blink' }
    return e
  }
}
