// Rabbit Hole mot TRADE-RIDER-PRINCIPER.md: P7, P10, P11, P12, P19, P20.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SRC = readFileSync(new URL('../../spel/lagen/rabbit.js', import.meta.url), 'utf8')
const R = await import('../../spel/lagen/rabbit.js')

test('P11: fast 60 Hz – samma antal steg vid 60 och 144 Hz under en sekund', () => {
  const run = (hz) => {
    let acc = 0
    let n = 0
    for (let i = 0; i < hz; i++) {
      const r = R.fixedSteps(acc, 1 / hz)
      acc = r.acc
      n += r.steps
    }
    return n
  }
  assert.ok(Math.abs(run(60) - 60) <= 1)
  assert.ok(Math.abs(run(144) - 60) <= 1)
  assert.ok(Math.abs(run(30) - 60) <= 1)
  assert.equal(R.fixedSteps(0, 5).steps, 15, 'lång paus ger högst 15 steg (ingen spiral)')
  assert.ok(!/Math\.min\(0\.05, \(stamp/.test(SRC), 'variabel dt i frame är borta')
})

test('P12: tangenter släpps vid blur och spelknappar scrollar inte', () => {
  assert.match(SRC, /addEventListener\('blur', \(\) => held\.clear\(\)\)/)
  assert.match(SRC, /visibilitychange/)
  assert.match(SRC, /PREVENT_DEFAULT\.has\(e\.code\)\) e\.preventDefault\(\)/)
  assert.match(SRC, /e\.repeat && phase === 'race'/)
})

test('P20: takt som Roddtakt – +0,55 upp till 4,2, samma stapel två gånger ×0,55', () => {
  let s = { v: 1, lastBar: null }
  s = R.rhythmStroke(s.v, s.lastBar, 1)
  assert.equal(s.good, true)
  assert.ok(Math.abs(s.v - 1.55) < 1e-9)
  const miss = R.rhythmStroke(s.v, s.lastBar, 1)
  assert.equal(miss.good, false)
  assert.ok(Math.abs(miss.v - 1.55 * 0.55) < 1e-9)
  let v = 0
  for (let bar = 0; bar < 20; bar++) v = R.rhythmStroke(v, bar - 1, bar).v
  assert.equal(v, 4.2)
})

test('P19: Bollingerväggen stoppar 40 steg, chili straffar, morot ger fart', () => {
  assert.equal(R.wallHit('upper', 'buy'), true)
  assert.equal(R.wallHit('lower', 'sell'), true)
  assert.equal(R.wallHit('upper', 'sell'), false)
  assert.equal(R.wallHit('lower', 'flat'), false)
  const hit = R.hitWall({ v: 3, stop: 0 })
  assert.equal(hit.v, 0)
  assert.equal(hit.stop, 40)
  assert.equal(R.fallSpeed(2, 3, 40), 0)
  assert.ok(R.fallSpeed(2, 4, 0) > R.fallSpeed(2, 1, 0))
  assert.ok(Math.abs(R.chiliPenalty(2) - 1.1) < 1e-9)
  assert.equal(R.carrotBoost(4.5), 5)
  const items = [{ kind: 'chili', id: 'c1', x: 100, y: 100, reach: 40 }, { kind: 'chili', id: 'c2', x: 400, y: 100, reach: 40 }]
  const a = R.applyChili(items, { x: 105, y: 102 }, [])
  assert.equal(a.hits, 1)
  assert.equal(R.applyChili(items, { x: 105, y: 102 }, a.hit).hits, 0, 'samma chili straffar bara en gång')
})

test('P10: signaler på kaninen – öron = läge, glasögon = resultat, batteri = marginal', () => {
  const ears = (side) => R.rabbitSprite({ side }).parts.filter((p) => p.kind === 'ear')
  assert.ok(ears('buy').every((e) => e.lean === 1), 'KÖP lutar mot KÖP-sidan (höger)')
  assert.ok(ears('sell').every((e) => e.lean === -1))
  assert.ok(ears('flat').every((e) => e.lean === 0))
  assert.ok(ears('buy')[0].x > ears('sell')[0].x)
  const eye = (result) => R.rabbitSprite({ result }).parts.find((p) => p.kind === 'eye').tint
  assert.equal(eye(2), 'gain')
  assert.equal(eye(-2), 'loss')
  assert.equal(eye(null), 'neutral')
  assert.equal(R.batteryLevel(-10, 'buy'), 0.8)
  assert.equal(R.batteryLevel(-80, 'sell'), 0)
  assert.equal(R.batteryLevel(-80, 'flat'), 1)
  const bat = R.rabbitSprite({ margin: 0.3 }).parts.find((p) => p.kind === 'battery')
  assert.equal(bat.level, 0.3)
  assert.equal(bat.logo, false)
})

test('P7: remsorna lämnar spelplanen fri vid 1280×800 och 390×844, 1P och 2P', () => {
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    for (const players of [1, 2]) {
      const s = R.stripLayout(w, h, players, 'race')
      assert.ok(s.top > 0 && s.bottom > 0)
      assert.equal(s.field.top, s.top)
      assert.equal(s.field.bottom, h - s.bottom)
      assert.ok(s.field.height > h * 0.7, `${w}×${h} ${players}P spelplan ${s.field.height}`)
    }
  }
  assert.equal(R.stripLayout(1280, 800, 1, 'home').top, 0)
})
