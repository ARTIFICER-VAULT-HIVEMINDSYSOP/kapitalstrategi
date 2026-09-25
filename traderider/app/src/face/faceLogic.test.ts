import { describe, expect, it } from 'vitest'
import { applyOverlay, baseExpr, computeIndicators, FaceDriver, healthTier, riskFlags, type FaceInput } from './faceLogic'

const flat = (n: number, v = 100) => Array.from({ length: n }, () => v)
const inp = (o: Partial<FaceInput>): FaceInput => ({
  pnl: 0, basis: 1000, side: 'flat', leverage: 1, maxLeverage: 4, closes: flat(60), index: 59, price: 100, phase: 'ride', ...o,
})

describe('face health tiers', () => {
  it('maps P/L % to five tiers', () => {
    expect([0, -0.9, -1.5, -3, -6, -9].map(healthTier)).toEqual([0, 0, 1, 2, 3, 4])
  })
  it('smiles, grins, celebrates and is rueful', () => {
    expect(baseExpr(0.6, 'ride', false, false).mouth).toBe('smile')
    expect(baseExpr(3, 'ride', false, false).mouth).toBe('grin')
    expect(baseExpr(1, 'done', false, false).celebrate).toBe(true)
    expect(baseExpr(-1, 'done', false, false).mouth).toBe('rueful')
    expect(baseExpr(-9, 'ride', false, false).sweat).toBe(3)
  })
  it('high leverage = strained brows', () => {
    expect(baseExpr(0, 'ride', true, false).brows).toBe('angry')
  })
})

describe('indicator overlay', () => {
  const rising = Array.from({ length: 60 }, (_, i) => 100 + i) // RSI → 100
  it('RSI > 70 while long → rsi alert, not while short', () => {
    const ind = computeIndicators(rising)
    expect(riskFlags(inp({ closes: rising, side: 'long', price: 159 }), ind).rsiAlert).toBe(true)
    expect(riskFlags(inp({ closes: rising, side: 'short', price: 159 }), ind).rsiAlert).toBe(false)
  })
  it('price at/below the lower band while long → band alarm overlay', () => {
    const c = [...flat(40, 100), ...Array.from({ length: 20 }, (_, i) => 100 + (i % 2 ? 1 : -1))]
    const ind = computeIndicators(c)
    const f = riskFlags(inp({ closes: c, side: 'long', price: 90 }), ind)
    expect(f.bandAlarm).toBe(true)
    const e = applyOverlay(baseExpr(0, 'ride', false, false), f, 0)
    expect(e.alert).toBe('band')
    expect(e.eyes).toBe('wide')
  })
  it('bandwidth spike + high leverage → tense + sweat', () => {
    const c = [...Array.from({ length: 45 }, (_, i) => 100 + (i % 2) * 0.2), ...Array.from({ length: 15 }, (_, i) => 100 + (i % 2 ? 6 : -6))]
    const ind = computeIndicators(c)
    const f = riskFlags(inp({ closes: c, leverage: 4, price: 100 }), ind)
    expect(f.volTense).toBe(true)
    expect(f.sweatRisk).toBe(true)
    expect(applyOverlay(baseExpr(0, 'ride', f.highLev, false), f, 0).sweat).toBeGreaterThanOrEqual(2)
  })
})

describe('driver events', () => {
  it('glances toward the new side and flashes on a big candle against the position', () => {
    const d = new FaceDriver()
    const c = [...flat(40, 100), 100, 95]
    d.update(inp({ closes: c, index: 40, side: 'flat' }), 1000)
    const g = d.update(inp({ closes: c, index: 40, side: 'long' }), 1010)
    expect(g.look).toBe(1)
    const hit = d.update(inp({ closes: c, index: 41, side: 'long', price: 95 }), 1100)
    expect(hit.flash).toBeGreaterThan(0)
    expect(hit.eyes).toBe('squeeze')
  })
})
