import { expect, test } from 'vitest'
import {
  JUMP_SEC,
  advancePhase,
  bandTouch,
  bollingerPoint,
  chaseCamera,
  edgeSignal,
  fallBand,
  fallRate,
  gamepadIntent,
  homeLayout,
  jumpPose,
  jumpProgress,
  macdCross,
  macdPoint,
  movementIndicators,
  priceOnShaft,
  shaftBorder,
  shaftRegion,
  splitLayout,
  standPoint,
} from '../../spel/lagen/rabbit.js'

test('starten går från hemma via hopp till loppet', () => {
  expect(advancePhase('home', 'start')).toBe('jump')
  expect(advancePhase('jump', 'landed')).toBe('race')
  expect(advancePhase('race', 'start')).toBe('race')
  expect(jumpProgress(0, false)).toBe(0)
  expect(jumpProgress(JUMP_SEC, false)).toBe(1)
  expect(jumpProgress(0.1, true)).toBe(1)
})

test('ovan jord står kaninen över hålet och köp ligger till höger', () => {
  const layout = homeLayout(900, 700)
  expect(layout.groundY).toBeLessThan(700)
  const mid = standPoint('flat', layout)
  const left = standPoint('sell', layout)
  const right = standPoint('buy', layout)
  expect(mid.y).toBeLessThan(layout.hole.y)
  expect(left.x).toBeLessThan(layout.hole.x)
  expect(right.x).toBeGreaterThan(layout.hole.x)
  const landed = jumpPose(1, left, layout.hole)
  expect(landed.done).toBe(true)
  expect(landed.y).toBeGreaterThan(left.y)
  expect(landed.x).toBeCloseTo(layout.hole.x)
})

test('indikatorerna följer sidläge, fallfart och reducerad rörelse', () => {
  const flat = movementIndicators({ side: 'flat', leverage: 1, width: 800 })
  const buy = movementIndicators({ side: 'buy', leverage: 4, width: 800 })
  const sell = movementIndicators({ side: 'sell', leverage: 1, width: 800, reduced: true })
  expect(flat.decision).toBe('flat')
  expect(Math.abs(flat.offset)).toBeLessThan(0.001)
  expect(buy.decision).toBe('buy')
  expect(buy.offset).toBeGreaterThan(0)
  expect(buy.x).toBeGreaterThan(flat.x)
  expect(buy.fallRate).toBeGreaterThan(flat.fallRate)
  expect(fallBand(buy.fallRate)).toBe('fast')
  expect(fallBand(flat.fallRate)).toBe('slow')
  expect(sell.decision).toBe('sell')
  expect(sell.offset).toBeLessThan(0)
  expect(sell.fallRate).toBe(0)
  expect(fallRate(3, true)).toBe(0)
  expect(splitLayout(400, 1)).toEqual([{ player: 1, left: 0, width: 400 }])
  expect(splitLayout(400, 2)).toEqual([
    { player: 1, left: 0, width: 200 },
    { player: 2, left: 200, width: 200 },
  ])
})

test('Bollingerkanterna är tunnelns väggar och hålet ligger utanför', () => {
  const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 4) * 4)
  const band = bollingerPoint(closes, 24)
  expect(band).not.toBeNull()
  const narrow = shaftBorder(800, { sma: 100, upper: 101, lower: 99 })
  const wide = shaftBorder(800, { sma: 100, upper: 112, lower: 88 })
  expect(narrow.hasBand).toBe(true)
  expect(wide.buy - wide.sell).toBeGreaterThan(narrow.buy - narrow.sell)
  expect(shaftRegion(narrow.flat, narrow)).toBe('tunnel')
  expect(shaftRegion(narrow.buy, narrow)).toBe('border')
  expect(shaftRegion(narrow.sell, narrow)).toBe('border')
  expect(shaftRegion(narrow.buy + 30, narrow)).toBe('hole')
  const buy = movementIndicators({ side: 'buy', width: 800, lanes: narrow })
  const sell = movementIndicators({ side: 'sell', width: 800, lanes: narrow })
  expect(buy.x).toBeCloseTo(narrow.buy)
  expect(sell.x).toBeCloseTo(narrow.sell)
  expect(priceOnShaft(band!.upper, band, narrow)).toBeCloseTo(narrow.buy)
  expect(priceOnShaft(band!.lower, band, narrow)).toBeCloseTo(narrow.sell)
  expect(shaftRegion(priceOnShaft(band!.sma, band, narrow)!, narrow)).toBe('tunnel')
  expect(bandTouch(band!.upper, band)).toBe('upper')
  expect(bandTouch(band!.lower, band)).toBe('lower')
  expect(bandTouch(band!.sma, band)).toBeNull()
  expect(edgeSignal(null, 'upper')).toBe('upper')
  expect(edgeSignal('upper', 'near-upper')).toBeNull()
  expect(edgeSignal('upper', 'lower')).toBe('lower')
  const fallback = shaftBorder(800, null)
  expect(fallback.hasBand).toBe(false)
  expect(fallback.flat).toBeCloseTo((fallback.buy + fallback.sell) / 2)
})

test('RSI och MACD är jämförelse, och kameran följer Form A', () => {
  expect(macdCross(-0.2, 0.1)).toBe('up')
  expect(macdCross(0.2, -0.1)).toBe('down')
  expect(macdCross(0.2, 0.1)).toBeNull()
  const wave = Array.from({ length: 60 }, (_, i) => 50 + Math.sin(i / 3) * 8)
  const macd = macdPoint(wave, 59)
  expect(macd.hist).not.toBeNull()
  expect(chaseCamera({ pan: 4, roll: 1 }, 0.5, 1, true)).toEqual({ pan: 0, roll: 0 })
  const chased = chaseCamera({ pan: 0, roll: 0 }, 0.5, 0.4, false)
  expect(chased.pan).toBeLessThan(0)
  expect(chased.roll).toBeGreaterThan(0)
  expect(gamepadIntent(null)).toBeNull()
  expect(gamepadIntent({ axes: [0, -0.8], buttons: [] })?.move).toBe('FORWARD')
  expect(gamepadIntent({ axes: [0, 0.8], buttons: [] })?.move).toBe('BACKWARD')
  expect(gamepadIntent({ axes: [0.8, 0], buttons: [] })?.move).toBe('STEER_TOWARD_HIGH')
  expect(gamepadIntent({ axes: [-0.8, 0], buttons: [] })?.move).toBe('STEER_TOWARD_LOW')
  expect(gamepadIntent({ axes: [0, 0], buttons: [{ pressed: true }] })?.confirm).toBe(true)
  expect(gamepadIntent({ axes: [0, -0.1], buttons: [] })).toBeNull()
})
