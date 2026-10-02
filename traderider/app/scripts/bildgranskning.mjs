/**
 * Granskar publicerade bilder under traderider/ med Tesseract.
 * Kör: npm run bildgranskning
 *
 * traderider/app/docs/ ingår inte. Pages tar bort hela traderider/app före
 * uppladdning (.github/workflows/pages.yml), och mappen är intern
 * utvecklingsdokumentation. Den återställs från origin/main och diffas inte.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const ROOT = join(REPO, 'traderider')
const LIST = fileURLToPath(new URL('../spel-test/bildgranskning.json', import.meta.url))
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg'])
const BANNED = /nvda|nvidia/i
const UNDANTAG = [
  {
    path: 'traderider/app/docs/',
    motiv:
      'Publiceras inte. GitHub Pages tar bort traderider/app före uppladdning (.github/workflows/pages.yml). Mappen är intern utvecklingsdokumentation och ingår inte i granskningen.',
  },
]

function extOf(name) {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i).toLowerCase()
}

function excluded(rel) {
  return rel.startsWith('traderider/app/docs/') || rel.split('/').includes('node_modules')
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const p = join(dir, name)
    const rel = relative(REPO, p).split('\\').join('/')
    if (excluded(rel)) continue
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXTS.has(extOf(name))) out.push({ path: p, rel })
  }
  return out
}

function tesseract(file, psm) {
  const run = spawnSync('tesseract', [file, 'stdout', '--psm', psm], { encoding: 'utf8' })
  if (run.error) throw run.error
  if (run.status !== 0) throw new Error(run.stderr || `tesseract ${file} psm ${psm}`)
  return run.stdout || ''
}

function boost(file) {
  const dest = join(tmpdir(), 'bildgranskning-boost.png')
  const run = spawnSync(
    'python3',
    [
      '-c',
      'from PIL import Image, ImageOps, ImageEnhance; import sys; im=Image.open(sys.argv[1]).convert("L"); im=ImageEnhance.Contrast(ImageOps.autocontrast(im)).enhance(2); im.save(sys.argv[2])',
      file,
      dest,
    ],
    { encoding: 'utf8' },
  )
  if (run.status !== 0) throw new Error(run.stderr || 'kontrastbild misslyckades')
  return dest
}

function hitsIn(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => BANNED.test(line))
}

const files = walk(ROOT).sort((a, b) => a.rel.localeCompare(b.rel))
const failures = []
const bilder = []
const datum = new Date().toISOString().slice(0, 10)

for (const file of files) {
  if (file.rel.endsWith('.svg')) {
    const text = readFileSync(file.path, 'utf8')
    if (BANNED.test(text)) failures.push(`${file.rel}: svg`)
  } else {
    const found = []
    for (const psm of ['6', '11']) found.push(...hitsIn(tesseract(file.path, psm)))
    found.push(...hitsIn(tesseract(boost(file.path), '6')))
    if (found.length) failures.push(`${file.rel}: ${found.join(' | ')}`)
  }
  const md5 = createHash('md5').update(readFileSync(file.path)).digest('hex')
  bilder.push({ path: file.rel, md5, ocr: 'ren', datum })
}

if (failures.length) {
  console.error(`träffar: ${failures.length}`)
  for (const line of failures) console.error(line)
  process.exit(1)
}

mkdirSync(join(LIST, '..'), { recursive: true })
writeFileSync(LIST, JSON.stringify({ undantag: UNDANTAG, bilder }, null, 2) + '\n')
console.log(`bildgranskning: ${bilder.length} bilder, ocr ren ${datum}`)
