import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { STRINGS } from '../../spel/lagen/i18n.js'
import { preRaceQuestions, spokenLines, guardLines, PRE_RACE, speechView, createGuideState } from '../../spel/lagen/robban-script.js'
import { rocketX } from '../../spel/lagen/tra.js'

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

test('växeln har Trade Rider Academy och framsidan saknar intern text', () => {
  const panel = readFileSync(new URL('../../spel/lagen/panel.js', import.meta.url), 'utf8')
  assert.match(panel, /MODES\.tra\.nameKey/)
  assert.match(panel, /setView\('tra'\)/)
  assert.match(panel, /toggle\.append\(bLine, bRaket, bAcademy, bRabbit, bTra\)/)
  for (const lang of ['sv', 'en', 'uk']) {
    const lead = STRINGS[lang]['tra.lead']
    assert.equal(/utkast|draft|чернетка/i.test(lead), false, lang)
    assert.match(lead, /Robban|Роббан/)
    assert.match(STRINGS[lang]['tra.raceNote'], /simuler|simulated|симул/i)
  }
  assert.match(STRINGS.sv['tra.raceNote'], /kan gå bra/)
  assert.match(STRINGS.sv['tra.raceNote'], /kan gå dåligt/)
})

test('talbubblan har en enda stängning, och raketen rör sig åt höger', () => {
  const greet = speechView(createGuideState(), 'sv')
  assert.equal(greet.choices.some((c) => c.act === 'close'), false)
  assert.equal(rocketX(640, 0) < rocketX(640, 0.4), true)
  assert.equal(rocketX(640, 0.4) < rocketX(640, 0.8), true)
  const akademin = readFileSync(new URL('../../spel/lagen/akademin.js', import.meta.url), 'utf8')
  assert.equal(akademin.includes('mountRobban'), false)
  assert.equal(akademin.includes('drawRobbanCraft'), false)
})

test('Trade Rider Academy har Robban nere till höger, öppnar helfigur och stänger tillbaka', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/#tra' })
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

  const { createTradeRiderAcademy } = await import('../../spel/lagen/tra.js')
  const tra = createTradeRiderAcademy()
  tra.show()

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
  assert.equal(figure.style.overflow, 'hidden')
  assert.equal(pop.style.flexDirection, 'column')
  assert.equal(figure.nextElementSibling.className.includes('rb-speech'), true)
  assert.ok(parseFloat(figure.style.height) >= 160)
  assert.equal(figure.querySelector('button'), null)
  const minimera = [...pop.querySelectorAll('button')].filter((b) => b.textContent === 'Minimera')
  assert.equal(minimera.length, 1)
  assert.equal(pop.querySelectorAll('[data-rb-act="close"]').length, 0)
  assert.ok(pop.querySelectorAll('.rb-choices button, [data-robban-close]').length > 0)
  for (const button of pop.querySelectorAll('.rb-choices button, [data-robban-close]')) {
    assert.equal(button.closest('.rb-speech') != null, true)
  }
  const stand = document.querySelector('[data-robban-stand]')
  const question = document.querySelector('[data-robban-prerace] button')
  assert.ok(stand)
  assert.equal(stand.contains(question), false)
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

  document.querySelector('[data-tra-start]').click()
  tra.step(0.2)
  const canvas = document.querySelector('[data-tra-canvas]')
  assert.equal(canvas.dataset.rocketDir, 'ltr')
  assert.equal(canvas.dataset.robbanRide, 'on')
  assert.ok(rocketX(640, 0.2) > rocketX(640, 0))

  tra.hide()
  assert.equal(document.querySelector('[data-robban-root]').hidden, true)
  assert.equal(document.querySelector('[data-tra]').classList.contains('on'), false)
})
