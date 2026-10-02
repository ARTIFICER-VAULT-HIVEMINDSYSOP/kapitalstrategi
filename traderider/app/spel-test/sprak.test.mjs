import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

test('Trade Rider-sidorna har svenska som dokumentets standardspråk', () => {
  for (const file of [
    '../../../traderider/spel/index.html',
    '../../../traderider/index.html',
    '../../../traderider/app/static.html',
    '../../../nvda-rider/index.html',
  ]) {
    assert.match(read(file), /<html lang="sv"/, file)
  }
  assert.match(read('../src/routes/__root.tsx'), /<html lang="sv">/)
})

test('dokumentets språk följer locale när språket byts', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.location = w.location
  const { applyHtmlLang, setLang, getLang } = await import('../../spel/lagen/i18n.js')
  w.document.documentElement.lang = 'en'
  applyHtmlLang()
  assert.equal(getLang(), 'sv')
  assert.equal(w.document.documentElement.lang, 'sv')
  setLang('en')
  assert.equal(w.document.documentElement.lang, 'en')
  setLang('uk')
  assert.equal(w.document.documentElement.lang, 'uk')
  setLang('sv')
  assert.equal(w.document.documentElement.lang, 'sv')
})
