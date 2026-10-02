import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chapterView, chapterHtml, gradeAnswer, CHAPTER } from '../../../school/hansan-riskskola/text.js'

const GAIN = /vinst|gain|прибу/i
const RISK = /risk|ризик/i

function sentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function assertRiskSharesSentence(text, label) {
  for (const sentence of sentences(text)) {
    if (GAIN.test(sentence)) assert.match(sentence, RISK, `${label}: ${sentence}`)
  }
}

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
      assertRiskSharesSentence(lesson.body, `${lang} lektion ${lesson.id}`)
      for (const quiz of lesson.quiz) {
        assertRiskSharesSentence(quiz.q, `${lang} fråga ${lesson.id}`)
        for (const option of quiz.options) assertRiskSharesSentence(option, `${lang} svar ${lesson.id}`)
      }
    }
    assert.match(view.lessons[4].body, lang === 'sv' ? /begränsade/ : lang === 'en' ? /limited/ : /обмежували/)
    assert.match(view.lessons[4].body, lang === 'sv' ? /vinteruppehåll/ : lang === 'en' ? /winter break/ : /зимовою перервою/)
    assert.doesNotMatch(view.lessons[4].body, /förbjöd|forbade|забороняли/)
    for (const word of FORBIDDEN) assert.equal(html.includes(word), false, `${lang} ${word}`)
    assert.equal(html.includes('bankernas-historia'), false)
    assert.equal(html.includes('marknadens-framtid'), false)
  }
})

test('varje faktapåstående bär ett käll-id som finns i källfilen, och källan syns inte', () => {
  const src = readFileSync(new URL('../../../school/hansan-riskskola/kallor.md', import.meta.url), 'utf8')
  const known = new Set([...src.matchAll(/^id:\s*(src-[a-z0-9-]+)/gm)].map((m) => m[1]))
  assert.ok(known.size >= 10)
  assert.equal(known.has('src-finns-inte'), false)
  const used = []
  assert.ok(CHAPTER.bridgeSource, 'bron saknar käll-id')
  used.push(CHAPTER.bridgeSource)
  for (const lesson of CHAPTER.lessons) {
    assert.ok(lesson.claims?.length, `lektion ${lesson.id} saknar påståenden`)
    for (const fact of lesson.claims) {
      assert.ok(fact.source, `lektion ${lesson.id} har ett påstående utan käll-id`)
      assert.equal(known.has(fact.source), true, `okänt käll-id ${fact.source}`)
      used.push(fact.source)
    }
    for (const quiz of lesson.quiz) {
      assert.ok(quiz.source, `quiz i lektion ${lesson.id} saknar käll-id`)
      assert.equal(known.has(quiz.source), true, `okänt käll-id ${quiz.source}`)
      used.push(quiz.source)
    }
  }
  for (const lang of ['sv', 'en', 'uk']) {
    const html = chapterHtml(lang)
    assert.equal(html.includes('Källor'), false)
    assert.equal(html.includes('id:'), false)
    for (const id of used) assert.equal(html.includes(id), false, `${lang} visar ${id}`)
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
