import { describe, expect, it } from 'vitest'
import {
  advancePractice, correctRead, levelFor, lessonUnlocked, openPractice, positionSize, riskAllowed,
  squeezeThreshold, xpTotal, XP_MAX, type XpKey,
} from './academy'

const band = { sma: 100, upper: 104, lower: 96, stdev: 2 }

describe('academy', () => {
  it('sizes so a stop-out risks at most the chosen %', () => {
    const s = positionSize(100_000, 1, 100, 98)
    expect(s.qty).toBe(500)
    expect(s.maxLoss).toBeLessThanOrEqual(1000)
    expect(riskAllowed(2)).toBe(true)
    expect(riskAllowed(5)).toBe(false)
  })
  it('refuses to open without both stop-loss and take-profit', () => {
    const c = { t: 0, o: 100, h: 100, l: 100, c: 100, v: 1 }
    expect('error' in openPractice(c, 0, 'long', 10, null, 110)).toBe(true)
    expect('error' in openPractice(c, 0, 'long', 10, 95, null)).toBe(true)
    const t = openPractice(c, 0, 'long', 10, 95, 110)
    expect('error' in t).toBe(false)
  })
  it('closes on stop or target', () => {
    const c0 = { t: 0, o: 100, h: 100, l: 100, c: 100, v: 1 }
    const t = openPractice(c0, 0, 'long', 10, 95, 110)
    if ('error' in t) throw new Error()
    const next = [c0, { t: 1, o: 100, h: 111, l: 99, c: 110, v: 1 }, c0]
    expect(advancePractice(t, next, 1).closed?.reason).toBe('target')
  })
  it('unlocks lessons in order and XP never depends on profit', () => {
    const e = new Set<XpKey>(['l1_read'])
    expect(lessonUnlocked(2, e)).toBe(false)
    e.add('l1_risk'); e.add('l1_size')
    expect(lessonUnlocked(2, e)).toBe(true)
    expect(xpTotal(e)).toBe(50)
    expect(levelFor(0).level).toBe(1)
    expect(levelFor(XP_MAX).level).toBe(4)
  })
  it('reads bands + RSI together', () => {
    expect(correctRead(104, band, 75)).toBe('stretched_up')
    expect(correctRead(96, band, 25)).toBe('stretched_down')
    expect(correctRead(100, band, 75)).toBe('rsi_only')
    expect(squeezeThreshold([band, null, { ...band, upper: 101, lower: 99 }])).toBeGreaterThan(0)
  })
})
