// Gränslandet-lobbyn: HIST -> LOBBY(acc P1, acc P2) -> LIVE. Kör: node --test traderider/app/spel-test/granslandet-lobby.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import {
  STATES,
  createLobbyMachine,
  connectTransport,
  createLoopbackPair,
  keyToAction,
  labelsFor,
  LABELS,
  sourceLine,
  formatClock,
  linePoints,
  enterLobby,
  accept,
  unaccept,
  currentLobby,
  closeLobby,
} from '../../spel/lagen/granslandet.js'

function clock(start = 1_000_000) {
  let t = start
  return { now: () => t, add: (ms) => (t += ms) }
}

test('startar i HIST och går till LOBBY med nollställda accept', () => {
  const m = createLobbyMachine({ players: 2 })
  assert.equal(m.phase(), STATES.HIST)
  assert.equal(m.accept(1), false, 'accept i HIST gör ingenting')
  assert.equal(m.enter(), true)
  assert.equal(m.phase(), STATES.LOBBY)
  assert.deepEqual(m.snapshot().accepted, [false, false])
  assert.equal(m.enter(), false, 'enter två gånger gör ingenting')
})

test('båda måste acceptera innan LIVE', () => {
  const m = createLobbyMachine({ players: 2 })
  const events = []
  m.subscribe((_s, e) => events.push(e.type))
  m.enter()
  assert.equal(m.accept(1), true)
  assert.equal(m.phase(), STATES.LOBBY)
  assert.equal(m.accept(1), false, 'dubbel accept ändrar inget')
  assert.equal(m.accept(2), true)
  assert.equal(m.phase(), STATES.LIVE)
  assert.deepEqual(events, ['enter', 'accept', 'live'])
})

test('accept kan ångras tills båda har accepterat, sedan inte', () => {
  const m = createLobbyMachine({ players: 2 })
  m.enter()
  m.accept(2)
  assert.equal(m.unaccept(2), true)
  assert.deepEqual(m.snapshot().accepted, [false, false])
  assert.equal(m.unaccept(2), false)
  m.accept(1)
  m.accept(2)
  assert.equal(m.phase(), STATES.LIVE)
  assert.equal(m.unaccept(1), false, 'ingen ångra efter LIVE')
  assert.equal(m.phase(), STATES.LIVE)
})

test('toggle växlar accept och ogiltiga spelare ignoreras', () => {
  const m = createLobbyMachine({ players: 2 })
  m.enter()
  assert.equal(m.toggle(1), true)
  assert.deepEqual(m.snapshot().accepted, [true, false])
  assert.equal(m.toggle(1), true)
  assert.deepEqual(m.snapshot().accepted, [false, false])
  assert.equal(m.accept(3), false)
  assert.equal(m.accept(0), false)
  assert.equal(m.accept('1'), false)
})

test('avböj går tillbaka till HIST och nollställer', () => {
  const m = createLobbyMachine({ players: 2 })
  let last = null
  m.subscribe((s, e) => (last = { s, e }))
  m.enter()
  m.accept(1)
  assert.equal(m.decline(2), true)
  assert.equal(m.phase(), STATES.HIST)
  assert.equal(last.e.type, 'decline')
  assert.equal(last.e.player, 2)
  assert.deepEqual(last.s.accepted, [false, false])
  assert.equal(m.decline(1), false, 'avböj utanför LOBBY gör ingenting')
})

test('timeout går tillbaka till HIST, även om en spelare har accepterat', () => {
  const c = clock()
  const m = createLobbyMachine({ players: 2, timeoutMs: 10_000, now: c.now })
  m.enter()
  m.accept(1)
  c.add(9_999)
  assert.equal(m.tick(), false)
  assert.equal(m.snapshot().remainingMs, 1)
  c.add(1)
  assert.equal(m.tick(), true)
  assert.equal(m.phase(), STATES.HIST)
  assert.equal(m.snapshot().reason, 'timeout')
})

test('ångra förlänger inte tiden och LIVE har ingen timeout', () => {
  const c = clock()
  const m = createLobbyMachine({ players: 2, timeoutMs: 5_000, now: c.now })
  m.enter()
  const d = m.snapshot().deadline
  m.accept(1)
  m.unaccept(1)
  assert.equal(m.snapshot().deadline, d)
  m.accept(1)
  m.accept(2)
  c.add(60_000)
  assert.equal(m.tick(), false)
  assert.equal(m.phase(), STATES.LIVE)
})

test('1 spelare: en accept räcker', () => {
  const m = createLobbyMachine({ players: 1 })
  m.enter()
  assert.deepEqual(m.snapshot().accepted, [false])
  m.accept(1)
  assert.equal(m.phase(), STATES.LIVE)
})

test('reset tar maskinen till HIST och lobbyn kan öppnas igen', () => {
  const m = createLobbyMachine({ players: 2 })
  m.enter()
  m.accept(1)
  m.accept(2)
  m.reset()
  assert.equal(m.phase(), STATES.HIST)
  assert.equal(m.enter(), true)
  assert.deepEqual(m.snapshot().accepted, [false, false])
})

