/**
 * Tre lägen — shared RSI for the engine (sits next to bollinger.ts).
 * Wilder RSI, period 14, standard levels 70 (överköpt) / 30 (översålt).
 * Neither c718de5 nor the old NVDA Rider build shipped an RSI function; this is the single
 * shared implementation all modes should use (period/levels are the only parameters).
 */
export const RSI_PERIOD = 14
export const RSI_OVERBOUGHT = 70
export const RSI_OVERSOLD = 30

export function rsi(closes: number[], period = RSI_PERIOD): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null)
  if (closes.length <= period) return out
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) gain += d
    else loss -= d
  }
  let avgG = gain / period
  let avgL = loss / period
  const val = () => (avgL === 0 ? (avgG === 0 ? 50 : 100) : 100 - 100 / (1 + avgG / avgL))
  out[period] = val()
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgG = (avgG * (period - 1) + Math.max(0, d)) / period
    avgL = (avgL * (period - 1) + Math.max(0, -d)) / period
    out[i] = val()
  }
  return out
}

/** RSI at a (fractional) desk progress, interpolated like sampleBand. */
export function sampleRsi(series: (number | null)[], progress: number): number | null {
  if (series.length === 0) return null
  const i = Math.max(0, Math.min(series.length - 1, Math.floor(progress)))
  const j = Math.min(series.length - 1, i + 1)
  const a = series[i]
  const b = series[j]
  if (a == null) return b ?? null
  if (b == null) return a
  const t = Math.min(1, Math.max(0, progress - i))
  return a + (b - a) * t
}

export function rsiZone(v: number | null): 'overbought' | 'oversold' | 'neutral' | 'none' {
  if (v == null) return 'none'
  if (v >= RSI_OVERBOUGHT) return 'overbought'
  if (v <= RSI_OVERSOLD) return 'oversold'
  return 'neutral'
}
