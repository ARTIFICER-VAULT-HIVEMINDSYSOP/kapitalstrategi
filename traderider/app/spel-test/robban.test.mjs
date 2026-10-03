import test from 'node:test'
import assert from 'node:assert/strict'
import { preRaceQuestions, spokenLines, guardLines, PRE_RACE } from '../../spel/lagen/robban-script.js'

function points(n = 40) {
  const out = []
  for (let i = 0; i < n; i++) {
    const price = 100 + Math.sin(i / 4) * 4
    out.push({ price, upper: price + 6, lower: price - 6, mid: price, t: i, c: price })
  }
  return out
}

test('Robbans rader klarar innehållsvakten på alla Akademins språk', () => {
  for (const lang of ['sv', 'en', 'uk']) {
    const lines = spokenLines(lang)
    assert.equal(lines.length > 10, true, lang)
    const report = guardLines(lines)
    assert.deepEqual(report.banned, [], lang)
    assert.deepEqual(report.upsideWithoutRisk, [], lang)
  }
})

test('frågorna före loppet är fasta och kommer från samma manus', () => {
  assert.deepEqual(PRE_RACE.map((q) => q.id), ['q1', 'q2', 'q3'])
  const first = preRaceQuestions('sv')
  const again = preRaceQuestions('sv')
  assert.deepEqual(again, first)
  assert.equal(first[0].prompt.length > 0, true)
  assert.equal(first[0].choices.length, 2)
  assert.notEqual(first[0].prompt, first[1].prompt)
})

test('Akademin har Robban nere till höger, öppnar helfigur och stänger tillbaka', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/#academy' })
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.location = w.location
  globalThis.performance = w.performance
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(w.performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  globalThis.getComputedStyle = (el) => w.getComputedStyle(el)
  globalThis.devicePixelRatio = 1
  globalThis.innerWidth = 1280
  globalThis.innerHeight = 800
  w.localStorage.setItem('app.language', 'sv')

  const { createAkademin } = await import('../../spel/lagen/akademin.js')
  const storage = { getItem: () => null, setItem() {} }
  const engine = { track: { points: points() }, spec: { log: false, key: '1y' }, quote: { candles: [] } }
  const akademin = createAkademin({ engine, storage })
  akademin.show()

  const hud = document.querySelector('[data-robban-hud]')
  assert.ok(hud, 'HUD-knapp saknas')
  assert.equal(hud.tagName, 'BUTTON')
  assert.equal(hud.type, 'button')
  assert.equal(hud.disabled, false)
  assert.ok(hud.tabIndex >= 0)
  assert.equal(hud.closest('details'), null)
  assert.equal(hud.closest('[hidden]'), null)
  assert.equal(hud.style.position, 'fixed')
  assert.equal(hud.style.right, '16px')
  assert.equal(hud.style.bottom, '16px')
  assert.ok(parseFloat(hud.style.width) >= 48)
  assert.ok(parseFloat(hud.style.height) >= 48)
  assert.equal(hud.getAttribute('aria-expanded'), 'false')
  const peek = hud.querySelector('.rb-peek')
  assert.equal(peek.style.overflow, 'hidden')

  const prompts = [...document.querySelectorAll('[data-robban-prerace] [data-rb-prompt]')].map((el) => el.textContent)
  assert.deepEqual(prompts, preRaceQuestions('sv').map((q) => q.prompt))

  hud.click()
  const pop = document.querySelector('[data-robban-pop]')
  assert.equal(pop.hidden, false)
  assert.equal(document.querySelector('[data-robban-root]').dataset.robbanState, 'open')
  const figure = pop.querySelector('[data-robban-figure="full"]')
  assert.ok(figure)
  assert.equal(figure.style.overflow, 'visible')
  assert.ok(parseFloat(figure.style.height) >= 160)
  assert.ok(figure.querySelector('[data-part="head"]'))
  assert.ok(figure.querySelector('[data-part="torso"]'))
  assert.ok(figure.querySelector('[data-part="legs"]'))
  assert.ok(figure.querySelector('[data-robban-body="full"]'))
  const say = pop.querySelector('[data-robban-say]').textContent
  assert.match(say, /Robban Robotsson/)
  assert.equal(hud.closest('[hidden]'), null)

  pop.querySelector('[data-robban-close]').click()
  assert.equal(pop.hidden, true)
  assert.equal(document.querySelector('[data-robban-root]').dataset.robbanState, 'docked')
  assert.equal(hud.hidden, false)
  assert.equal(hud.getAttribute('aria-expanded'), 'false')

  hud.click()
  document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  assert.equal(document.querySelector('[data-robban-pop]').hidden, true)

  const choice = document.querySelector('[data-robban-prerace] [data-rb-choice]')
  choice.click()
  const reply = document.querySelector('[data-robban-prerace] [data-rb-reply]').textContent
  assert.equal(reply, preRaceQuestions('sv')[0].choices[0].reply)

  akademin.step(0.05)
  const canvas = document.querySelector('.nlr-ak-chart canvas')
  assert.equal(canvas.dataset.robbanRide, 'on')

  akademin.hide()
  assert.equal(document.querySelector('[data-robban-root]').hidden, true)
})
