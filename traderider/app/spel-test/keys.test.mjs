import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { keyAction, isTypingTarget, KEYMAP, PREVENT_DEFAULT, HINTS } from '../../spel/lagen/keys.js'

const ev = (code, extra = {}) => ({ code, key: '', target: { tagName: 'BODY' }, ...extra })

// Tangentplanen (beslutad)
const PLAN = [
  ['KeyW', 'buy', 1], ['ArrowUp', 'buy', 2],
  ['KeyS', 'sell', 1], ['ArrowDown', 'sell', 2],
  ['KeyA', 'levDown', 1], ['ArrowLeft', 'levDown', 2],
  ['KeyD', 'levUp', 1], ['ArrowRight', 'levUp', 2],
  ['Space', 'flat', 1], ['Digit0', 'flat', 2], ['Numpad0', 'flat', 2],
]

test('1P: alla tangenter styr samma spelare', () => {
  for (const [code, action] of PLAN) assert.deepEqual(keyAction(ev(code), '1p'), { action, player: 1 }, code)
})

test('2P: spelare 1 = WASD + mellanslag, spelare 2 = pilar + 0', () => {
  for (const [code, action, player] of PLAN) assert.deepEqual(keyAction(ev(code), '2p'), { action, player }, code)
})

test('P = paus och R = omstart gäller båda spelarna', () => {
  for (const mode of ['1p', '2p']) {
    assert.deepEqual(keyAction(ev('KeyP'), mode), { action: 'pause', player: 0 })
    assert.deepEqual(keyAction(ev('KeyR'), mode), { action: 'reset', player: 0 })
  }
})

test('mellanslag är inte längre paus och F gör ingenting', () => {
  assert.notEqual(keyAction(ev('Space')).action, 'pause')
  assert.equal(keyAction(ev('KeyF')), null)
})

test('inga tangenter i textfält eller med ctrl/cmd/alt', () => {
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) assert.equal(keyAction(ev('KeyW', { target: { tagName } })), null, tagName)
  assert.equal(keyAction(ev('Space', { target: { tagName: 'DIV', isContentEditable: true } })), null)
  assert.equal(keyAction(ev('KeyW', { ctrlKey: true })), null)
  assert.equal(keyAction(ev('KeyS', { metaKey: true })), null)
  assert.equal(keyAction(ev('KeyA', { altKey: true })), null)
  assert.equal(isTypingTarget({ tagName: 'button' }), false)
})

test('pilar och mellanslag får preventDefault (ingen scroll)', () => {
  for (const c of ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) assert.ok(PREVENT_DEFAULT.has(c), c)
})

test('hintar enligt tangentplanen, utan hakparenteser eller paus-text', () => {
  assert.deepEqual(HINTS['1p'], { buy: 'W/↑', sell: 'S/↓', levDown: 'A/←', levUp: 'D/→', flat: '␣/0 Flat' })
  const all = JSON.stringify(HINTS)
  assert.ok(!/[[\]]/.test(all))
  assert.ok(!/Paus/i.test(all))
})

// NVDA Line-motorns EGEN tangenthanterare (den som skeppas i bundlen) mot samma tabell.
function engineOnKey() {
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

test('NVDA Line-motorn (1P) följer tangentplanen', () => {
  const k = engineOnKey()
  for (const [code, action] of PLAN) {
    const r = k(code)
    assert.deepEqual(r.calls, [action], code)
    if (PREVENT_DEFAULT.has(code)) assert.ok(r.prevented, `${code} preventDefault`)
  }
  assert.deepEqual(k('KeyP').calls, ['pause'])
  assert.deepEqual(k('KeyR', { key: 'r' }).calls, ['reset'])
  assert.deepEqual(k('KeyF').calls, [])
})

test('NVDA Line-motorn: inga tangenter i textfält eller med modifierare', () => {
  const k = engineOnKey()
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) assert.deepEqual(k('Space', { target: { tagName } }).calls, [], tagName)
  assert.deepEqual(k('KeyW', { target: { tagName: 'DIV', isContentEditable: true } }).calls, [])
  assert.deepEqual(k('KeyW', { ctrlKey: true }).calls, [])
})

test('tabellen täcker exakt tangentplanen', () => {
  assert.deepEqual(Object.keys(KEYMAP).sort(), [...PLAN.map((p) => p[0]), 'KeyP', 'KeyR'].sort())
})
