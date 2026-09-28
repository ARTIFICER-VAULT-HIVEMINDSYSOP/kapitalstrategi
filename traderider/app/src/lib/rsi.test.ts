import { describe, expect, it } from 'vitest'
import { rsi, sampleRsi, rsiZone } from './rsi'

describe('rsi', () => {
  it('is null before the period and 100 on a straight rise', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i)
    const r = rsi(closes, 14)
    expect(r[13]).toBeNull()
    expect(r[14]).toBe(100)
  })
  it('stays within 0..100 and zones at 70/30', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5)
    for (const v of rsi(closes)) if (v != null) expect(v >= 0 && v <= 100).toBe(true)
    expect(rsiZone(75)).toBe('overbought')
    expect(rsiZone(25)).toBe('oversold')
    expect(rsiZone(50)).toBe('neutral')
    expect(sampleRsi([null, 40, 60], 1.5)).toBe(50)
  })
})
