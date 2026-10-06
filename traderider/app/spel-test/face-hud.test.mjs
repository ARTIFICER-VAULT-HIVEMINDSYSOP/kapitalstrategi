import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { sampleIndex, sampleX } from '../../spel/lagen/kurs.js'
import { createFaceDriver, frameAt, GREEN_FRAMES, DOWN_FRAMES, rideClip, rideSheet } from '../../spel/lagen/face-driver.js'
import { openPctFromTrain, trainTick } from '../../spel/lagen/face-hud.js'
import { STRINGS } from '../../spel/lagen/i18n.js'

function track(n, priceAt) {
  const points = []
  for (let i = 0; i < n; i++) {
    const price = priceAt(i)
    points.push({ price, upper: price + 4, lower: price - 4, mid: price, t: 1_700_000_000 + i * 3600, x: i * 12 })
  }
  return points
}

/** Oberoende kopia av grafens x-sampel (motorns funktion k / A). */
function chartK(points, x) {
  const mix = (i, a, b, u) => ({ i, price: a.price + (b.price - a.price) * u })
  const first = points[0]
  const last = points[points.length - 1]
  if (points.length === 1 || x <= first.x) return mix(0, first, points[1] ?? first, 0)
  if (x >= last.x) return mix(points.length - 1, points[points.length - 2] ?? last, last, 1)
  let lo = 0
  let hi = points.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (points[mid].x <= x) lo = mid
    else hi = mid
  }
  const a = points[lo]
  const b = points[hi]
  return mix(lo, a, b, (x - a.x) / (b.x - a.x || 1))
}

function chartIndex(points, cursor) {
  const i = Math.max(0, Math.min(points.length - 1, Math.floor(cursor)))
  const j = Math.min(points.length - 1, i + 1)
  const u = Math.min(1, Math.max(0, cursor - i))
  return points[i].price + (points[j].price - points[i].price) * u
}

test('tågets avatar och graf läser samma x-tick', () => {
  const points = track(12, (i) => 100 + Math.sin(i / 3) * 6)
  for (const x of [0, 5, 12, 18.5, 40, 200]) {
    const chart = chartK(points, x)
    assert.equal(sampleX(points, x).price, chart.price)
    const engine = {
      track: { points },
      train: { x, side: 'buy', flat: false, pnl: 0 },
      leverage: 1,
      hudSnap: () => ({ price: 1, candleIndex: 0 }),
    }
    assert.equal(trainTick(engine).price, chart.price)
  }
})

test('avataren tar emot exakt de kurser drivern får från grafens sampel', () => {
  const points = track(20, (i) => 80 + i * 0.7)
  const driver = createFaceDriver()
  const chart = []
  const face = []
  for (let cursor = 0; cursor < points.length - 1; cursor += 0.25) {
    const price = sampleIndex(points, cursor)
    chart.push(price)
    face.push(driver.update({ price, index: cursor, side: 'buy', openPct: 1, lev: 1, now: cursor * 400 }).price)
    assert.equal(price, chartIndex(points, cursor))
  }
  assert.deepEqual(face, chart)
})

test('nedgång mot lång är röd, plus på samma nedgång är grön bräda', () => {
  const down = createFaceDriver()
  const up = createFaceDriver()
  let against
  let withTrend
  for (let i = 0; i < 10; i++) {
    const price = 100 - i * 1.4
    against = down.update({ price, index: i, side: 'buy', openPct: -1.2 - i, lev: 1, now: i * 200 })
    withTrend = up.update({ price, index: i, side: 'sell', openPct: 1.2 + i, lev: 1, now: i * 200 })
  }
  assert.equal(against.price, withTrend.price)
  assert.equal(against.ride.clip, 'down')
  assert.equal(against.expression, 'worried')
  assert.equal(withTrend.ride.clip, 'green')
  assert.equal(withTrend.expression, 'happy')
  assert.equal(withTrend.tense, false)
  assert.deepEqual(withTrend.ride.frames, GREEN_FRAMES)
  assert.deepEqual(against.ride.frames, DOWN_FRAMES)
})

