import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { createPhases, summarySentence, createPlayback, mountFas, PHASES } from '../../spel/lagen/faser.js'
import { historicalSource, openLiveSource } from '../../spel/lagen/kalla.js'
import { HISTORIA } from '../../spel/lagen/historia-data.js'
import { attachLiveFeed, resetLiveFeedForTests, useLiveFeed } from '../../spel/lagen/live-port.js'
import { t, setLang } from '../../spel/lagen/i18n.js'

test('historien tar slut i Gränslandet och går aldrig vidare av sig själv', () => {
  const phases = createPhases(() => null)
  assert.deepEqual(phases.phases, PHASES)
  assert.equal(PHASES.includes('live'), true)
  let ended = 0
  const play = createPlayback(HISTORIA.bars, {
    onIndex() {},
    onEnd() {
      ended += 1
      phases.endHistoria()
    },
  })
  play.start(false)
  while (!play.done()) play.tick()
  play.tick()
  assert.equal(ended, 1)
  assert.equal(phases.phase(), 'granslandet')
  phases.advance()
  assert.equal(phases.phase(), 'granslandet')
  assert.equal(phases.tryCross(), false)
})

test('sammanfattningen har risk i samma mening som vinst och hävstång', () => {
  setLang('sv')
  const text = summarySentence({ side: 'buy', leverage: 2 }, t)
  assert.match(text, /hävstång 2/)
  assert.match(text, /vinst/)
  assert.match(text, /förlust/)
  assert.equal(text.split('.').filter(Boolean).length, 1)
})

test('liveFeed null visar bara sammanfattning, igen och menyn', () => {
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.matchMedia = () => ({ matches: true })
  setLang('sv')
  resetLiveFeedForTests()
  const ui = mountFas(w.document.body, {
    getOrientation: () => ({ movement: 'down', highPriceSide: 'right' }),
    getPlace: () => 'bottom',
    isActive: () => true,
  })
  ui.play()
  const phases = ui.phases
  while (phases.phase() === 'historia') {
    // reduced motion jumps to the end inside play(); if not, step the machine
    phases.endHistoria()
  }
  ui.sync()
  const root = ui.root
  assert.equal(root.dataset.place, 'bottom')
  assert.equal(root.querySelector('[data-tr-summary]').textContent.includes('förlust'), true)
  assert.equal(root.querySelector('[data-tr-replay]').textContent, t('grans.replay'))
  assert.equal(root.querySelector('[data-tr-menu]').textContent, t('grans.menu'))
  assert.equal(root.querySelector('[data-tr-cross]'), null)
  assert.equal(root.querySelector('[data-tr-live-status]').textContent, '')
  assert.equal(/websocket|fetch\(/i.test(root.textContent), false)
  assert.equal(root.textContent.includes(t('grans.cross')), false)
})

test('ett stängt flöde visar status och stannar i Gränslandet', () => {
  const feed = { status: () => 'stangd', subscribe: () => () => {} }
  const phases = createPhases(() => feed)
  phases.endHistoria()
  assert.equal(phases.phase(), 'granslandet')
  assert.equal(phases.statusKey(), 'live.stangd')
  assert.equal(phases.showCross(), false)
  phases.advance()
  assert.equal(phases.phase(), 'granslandet')
})

test('Historia döljer simulerad markör och startkort under hela fasen', () => {
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.matchMedia = () => ({ matches: false })
  setLang('sv')
  resetLiveFeedForTests()
  const splash = w.document.createElement('div')
  splash.dataset.trSplash = '1'
  const pill = w.document.createElement('span')
  pill.textContent = t('sim.badge')
  const board = w.document.createElement('button')
  board.textContent = t('splash.board')
  splash.append(pill, board)
  const top = w.document.createElement('div')
  top.className = 'tr-sim'
  top.textContent = t('sim.label')
  w.document.body.append(splash, top)
  const ui = mountFas(w.document.body, {
    getOrientation: () => ({ movement: 'down', highPriceSide: 'right' }),
    getPlace: () => 'chart',
    isActive: () => true,
  })
  ui.play()
  let guard = 0
  while (ui.phases.phase() === 'historia' && guard++ < HISTORIA.bars.length + 2) ui.step()
  assert.equal(ui.phases.phase(), 'granslandet')
  assert.equal(ui.shots.length, HISTORIA.bars.length)
  assert.ok(ui.shots.length >= 21)
  for (const shot of ui.shots) {
    assert.equal(shot.badgeOn, true)
    assert.equal(shot.simOn, false)
    assert.equal(shot.badgeOn && shot.simOn, false)
  }
})

test('ett live-flöde gör korset tillgängligt och tickar går genom samma källa', () => {
  const ticks = [{ t: 1, price: 101 }, { t: 2, price: 102 }]
  const feed = {
    status: () => 'live',
    subscribe(_symbol, onTick) {
      for (const tick of ticks) onTick(tick)
      return () => {}
    },
  }
  const phases = createPhases(() => feed)
  phases.endHistoria()
  assert.equal(phases.showCross(), true)
  assert.equal(phases.tryCross(), true)
  assert.equal(phases.phase(), 'live')
  const history = historicalSource(HISTORIA.bars)
  const live = openLiveSource(feed, 'NVDA')
  assert.equal(typeof history.read, 'function')
  assert.equal(typeof live.read, 'function')
  assert.deepEqual(live.read(), ticks)
  assert.equal(history.read()[0].price, 100)
  attachLiveFeed(feed)
  assert.equal(useLiveFeed(), feed)
  resetLiveFeedForTests()
  assert.equal(useLiveFeed(), null)
})