test('online-porten: två skärmar speglar varandra via en transport (ingen server)', () => {
  const [ta, tb] = createLoopbackPair()
  const a = createLobbyMachine({ players: 2 })
  const b = createLobbyMachine({ players: 2 })
  a.enter()
  b.enter()
  const pa = connectTransport(a, ta, { localPlayers: [1] })
  const pb = connectTransport(b, tb, { localPlayers: [2] })
  assert.equal(pa.accept(2), false, 'skärm A styr inte spelare 2')
  assert.equal(pa.accept(1), true)
  assert.deepEqual(b.snapshot().accepted, [true, false])
  pa.unaccept(1)
  assert.deepEqual(b.snapshot().accepted, [false, false])
  pa.accept(1)
  pb.accept(2)
  assert.equal(a.phase(), STATES.LIVE)
  assert.equal(b.phase(), STATES.LIVE)
  pa.disconnect()
  pb.disconnect()
})

test('online-porten: avböj från en skärm tar båda till HIST', () => {
  const [ta, tb] = createLoopbackPair()
  const a = createLobbyMachine({ players: 2 })
  const b = createLobbyMachine({ players: 2 })
  a.enter()
  b.enter()
  connectTransport(a, ta, { localPlayers: [1] })
  const pb = connectTransport(b, tb, { localPlayers: [2] })
  pb.decline(2)
  assert.equal(a.phase(), STATES.HIST)
  assert.equal(b.phase(), STATES.HIST)
})

test('tangenter: E = spelare 1, Enter = spelare 2, Esc = tillbaka; 1P tar båda', () => {
  assert.deepEqual(keyToAction('KeyE', 2), { player: 1 })
  assert.deepEqual(keyToAction('Enter', 2), { player: 2 })
  assert.deepEqual(keyToAction('Escape', 2), { back: true })
  assert.equal(keyToAction('KeyX', 2), null)
  assert.deepEqual(keyToAction('Enter', 1), { player: 1 })
  assert.deepEqual(keyToAction('Space', 1), { player: 1 })
})

test('texter: alla språk har samma nycklar, inga köp/sälj-råd, ingen shop eller NFT', () => {
  const keys = Object.keys(LABELS.sv).sort()
  for (const lang of ['no', 'en', 'uk']) assert.deepEqual(Object.keys(LABELS[lang]).sort(), keys, lang)
  const all = Object.values(LABELS).flatMap((l) => Object.values(l)).join(' ').toLowerCase()
  for (const word of ['köp', 'sälj', 'buy', 'sell', 'kjøp', 'selg', 'shop', 'butik', 'nft', 'advisory', 'rekommend', 'garanti']) {
    assert.equal(all.includes(word), false, word)
  }
  assert.equal(labelsFor('xx').title, 'Gränslandet')
  assert.equal(labelsFor('en', { title: 'X' }).title, 'X')
})

test('LIVE-raden visar källa och tid i Stockholmstid, annars att källan saknas', () => {
  const L = labelsFor('sv')
  const t = Date.UTC(2026, 9, 17, 10, 5)
  assert.equal(formatClock(t), '12:05')
  assert.equal(sourceLine({ name: 'Coinbase', time: t }, L, 0), 'Coinbase · 12:05')
  assert.equal(sourceLine(null, L, t), L.noSource)
  assert.equal(linePoints([]).split(' ').length, 2)
  assert.equal(linePoints([1, 2, 3]).split(' ').length, 3)
})

function dom() {
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/' })
  globalThis.window = w
  globalThis.document = w.document
  return w
}

test('vyn: helskärmsscen, knappar per spelare, ångra, båda -> onLive', () => {
  const w = dom()
  let live = 0
  let back = 0
  const view = enterLobby({ players: 2, onLive: () => live++, onBack: () => back++, autoTick: false, history: [1, 3, 2] })
  const root = w.document.querySelector('[data-gl-lobby]')
  assert.ok(root)
  assert.equal(root.getAttribute('role'), 'dialog')
  assert.equal(root.getAttribute('aria-modal'), 'true')
  assert.equal(root.parentElement, w.document.body, 'monteras direkt i body, inte i spelplanen')
  const b1 = root.querySelector('[data-gl-accept="1"]')
  const b2 = root.querySelector('[data-gl-accept="2"]')
  assert.equal(b1.getAttribute('aria-pressed'), 'false')
  b1.click()
  assert.equal(b1.getAttribute('aria-pressed'), 'true')
  b1.click()
  assert.equal(b1.getAttribute('aria-pressed'), 'false', 'andra klicket ångrar')
  assert.equal(accept(1), true, 'modul-API accept(player)')
  assert.equal(unaccept(1), true, 'modul-API unaccept(player)')
  assert.equal(currentLobby(), view)
  b1.click()
  b2.click()
  assert.equal(live, 1)
  assert.equal(back, 0)
  assert.equal(w.document.querySelector('[data-gl-lobby]'), null, 'lobbyn stängs vid LIVE')
  assert.equal(currentLobby(), null)
})

