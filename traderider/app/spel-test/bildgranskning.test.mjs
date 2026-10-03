import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const ROOT = REPO
const LIST = new URL('./bildgranskning.json', import.meta.url)
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg'])

// traderider/app/docs/ publiceras inte: Pages tar bort traderider/app
// (.github/workflows/pages.yml). Mappen är intern utvecklingsdokumentation.
function excluded(rel) {
  if (rel.startsWith('traderider/app/') || rel.startsWith('traderider/app/docs/')) return true
  const parts = rel.split('/')
  return parts.includes('node_modules') || parts.includes('.git')
}

function extOf(name) {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i).toLowerCase()
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const p = join(dir, name)
    const rel = relative(REPO, p).split('\\').join('/')
    if (excluded(rel)) continue
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXTS.has(extOf(name))) out.push(p)
  }
  return out
}

function md5(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex')
}

test('varje publicerad bild är granskad, ren och har oförändrad md5', () => {
  const doc = JSON.parse(readFileSync(LIST, 'utf8'))
  assert.ok(doc.undantag.some((row) => row.path === 'traderider/app/docs/' && /publiceras inte/i.test(row.motiv)))
  const byPath = new Map(doc.bilder.map((row) => [row.path, row]))
  const seen = new Set()
  for (const file of walk(ROOT)) {
    const rel = relative(REPO, file).split('\\').join('/')
    seen.add(rel)
    const row = byPath.get(rel)
    assert.ok(row, `${rel} saknas i bildgranskning.json`)
    assert.equal(md5(file), row.md5, `${rel} har ändrats utan ny granskning`)
    assert.equal(row.ocr, 'ren', rel)
    assert.match(row.datum, /^\d{4}-\d{2}-\d{2}$/, rel)
    if (rel.endsWith('.svg')) assert.equal(/nvda|nvidia/i.test(readFileSync(file, 'utf8')), false, rel)
  }
  for (const row of doc.bilder) {
    assert.equal(seen.has(row.path), true, `${row.path} finns i listan men inte bland publicerade bilder`)
    assert.equal(row.path.startsWith('traderider/app/docs/'), false, row.path)
  }
  assert.equal(doc.bilder.length, seen.size)
})