test('hävstång 1–2 är vanlig sprite, 3–4 är fartvarianten och gör nedåtrutan mer spänd', () => {
  assert.equal(rideSheet(1), 'ride')
  assert.equal(rideSheet(2), 'ride')
  assert.equal(rideSheet(3), 'high')
  assert.equal(rideSheet(4), 'high')
  const run = (lev) => {
    const d = createFaceDriver()
    let snap
    for (let i = 0; i < 8; i++) snap = d.update({ price: 100 - i, index: i, side: 'buy', openPct: -2, lev, now: i * 150 })
    return snap
  }
  const calmLev = run(2)
  const fast = run(4)
  assert.equal(calmLev.ride.sheet, 'ride')
  assert.equal(calmLev.tense, false)
  assert.equal(fast.ride.sheet, 'high')
  assert.equal(fast.ride.clip, 'down')
  assert.equal(fast.tense, true)
  assert.equal(fast.expression, 'worried')
  assert.ok(fast.weights.browDown > calmLev.weights.browDown)
  assert.ok(fast.weights.strain > 0)
  const profit = createFaceDriver()
  let snap
  for (let i = 0; i < 8; i++) snap = profit.update({ price: 100 - i, index: i, side: 'sell', openPct: 3, lev: 4, now: i * 150 })
  assert.equal(snap.ride.sheet, 'high')
  assert.equal(snap.ride.clip, 'green')
  assert.equal(snap.expression, 'happy')
  assert.equal(snap.tense, false)
})

test('stop-loss är lugn, take-profit är jubel, reducerad rörelse står still', () => {
  const d = createFaceDriver()
  for (let i = 0; i < 6; i++) d.update({ price: 100 - i, index: i, side: 'buy', openPct: -3, lev: 4, now: i * 100 })
  const sl = d.update({ price: 90, index: 6, side: 'flat', openPct: 0, lev: 4, now: 2000, hit: 'sl' })
  assert.equal(sl.expression, 'calm')
  assert.equal(sl.tense, false)
  assert.ok(sl.weights.calm > 0.9)
  const tp = d.update({ price: 110, index: 7, side: 'flat', openPct: 0, lev: 1, now: 3000, hit: 'tp' })
  assert.equal(tp.expression, 'cheer')
  assert.equal(frameAt(DOWN_FRAMES, 0, true), DOWN_FRAMES[0])
  assert.equal(frameAt(DOWN_FRAMES, 5000, true), DOWN_FRAMES[0])
  assert.notEqual(frameAt(GREEN_FRAMES, 0, false), frameAt(GREEN_FRAMES, 400, false))
})

test('öppen vinst följer spelaren, inte kursens tecken', () => {
  assert.ok(openPctFromTrain({ pnl: 100, price: 110, side: 'buy', leverage: 1 }) > 0)
  assert.ok(openPctFromTrain({ pnl: 100, price: 90, side: 'sell', leverage: 2 }) > 0)
  assert.equal(openPctFromTrain({ pnl: 100, price: 90, side: 'flat', leverage: 1 }), 0)
  assert.equal(rideClip({ trend: 'down', side: 'sell', openPct: 2 }), 'green')
  assert.equal(rideClip({ trend: 'down', side: 'buy', openPct: -2 }), 'down')
  assert.equal(rideClip({ trend: 'down', side: 'flat', openPct: 0, followMarket: true }), 'down')
  assert.equal(rideClip({ trend: 'up', side: 'flat', openPct: 0, followMarket: true }), 'green')
})

test('synlig text finns på svenska, engelska och ukrainska utan löfte om avkastning', () => {
  for (const lang of ['sv', 'en', 'uk']) {
    for (const key of ['face.aria', 'face.neutral', 'face.focused', 'face.happy', 'face.cheer', 'face.worried', 'face.calm', 'face.surprised']) {
      assert.equal(typeof STRINGS[lang][key], 'string', `${lang} ${key}`)
      assert.equal(/avkastning|return|доход/i.test(STRINGS[lang][key]), false, STRINGS[lang][key])
    }
  }
})

function webpSize(buf) {
  const s = buf.toString('latin1')
  const i = s.indexOf('VP8X')
  assert.ok(i > 0)
  const o = i + 8
  return { w: 1 + buf.readUIntLE(o + 4, 3), h: 1 + buf.readUIntLE(o + 7, 3) }
}

test('spriten hämtas först när en avatar synkas, och fartvarianten först vid hävstång 3', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  const srcs = []
  globalThis.Image = class {
    set src(v) {
      srcs.push(v)
      this._src = v
    }
    get src() {
      return this._src
    }
    addEventListener() {}
  }
  const { mountPilot } = await import('../../spel/lagen/face-hud.js')
  const host = w.document.createElement('div')
  w.document.body.appendChild(host)
  const pilot = mountPilot(host, { theme: 'hud', player: 1 })
  assert.equal(srcs.length, 0)
  pilot.sync({ price: 100, index: 0, side: 'flat', openPct: 0, lev: 1, now: 0 }, 0)
  assert.ok(srcs.some((s) => s.endsWith('/academy-robot-ride.webp')))
  assert.equal(srcs.some((s) => s.includes('highlev')), false)
  pilot.sync({ price: 99, index: 1, side: 'buy', openPct: -1, lev: 4, now: 200 }, 200)
  assert.ok(srcs.some((s) => s.includes('academy-robot-ride-highlev.webp')))
  pilot.destroy()
})

