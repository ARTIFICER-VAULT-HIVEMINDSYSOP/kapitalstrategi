import test from 'node:test'
import assert from 'node:assert/strict'
import { effectLevels, pnlPct, switchSide, FX_FULL, labelBox, boxesOverlap, dodgeEntryY, tradePulse, wobbleOffset, burstLift, satelliteAngle, ORBIT_FROZEN, orbitPoint, CONSTELLATIONS, starTwinkle, PLAYER_ACCENT, VISUAL_PULSE_BAND, PLAN_TP, PLAN_SL, PRACTICE_INDEX, openMove, planAction, referenceRun, sidesFromLog, assess, disciplineScore, compareRuns, balanceIndex } from '../../spel/lagen/raket.js'
import { STRINGS } from '../../spel/lagen/i18n.js'

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

test('plus-korsning ger en visuell tp-puls och minus-korsning en sl-puls, utan att ändra talen', () => {
  const prev = { open: true, move: 0 }
  const up = { open: true, move: VISUAL_PULSE_BAND + 0.2 }
  const down = { open: true, move: -(VISUAL_PULSE_BAND + 0.2) }
  assert.equal(tradePulse(prev, up), 'tp')
  assert.equal(tradePulse(prev, down), 'sl')
  assert.equal(tradePulse(up, { open: true, move: up.move + 1 }), null)
  assert.equal(tradePulse({ open: false, move: 0 }, up), null)
  assert.equal(tradePulse(prev, { open: false, move: 4 }), null)
  assert.deepEqual(prev, { open: true, move: 0 })
})

test('wobble och lyft är stilla vid reducerad rörelse', () => {
  assert.deepEqual(wobbleOffset(1.2, 1, true), { x: 0, rot: 0 })
  assert.equal(burstLift(1, true), 0)
  const live = wobbleOffset(0.4, 1, false)
  assert.ok(Math.abs(live.x) > 0)
  assert.ok(burstLift(1, false) > burstLift(0.5, false))
  assert.equal(satelliteAngle(3, true), ORBIT_FROZEN)
  assert.notEqual(satelliteAngle(3, false), satelliteAngle(4, false))
  const p = orbitPoint(0, 10, 4)
  assert.equal(p.x, 10)
  assert.equal(p.y, 0)
})

test('stjärnbilderna är svaga figurer: Karlavagnen, ett W och ett bälte', () => {
  const ids = CONSTELLATIONS.map((f) => f.id)
  assert.deepEqual(ids, ['dipper', 'cassiopeia', 'orion'])
  const dipper = CONSTELLATIONS[0]
  assert.equal(dipper.stars.length, 7)
  assert.equal(dipper.lines.length, 7)
  for (const fig of CONSTELLATIONS) {
    for (const [a, b] of fig.lines) {
      assert.ok(fig.stars[a] && fig.stars[b])
      assert.ok(fig.stars[a][0] >= 0 && fig.stars[a][0] <= 1)
      assert.ok(fig.stars[a][1] >= 0 && fig.stars[a][1] <= 1)
    }
  }
  assert.equal(starTwinkle(1, 0, true), starTwinkle(9, 2, true))
  assert.notEqual(PLAYER_ACCENT[0], PLAYER_ACCENT[1])
})

test('2P delar skärmen: vänster/höger på bred, över/under på smal; 1P = hela', () => {
  assert.deepEqual(splitViewports(1280, 800, '1p'), [{ x: 0, y: 0, w: 1280, h: 800 }])
  assert.deepEqual(splitViewports(1280, 800, '2p'), [{ x: 0, y: 0, w: 640, h: 800 }, { x: 640, y: 0, w: 640, h: 800 }])
  assert.deepEqual(splitViewports(390, 844, '2p'), [{ x: 0, y: 0, w: 390, h: 422 }, { x: 0, y: 422, w: 390, h: 422 }])
})

const series = (prices) => prices.map((price, i) => ({ price, t: i }))

test('planen följer senaste steget och stänger vid mål eller stopp, utan att ändra läget', () => {
  const open = { side: 'buy', entry: 100, realized: 0, lev: 4 }
  const before = { ...open }
  assert.equal(planAction(open, 102, 101), 'buy')
  assert.equal(planAction(open, 103, 102), 'flat')
  assert.equal(planAction({ side: 'sell', entry: 100, realized: 0, lev: 1 }, 102, 101), 'flat')
  assert.equal(planAction({ side: 'flat', entry: null, realized: 0, lev: 1 }, 101, 100), 'buy')
  assert.equal(planAction({ side: 'flat', entry: null, realized: 0, lev: 1 }, 99, 100), 'sell')
  assert.equal(planAction({ side: 'flat', entry: null, realized: 0, lev: 1 }, 100, 100), 'flat')
  assert.deepEqual(open, before)
  assert.equal(PLAN_TP, 3)
  assert.equal(PLAN_SL, 2)
  assert.equal(PRACTICE_INDEX, 100)
  close(openMove(open, 103), 3)
})

