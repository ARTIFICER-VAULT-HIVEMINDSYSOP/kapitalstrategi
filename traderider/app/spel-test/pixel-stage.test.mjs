// 16-bit picture stage: resolution, 5-bit colour, palette size, fixed step, coyote, buffer.
import test from 'node:test'
import assert from 'node:assert/strict'

test('bildrutan är 256×224 och skalan är ett heltal', async () => {
  const { STAGE_W, STAGE_H, fitScale, STEP_SEC } = await import('../../spel/lagen/pixel-stage.js')
  assert.equal(STAGE_W, 256)
  assert.equal(STAGE_H, 224)
  assert.equal(fitScale(1280, 800), 3)
  assert.equal(fitScale(390, 844), 1)
  assert.equal(fitScale(200, 100), 1)
  assert.equal(STEP_SEC, 1 / 60)
})

test('färgerna kvantiseras till 5 bitar och en scen håller det', async () => {
  const {
    quantizeChannel,
    quantizeRgb,
    createBuffer,
    renderScene,
    channelsAre15bit,
    tilePaletteSize,
    paletteOf,
    rabbitSheet,
    MASTER_VOLUME,
  } = await import('../../spel/lagen/pixel-stage.js')
  assert.equal(quantizeChannel(255), 248)
  assert.equal(quantizeChannel(4), 0)
  assert.deepEqual(quantizeRgb(250, 100, 20), [248, 96, 16])
  const sizes = tilePaletteSize()
  for (const [name, n] of Object.entries(sizes)) assert.ok(n <= 15, name)
  for (const pose of ['stand', 'fall', 'stretch', 'squash']) {
    for (let frame = 0; frame < 4; frame++) {
      const sprite = rabbitSheet(pose, frame, frame === 2)
      assert.ok(paletteOf(sprite) <= 15, pose)
      assert.ok(sprite.w <= 32 && sprite.h <= 48)
    }
  }
  const buf = createBuffer()
  renderScene(buf, {
    phase: 'home',
    time: 1.2,
    reduced: false,
    logicW: 800,
    logicH: 600,
    groundY: 420,
    hole: { x: 400, y: 440, rx: 70, ry: 22 },
    lanes: { sell: 220, flat: 400, buy: 580 },
    stand: { x: 400, y: 416 },
    labels: { title: 'RABBIT HOLE', press: 'PRESS START', sell: 'SÄLJ', flat: 'FLAT', buy: 'KÖP' },
  })
  assert.equal(channelsAre15bit(buf), true)
  let ink = 0
  for (let i = 3; i < buf.data.length; i += 4) if (buf.data[i]) ink += 1
  assert.ok(ink > 1000)
  renderScene(buf, {
    phase: 'race',
    time: 2,
    players: 1,
    logicW: 800,
    logicH: 600,
    hud: '100.00 FLAT x1 RSI 50',
    labels: { sell: 'SÄLJ', buy: 'KÖP', tunnel: 'Tunnel', hp: '+HP', pause: 'PAUSE', resume: 'OK', sound: 'SOUND' },
    riders: [{
      walls: { sell: 220, buy: 580, hasBand: true },
      x: 400,
      rabbitY: 240,
      priceX: 500,
      region: 'tunnel',
      items: [
        { kind: 'carrot', x: 300, y: 200, label: '' },
        { kind: 'chili', x: 500, y: 180, label: '', front: true },
        { kind: 'sign', x: 360, y: 120, label: 'RSI' },
      ],
      scroll: 40,
      spin: 1,
      hp: 2,
      eating: true,
      floater: { life: 1, x: 420, y: 200 },
    }],
  })
  assert.equal(channelsAre15bit(buf), true)
  assert.ok(MASTER_VOLUME > 0 && MASTER_VOLUME <= 0.2)
})

test('fast steg, coyote och inmatningsbuffert', async () => {
  const { fixedStep, coyoteLeft, rememberInput, readBuffered, animFrame, paletteCycle, mode7Uv } = await import('../../spel/lagen/pixel-stage.js')
  const once = fixedStep(0, 1 / 60)
  assert.equal(once.steps, 1)
  assert.ok(once.accumulator < 1e-9)
  const burst = fixedStep(0, 1, 1 / 60, 5)
  assert.equal(burst.steps, 5)
  assert.equal(burst.accumulator, 0)
  assert.equal(coyoteLeft(0), 6)
  assert.equal(coyoteLeft(6), 0)
  assert.equal(coyoteLeft(2), 4)
  const entry = rememberInput('FLAT', 10, 8)
  assert.equal(readBuffered(entry, 18), 'FLAT')
  assert.equal(readBuffered(entry, 19), null)
  assert.equal(animFrame(0.5, 8, 4, true), 0)
  assert.equal(animFrame(0.4, 8, 4, false), 3)
  assert.equal(paletteCycle(1, 4, true), 0)
  const still = mode7Uv(10, 40, 256, 224, 0, 0, 20)
  const spun = mode7Uv(10, 40, 256, 224, 0.8, 30, 20)
  assert.ok(still)
  assert.notDeepEqual(still, spun)
  assert.equal(mode7Uv(10, 10, 256, 224, 0, 0, 20), null)
})

test('reducerad rörelse fryser palett, bildruta och skak i scenen', async () => {
  const { createBuffer, renderScene, animFrame } = await import('../../spel/lagen/pixel-stage.js')
  const a = createBuffer()
  const b = createBuffer()
  const scene = {
    phase: 'home',
    time: 3,
    reduced: true,
    shake: 4,
    logicW: 800,
    logicH: 600,
    groundY: 420,
    hole: { x: 400, y: 440, rx: 60, ry: 18 },
    stand: { x: 400, y: 416 },
    labels: { title: 'RABBIT HOLE', press: 'PRESS START', sell: 'SELL', flat: 'FLAT', buy: 'BUY' },
  }
  renderScene(a, scene)
  renderScene(b, { ...scene, time: 9 })
  assert.equal(animFrame(3, 8, 4, true), animFrame(9, 8, 4, true))
  let same = 0
  for (let i = 0; i < a.data.length; i++) if (a.data[i] === b.data[i]) same += 1
  assert.ok(same / a.data.length > 0.98)
})