test('åk-arken ligger på ett exakt rutnät och hämtas inte som skript', () => {
  const ride = readFileSync(new URL('../../spel/sprites/academy-robot-ride.webp', import.meta.url))
  const high = readFileSync(new URL('../../spel/sprites/academy-robot-ride-highlev.webp', import.meta.url))
  assert.deepEqual(webpSize(ride), { w: 3200, h: 396 })
  assert.deepEqual(webpSize(high), { w: 3210, h: 396 })
  assert.equal(320 * 10, 3200)
  assert.equal(321 * 10, 3210)
})

async function dom() {
  const { Window } = await import('happy-dom')
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/#racex' })
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.location = w.location
  globalThis.performance = w.performance
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(w.performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  globalThis.removeEventListener = (...args) => w.removeEventListener(...args)
  globalThis.getComputedStyle = (el) => w.getComputedStyle(el)
  globalThis.devicePixelRatio = 1
  globalThis.matchMedia = (q) => w.matchMedia(q)
  globalThis.innerWidth = 1280
  globalThis.innerHeight = 800
  w.localStorage.setItem('app.language', 'sv')
  return w
}

test('RaceX-grafen och båda spelarnas avatarer får samma tick', async () => {
  const w = await dom()
  const points = track(24, (i) => 100 - i * 1.25)
  const engine = { track: { points }, spec: { log: false, key: '1y' }, leverage: 1 }
  const { createRaket } = await import('../../spel/lagen/raket.js')
  const { sampleIndex: read } = await import('../../spel/lagen/kurs.js')
  const raket = createRaket({ engine })
  try {
    raket.setMode('2p')
    raket.show()
    raket.act(0, 'buy')
    raket.act(0, 'levUp')
    raket.act(0, 'levUp')
    raket.act(0, 'levUp')
    raket.act(1, 'sell')
    const chart = []
    const face0 = []
    const face1 = []
    for (let n = 0; n < 10; n++) {
      raket.step(0.2)
      const price = raket.chartPrice()
      chart.push(price)
      face0.push(raket.facePrice(0))
      face1.push(raket.facePrice(1))
      assert.equal(price, read(points, raket.state(0).p))
    }
    assert.deepEqual(face0, chart)
    assert.deepEqual(face1, chart)
    // Sidbyte blinkar till fokus en kort stund. Vänta ut den, sedan syns plusläget.
    await new Promise((r) => setTimeout(r, 260))
    raket.step(0)
    const a = raket.faceSnap(0)
    const b = raket.faceSnap(1)
    assert.equal(a.price, b.price)
    assert.equal(a.lev, 4)
    assert.equal(a.ride.sheet, 'high')
    assert.equal(a.ride.clip, 'down')
    assert.equal(a.tense, true)
    assert.equal(a.expression, 'worried')
    assert.equal(b.ride.sheet, 'ride')
    assert.equal(b.ride.clip, 'green')
    assert.equal(b.expression, 'happy')
    assert.equal(b.tense, false)
    assert.equal(w.document.querySelectorAll('[data-pilot]').length, 2)
  } finally {
    raket.hide()
  }
})

test('Academy-loppet rider på samma kursindex som grafens sampel', async () => {
  const w = await dom()
  const points = track(20, (i) => 140 - i * 2)
  const { createTradeRiderAcademy } = await import('../../spel/lagen/tra.js')
  const { sampleIndex: read } = await import('../../spel/lagen/kurs.js')
  const tra = createTradeRiderAcademy({ engine: { track: { points }, leverage: 4 } })
  try {
    tra.show()
    w.document.querySelector('[data-tra-start]').click()
    for (let n = 0; n < 8; n++) tra.step(0.2)
    const canvas = w.document.querySelector('[data-tra-canvas]')
    const cursor = Math.min(points.length - 1, tra.state().clock * 5)
    assert.equal(Number(canvas.dataset.ridePrice), read(points, cursor))
    assert.equal(canvas.dataset.rideClip, 'down')
    assert.equal(canvas.dataset.rideSheet, 'high')
  } finally {
    tra.hide()
  }
})
