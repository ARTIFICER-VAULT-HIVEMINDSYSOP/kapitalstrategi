// Publicerade texter under docs/raket-akademin/ (inte _intern/) får inte bära interna markörer.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../../docs/raket-akademin/', import.meta.url).pathname
const BANNED = ['ÖB', 'TODO', 'internt', 'inte investeringsrådgivning', '## Källor', 'paper']

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '_intern') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

test('publicerade raket-akademin-texter saknar interna markörer och har Koppling', () => {
  const files = walk(ROOT).filter((p) => /\.(md|html|json)$/.test(p))
  assert.ok(files.some((p) => p.endsWith('koppling.md')))
  assert.ok(files.some((p) => p.endsWith('README.md')))
  const hits = []
  for (const p of files) {
    const text = readFileSync(p, 'utf8')
    for (const word of BANNED) if (text.includes(word)) hits.push(`${relative(ROOT, p)}: ${word}`)
    if (p.endsWith('.md') && !text.includes('## Koppling') && !text.includes('# Koppling')) hits.push(`${relative(ROOT, p)}: saknar Koppling`)
  }
  assert.deepEqual(hits, [])
})
