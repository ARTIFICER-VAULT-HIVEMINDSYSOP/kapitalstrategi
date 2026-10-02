import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const ROOT = join(REPO, 'traderider')
const LIST = new URL('./bildgranskning.json', import.meta.url)
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg'])

function ext(name) {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i).toLowerCase()
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXTS.has(ext(name))) out.push(p)
  }
  return out
}

function md5(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex')
}

test('varje bild under traderider/ är granskad och har oförändrad md5', () => {
  const reviewed = JSON.parse(readFileSync(LIST, 'utf8'))
  const byPath = new Map(reviewed.map((row) => [row.path, row.md5]))
  const seen = new Set()
  for (const file of walk(ROOT)) {
    const rel = relative(REPO, file).split('\\').join('/')
    seen.add(rel)
    assert.equal(byPath.has(rel), true, `${rel} saknas i bildgranskning.json`)
    assert.equal(md5(file), byPath.get(rel), `${rel} har ändrats utan ny granskning`)
    if (ext(file).endsWith('svg') || file.endsWith('.svg')) {
      assert.equal(/nvda|nvidia/i.test(readFileSync(file, 'utf8')), false, rel)
    }
  }
  for (const row of reviewed) {
    assert.equal(seen.has(row.path), true, `${row.path} finns i listan men inte på disk`)
    assert.match(row.md5, /^[a-f0-9]{32}$/)
  }
  assert.equal(reviewed.length, seen.size)
})
