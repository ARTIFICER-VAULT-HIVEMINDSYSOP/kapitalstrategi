import { expect, test } from 'vitest'
import {
  JUMP_SEC,
  advancePhase,
  fallBand,
  fallRate,
  homeLayout,
  jumpPose,
  jumpProgress,
  movementIndicators,
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
