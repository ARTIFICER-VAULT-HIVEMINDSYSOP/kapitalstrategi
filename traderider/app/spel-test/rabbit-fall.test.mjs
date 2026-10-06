// Rabbit Hole: fallet går nedåt, spriten har öron och två ögon/linser, ingen logotyp.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SRC = readFileSync(new URL('../../spel/lagen/rabbit.js', import.meta.url), 'utf8')

test('världen rullar uppåt så kaninen faller nedåt relativt tunneln', async () => {
  const { scrollDelta, projectItem, markerScreenY, parallaxShift } = await import('../../spel/lagen/rabbit.js')
  assert.ok(scrollDelta(0, 40) < 0)
  assert.ok(scrollDelta(10, 25) < scrollDelta(10, 12))
  const before = projectItem(3, 16, 0, 800, 600, false)
  const after = projectItem(3, 16, 30, 800, 600, false)
  assert.ok(after.y < before.y, `föremål ${before.y} -> ${after.y}`)
  assert.ok(markerScreenY(20) < markerScreenY(0))
  assert.ok(parallaxShift(20, 1.4) < parallaxShift(20, 0.6))
})

test('spriten har två öron och två ögon/linser på huvudet, och huvudet leder fallet', async () => {
  const { rabbitSprite } = await import('../../spel/lagen/rabbit.js')
  const sprite = rabbitSprite()
  assert.equal(sprite.pose, 'head-first-down')
  assert.equal(sprite.fall, 'down')
  const ears = sprite.parts.filter((p) => p.kind === 'ear')
  assert.equal(ears.length, 2)
  assert.ok(ears.every((ear) => ear.on === 'head' && ear.inner === 'pink'))
  const head = sprite.parts.find((p) => p.kind === 'head')
  const body = sprite.parts.find((p) => p.kind === 'body')
  assert.ok(head.y > body.y, 'huvudet ligger lägre än kroppen')
  assert.ok(ears.every((ear) => ear.y < head.y), 'öronen pekar uppåt från huvudet')
  const eyes = sprite.parts.filter((p) => p.kind === 'eye' && p.on === 'head')
  assert.equal(eyes.length, 2)
  assert.ok(eyes[0].x !== eyes[1].x)
  const glints = sprite.parts.filter((p) => p.kind === 'glint')
  assert.equal(glints.length, 2)
  const battery = sprite.parts.find((p) => p.kind === 'battery')
  assert.equal(battery.logo, false)
  assert.equal(battery.on, 'arm-r')
  assert.equal(battery.x, 62)
  assert.equal(battery.y, -66)
  assert.equal(sprite.parts.find((p) => p.kind === 'nose').on, 'head')
  assert.equal(sprite.parts.filter((p) => p.kind === 'cheek').length, 2)
  assert.equal(rabbitSprite({ eating: true }).parts.find((p) => p.kind === 'mouth').expression, 'eating')
  const feet = sprite.parts.filter((p) => p.kind === 'foot')
  assert.equal(feet.length, 2)
  assert.ok(feet.every((foot) => foot.y < head.y))
})

test('batteriet sitter vid höger tass och skär inte bålen', async () => {
  const { rabbitSprite, batteryBounds, torsoBounds, boundsIntersect } = await import('../../spel/lagen/rabbit.js')
  const sprite = rabbitSprite()
  const battery = sprite.parts.find((p) => p.kind === 'battery')
  const body = sprite.parts.find((p) => p.kind === 'body')
  const ear = sprite.parts.find((p) => p.id === 'ear-r')
  const box = batteryBounds(battery)
  const torso = torsoBounds(body)
  assert.equal(boundsIntersect(box, torso), false)
  assert.ok(box.left > torso.right)
  assert.ok(box.left > ear.x + 16, 'batteriet ligger till höger om höger öra')
})

test('inget som ritas framför kaninen skär bålen', async () => {
  const { drawsInFront, rabbitBodyBox, itemScreenBox, boundsIntersect } = await import('../../spel/lagen/rabbit.js')
  const scale = 1.25
  const x = 640
  const y = 360
  const body = rabbitBodyBox(x, y, scale)
  let inFront = 0
  for (const kind of ['chili', 'carrot', 'sign']) {
    for (let dx = -240; dx <= 240; dx += 12) {
      for (let dy = -280; dy <= 80; dy += 14) {
        const item = { kind, x: x + dx, y: y + dy, scale: 1.15 }
        if (!drawsInFront(item, x, y, scale)) continue
        inFront += 1
        assert.equal(boundsIntersect(itemScreenBox(item), body), false, `${kind} ${dx},${dy}`)
      }
    }
  }
  assert.ok(inFront > 0, 'en chili vid sidan ska ligga framför')
  assert.equal(drawsInFront({ kind: 'chili', x: x + 200, y: y - 90, scale: 1 }, x, y, scale), true)
  assert.equal(drawsInFront({ kind: 'chili', x, y: y - 70 * scale, scale: 1 }, x, y, scale), false)
  assert.equal(drawsInFront({ kind: 'carrot', x: x + 200, y: y - 90, scale: 1 }, x, y, scale), false)
  assert.equal(drawsInFront({ kind: 'sign', x: x + 200, y: y - 90, scale: 1 }, x, y, scale), false)
})

