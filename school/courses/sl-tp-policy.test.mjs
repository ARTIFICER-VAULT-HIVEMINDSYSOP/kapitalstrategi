/**
 * Låser undervisningens förval: entry 100, stop-loss 98, take-profit 104 (1:2).
 * Kör: node --test school/courses/sl-tp-policy.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../../assets/index-CBayL6Go.js', import.meta.url), 'utf8')
const stopSvg = readFileSync(new URL('../lessons/stop-loss-diagram.svg', import.meta.url), 'utf8')
const tpSvg = readFileSync(new URL('../lessons/take-profit-diagram.svg', import.meta.url), 'utf8')
const rrSvg = readFileSync(new URL('../lessons/risk-reward.svg', import.meta.url), 'utf8')

test('kanoniskt exempel är 100 / 98 / 104, alltså 1:2', () => {
  assert.match(bundle, /Entry \*\*100\*\*, S\/L \*\*98\*\* \(risk = 2\), T\/P \*\*104\*\*/)
  assert.match(bundle, /Entry \*\*100\*\*, S\/L \*\*98\*\* \(risk 2\), T\/P \*\*104\*\*/)
  assert.match(bundle, /S\/L \*\*98\*\* \(−2\), T\/P \*\*104\*\*/)
  assert.equal(bundle.includes('T/P **106**'), false)
  assert.equal(bundle.includes('T/P **109**'), false)
  assert.equal(bundle.includes('S/L **95**'), false)
  assert.equal(bundle.includes('S/L **97**'), false)
})

test('quizzen räknar 1:2 som rätt svar på samma exempel', () => {
  assert.match(bundle, /Entry 100, S\/L 98, T\/P 104\. Vad är R:R\?`,options:\[xs\(`a`,`1:1`,!1\),xs\(`b`,`1:2`,!0\)/)
  assert.match(bundle, /Köp 100, SL 98, TP 104\. Vad är R:R\?`,options:\[ks\(`a`,`1:1`,!1\),ks\(`b`,`1:2`,!0\)/)
  assert.match(bundle, /stop-loss på 98/)
})

test('WebTrader kräver båda nivåerna och arkivposten är 1:2', () => {
  assert.match(bundle, /Stop-loss \(krävs\)/)
  assert.match(bundle, /Stop-loss \(required\)/)
  assert.match(bundle, /Стоп-лосс \(обов/)
  assert.match(bundle, /wt\.slTpRequired/)
  assert.match(bundle, /reward\+1e-9<risk\*1\.5/)
  assert.match(bundle, /cash\*0\.02/)
  assert.match(bundle, /tpPct:\.04,slPct:\.02/)
  assert.equal(bundle.includes('tpPct:.1,slPct:.15'), false)
  assert.equal(bundle.includes('Stop-loss (valfritt)'), false)
})

test('diagrammen visar samma par', () => {
  assert.match(stopSvg, /SL 98/)
  assert.equal(stopSvg.includes('SL 95'), false)
  assert.match(tpSvg, /T\/P 104/)
  assert.match(tpSvg, /\+4 · vinstmål/)
  assert.match(rrSvg, /1 : 2/)
  assert.match(rrSvg, /\+2R/)
  assert.equal(rrSvg.includes('+3R'), false)
})