test('vyn: tangentbord E/Enter accepterar, Esc går tillbaka', () => {
  const w = dom()
  let back = null
  enterLobby({ players: 2, onBack: (i) => (back = i), autoTick: false })
  const key = (code) => w.dispatchEvent(new w.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }))
  key('KeyE')
  assert.equal(w.document.querySelector('[data-gl-accept="1"]').getAttribute('aria-pressed'), 'true')
  key('Escape')
  assert.deepEqual(back, { reason: 'decline', player: null })
  assert.equal(w.document.querySelector('[data-gl-lobby]'), null)
})

test('vyn: Tillbaka-knappen och timeout ger onBack', () => {
  const w = dom()
  const c = clock()
  let reason = null
  const view = enterLobby({ players: 2, onBack: (i) => (reason = i.reason), autoTick: false, timeoutMs: 1000, now: c.now })
  c.add(1000)
  view.tick()
  assert.equal(reason, 'timeout')
  enterLobby({ players: 1, onBack: (i) => (reason = i.reason), autoTick: false })
  w.document.querySelector('[data-gl-back]').click()
  assert.equal(reason, 'decline')
  closeLobby()
})

test('vyn: LIVE-etikett och källa syns direkt i lobbyn', () => {
  const w = dom()
  enterLobby({ players: 2, source: { name: 'Coinbase', time: Date.UTC(2026, 9, 17, 10, 5) }, autoTick: false, lang: 'sv' })
  const root = w.document.querySelector('[data-gl-lobby]')
  assert.match(root.textContent, /LIVE/)
  assert.match(root.querySelector('[data-gl-source]').textContent, /Coinbase · 12:05/)
  assert.match(root.textContent, /HISTORIK/)
  closeLobby()
})

test('faser.js öppnar lobbyn från korset och panel.js skickar antal spelare', () => {
  const faser = readFileSync(new URL('../../spel/lagen/faser.js', import.meta.url), 'utf8')
  const panel = readFileSync(new URL('../../spel/lagen/panel.js', import.meta.url), 'utf8')
  assert.match(faser, /from '\.\/granslandet\.js'/)
  assert.match(faser, /enterLobby\(/)
  assert.match(panel, /getPlayers:/)
})

test('Vikingbåt: race -> Gränslandet-lobby -> livevarv, med reserv om modulen saknas', () => {
  const html = readFileSync(new URL('../../../pv/vikingbat/index.html', import.meta.url), 'utf8')
  assert.match(html, /\/traderider\/spel\/lagen\/granslandet\.js/)
  assert.match(html, /if \(liveLapOn\) enterGranslandet\(now\)/)
  assert.match(html, /onBack: function\(\)\{ startRace\(\); \}/)
  assert.match(html, /startLive\(now\); return; \}/)
})

test('Trade Rider/RaceX/Rabbit Hole (faser.js): korset öppnar lobbyn, båda accept -> live, avböj -> Historia', async () => {
  const w = dom()
  globalThis.localStorage = w.localStorage
  globalThis.matchMedia = () => ({ matches: false })
  const { mountFas } = await import('../../spel/lagen/faser.js')
  const { attachLiveFeed, resetLiveFeedForTests } = await import('../../spel/lagen/live-port.js')
  const { HISTORIA } = await import('../../spel/lagen/historia-data.js')
  const feed = { status: () => 'live', subscribe: () => () => {}, source: () => ({ name: 'Testkälla', time: 0 }) }
  attachLiveFeed(feed)
  let players = 2
  const ui = mountFas(w.document.body, {
    getOrientation: () => ({ movement: 'down', highPriceSide: 'right' }),
    getPlace: () => 'chart',
    isActive: () => true,
    getPlayers: () => players,
    getTheme: () => 'racex',
  })
  const toLand = () => {
    ui.play()
    let guard = 0
    while (ui.phases.phase() === 'historia' && guard++ < HISTORIA.bars.length + 2) ui.step()
    assert.equal(ui.phases.phase(), 'granslandet')
  }
  toLand()
  w.document.querySelector('[data-tr-cross]').click()
  let lobby = w.document.querySelector('[data-gl-lobby]')
  assert.ok(lobby, 'korset öppnar lobbyn i stället för att gå direkt till live')
  assert.ok(lobby.classList.contains('gl-theme-racex'))
  assert.equal(lobby.dataset.players, '2')
  assert.match(lobby.querySelector('[data-gl-source]').textContent, /Testkälla/)
  lobby.querySelector('[data-gl-accept="1"]').click()
  assert.equal(ui.phases.phase(), 'granslandet', 'en accept räcker inte')
  lobby.querySelector('[data-gl-back]').click()
  assert.equal(ui.phases.phase(), 'historia', 'avböj spelar historien igen')
  toLand()
  w.document.querySelector('[data-tr-cross]').click()
  lobby = w.document.querySelector('[data-gl-lobby]')
  lobby.querySelector('[data-gl-accept="1"]').click()
  lobby.querySelector('[data-gl-accept="2"]').click()
  assert.equal(ui.phases.phase(), 'live')
  players = 1
  resetLiveFeedForTests()
  closeLobby()
})
