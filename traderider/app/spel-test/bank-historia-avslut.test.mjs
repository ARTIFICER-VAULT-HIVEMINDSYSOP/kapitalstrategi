// Avslutningen i Bankernas historia, lektion 08, ska finnas på svenska och engelska.
// Kursen har inget ukrainskt fält, så inget ukrainskt avslut läggs till.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const CLOSER = {
  sv: [
    'Historien slutar inte här. Hur banker och betalningar fungerar i dag kan du lära dig vidare genom det våra kunder rapporterar till oss och genom det vi har kunnat identifiera på internet.',
    'Det vi delar är sammanställt och avidentifierat, och det är iakttagelser, inte en garanti för hur en viss bank agerar.',
  ],
  en: [
    'The story does not end here. You can go on learning how banks and payments work today through what our customers report to us and through what we have been able to identify on the internet.',
    'What we share is compiled and anonymised, and these are observations, not a guarantee of how any particular bank acts.',
  ],
}

const BANNED = ['ÖB', 'paper', 'Paper', 'Källor', 'inte investeringsrådgivning', 'not investment advice']

function parseTickList(source, openAt) {
  let i = openAt
  const items = []
  while (i < source.length) {
    while (source[i] === ',' || source[i] === ' ' || source[i] === '\n') i++
    if (source[i] === ']') return { items, end: i }
    if (source[i] !== '`') throw new Error(`expected tick at ${i}`)
    let j = i + 1
    let out = ''
    while (j < source.length) {
      if (source[j] === '\\') {
        out += source[j + 1]
        j += 2
        continue
      }
      if (source[j] === '`') break
      out += source[j]
      j++
    }
    items.push(out)
    i = j + 1
  }
  throw new Error('unterminated content list')
}

function lessonEight(source) {
  const idAt = source.indexOf('moduleId:`bank-08-sa-hanger-det-ihop`')
  assert.ok(idAt >= 0, 'saknar lektion 08')
  assert.equal(source.indexOf('moduleId:`bank-08-sa-hanger-det-ihop`', idAt + 1), -1)
  const contentAt = source.indexOf('content:[', idAt)
  const content = parseTickList(source, contentAt + 'content:['.length)
  assert.ok(source.startsWith('],contentEn:[', content.end))
  const en = parseTickList(source, content.end + '],contentEn:['.length)
  assert.ok(source.startsWith('],quiz:', en.end), 'lektion 08 ska inte ha contentUk')
  const lesson = source.slice(idAt, en.end)
  assert.equal(lesson.includes('contentUk'), false)
  assert.equal(lesson.includes('topicsUk'), false)
  assert.equal(lesson.includes('moduleTitleUk'), false)
  return { sv: content.items, en: en.items }
}

function assertCloser(fields, label) {
  for (const lang of ['sv', 'en']) {
    const items = fields[lang]
    assert.ok(items.length > 2, `${label} ${lang}`)
    assert.deepEqual(items.slice(-2), CLOSER[lang], `${label} ${lang}`)
    const tail = items.slice(-2).join(' ')
    for (const word of BANNED) assert.equal(tail.includes(word), false, `${label} ${lang} ${word}`)
  }
  const body = fields.sv.slice(0, -2).join('\n')
  assert.equal(fields.en.slice(0, -2).join('\n'), body)
  assert.match(fields.sv.at(-3), /Bankkartan är en pedagogisk jämförelse/)
}

test('lektion 08 i Bankernas historia slutar med samma avslut på svenska och engelska', () => {
  const bundle = readFileSync(new URL('../../../assets/index-CBayL6Go.js', import.meta.url), 'utf8')
  const patch = readFileSync(new URL('../../../school/courses/patch-bundle.mjs', import.meta.url), 'utf8')
  const fromBundle = lessonEight(bundle)
  const fromPatch = lessonEight(patch)
  assertCloser(fromBundle, 'bundle')
  assertCloser(fromPatch, 'patch')
  assert.deepEqual(fromBundle, fromPatch)
  for (const phrase of [...CLOSER.sv, ...CLOSER.en]) {
    assert.equal(bundle.split(phrase).length - 1, 1, phrase)
  }
  assert.equal(bundle.includes('Історія на цьому'), false)
  assert.equal(bundle.includes('courseId:`bankernas-historia`'), true)
})
