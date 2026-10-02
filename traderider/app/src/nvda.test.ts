import { expect, test } from 'vitest'
import { fallbackPayload, loadNvdaCandles, loadNvdaForDesk, loadNvdaForStatic, parseYahooChart } from './lib/loadNvda'

test('bundled series is labelled and is not fetched live', async () => {
  const payload = fallbackPayload()
  expect(payload.fallback).toBe(true)
  expect(payload.source).toBe('fallback')
  expect(payload.label).toBe('Medföljande kursserie')
  expect(payload.symbol).toBe('NVDA')
  expect(payload.candles.length).toBeGreaterThanOrEqual(20)
  expect(payload.candles[0]?.c).toBeGreaterThan(0)

  let called = false
  const fetchImpl = async () => {
    called = true
    return Response.json({ chart: { result: [] } })
  }
  const fromCandles = await loadNvdaCandles(fetchImpl)
  const fromStatic = await loadNvdaForStatic(fetchImpl)
  const fromDesk = await loadNvdaForDesk(false, fetchImpl)
  expect(called).toBe(false)
  expect(fromCandles.source).toBe('fallback')
  expect(fromStatic.candles.length).toBe(payload.candles.length)
  expect(fromDesk.fallback).toBe(true)
})

test('offline try package uses the bundled candles and does not fetch', async () => {
  let called = false
  const payload = await loadNvdaForDesk(true, async () => {
    called = true
    throw new Error('should not fetch')
  })
  expect(called).toBe(false)
  expect(payload.fallback).toBe(true)
  expect(payload.source).toBe('fallback')
  expect(payload.candles.length).toBeGreaterThanOrEqual(20)
})

const chart = {
  chart: {
    result: [
      {
        timestamp: Array.from({ length: 20 }, (_, i) => 1_700_000_000 + i * 3600),
        indicators: {
          quote: [
            {
              open: Array.from({ length: 20 }, () => 100),
              high: Array.from({ length: 20 }, () => 101),
              low: Array.from({ length: 20 }, () => 99),
              close: Array.from({ length: 20 }, (_, i) => 100 + i),
              volume: Array.from({ length: 20 }, () => 10),
            },
          ],
        },
      },
    ],
  },
}

test('chart payload parses into candles', () => {
  const candles = parseYahooChart(chart)
  expect(candles).toHaveLength(20)
  expect(candles[19]?.c).toBe(119)
})
