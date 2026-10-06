// Picture stage: fixed step, coyote, Bollinger walls in world space, quality, pinned three.js.
import test from 'node:test'
import assert from 'node:assert/strict'

test('fast steg, coyote och inmatningsbuffert', async () => {
  const { fixedStep, coyoteLeft, rememberInput, readBuffered, animFrame, STEP_SEC, MASTER_VOLUME } = await import('../../spel/lagen/world-stage.js')
  assert.equal(STEP_SEC, 1 / 60)
  const once = fixedStep(0, 1 / 60)
  assert.equal(once.steps, 1)
  const burst = fixedStep(0, 1, 1 / 60, 5)
  assert.equal(burst.steps, 5)
  assert.equal(burst.accumulator, 0)
  assert.equal(coyoteLeft(0), 6)
  assert.equal(coyoteLeft(6), 0)
  const entry = rememberInput('FLAT', 10, 8)
  assert.equal(readBuffered(entry, 18), 'FLAT')
  assert.equal(readBuffered(entry, 19), null)
  assert.equal(animFrame(0.4, 8, 4, false), 3)
  assert.equal(animFrame(0.5, 8, 4, true), 0)
  assert.ok(MASTER_VOLUME > 0 && MASTER_VOLUME <= 0.2)
})

test('schaktväggarna följer banden och kameran svänger in', async () => {
  const { bandSpan, worldX, easeToward, defaultQuality, THREE_REVISION } = await import('../../spel/lagen/world-stage.js')
  const narrow = bandSpan(320, 480, 800)
  const wide = bandSpan(160, 640, 800)
  assert.ok(wide.right - wide.left > narrow.right - narrow.left)
  assert.ok(narrow.left < 0 && narrow.right > 0)
  assert.ok(worldX(0, 800) < worldX(800, 800))
  assert.equal(easeToward(0, 10, 1, true), 10)
  const mid = easeToward(0, 10, 1 / 60, false)
  assert.ok(mid > 0 && mid < 10)
  assert.equal(defaultQuality(390, true), 'low')
  assert.equal(defaultQuality(1440, false), 'high')
  assert.equal(defaultQuality(640, false), 'low')
  assert.equal(THREE_REVISION, '186')
})

test('utan WebGL blir läget en duk, och reducerad rörelse snappar kameran', async () => {
  const { createWorld, paintFallback, easeToward } = await import('../../spel/lagen/world-stage.js')
  const world = createWorld(null)
  assert.equal(world.mode(), 'canvas')
  world.setQuality('low')
  assert.equal(world.quality(), 'low')
  world.render({ phase: 'home', time: 0, reduced: true }, 320, 180)
  const calls = []
  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return {
        createLinearGradient() {
          return { addColorStop() {} }
        },
        fillRect() { calls.push('fill') },
        beginPath() {},
        ellipse() {},
        arc() {},
        fill() { calls.push('shape') },
        stroke() {},
        save() {},
        restore() {},
        clip() {},
        rect() {},
      }
    },
  }
  paintFallback(canvas, 320, 180, {
    phase: 'race',
    side: 'buy',
    logicW: 800,
    riders: [{ walls: { sell: 200, buy: 600 }, logicW: 800, x: 600 }],
  })
  assert.ok(calls.includes('fill'))
  assert.equal(easeToward(2, 8, 0, true), 8)
})
