import test from 'node:test'
import assert from 'node:assert/strict'
import { effectLevels, pnlPct, switchSide, FX_FULL, labelBox, boxesOverlap, dodgeEntryY } from '../../spel/lagen/raket.js'

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`)

test('ingen position → inga effekter', () => {
  assert.deepEqual(effectLevels({ side: 'buy', entry: null }, 100, 99), { move: 0, boost: 0, loss: 0, glow: 0, asteroids: 0 })
})

test('long i plus → boost, inga asteroider', () => {
  const fx = effectLevels({ side: 'buy', entry: 100 }, 103, 102)
  close(fx.move, 3)
  close(fx.boost, 3 / FX_FULL)
  assert.equal(fx.loss, 0)
  assert.equal(fx.asteroids, 0)
  assert.ok(fx.glow > 0)
})

test('long i minus → asteroider, fler vid större förlust, ingen boost', () => {
  const a = effectLevels({ side: 'buy', entry: 100 }, 99, 99.5)
  const b = effectLevels({ side: 'buy', entry: 100 }, 95, 95.5)
  assert.equal(a.boost, 0)
  assert.ok(a.asteroids >= 1)
  assert.ok(b.asteroids > a.asteroids)
  assert.equal(a.glow, 0)
})

test('short vänder tecknet', () => {
  const fx = effectLevels({ side: 'sell', entry: 100 }, 97, 98)
  close(fx.move, 3)
  assert.ok(fx.boost > 0 && fx.glow > 0 && fx.asteroids === 0)
})

test('effekterna är skilda från hävstången', () => {
  const a = effectLevels({ side: 'buy', entry: 100, lev: 1 }, 102, 101)
  const b = effectLevels({ side: 'buy', entry: 100, lev: 4 }, 102, 101)
  assert.deepEqual(a, b)
})

test('nivåer är begränsade till 0–1', () => {
  const up = effectLevels({ side: 'buy', entry: 100 }, 200, 100)
  const dn = effectLevels({ side: 'buy', entry: 100 }, 10, 20)
  assert.equal(up.boost, 1)
  assert.equal(up.glow, 1)
  assert.equal(dn.loss, 1)
  assert.equal(dn.asteroids, 22)
})

test('P&L i procent med hävstång och sidbyte', () => {
  let st = { side: 'buy', entry: null, realized: 0, lev: 2 }
  st = switchSide(st, 'buy', 100)
  close(pnlPct(st, 110), 20)
  st = switchSide(st, 'sell', 110)
  close(st.realized, 20)
  close(pnlPct(st, 99), 20 + 2 * 10)
})

// ---------- flat ----------
import { closePosition, openPct, isFlat, setLev, splitViewports, LEV_MIN, LEV_MAX } from '../../spel/lagen/raket.js'

test('FLAT stänger en plusposition och bokför realiserat resultat', () => {
  let st = switchSide({ side: 'buy', entry: null, realized: 0, lev: 1 }, 'buy', 100)
  st = closePosition(st, 104)
  assert.ok(isFlat(st))
  close(st.realized, 4)
  close(pnlPct(st, 50), 4) // flat: kursen påverkar inte längre
  assert.equal(openPct(st, 120), 0)
})

test('FLAT stänger en minusposition (short, 2×)', () => {
  let st = switchSide({ side: 'buy', entry: null, realized: 0, lev: 2 }, 'sell', 100)
  st = closePosition(st, 103)
  close(st.realized, -6)
  assert.ok(isFlat(st))
})

test('FLAT när man redan är flat ändrar ingenting', () => {
  const st = { side: 'buy', entry: null, realized: 1.5, lev: 1 }
  assert.equal(closePosition(st, 99), st)
})

test('flat → inga effekter (ingen boost, inga asteroider, inget ljusspår)', () => {
  const st = closePosition(switchSide({ side: 'buy', entry: null, realized: 0, lev: 1 }, 'buy', 100), 90)
  assert.deepEqual(effectLevels(st, 80, 85), { move: 0, boost: 0, loss: 0, glow: 0, asteroids: 0 })
})

test('ny position efter flat startar från ny kurs och behåller realiserat', () => {
  let st = closePosition(switchSide({ side: 'buy', entry: null, realized: 0, lev: 1 }, 'buy', 100), 110)
  st = switchSide(st, 'buy', 200)
  close(st.realized, 10)
  close(pnlPct(st, 210), 15)
})

test('hävstång håller sig inom 1–4 och gäller från ändringen', () => {
  let st = { side: 'buy', entry: null, realized: 0, lev: 1 }
  st = setLev(st, 0, 100)
  assert.equal(st.lev, LEV_MIN)
  st = setLev(st, 9, 100)
  assert.equal(st.lev, LEV_MAX)
  st = switchSide({ side: 'buy', entry: null, realized: 0, lev: 1 }, 'buy', 100)
  st = setLev(st, 2, 110) // +10 % bokförs med 1×
  close(st.realized, 10)
  close(pnlPct(st, 121), 10 + 20)
})

test('ENTRY-rutan skär inte SKJUTS eller priset, och de två ligger kvar', () => {
  const W = 390
  const rocketX = 180
  const rocketY = 210
  const tag = labelBox(rocketX, rocketY + 56, 340, { size: 11, align: 'center', W })
  const price = labelBox(rocketX - (64 + 16) - 28, rocketY, 64, { size: 13, align: 'left', W })
  const tagBefore = { ...tag }
  const priceBefore = { ...price }
  const ex = rocketX - 10
  const limit = rocketY + 70
  const startY = Math.min(rocketY + 78, limit)
  const boxAt = (yy) => labelBox(ex, yy, 88, { size: 11, align: 'center', W })
  assert.equal(boxesOverlap(boxAt(startY), tag), true)
  const y = dodgeEntryY(boxAt, [tag, price], { minY: rocketY + 21, maxY: limit, startY })
  assert.ok(y != null)
  const entry = boxAt(y)
  assert.equal(boxesOverlap(entry, tag), false)
  assert.equal(boxesOverlap(entry, price), false)
  assert.deepEqual(tag, tagBefore)
  assert.deepEqual(price, priceBefore)
})

test('ENTRY ligger kvar när rutan redan är fri', () => {
  const tag = labelBox(180, 160, 80, { size: 11, align: 'center', W: 390 })
  const price = labelBox(40, 100, 64, { size: 13, align: 'left', W: 390 })
  const boxAt = (yy) => labelBox(300, yy, 70, { size: 11, align: 'center', W: 390 })
  assert.equal(dodgeEntryY(boxAt, [tag, price], { minY: 80, maxY: 240, startY: 200 }), 200)
})

test('2P delar skärmen: vänster/höger på bred, över/under på smal; 1P = hela', () => {
  assert.deepEqual(splitViewports(1280, 800, '1p'), [{ x: 0, y: 0, w: 1280, h: 800 }])
  assert.deepEqual(splitViewports(1280, 800, '2p'), [{ x: 0, y: 0, w: 640, h: 800 }, { x: 640, y: 0, w: 640, h: 800 }])
  assert.deepEqual(splitViewports(390, 844, '2p'), [{ x: 0, y: 0, w: 390, h: 422 }, { x: 0, y: 422, w: 390, h: 422 }])
})
