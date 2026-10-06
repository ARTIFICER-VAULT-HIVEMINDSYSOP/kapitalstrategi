import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { STRINGS } from '../../spel/lagen/i18n.js'
import { preRaceQuestions, spokenLines, guardLines, PRE_RACE, speechView, createGuideState } from '../../spel/lagen/robban-script.js'
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

test('växeln har ett enda Academy-läge och framsidan räknar fyra lägen', () => {
  const panel = readFileSync(new URL('../../spel/lagen/panel.js', import.meta.url), 'utf8')
  assert.match(panel, /toggle\.append\(bLine, bRaket, bAcademy, bRabbit\)/)
  assert.equal(panel.includes('bTra'), false)
  assert.equal(panel.includes("setView('tra')"), false)
  assert.match(STRINGS.sv['land.lead'], /Fyra lägen/)
  assert.match(STRINGS.en['land.lead'], /Four modes/)
  assert.match(STRINGS.uk['land.lead'], /Чотири режими/)
  assert.equal(/Fem lägen/.test(STRINGS.sv['land.lead']), false)
  const traSrc = readFileSync(new URL('../../spel/lagen/tra.js', import.meta.url), 'utf8')
  assert.equal(traSrc.includes('rocketX'), false)
  assert.equal(traSrc.includes('data-tra-canvas'), false)
  const akademin = readFileSync(new URL('../../spel/lagen/akademin.js', import.meta.url), 'utf8')
  assert.equal(akademin.includes('mountRobban'), false)
  assert.equal(akademin.includes('drawRobbanCraft'), false)
  assert.equal(akademin.includes('robbanSvg'), false)
})

test('manuset har fortfarande en talvy utan extra stängning i hälsningen', () => {
  const greet = speechView(createGuideState(), 'sv')
  assert.equal(greet.choices.some((c) => c.act === 'close'), false)
})
