import test from 'node:test'
import assert from 'node:assert/strict'

const { Window } = await import('happy-dom')
const w = new Window({ url: 'https://kapitalstrategi.example/traderider/spel/' })
globalThis.window = w
globalThis.document = w.document
globalThis.localStorage = w.localStorage
globalThis.location = w.location

const { STRINGS, LANGS, setLang, getLang, applyHtmlLang, mountSwitcher } = await import('../../spel/lagen/i18n.js')
const { spokenLines, guardLines } = await import('../../spel/lagen/robban-script.js')

const holders = (s) => (String(s).match(/\{[a-zA-Z0-9]+\}/g) || []).sort().join(',')

test('norska (bokmål) har varje spelnyckel med samma platshållare', () => {
  assert.deepEqual(LANGS, ['sv', 'no', 'en', 'uk'])
  for (const [key, sv] of Object.entries(STRINGS.sv)) {
    assert.equal(typeof STRINGS.no[key], 'string', key)
    assert.ok(STRINGS.no[key].length > 0, key)
    assert.equal(holders(STRINGS.no[key]), holders(sv), key)
  }
  for (const lang of ['sv', 'en', 'uk']) assert.equal(typeof STRINGS[lang]['lang.no'], 'string', lang)
})

test('norska texter håller spelets regler', () => {
  const banned = /gøy|investeringsråd|mindcloud/i
  for (const [key, value] of Object.entries(STRINGS.no)) assert.equal(banned.test(value), false, key)
  const report = guardLines(spokenLines('no'))
  assert.deepEqual(report.banned, [])
  assert.deepEqual(report.upsideWithoutRisk, [])
})

test('NO ger html lang nb och en synlig NO-knapp', () => {
  localStorage.clear()
  assert.equal(getLang(), 'sv')
  setLang('no')
  assert.equal(getLang(), 'no')
  assert.equal(document.documentElement.lang, 'nb')
  const host = document.createElement('div')
  document.body.appendChild(host)
  mountSwitcher(host)
  const labels = [...host.querySelectorAll('.lang-switcher-btn')].map((b) => b.textContent)
  assert.deepEqual(labels, ['SV', 'NO', 'EN', 'UA'])
  const btn = host.querySelector('.lang-switcher-btn[data-lang="no"]')
  assert.equal(btn.getAttribute('lang'), 'nb')
  assert.equal(btn.getAttribute('aria-pressed'), 'true')
  setLang('sv')
  applyHtmlLang()
  assert.equal(document.documentElement.lang, 'sv')
})

test('NO som valts på sajten (ig.app.language) gäller i spelen', () => {
  localStorage.clear()
  localStorage.setItem('ig.app.language', JSON.stringify('no'))
  localStorage.setItem('app.language', 'sv')
  assert.equal(getLang(), 'no')
  window.__trSetLang('sv')
  assert.equal(getLang(), 'no')
  setLang('en')
  assert.equal(localStorage.getItem('app.language'), 'en')
  assert.equal(JSON.parse(localStorage.getItem('ig.app.language')), 'en')
  assert.equal(getLang(), 'en')
  setLang('no')
  assert.equal(JSON.parse(localStorage.getItem('ig.app.language')), 'no')
  localStorage.clear()
})
