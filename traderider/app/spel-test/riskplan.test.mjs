import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  assessPlan,
  breakEvenWinRate,
  chosenRatio,
  compareDuel,
  defaultPlan,
  floorFor,
  markRatioQuizPassed,
  planOutcome,
  RATIO_QUIZ_ID,
  referenceDistances,
  referenceOutcome,
  ratioChoiceUnlocked,
  setChosenRatio,
} from '../../spel/lagen/riskplan.js'

function mem() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  }
}

test('jämnt utfall är 1/(1+R)', () => {
  assert.ok(Math.abs(breakEvenWinRate(2) - 1 / 3) < 1e-12)
  assert.ok(Math.abs(breakEvenWinRate(1.5) - 0.4) < 1e-12)
})

test('förvalet är 1:2 och 1:1,5 är stängt tills quizet i första lektionen är godkänt', () => {
  const box = mem()
  assert.equal(ratioChoiceUnlocked(box), false)
  assert.equal(floorFor(box), 2)
  assert.equal(chosenRatio(box), 2)
  assert.equal(setChosenRatio(box, 1.5), 2)
  const preset = defaultPlan()
  assert.equal(preset.sl, 2)
  assert.equal(preset.tp, 4)
  assert.equal(assessPlan({ unit: 'pct', sl: 2, tp: 3 }, { minRatio: floorFor(box) }).ok, false)
  assert.equal(assessPlan(preset, { minRatio: floorFor(box) }).ok, true)
  markRatioQuizPassed(box)
  assert.equal(ratioChoiceUnlocked(box), true)
  assert.equal(floorFor(box), 1.5)
  assert.equal(setChosenRatio(box, 1.5), 1.5)
  assert.equal(chosenRatio(box), 1.5)
  assert.equal(assessPlan({ unit: 'pct', sl: 2, tp: 3 }, { minRatio: floorFor(box) }).ok, true)
})

test('en godkänd modul utan rätt ratio-fråga låser inte upp valet', () => {
  const box = mem()
  box.setItem('tr.riskplan.unlock', JSON.stringify({ unlocked: true, quizId: 'nagon-annan' }))
  assert.equal(ratioChoiceUnlocked(box), false)
  assert.equal(RATIO_QUIZ_ID, 'bas1-ratio')
})

test('referensen följer valt förhållande: 2 % stopp och 4 % eller 3 % mål', () => {
  assert.deepEqual(referenceDistances(2), { slPct: 2, tpPct: 4, ratio: 2 })
  assert.deepEqual(referenceDistances(1.5), { slPct: 2, tpPct: 3, ratio: 1.5 })
  const up = [100, 101, 102, 103, 104]
  const hit = referenceOutcome(up, 2)
  assert.equal(hit.tpPct, 4)
  assert.equal(hit.exit.reason, 'target')
  assert.ok(Math.abs(hit.exit.r - 2) < 1e-9)
  assert.equal(hit.exit.disciplined, true)
  const loose = referenceOutcome(up, 1.5)
  assert.equal(loose.tpPct, 3)
  assert.equal(loose.exit.reason, 'target')
  assert.ok(Math.abs(loose.exit.r - 1.5) < 1e-9)
})

test('egen plan vinner mot referens eller motståndare när R är högre och stoppen hölls', () => {
  const own = planOutcome({ entry: 100, stop: 98, exit: 104, side: 'buy', reason: 'target', overridden: false })
  const wider = planOutcome({ entry: 100, stop: 90, exit: 106, side: 'buy', reason: 'target', overridden: false })
  assert.ok(own.r > wider.r)
  assert.equal(compareDuel(own, wider).winner, 'a')
  const abandoned = planOutcome({ entry: 100, stop: 98, exit: 110, side: 'buy', reason: 'manual', overridden: true })
  assert.equal(abandoned.disciplined, false)
  assert.equal(compareDuel(own, abandoned).winner, 'a')
})

test('quizet sitter i första lektionen och upplåsningen är inte bunden till en vecka', () => {
  const bundle = readFileSync(new URL('../../../assets/index-CBayL6Go.js', import.meta.url), 'utf8')
  const lesson = bundle.slice(bundle.indexOf('moduleId:`basics-01-samma-sprak`'), bundle.indexOf('moduleId:`basics-03-ranta-pa-ranta`'))
  assert.match(lesson, /id:`bas1-ratio`/)
  assert.match(lesson, /1\/\(1\+R\)/)
  assert.match(lesson, /inte efter en viss vecka/)
  assert.match(bundle, /basics-01-samma-sprak`&&e>=70&&Array\.isArray\(n\)&&n\.some\(e=>e\.id===`bas1-ratio`&&e\.correct\)/)
  assert.equal(bundle.includes('vecka 2'), false)
  assert.equal(lesson.includes('vecka 2'), false)
})
