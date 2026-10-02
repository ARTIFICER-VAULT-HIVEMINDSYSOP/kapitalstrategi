/**
 * RSI(14) enligt Wilder, på stängningskurser. Ren funktion utan DOM (enhetstestad i test/rsi.test.mjs).
 * Returnerar en lista lika lång som indata. Index utan tillräckligt med data (eller med ogiltig kurs) blir null,
 * så att panelen kan visa «saknas» i stället för att hitta på ett värde.
 */
export const RSI_PERIOD = 14
export const RSI_HIGH = 70
export const RSI_LOW = 30

export function rsi(closes, period = RSI_PERIOD) {
  const n = Array.isArray(closes) ? closes.length : 0
  const out = new Array(n).fill(null)
  if (!Number.isInteger(period) || period < 1 || n <= period) return out
  let avgGain = 0
  let avgLoss = 0
  let seeded = 0
  // Hitta första sammanhängande sträckan med giltiga kurser; ogiltig kurs nollställer uppbyggnaden.
  for (let i = 1; i < n; i++) {
    const a = closes[i - 1]
    const b = closes[i]
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0)) {
      avgGain = 0
      avgLoss = 0
      seeded = 0
      continue
    }
    const ch = b - a
    const gain = ch > 0 ? ch : 0
    const loss = ch < 0 ? -ch : 0
    if (seeded < period) {
      avgGain += gain
      avgLoss += loss
      seeded++
      if (seeded === period) {
        avgGain /= period
        avgLoss /= period
        out[i] = value(avgGain, avgLoss)
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      out[i] = value(avgGain, avgLoss)
    }
  }
  return out
}

function value(g, l) {
  if (g === 0 && l === 0) return 50
  if (l === 0) return 100
  return 100 - 100 / (1 + g / l)
}

export function rsiZone(v) {
  if (v == null || !Number.isFinite(v)) return 'saknas'
  if (v >= RSI_HIGH) return 'overkopt'
  if (v <= RSI_LOW) return 'oversalt'
  return 'neutral'
}

/** RSI på hela periodens candles, avläst vid spårets (nedsamplade) punkter via tidsstämpel. */
export function rsiAtPoints(candles, points, period = RSI_PERIOD) {
  const closes = (candles ?? []).map((c) => (c && Number.isFinite(c.c) ? c.c : NaN))
  const full = rsi(closes, period)
  const byT = new Map()
  ;(candles ?? []).forEach((c, i) => c && byT.set(c.t, full[i]))
  return (points ?? []).map((p) => {
    const v = byT.get(p.t)
    return v === undefined ? null : v
  })
}
