/**
 * Granskar publicerade bilder under traderider/ med Tesseract.
 * Kör: npm run bildgranskning
 *
 * traderider/app/docs/ ingår inte. Pages tar bort hela traderider/app före
 * uppladdning (.github/workflows/pages.yml), och mappen är intern
 * utvecklingsdokumentation. Den återställs från origin/main och diffas inte.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
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

/**
 * Vit text på svart botten syns för Tesseract först när bilden inverteras
 * och förstoras. Varje rasterbild läses därför normalt och inverterat,
 * i 2× och 3×, med psm 3, 6 och 11.
 */
function variants(file) {
  const dest = mkdtempSync(join(tmpdir(), 'bildgranskning-'))
  const run = spawnSync(
    'python3',
    [
      '-c',
      'from PIL import Image, ImageOps; import sys; im=Image.open(sys.argv[1]).convert("RGB"); dest=sys.argv[2]\n'
        + 'for scale in (2, 3):\n'
        + '    up=im.resize((im.width*scale, im.height*scale), Image.Resampling.LANCZOS)\n'
        + '    up.save(f"{dest}/n{scale}.png"); ImageOps.invert(up).save(f"{dest}/i{scale}.png")\n',
      file,
      dest,
    ],
    { encoding: 'utf8' },
  )
  if (run.status !== 0) throw new Error(run.stderr || 'förstoring misslyckades')
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
    const dir = variants(file.path)
    const found = []
    try {
      for (const tag of ['n2', 'n3', 'i2', 'i3']) {
        for (const psm of ['3', '6', '11']) {
          const lines = hitsIn(tesseract(join(dir, `${tag}.png`), psm))
          for (const line of lines) found.push(`${tag} psm ${psm}: ${line}`)
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
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
