/**
 * Samma formler för den historiska banan och live.
 * RSI är lagen/rsi.js (Wilder, period 14).
 * Bollinger är populationens standardavvikelse, period 20, k = 2,
 * samma definition som traderider/app/src/lib/bollinger.ts.
 * SMA, EMA, MACD och ATR räknas här och anropas med samma funktion på båda serierna.
 */
import { rsi as wilderRsi, RSI_PERIOD } from '../lagen/rsi.js'

export { RSI_PERIOD }

export function rsi(closes, period = RSI_PERIOD) {
  return wilderRsi(closes, period)
}

export function sma(values, period) {
  const out = new Array(values.length).fill(null)
  if (!Number.isInteger(period) || period < 1) return out
  let sum = 0
  let filled = 0
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (!Number.isFinite(value)) {
      sum = 0
      filled = 0
      continue
    }
    sum += value
    filled += 1
    if (filled > period) {
      const prev = values[i - period]
      if (Number.isFinite(prev)) sum -= prev
      filled = period
    }
    if (filled === period) out[i] = sum / period
  }
  return out
}

/** EMA med multiplikator 2/(period+1). Första värdet är SMA över den första perioden. */
export function ema(values, period) {
  const out = new Array(values.length).fill(null)
  if (!Number.isInteger(period) || period < 1 || values.length < period) return out
  let seed = 0
  for (let i = 0; i < period; i++) {
    if (!Number.isFinite(values[i])) return out
    seed += values[i]
  }
  let prev = seed / period
  out[period - 1] = prev
  const k = 2 / (period + 1)
  for (let i = period; i < values.length; i++) {
    if (!Number.isFinite(values[i]) || prev == null) {
      prev = null
      continue
    }
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function bollinger(closes, period = 20, k = 2) {
  const out = closes.map(() => null)
  if (period < 2) return out
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0
    let ok = true
    for (let j = i - period + 1; j <= i; j++) {
      if (!Number.isFinite(closes[j])) ok = false
      else sum += closes[j]
    }
    if (!ok) continue
    const mid = sum / period
    let varSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - mid
      varSum += d * d
    }
    const stdev = Math.sqrt(varSum / period)
    out[i] = { sma: mid, stdev, upper: mid + k * stdev, lower: mid - k * stdev }
  }
  return out
}

export function macd(closes, fast = 12, slow = 26, signalPeriod = 9) {
  const fastE = ema(closes, fast)
  const slowE = ema(closes, slow)
  const line = closes.map((_, i) => (fastE[i] == null || slowE[i] == null ? null : fastE[i] - slowE[i]))
  const signal = new Array(closes.length).fill(null)
  const first = line.findIndex((value) => value != null)
  if (first >= 0) {
    const tail = line.slice(first)
    const sigTail = ema(tail, signalPeriod)
    for (let i = 0; i < sigTail.length; i++) signal[first + i] = sigTail[i]
  }
  const histogram = line.map((value, i) => (value == null || signal[i] == null ? null : value - signal[i]))
  return { line, signal, histogram }
}

/** Wilder ATR. True range mot föregående stängning, sedan utjämning (period-1). */
export function atr(bars, period = 14) {
  const out = new Array(bars.length).fill(null)
  if (!Array.isArray(bars) || bars.length <= period || period < 1) return out
  const trs = bars.map((bar, i) => {
    if (i === 0) return bar.h - bar.l
    const prev = bars[i - 1].c
    return Math.max(bar.h - bar.l, Math.abs(bar.h - prev), Math.abs(bar.l - prev))
  })
  let sum = 0
  for (let i = 1; i <= period; i++) sum += trs[i]
  let avg = sum / period
  out[period] = avg
  for (let i = period + 1; i < bars.length; i++) {
    avg = (avg * (period - 1) + trs[i]) / period
    out[i] = avg
  }
  return out
}

export function indicatorPack(bars) {
  const closes = (bars || []).map((bar) => bar.c)
  const bands = bollinger(closes)
  const macdPack = macd(closes)
  return {
    rsi: rsi(closes),
    sma: sma(closes, 20),
    ema: ema(closes, 20),
    bollinger: bands,
    macd: macdPack,
    atr: atr(bars),
  }
}

export function lastNumber(series) {
  if (!series) return null
  for (let i = series.length - 1; i >= 0; i--) {
    const value = series[i]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (value && typeof value === 'object' && Number.isFinite(value.sma)) return value.sma
  }
  return null
}
