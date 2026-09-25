/**
 * Traderider Academy — pure learning logic on top of the shared engine
 * (same candles, bollinger(20, 2), rsi(14), deriveQuote slippage, STARTING_CASH practice balance).
 * XP is awarded for learning actions only — never for simulated profit.
 */
import type { Band } from './bollinger'
import { deriveQuote, roundCents, STARTING_CASH } from './market'
import { RSI_OVERBOUGHT, RSI_OVERSOLD } from './rsi'
import type { Candle } from './types'

export const PRACTICE_BALANCE = STARTING_CASH
export const MAX_RISK_PCT = 2
export const RISK_CHOICES = [0.5, 1, 2, 5] as const
export const STOP_SIGMAS = [1, 1.5, 2] as const
export const TP_R_MULTIPLES = [1, 2, 3] as const

export type LessonId = 1 | 2 | 3 | 4
export type XpKey =
  | 'l1_read' | 'l1_risk' | 'l1_size'
  | 'l2_read' | 'l2_bracket' | 'l2_open' | 'l2_closed'
  | 'l3_read' | 'l3_touch' | 'l3_squeeze'
  | 'l4_read' | 'l4_extreme' | 'l4_read_ok'

export const XP_TABLE: Record<XpKey, number> = {
  l1_read: 10, l1_risk: 15, l1_size: 25,
  l2_read: 10, l2_bracket: 15, l2_open: 15, l2_closed: 30,
  l3_read: 10, l3_touch: 25, l3_squeeze: 25,
  l4_read: 10, l4_extreme: 15, l4_read_ok: 30,
}
export const XP_MAX = Object.values(XP_TABLE).reduce((a, b) => a + b, 0)
export const LEVELS = [0, 60, 140, 220] as const

/** Keys that must be earned for a lesson's task to count as done (reading alone does not unlock). */
export const LESSON_DONE: Record<LessonId, XpKey[]> = {
  1: ['l1_risk', 'l1_size'],
  2: ['l2_bracket', 'l2_open', 'l2_closed'],
  3: ['l3_touch', 'l3_squeeze'],
  4: ['l4_extreme', 'l4_read_ok'],
}

export function xpTotal(earned: Set<XpKey>): number {
  let t = 0
  for (const k of earned) t += XP_TABLE[k]
  return t
}

export function levelFor(xp: number): { level: number; from: number; to: number | null } {
  let level = 1
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1
  const from = LEVELS[level - 1]
  const to = level < LEVELS.length ? LEVELS[level] : null
  return { level, from, to }
}

export function lessonDone(id: LessonId, earned: Set<XpKey>): boolean {
  return LESSON_DONE[id].every((k) => earned.has(k))
}

/** Lesson n is open when every earlier lesson's task is done. */
export function lessonUnlocked(id: LessonId, earned: Set<XpKey>): boolean {
  for (let i = 1; i < id; i++) if (!lessonDone(i as LessonId, earned)) return false
  return true
}

export type Side = 'long' | 'short'

/** Stop price k band-sigmas away from the entry, on the losing side. */
export function stopPrice(entry: number, band: Band, sigmas: number, side: Side): number {
  const d = Math.max(0.01, band.stdev * sigmas)
  return roundCents(side === 'long' ? entry - d : entry + d)
}

export function takeProfitPrice(entry: number, stop: number, r: number, side: Side): number {
  const risk = Math.abs(entry - stop)
  return roundCents(side === 'long' ? entry + risk * r : entry - risk * r)
}

/** Whole shares so that a stop-out loses at most riskPct of the balance (also capped at 1× cash). */
export function positionSize(balance: number, riskPct: number, entry: number, stop: number) {
  const perShare = Math.abs(entry - stop)
  const riskBudget = (balance * riskPct) / 100
  if (!(perShare > 0) || !(entry > 0)) return { qty: 0, riskBudget, maxLoss: 0, notional: 0 }
  const qty = Math.max(0, Math.min(Math.floor(riskBudget / perShare), Math.floor(balance / entry)))
  return { qty, riskBudget: roundCents(riskBudget), maxLoss: roundCents(qty * perShare), notional: roundCents(qty * entry) }
}

export function riskAllowed(riskPct: number): boolean {
  return riskPct > 0 && riskPct <= MAX_RISK_PCT
}

export type PracticeTrade = {
  side: Side
  qty: number
  entry: number
  stop: number
  target: number
  openedAt: number
  checkedTo: number
  closed?: { reason: 'stop' | 'target' | 'series_end'; price: number; at: number; pnl: number }
}

