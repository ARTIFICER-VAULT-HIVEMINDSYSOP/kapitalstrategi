import fallbackFile from '../data/nvda-fallback.json'
import type { Candle, NvdaPayload } from './types'

export const FALLBACK_LABEL = 'Medföljande kursserie'

type YahooQuote = {
  open?: Array<number | null>
  high?: Array<number | null>
  low?: Array<number | null>
  close?: Array<number | null>
  volume?: Array<number | null>
}

type YahooPayload = {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: { quote?: YahooQuote[] }
    }> | null
  }
}

/** Parser for a chart payload. The desk never calls a live host. */
export function parseYahooChart(payload: unknown): Candle[] {
  const result = (payload as YahooPayload).chart?.result?.[0]
  const timestamps = result?.timestamp
  const quote = result?.indicators?.quote?.[0]
  if (!timestamps || !quote) throw new Error('chart_empty')

  const candles: Candle[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i]
    const h = quote.high?.[i]
    const l = quote.low?.[i]
    const c = quote.close?.[i]
    const v = quote.volume?.[i]
    if (o == null || h == null || l == null || c == null || v == null) continue
    if (![o, h, l, c].every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)) continue
    candles.push({ t: timestamps[i], o, h, l, c, v })
  }
  if (candles.length < 20) throw new Error('chart_short')
  return candles
}

export function fallbackPayload(): NvdaPayload {
  return {
    source: 'fallback',
    fallback: true,
    label: fallbackFile.label || FALLBACK_LABEL,
    symbol: 'NVDA',
    interval: fallbackFile.interval,
    candles: fallbackFile.candles,
  }
}

/** Bundled snapshot only. No live request. */
export function loadNvdaOffline(): Promise<NvdaPayload> {
  return Promise.resolve(fallbackPayload())
}

export function loadNvdaForDesk(_offline?: boolean, _fetchImpl?: typeof fetch): Promise<NvdaPayload> {
  return loadNvdaOffline()
}

export function loadNvdaForStatic(_fetchImpl?: typeof fetch): Promise<NvdaPayload> {
  return loadNvdaOffline()
}

export function loadNvdaCandles(_fetchImpl?: typeof fetch): Promise<NvdaPayload> {
  return loadNvdaOffline()
}
