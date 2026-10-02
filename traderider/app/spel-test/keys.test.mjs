import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { keyAction, isTypingTarget, PREVENT_DEFAULT } from '../../spel/lagen/keys.js'
import { MODES } from '../../spel/lagen/orientation.js'

const ev = (code, extra = {}) => ({ code, key: '', target: { tagName: 'BODY' }, ...extra })
const trend = MODES.trendRider.orientation

// Trend Rider: movement right. W/→/D ökar hävstång, S/←/A minskar, ↑ mot KÖP, ↓ mot SÄLJ.
const PLAN = [
  ['KeyW', 'levUp', 1],
  ['ArrowUp', 'buy', 2],
  ['KeyS', 'levDown', 1],
  ['ArrowDown', 'sell', 2],
  ['KeyA', 'levDown', 1],
  ['ArrowLeft', 'levDown', 2],
  ['KeyD', 'levUp', 1],
  ['ArrowRight', 'levUp', 2],
  ['Space', 'flat', 1],
  ['Digit0', 'flat', 2],
  ['Numpad0', 'flat', 2],
]

test('1P Trend Rider: alla tangenter styr samma spelare', () => {
  for (const [code, action] of PLAN) {
    const hit = keyAction(ev(code), '1p', trend)
    assert.equal(hit.action, action, code)
    assert.equal(hit.player, 1, code)
  }
})

test('2P: spelare 1 = WASD + mellanslag, spelare 2 = pilar + 0', () => {
  for (const [code, action, player] of PLAN) {
    const hit = keyAction(ev(code), '2p', trend)
    assert.equal(hit.action, action, code)
    assert.equal(hit.player, player, code)
  }
})

test('P = paus och R = omstart gäller båda spelarna', () => {
  for (const mode of ['1p', '2p']) {
    assert.deepEqual(keyAction(ev('KeyP'), mode, trend), { action: 'pause', intent: null, player: 0 })
    assert.deepEqual(keyAction(ev('KeyR'), mode, trend), { action: 'reset', intent: null, player: 0 })
  }
})

test('mellanslag är FLAT och ignoreras i fält, knapp och länk', () => {
  assert.equal(keyAction(ev('Space'), '1p', trend).action, 'flat')
  assert.equal(keyAction(ev('KeyF'), '1p', trend), null)
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']) {
    assert.equal(keyAction(ev('Space', { target: { tagName } }), '1p', trend), null, tagName)
  }
  assert.equal(isTypingTarget({ tagName: 'button' }), false)
})

test('pilar och mellanslag får preventDefault (ingen scroll) när de hanteras', () => {
  for (const c of ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) assert.ok(PREVENT_DEFAULT.has(c), c)
})

function engineOnKey() {
  globalThis.window = globalThis.window || {}
  window.__trKeyAction = (e, mode) => keyAction(e, mode)
  const src = readFileSync(new URL('../../spel/assets/routes-CbqPJAI2.js', import.meta.url), 'utf8')
  const i = src.indexOf('onKey=e=>{')
  const j = src.indexOf('};burst(', i)
  assert.ok(i > 0 && j > i)
  const body = src.slice(i + 'onKey='.length, j + 1)
  const calls = []
  const mock = {
    toggle: () => calls.push(['pause']),
    reset: () => calls.push(['reset']),
    flat: () => calls.push(['flat']),
    choose: (s) => calls.push([s]),
    nudgeLeverage: (d) => calls.push([d < 0 ? 'levDown' : 'levUp']),
    setLeverage: (n) => calls.push(['setLev', n]),
  }
  const fn = new Function(`return (${body})`).call(mock)
  return (code, extra = {}) => {
    calls.length = 0
    let prevented = false
    fn({ code, key: extra.key ?? '', target: extra.target ?? { tagName: 'BODY' }, preventDefault: () => (prevented = true), ...extra })
    return { calls: calls.map((c) => c.join(':')), prevented }
  }
}

test('NVDA Line-motorn (1P) följer Trend Rider-planen', () => {
  const k = engineOnKey()
  for (const [code, action] of PLAN) {
    const r = k(code)
    assert.deepEqual(r.calls, [action], code)
    if (PREVENT_DEFAULT.has(code)) assert.ok(r.prevented, `${code} preventDefault`)
  }
  assert.deepEqual(k('KeyP').calls, ['pause'])
  assert.deepEqual(k('KeyR', { key: 'r' }).calls, ['reset'])
  assert.deepEqual(k('KeyF').calls, [])
  const onButton = k('Space', { target: { tagName: 'BUTTON' } })
  assert.deepEqual(onButton.calls, [])
  assert.equal(onButton.prevented, false)
})
