// Första gruppen i «Kurser i spåret» är Ms.filter(id => Xc.includes(id)).
// Den behåller Ms-ordning. Xc-ordning och fältet order styr inte korten.
// «Din karta genom skolan» ska vara öppen, samma mönster som katalogens open:!0.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../../../assets/index-CBayL6Go.js', import.meta.url), 'utf8')

function courseOrder(source) {
  const start = source.indexOf(',Ms=[{courseId:')
  assert.ok(start >= 0, 'saknar kurslistan Ms')
  const end = source.indexOf('];function Ns', start)
  assert.ok(end > start, 'saknar slutet på Ms')
  return [...source.slice(start, end).matchAll(/courseId:`([^`]+)`,order:/g)].map((m) => m[1])
}

function memberList(source, name) {
  const marker = `var ${name}=[`
  const start = source.indexOf(marker)
  assert.ok(start >= 0, `saknar ${name}`)
  assert.equal(source.indexOf(marker, start + 1), -1, `${name} ska förekomma en gång`)
  const end = source.indexOf(']', start)
  return [...source.slice(start, end).matchAll(/`([^`]+)`/g)].map((m) => m[1])
}

function groups(source) {
  const order = courseOrder(source)
  const xc = memberList(source, 'Xc')
  const first = order.filter((id) => xc.includes(id))
  const rest = order.filter((id) => !xc.includes(id))
  return { order, xc, first, rest }
}

test('första kursgruppen ryms på en rad och innehåller Bankernas historia', () => {
  assert.equal(bundle.split('Ms.filter(e=>Xc.includes(e.courseId))').length - 1, 1)
  assert.equal(bundle.split('Ms.filter(e=>!Xc.includes(e.courseId))').length - 1, 1)
  const { order, first, rest } = groups(bundle)
  assert.ok(first.length <= 4, first.join(','))
  assert.equal(first.includes('bankernas-historia'), true)
  assert.ok(first.indexOf('bankernas-historia') < 4)
  assert.equal(rest.includes('ipo'), true, 'ipo ska ligga kvar i nästa grupp')
  assert.equal(order.includes('bankernas-historia'), true)
  assert.deepEqual([...first, ...rest].sort(), [...order].sort())
  assert.equal(bundle.includes('className:`ts-catalog-fold card`,open:!0'), true)
  assert.equal(bundle.split('className:`ts-path-fold card`,open:!0').length - 1, 1)
  assert.equal(bundle.includes('className:`ts-path-fold card`,children:'), false)
})
