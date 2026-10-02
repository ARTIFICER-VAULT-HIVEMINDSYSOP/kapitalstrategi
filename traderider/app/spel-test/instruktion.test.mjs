import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import { MODES, instructionText } from '../../spel/lagen/orientation.js'
import { keyAction } from '../../spel/lagen/keys.js'
import { t, setLang } from '../../spel/lagen/i18n.js'
import { mountInstruction } from '../../spel/lagen/instruktion.js'

const w = new Window()
globalThis.window = w
globalThis.document = w.document
globalThis.localStorage = w.localStorage
globalThis.HTMLElement = w.HTMLElement

test('panelen renderas i varje läge med text från orientation', () => {
  setLang('sv')
  for (const mode of [MODES.trendRider, MODES.raket, MODES.rabbitHole]) {
    const ui = mountInstruction(document.body, {
      getOrientation: () => mode.orientation,
      isActive: () => true,
    })
    const body = ui.root.querySelector('[data-tr-instr-body]')
    assert.equal(body.textContent, instructionText(mode.orientation, t), mode.id)
    assert.equal(ui.root.hidden, false)
    ui.root.remove()
    ui.reopen.remove()
  }
})

test('mellanslag är FLAT', () => {
  setLang('sv')
  for (const mode of [MODES.trendRider, MODES.raket, MODES.rabbitHole]) {
    const action = keyAction({ code: 'Space', target: { tagName: 'DIV' } }, '1p', mode.orientation)
    assert.equal(action.action, 'flat', mode.id)
    assert.equal(action.intent, 'FLAT', mode.id)
    assert.match(instructionText(mode.orientation, t), /Mellanslag: FLAT/)
  }
  assert.equal(keyAction({ code: 'Space', target: { tagName: 'BUTTON' } }, '1p'), null)
})

test('det finns en gemensam panel, inte en kopia per läge', () => {
  const panel = readFileSync(new URL('../../spel/lagen/panel.js', import.meta.url), 'utf8')
  const rabbit = readFileSync(new URL('../../spel/lagen/rabbit.js', import.meta.url), 'utf8')
  const raket = readFileSync(new URL('../../spel/lagen/raket.js', import.meta.url), 'utf8')
  assert.equal(panel.includes('mountInstruction'), true)
  assert.equal(rabbit.includes('helpLine'), false)
  assert.equal(raket.includes('helpLine'), false)
  assert.equal(rabbit.includes('mountInstruction'), false)
})