/** Opens at the engine's quote (offer + slip for long, bid − slip for short). SL and TP are required. */
export function openPractice(
  candle: Candle, index: number, side: Side, qty: number, stop: number | null, target: number | null,
): PracticeTrade | { error: string } {
  if (stop == null || target == null) return { error: 'Sätt både stop-loss och take-profit innan du öppnar.' }
  if (qty < 1) return { error: 'Positionsstorleken blev 0 aktier. Välj en annan risk eller stopp.' }
  const q = deriveQuote(candle.c)
  const entry = roundCents(side === 'long' ? q.offer + q.slippage : q.bid - q.slippage)
  if (side === 'long' && !(stop < entry && target > entry)) return { error: 'Long: stop under och mål över ingångskursen.' }
  if (side === 'short' && !(stop > entry && target < entry)) return { error: 'Short: stop över och mål under ingångskursen.' }
  return { side, qty, entry, stop, target, openedAt: index, checkedTo: index }
}

/** Walks candles after the last check; stop is checked before target inside one candle (conservative). */
export function advancePractice(t: PracticeTrade, candles: Candle[], upTo: number): PracticeTrade {
  if (t.closed) return t
  const last = Math.min(candles.length - 1, Math.floor(upTo))
  for (let i = t.checkedTo + 1; i <= last; i++) {
    const c = candles[i]
    const hitStop = t.side === 'long' ? c.l <= t.stop : c.h >= t.stop
    const hitTarget = t.side === 'long' ? c.h >= t.target : c.l <= t.target
    if (hitStop || hitTarget) {
      const price = hitStop ? t.stop : t.target
      const pnl = roundCents((t.side === 'long' ? price - t.entry : t.entry - price) * t.qty)
      return { ...t, checkedTo: i, closed: { reason: hitStop ? 'stop' : 'target', price, at: i, pnl } }
    }
  }
  if (last >= candles.length - 1 && last > t.openedAt) {
    const price = candles[candles.length - 1].c
    const pnl = roundCents((t.side === 'long' ? price - t.entry : t.entry - price) * t.qty)
    return { ...t, checkedTo: last, closed: { reason: 'series_end', price, at: last, pnl } }
  }
  return { ...t, checkedTo: Math.max(t.checkedTo, last) }
}

export function percentB(close: number, band: Band): number | null {
  const w = band.upper - band.lower
  return w > 1e-9 ? (close - band.lower) / w : null
}

export function bandwidthPct(band: Band): number {
  return band.sma > 0 ? ((band.upper - band.lower) / band.sma) * 100 : 0
}

/** Squeeze threshold = 25th percentile of the bandwidth over the whole historical series. */
export function squeezeThreshold(bands: (Band | null)[]): number {
  const w = bands.filter((b): b is Band => !!b).map(bandwidthPct).sort((a, b) => a - b)
  if (w.length === 0) return 0
  return w[Math.floor((w.length - 1) * 0.25)]
}

export function isTouch(close: number, band: Band): boolean {
  const pb = percentB(close, band)
  return pb != null && (pb >= 0.95 || pb <= 0.05)
}

export type MarketRead = 'stretched_up' | 'stretched_down' | 'rsi_only'
export const READ_TEXT: Record<MarketRead, string> = {
  stretched_up: 'Sträckt uppåt: kursen vid övre bandet och RSI ≥ 70. Nästa steg brukar vara vila eller återgång mot mittfilen — öva på att inte jaga köp här.',
  stretched_down: 'Sträckt nedåt: kursen vid undre bandet och RSI ≤ 30. Nästa steg brukar vara vila eller återgång mot mittfilen — öva på att inte jaga sälj här.',
  rsi_only: 'RSI är extremt men kursen är inne i korridoren. Signalerna säger olika — vänta på bekräftelse från banden.',
}

export function rsiExtreme(r: number | null): boolean {
  return r != null && (r >= RSI_OVERBOUGHT || r <= RSI_OVERSOLD)
}

export function correctRead(close: number, band: Band, r: number): MarketRead {
  const pb = percentB(close, band) ?? 0.5
  if (r >= RSI_OVERBOUGHT && pb >= 0.8) return 'stretched_up'
  if (r <= RSI_OVERSOLD && pb <= 0.2) return 'stretched_down'
  return 'rsi_only'
}