test('ett mål på 4 % stänger referensen senare än ett mål på 3 %', () => {
  const up = series([100, 101, 102, 103, 104, 105, 106])
  const closeAt = (plan) => referenceRun(up, plan).sides.findIndex((side, i) => i > 1 && side === 'flat')
  const at3 = closeAt({ tp: 3, sl: 2 })
  const at4 = closeAt({ tp: 4, sl: 2 })
  assert.ok(at3 > 1)
  assert.ok(at4 > at3)
})

test('referensen är deterministisk på samma kursserie och tittar inte framåt', () => {
  const up = series([100, 101, 102, 103, 104, 105, 106])
  const run = referenceRun(up)
  assert.equal(run.sides[0], 'flat')
  assert.equal(run.sides[1], 'buy')
  const closed = run.sides.findIndex((side, i) => i > 1 && side === 'flat')
  assert.ok(closed > 1)
  assert.equal(run.sides[closed - 1], 'buy')
  assert.deepEqual(referenceRun(up).sides, run.sides)
  const later = series([100, 101, 102, 103, 104, 105, 40])
  assert.deepEqual(referenceRun(later).sides.slice(0, -1), run.sides.slice(0, -1))
  assert.deepEqual(up.map((p) => p.price), [100, 101, 102, 103, 104, 105, 106])
})

test('en logg fyller luckorna med senaste sidan', () => {
  assert.deepEqual(sidesFromLog(6, [{ i: 0, side: 'flat' }, { i: 2, side: 'buy' }, { i: 2, side: 'sell' }]), ['flat', 'flat', 'sell', 'sell', 'sell', 'sell'])
})

test('disciplin slår ett lyckat utfall med hög hävstång, på samma kursserie', () => {
  const prices = []
  let price = 100
  for (let i = 0; i < 12; i++) {
    prices.push(Number(price.toFixed(4)))
    price *= 1.006
  }
  for (let i = 0; i < 20; i++) {
    prices.push(Number(price.toFixed(4)))
    price *= 0.985
  }
  for (let i = 0; i < 16; i++) {
    prices.push(Number(price.toFixed(4)))
    price *= 1.08
  }
  prices.push(Number(price.toFixed(4)))
  const points = series(prices)
  const ref = referenceRun(points)
  const follower = assess(points, ref.sides)
  const luckySides = points.map(() => 'buy')
  const lucky = assess(points, luckySides)
  const luckyBalance = balanceIndex({ side: 'buy', entry: prices[0], realized: 0, lev: 4 }, prices.at(-1))
  assert.equal(follower.planMatch, 1)
  assert.equal(follower.slScore, 1)
  assert.ok(follower.tpAt != null)
  assert.ok(follower.discipline > lucky.discipline, `${follower.discipline} > ${lucky.discipline}`)
  assert.ok(luckyBalance > follower.balance, `${luckyBalance} > ${follower.balance}`)
  const cmp = compareRuns([
    { id: 'plan', ...follower },
    { id: 'luck', ...lucky, balance: luckyBalance },
  ])
  assert.equal(cmp.winnerId, 'plan')
  assert.equal(compareRuns([
    { id: 'plan', discipline: 88, tpAt: 12, maxDd: 3, balance: 104 },
    { id: 'luck', discipline: 41, tpAt: 4, maxDd: 1, balance: 480 },
  ]).winnerId, 'plan')
  assert.equal(disciplineScore({ planMatch: 1, slScore: 1, maxDd: 0 }), 100)
})

test('jämförelsens etiketter finns på svenska, engelska och ukrainska', () => {
  for (const lang of ['sv', 'en', 'uk']) {
    for (const key of ['rk.ref', 'rk.refTitle', 'rk.you', 'rk.refName', 'rk.compareTitle', 'rk.tpFirst', 'rk.noTp', 'rk.tpAt', 'rk.tpNone', 'rk.winner', 'rk.tie', 'rk.planRule', 'rk.statLine']) {
      assert.equal(typeof STRINGS[lang][key], 'string', `${lang} ${key}`)
      assert.ok(STRINGS[lang][key].length > 0)
    }
  }
})
