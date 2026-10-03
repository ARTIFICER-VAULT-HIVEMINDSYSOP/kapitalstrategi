// Avslutningen i Bankernas historia, lektion 08, ska finnas på sv/en/uk.
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
  uk: [
    'Історія на цьому не закінчується. Як банки й платежі працюють сьогодні, ви можете дізнатися далі з того, що наші клієнти повідомляють нам, і з того, що нам вдалося виявити в інтернеті.',
    'Те, чим ми ділимося, зібрано й знеособлено, і це спостереження, а не гарантія того, як діє певний банк.',
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
  assert.ok(source.startsWith('],contentUk:[', en.end))
  const uk = parseTickList(source, en.end + '],contentUk:['.length)
  assert.ok(source.startsWith('],quiz:', uk.end))
  return { sv: content.items, en: en.items, uk: uk.items }
}

function assertCloser(fields, label) {
  for (const lang of ['sv', 'en', 'uk']) {
    const items = fields[lang]
    assert.ok(items.length > 2, `${label} ${lang}`)
    assert.deepEqual(items.slice(-2), CLOSER[lang], `${label} ${lang}`)
    const tail = items.slice(-2).join(' ')
    for (const word of BANNED) assert.equal(tail.includes(word), false, `${label} ${lang} ${word}`)
    assert.equal(items.slice(0, -2).some((p) => p.includes('Historien slutar inte här')), false)
  }
  const body = fields.sv.slice(0, -2).join('\n')
  assert.equal(fields.en.slice(0, -2).join('\n'), body)
  assert.equal(fields.uk.slice(0, -2).join('\n'), body)
  assert.match(fields.sv.at(-3), /Bankkartan är en pedagogisk jämförelse/)
}

test('lektion 08 i Bankernas historia slutar med samma avslut på sv, en och uk', () => {
  const bundle = readFileSync(new URL('../../../assets/index-CBayL6Go.js', import.meta.url), 'utf8')
  const patch = readFileSync(new URL('../../../school/courses/patch-bundle.mjs', import.meta.url), 'utf8')
  const fromBundle = lessonEight(bundle)
  const fromPatch = lessonEight(patch)
  assertCloser(fromBundle, 'bundle')
  assertCloser(fromPatch, 'patch')
  assert.deepEqual(fromBundle, fromPatch)
  for (const phrase of [CLOSER.sv[0], CLOSER.en[0], CLOSER.uk[0]]) {
    assert.equal(bundle.split(phrase).length - 1, 1, phrase)
  }
  assert.equal(bundle.includes('courseId:`bankernas-historia`'), true)
})