test('ett steg i läget flyttar tunneln uppåt förbi kaninen', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.HTMLElement = w.HTMLElement
  globalThis.localStorage = w.localStorage
  globalThis.matchMedia = () => ({ matches: false })
  globalThis.devicePixelRatio = 1
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  const { createRabbit } = await import('../../spel/lagen/rabbit.js')
  const rabbit = createRabbit()
  rabbit.show()
  const before = rabbit.state()
  const ears = before.sprite.parts.filter((p) => p.kind === 'ear')
  const eyes = before.sprite.parts.filter((p) => p.kind === 'eye' && p.on === 'head')
  assert.equal(ears.length, 2)
  assert.equal(eyes.length, 2)
  assert.equal(before.phase, 'home')
  assert.equal(before.above, true)
  assert.equal(before.motion, 'home')
  assert.ok(before.home.groundY < 600)
  assert.ok(document.querySelector('[data-rh-home]'))
  assert.ok(document.querySelector('[data-rh-start="1"]'))
  rabbit.step(0.2)
  assert.equal(rabbit.state().y, before.y)
  assert.equal(rabbit.state().phase, 'home')
  rabbit.start()
  assert.equal(rabbit.state().phase, 'jump')
  rabbit.step(0.8)
  assert.equal(rabbit.state().phase, 'race')
  const landed = rabbit.state()
  rabbit.step(0.2)
  const after = rabbit.state()
  assert.ok(after.y > landed.y)
  assert.ok(after.markerY < landed.markerY)
  assert.equal(after.motion, 'fall')
  assert.equal(after.indicators.decision, 'flat')
  rabbit.hide()
})

test('reducerad rörelse stoppar spiral och parallax', async () => {
  const { spiralAngle, parallaxShift, scrollDelta, projectItem, createRabbit } = await import('../../spel/lagen/rabbit.js')
  assert.equal(spiralAngle(4, true), 0)
  assert.notEqual(spiralAngle(4, false), 0)
  assert.equal(parallaxShift(30, 2, true), 0)
  assert.equal(scrollDelta(0, 30, true), 0)
  const still = projectItem(2, 10, 0, 400, 300, true)
  const later = projectItem(2, 10, 80, 400, 300, true)
  assert.equal(later.y, still.y)
  globalThis.matchMedia = () => ({ matches: true })
  const rabbit = createRabbit()
  rabbit.show()
  assert.equal(rabbit.state().phase, 'home')
  rabbit.start()
  const before = rabbit.state()
  assert.equal(before.phase, 'race')
  assert.equal(before.jump, 1)
  rabbit.step(0.4)
  const after = rabbit.state()
  assert.equal(after.markerY, before.markerY)
  assert.equal(after.y, before.y)
  assert.equal(after.spiral, 0)
  assert.equal(after.motion, 'reduced')
  assert.equal(after.indicators.fallRate, 0)
  assert.equal(after.indicators.band, 'still')
  assert.equal(rabbit.anchor(), 'bottom')
  rabbit.hide()
})

test('Rabbit Hole-källan och etiketterna saknar varumärke och ticker', async () => {
  const { artLabels } = await import('../../spel/lagen/rabbit.js')
  const banned = /Duracell|BRK\.B|\bBRK\b|\bNVDA\b|Berkshire|Liseberg|Julius|Disney/i
  assert.equal(banned.test(SRC), false)
  for (const label of artLabels()) assert.equal(banned.test(label), false)
  assert.deepEqual(artLabels(), ['RSI', 'MACD', '+HP'])
  assert.match(SRC, /prefers-reduced-motion/)
})

