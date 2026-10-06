// Cyber-HUD för Raket: WCAG AA-kontrast, rörelsehjälpare, reducerad rörelse, glitch-tröskel och spärrade ord.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HUD, smoothTo, rocketTilt, headingFromPath, glitchLevel, GLITCH_AT, exhaustRate, parallaxSpeed, makeStars, STAR_LAYERS, effectLevels, FX_FULL } from '../../spel/lagen/raket.js'

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
// kortens faktiska bakgrund: rgba(10,15,46,.84) över BG_TOP/BG_BOT ≈ dessa
const CARD = '#0b1031'
const BGS = [HUD.BG_PANEL, HUD.BG_TOP, HUD.BG_BOT, CARD]

test('WCAG AA: all HUD-text mot mörk bakgrund ≥ 4,5:1', () => {
  for (const bg of BGS)
    for (const [name, fg] of Object.entries({ TEXT: HUD.TEXT, TEXT2: HUD.TEXT2, MUTED: HUD.MUTED, CYAN: HUD.CYAN, MAGENTA: HUD.MAGENTA, BUY: HUD.BUY, SELL: HUD.SELL })) {
      const r = ratio(fg, bg)
      assert.ok(r >= 4.5, `${name} ${fg} mot ${bg}: ${r.toFixed(2)}`)
    }
})
test('WCAG AA: mörk text på aktiva neonknappar (BUY/SELL/kör) ≥ 4,5:1', () => {
  for (const bg of [HUD.BUY, HUD.SELL, HUD.CYAN]) assert.ok(ratio(HUD.ON_DARK, bg) >= 4.5, `${bg}: ${ratio(HUD.ON_DARK, bg).toFixed(2)}`)
})
test('BUY grön och SELL röd – tydligt skilda', () => {
  const [br, bgc] = hex(HUD.BUY)
  const [sr, sg] = hex(HUD.SELL)
  assert.ok(bgc > br && sr > sg, 'BUY ska vara grön, SELL röd')
})
test('bakgrunden är djupt marinblå/lila – inte ren svart', () => {
  for (const c of [HUD.BG_TOP, HUD.BG_BOT, HUD.BG_PANEL]) {
    const [r, g, b] = hex(c)
    assert.ok(b > r && b > g && b > 0.15, c)
  }
})
test('mjuk easing: bildfrekvensoberoende och konvergerar', () => {
  let a = 0
  for (let k = 0; k < 60; k++) a = smoothTo(a, 100, 1 / 60, 8)
  let b = 0
  for (let k = 0; k < 30; k++) b = smoothTo(b, 100, 1 / 30, 8)
  assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`)
  assert.ok(a > 99.9)
  assert.equal(smoothTo(null, 5, 0.016, 8), 5)
})
test('nosen pekar i färdriktningen: lutning följer rälsen och är begränsad', () => {
  assert.ok(rocketTilt(10, 30) > 0) // rälsen går åt höger → nosen lutar åt höger
  assert.ok(rocketTilt(-10, 30) < 0)
  assert.equal(rocketTilt(0, 30), 0)
  assert.ok(Math.abs(rocketTilt(1e6, 30)) <= 0.6)
  assert.ok(rocketTilt(12, 30, true) > 0)
  assert.ok(Math.abs(rocketTilt(12, 30, true)) < Math.abs(rocketTilt(12, 30)))
})

test('nosen har samma tecken som banans lutning över flera bildrutor', () => {
  const follow = (xs) => {
    let tilt = 0
    const frames = []
    for (let i = 1; i < xs.length; i++) {
      const slope = xs[i] - xs[i - 1]
      const aim = headingFromPath([
        { x: xs[i - 1], y: 120 },
        { x: xs[i], y: 80 },
      ])
      tilt = smoothTo(tilt, aim, 1 / 30, 6)
      frames.push({ slope, tilt })
    }
    return frames
  }
  const rise = follow([0, 8, 18, 30, 44, 60, 78])
  assert.ok(rise.length >= 5)
  assert.ok(rise.every((frame) => frame.slope > 0 && frame.tilt > 0))
  const fall = follow([80, 62, 44, 28, 14, 4, 0])
  assert.ok(fall.every((frame) => frame.slope < 0 && frame.tilt < 0))
  let bank = 0
  const lane = [100, 100, 148, 210, 250]
  const banks = []
  for (let i = 1; i < lane.length; i++) {
    const slope = lane[i] - lane[i - 1]
    bank = smoothTo(bank, headingFromPath([{ x: lane[i - 1], y: 160 }, { x: lane[i], y: 120 }]), 1 / 30, 6)
    banks.push({ slope, tilt: bank })
  }
  assert.ok(banks.filter((frame) => frame.slope > 0).every((frame) => frame.tilt > 0))
  const calm = headingFromPath([{ x: 0, y: 50 }, { x: 24, y: 10 }], true)
  const full = headingFromPath([{ x: 0, y: 50 }, { x: 24, y: 10 }], false)
  assert.ok(calm > 0 && calm < full)
})
test('glitch vid förlust ≥ 5 % – samma mått som asteroiderna; aldrig vid reducerad rörelse', () => {
  const st = { side: 'buy', entry: 100, realized: 0, lev: 3 }
  assert.equal(glitchLevel(effectLevels(st, 96, 96)), 0) // −4 %
  const fx5 = effectLevels(st, 95, 95)
  assert.ok(glitchLevel(fx5) >= 0.5, 'vid −5 %')
  assert.ok(fx5.asteroids > 0 && Math.abs(fx5.loss - 5 / FX_FULL) < 1e-9)
  assert.equal(glitchLevel(fx5, true), 0, 'reducerad rörelse')
  assert.equal(glitchLevel(effectLevels(st, 110, 109)), 0, 'plus')
  assert.equal(glitchLevel(effectLevels({ ...st, entry: null }, 80, 80)), 0, 'flat')
  assert.equal(GLITCH_AT, 5)
  // hävstången påverkar inte tröskeln (samma som asteroiderna)
  assert.equal(glitchLevel(effectLevels({ ...st, lev: 1 }, 94, 94)), glitchLevel(effectLevels({ ...st, lev: 4 }, 94, 94)))
})
test('avgaser följer boost; inga partiklar vid reducerad rörelse', () => {
  assert.ok(exhaustRate({ boost: 1 }, true, false) > exhaustRate({ boost: 0 }, true, false))
  assert.equal(exhaustRate({ boost: 1 }, true, true), 0)
})
test('parallax följer farten; står still vid paus eller reducerad rörelse', () => {
  assert.equal(parallaxSpeed(false, false, 150, 0), 0)
  assert.equal(parallaxSpeed(true, true, 150, 1), 0)
  assert.ok(parallaxSpeed(true, false, 150, 1) > parallaxSpeed(true, false, 150, 0))
})
test('stjärnor i tre lager, fast frö, olika fart per lager', () => {
  const a = makeStars(3)
  assert.equal(a.length, 3)
  assert.deepEqual(a, makeStars(3))
  assert.ok(STAR_LAYERS[0].speed < STAR_LAYERS[1].speed && STAR_LAYERS[1].speed < STAR_LAYERS[2].speed)
  for (const L of a) for (const s of L) assert.ok(s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1)
})
test('ingenting från den spärrade varianten i raket.js', () => {
  const src = readFileSync(new URL('../../spel/lagen/raket.js', import.meta.url), 'utf8')
  for (const w of ['Övningskapital', '100,000', '100_000', 'Köp', 'Sälj', 'Platt', 'Hävstång –', 'Paus · mellanslag', 'Alla lägen', 'candles/s', 'konduktör', 'Konduktör', '20-SMA', 'Övre', 'Undre', 'pixeltåg', 'pixel-tåg', 'drawTrain'])
    assert.ok(!src.includes(w), w)
  for (const w of ['SpaceX', 'Starship', 'Grok', 'xAI', 'Elon', 'Musk'])
    assert.equal(src.toLowerCase().includes(w.toLowerCase()), false, w)
})
