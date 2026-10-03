import { INSTRUMENTS, yahooSymbols } from '../../../traderider/spel/gransland/instruments.js'

export const CACHE_TTL_SECONDS = 120
export const BACKOFF_START_MS = 60_000
export const BACKOFF_MAX_MS = 5 * 60_000

const ALLOWED = new Set([
  'https://kapitalstrategi.com',
  'https://www.kapitalstrategi.com',
])

export function allowedYahooSymbols() {
  return yahooSymbols()
}

export function isYahooAllowed(symbol) {
  return allowedYahooSymbols().includes(symbol)
}

export function isCryptoAllowed(symbol) {
  return INSTRUMENTS.some((item) => item.kind === 'crypto' && (item.id === symbol || item.coinbase === symbol))
}

export function corsOrigin(origin) {
  if (!origin || typeof origin !== 'string') return null
  if (ALLOWED.has(origin)) return origin
  try {
    const url = new URL(origin)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (local && (url.protocol === 'http:' || url.protocol === 'https:')) return origin
  } catch {
    return null
  }
  return null
}

export function nextBackoff(previous) {
  if (!previous) return BACKOFF_START_MS
  return Math.min(BACKOFF_MAX_MS, previous * 2)
}

export function normalizeYahooChart(json) {
  const result = json?.chart?.result?.[0]
  if (!result) return []
  const stamps = result.timestamp || []
  const quote = result.indicators?.quote?.[0] || {}
  const bars = []
  for (let i = 0; i < stamps.length; i++) {
    const open = quote.open?.[i]
    const high = quote.high?.[i]
    const low = quote.low?.[i]
    const close = quote.close?.[i]
    if (![open, high, low, close].every(Number.isFinite)) continue
    bars.push({ t: stamps[i] * 1000, o: open, h: high, l: low, c: close })
  }
  return bars
}

export function yahooChartUrl(symbol) {
  const url = new URL('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol))
  url.searchParams.set('interval', '5m')
  url.searchParams.set('range', '5d')
  return url.toString()
}