test('start, hopp och indikatorer: hemma, sedan fall med sidläge', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.HTMLElement = w.HTMLElement
  globalThis.localStorage = w.localStorage
  globalThis.matchMedia = () => ({ matches: false })
  globalThis.devicePixelRatio = 1
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  const { createRabbit, movementIndicators, fallRate } = await import('../../spel/lagen/rabbit.js')
  const { STRINGS } = await import('../../spel/lagen/i18n.js')
  const keys = [
    'rh.homeTitle', 'rh.homeBody', 'rh.jump', 'rh.jumpKey', 'rh.two', 'rh.twoHint',
    'rh.fall', 'rh.fallStill', 'rh.fallSlow', 'rh.fallSteady', 'rh.fallFast',
    'rh.lane', 'rh.left', 'rh.center', 'rh.right', 'rh.decision',
    'rh.cue.sell', 'rh.cue.flat', 'rh.cue.buy', 'rh.p1', 'rh.p2',
    'rh.band', 'rh.bandRole', 'rh.bandWait', 'rh.tunnel', 'rh.hole',
    'rh.wallUpper', 'rh.wallLower', 'rh.touchUpper', 'rh.touchLower',
    'rh.nearUpper', 'rh.nearLower', 'rh.rsi', 'rh.rsiHigh', 'rh.rsiLow',
    'rh.macd', 'rh.macdUp', 'rh.macdDown',
    'rh.pressStart', 'rh.pause', 'rh.resume', 'rh.soundOn', 'rh.soundOff',
    'rh.qualityHigh', 'rh.qualityLow',
  ]
  for (const lang of ['sv', 'en', 'uk']) {
    for (const key of keys) assert.equal(typeof STRINGS[lang][key], 'string', `${lang} ${key}`)
    assert.match(STRINGS[lang]['rh.homeBody'], /hävstång|leverage|плече/i)
  }
  w.__trEngine = { quote: { candles: Array.from({ length: 40 }, (_, i) => ({ c: 100 + Math.sin(i / 5) * 3 })) } }
  const rabbit = createRabbit()
  rabbit.show()
  const view = () => document.querySelector('.nlr-rh.on')
  const card = view().querySelector('[data-rh-home-body]')
  assert.equal(card.textContent, STRINGS.sv['rh.homeBody'])
  assert.match(view().querySelector('[data-tr-claim]').textContent, /Simulerade kurser/)
  w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'KeyD' }))
  assert.equal(rabbit.state().side, 'buy')
  assert.ok(rabbit.state().indicators.offset > 0)
  w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'Enter' }))
  assert.equal(rabbit.state().phase, 'jump')
  rabbit.step(0.8)
  assert.equal(rabbit.state().phase, 'race')
  const slow = rabbit.state().indicators.fallRate
  w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'KeyW' }))
  const faster = rabbit.state().indicators.fallRate
  assert.ok(faster > slow)
  w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'ArrowDown' }))
  assert.ok(rabbit.state().indicators.fallRate < faster)
  assert.equal(rabbit.state().border.hasBand, true)
  assert.equal(rabbit.state().region, 'border')
  assert.ok(Math.abs(rabbit.state().x - rabbit.state().buy) < 0.01)
  assert.match(view().querySelector('[data-rh-bb]').textContent, /tunnel/)
  assert.match(view().querySelector('[data-rh-rsi]').textContent, /RSI/)
  assert.match(view().querySelector('[data-rh-macd]').textContent, /MACD/)
  assert.equal(fallRate(4, false) > fallRate(1, false), true)
  const panel = view().querySelector('[data-rh-decision="1"]')
  assert.equal(panel.textContent, STRINGS.sv['btn.buy'])
  assert.equal(panel.dataset.side, 'buy')
  assert.match(view().querySelector('[data-rh-fall="1"]').textContent, /Fallfart/)
  assert.match(view().querySelector('[data-rh-cue="1"]').textContent, /KÖP/)
  const flat = movementIndicators({ side: 'flat', leverage: 1, width: 800 })
  const sell = movementIndicators({ side: 'sell', leverage: 1, width: 800 })
  assert.ok(sell.x < flat.x)
  assert.equal(rabbit.anchor(), 'bottom')
  rabbit.hide()

  const duo = createRabbit()
  duo.show()
  view().querySelector('[data-rh-start="2"]').click()
  assert.equal(duo.state().phase, 'jump')
  assert.equal(duo.state().players, 2)
  duo.step(0.8)
  assert.equal(duo.state().phase, 'race')
  w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'ArrowRight' }))
  const both = duo.state()
  assert.equal(both.riders[0].side, 'flat')
  assert.equal(both.riders[1].side, 'buy')
  assert.equal(view().querySelectorAll('[data-rh-player]').length, 2)
  duo.freeze()
  duo.resume()
  assert.equal(duo.anchor(), 'bottom')
  duo.hide()
})

test('morot ger en liten mängd HP, chili är fallande stapel', async () => {
  const { eatCarrot, applyPickups, candleKind, CARROT_HP, HP_MAX } = await import('../../spel/lagen/rabbit.js')
  assert.equal(CARROT_HP, 1)
  assert.equal(eatCarrot(0), 1)
  assert.equal(eatCarrot(HP_MAX), HP_MAX)
  const hit = applyPickups([{ id: 'a', kind: 'carrot', x: 10, y: 10, reach: 8 }], { x: 12, y: 12 }, 2, [])
  assert.equal(hit.gained, 1)
  assert.equal(hit.hp, 3)
  const miss = applyPickups([{ id: 'b', kind: 'chili', x: 10, y: 10, reach: 8 }], { x: 10, y: 10 }, 2, [])
  assert.equal(miss.gained, 0)
  const again = applyPickups([{ id: 'a', kind: 'carrot', x: 10, y: 10, reach: 8 }], { x: 10, y: 10 }, 3, hit.eaten)
  assert.equal(again.gained, 0)
  assert.equal(candleKind({ o: 10, c: 12 }), 'carrot')
  assert.equal(candleKind({ open: 12, close: 9 }), 'chili')
})
