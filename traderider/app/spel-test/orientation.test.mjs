import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MODES,
  keyToIntent,
  wheelToIntent,
  applyIntent,
  instructionText,
  createSteering,
  modeFromHash,
  hashForView,
  travelVector,
} from '../../spel/lagen/orientation.js'
import { stepSide } from '../../spel/lagen/styrmotor.js'
import { t, setLang } from '../../spel/lagen/i18n.js'

const ORIENTATIONS = {
  right: { movement: 'right', highPriceSide: 'up' },
  left: { movement: 'left', highPriceSide: 'up' },
  up: { movement: 'up', highPriceSide: 'right' },
  down: { movement: 'down', highPriceSide: 'right' },
}

test('W är FORWARD och S är BACKWARD i alla fyra riktningar', () => {
  for (const o of Object.values(ORIENTATIONS)) {
    assert.equal(keyToIntent('KeyW', o), 'FORWARD')
    assert.equal(keyToIntent('KeyS', o), 'BACKWARD')
  }
})

test('pilen längs rörelsen ökar hävstången', () => {
  assert.equal(keyToIntent('ArrowRight', ORIENTATIONS.right), 'FORWARD')
  assert.equal(keyToIntent('ArrowLeft', ORIENTATIONS.left), 'FORWARD')
  assert.equal(keyToIntent('ArrowUp', ORIENTATIONS.up), 'FORWARD')
  assert.equal(keyToIntent('ArrowDown', ORIENTATIONS.down), 'FORWARD')
})

test('per läge: W/S oförändrade, pil längs rörelsen, tvärställda pilar och hjul styr, mellanslag är FLAT', () => {
  const cases = [
    [MODES.trendRider.orientation, 'ArrowRight', 'ArrowUp', 'ArrowDown'],
    [MODES.raket.orientation, 'ArrowUp', 'ArrowRight', 'ArrowLeft'],
    [MODES.rabbitHole.orientation, 'ArrowDown', 'ArrowRight', 'ArrowLeft'],
  ]
  for (const [o, fwd, high, low] of cases) {
    assert.equal(keyToIntent('KeyW', o), 'FORWARD')
    assert.equal(keyToIntent('KeyS', o), 'BACKWARD')
    assert.equal(keyToIntent(fwd, o), 'FORWARD')
    assert.equal(keyToIntent(high, o), 'STEER_TOWARD_HIGH')
    assert.equal(keyToIntent(low, o), 'STEER_TOWARD_LOW')
    assert.equal(keyToIntent('Space', o), 'FLAT')
    assert.equal(wheelToIntent(-1), 'STEER_TOWARD_HIGH')
    assert.equal(wheelToIntent(1), 'STEER_TOWARD_LOW')
  }
})

test('styrning är ett steg och pilarna äger cykeln, W ändrar inte sida', () => {
  let side = 'flat'
  side = applyIntent({ side, leverage: 1 }, 'STEER_TOWARD_HIGH').side
  assert.equal(side, 'buy')
  side = applyIntent({ side, leverage: 1 }, 'STEER_TOWARD_LOW').side
  assert.equal(side, 'flat')
  side = applyIntent({ side, leverage: 1 }, 'STEER_TOWARD_LOW').side
  assert.equal(side, 'sell')
  side = applyIntent({ side, leverage: 1 }, 'STEER_TOWARD_HIGH').side
  assert.equal(side, 'flat')
  assert.equal(applyIntent({ side: 'buy', leverage: 2 }, 'FORWARD').side, 'buy')
  assert.equal(applyIntent({ side: 'sell', leverage: 2 }, 'BACKWARD').side, 'sell')
  assert.equal(applyIntent({ side: 'buy', leverage: 3 }, 'FLAT').side, 'flat')
  assert.equal(applyIntent({ side: 'buy', leverage: 2 }, 'STEER_TOWARD_HIGH').side, 'buy')
})

test('90 grader byter både tangentkarta och instruktion utan annan kod', () => {
  setLang('sv')
  const right = instructionText(ORIENTATIONS.right, t)
  const down = instructionText(ORIENTATIONS.down, t)
  assert.notEqual(right, down)
  assert.match(right, /↑ \/ ↓ eller scrollhjulet/)
  assert.match(right, /W eller →\/D/)
  assert.match(right, /Högre hävstång kan ge större vinst men också större förlust/)
  assert.match(down, /→\/D \/ ←\/A eller scrollhjulet/)
  assert.match(down, /W eller ↓/)
  assert.equal(keyToIntent('ArrowUp', ORIENTATIONS.right), 'STEER_TOWARD_HIGH')
  assert.equal(keyToIntent('ArrowUp', ORIENTATIONS.down), 'BACKWARD')
})

test('de tre lägena delar stepSide och har ingen egen styrmotor i källan', () => {
  const a = createSteering(MODES.raket.orientation)
  const b = createSteering(MODES.trendRider.orientation)
  const c = createSteering(MODES.rabbitHole.orientation)
  assert.equal(a.stepSide, b.stepSide)
  assert.equal(b.stepSide, c.stepSide)
  assert.equal(a.stepSide, stepSide)
  for (const file of ['raket.js', 'panel.js', 'duo.js', 'akademin.js']) {
    const src = readFileSync(new URL(`../../spel/lagen/${file}`, import.meta.url), 'utf8')
    assert.equal(src.includes('function stepSide'), false, file)
  }
  const joined = JSON.stringify(MODES) + readFileSync(new URL('../../spel/lagen/orientation.js', import.meta.url), 'utf8')
  assert.equal(/\bgas\b|\bbroms\b|\bbrake\b/i.test(joined), false)
})

test('hash: #nvda-rider är kanonisk, alias och de andra lägena', () => {
  assert.equal(modeFromHash('#nvda-rider'), 'line')
  assert.equal(modeFromHash('#trend-rider'), 'line')
  assert.equal(modeFromHash('#line-rider'), 'line')
  assert.equal(modeFromHash('#raket'), 'raket')
  assert.equal(modeFromHash('#rabbit-hole'), 'rabbit')
  assert.equal(hashForView('line'), 'nvda-rider')
  assert.equal(hashForView('rabbit'), 'rabbit-hole')
  assert.equal(travelVector(MODES.rabbitHole.orientation).y, 1)
  assert.equal(travelVector(MODES.raket.orientation).y, -1)
  assert.equal(travelVector(MODES.trendRider.orientation).x, 1)
})
