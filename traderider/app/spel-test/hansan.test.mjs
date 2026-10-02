import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chapterView, chapterHtml, gradeAnswer, CHAPTER } from '../../../school/hansan-riskskola/text.js'

const FORBIDDEN = [
  'Bankernas historia',
  'History of the banks',
  'Історія банків',
  'bokföringens fader',
  'father of accounting',
  'första börsnoterade',
  'first listed',
  'first publicly',
  'Tyska orden',
  'Teutonic Order',
  'paper',
  'ÖB',
  'Källor',
  'Britannica',
  'Schulte',
  'Hansemuseum',
  'Ceccarelli',
  'Stieda',
  'ICAEW',
  'köpte premie',
  'bought premium',
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(js|mjs|html|css|md)$/.test(name)) out.push(p)
  }
  return out
}

test('kapitlet heter Hansan och har sex hansalektioner plus liggaren', () => {
  assert.equal(CHAPTER.lessons.length, 7)
  assert.equal(CHAPTER.lessons.some((l) => l.id === '0'), false)
  for (const lang of ['sv', 'en', 'uk']) {
    const view = chapterView(lang)
    const html = chapterHtml(lang)
    assert.match(view.title, /Hansan|Hansa|Ганза/)
    assert.match(html, new RegExp(view.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(view.bridge, /tempel|Templar|тамплі/i)
    assert.match(html, /hist-02-guld-korsfarare/)
    assert.equal(view.lessons.length, 7)
    for (const lesson of view.lessons) {
      assert.doesNotMatch(lesson.body, /tempelherre|Templar|тамплі/i)
      assert.match(lesson.body, /vinst|gain|прибу/i)
      assert.match(lesson.body, /risk|ризик/i)
    }
    for (const word of FORBIDDEN) assert.equal(html.includes(word), false, `${lang} ${word}`)
    assert.equal(html.includes('bankernas-historia'), false)
    assert.equal(html.includes('marknadens-framtid'), false)
  }
})

test('ett quizsvar kan rättas utan att texten lovar ett utfall', () => {
  assert.equal(gradeAnswer('1', 0, 0), true)
  assert.equal(gradeAnswer('1', 0, 1), false)
  assert.equal(gradeAnswer('9', 0, 0), false)
})

test('leverantörsnamn ligger inte under traderider/spel', () => {
  const root = new URL('../../spel/', import.meta.url).pathname
  const names = ['Britannica', 'Schulte', 'Hansemuseum', 'Ceccarelli', 'Stieda', 'ICAEW', 'Bankernas historia']
  const hits = []
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8')
    for (const name of names) if (text.includes(name)) hits.push(`${file}: ${name}`)
  }
  assert.deepEqual(hits, [])
})
