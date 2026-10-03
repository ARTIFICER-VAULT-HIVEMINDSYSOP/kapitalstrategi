// Hårdkodsgranskning av det som publiceras för Trade Rider.
// Kör: node traderider/app/spel-test/hardkod-scan.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const LAGEN = join(REPO, 'traderider/spel/lagen')

function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

function read(rel) {
  return readFileSync(join(REPO, rel), 'utf8')
}

export function scan() {
  const unjustified = []
  const justified = []

  const pages = ['traderider/index.html', 'traderider/spel/index.html', 'nvda-rider/index.html', 'traderider/spel/lagen/i18n.js']
  for (const rel of pages) {
    if (read(rel).includes('NVDA Rider')) unjustified.push(`${rel}: produktnamnet innehåller fortfarande NVDA Rider`)
  }
  justified.push('Hash #trade-rider är kanonisk adress. #nvda-rider är ett alias, inte produktnamnet.')
  justified.push('historia-data.js seriesId NVDA är datamängdens id och ritas inte i gränssnittet.')
  justified.push('Typsnittsadresser mot fonts.googleapis.com och fonts.gstatic.com är inte kurskällor.')
  justified.push('styrmotor.js 450 är gestlåsets millisekunder, inte en prisnivå.')
  justified.push('panel.js matchar titel-noden Trade Rider, och fortfarande NVDA Line/Rider om en gammal nod finns kvar, för att placera växeln. Knapptexten kommer från i18n.')
  justified.push('RSI 14 är indikatorns namn, samma på alla språk.')
  justified.push('kind märke/medalj är interna id. Den synliga texten går via kind.mark och kind.medal.')
  justified.push('CSS-klasser som bg-paper är befintliga identifierare, inte kundtext.')
  justified.push('traderider/index.html har data-i18n-reserver som speglar ordlistan.')
  justified.push('assets/traderider-demo-nav.js är sajtens språkväxlare (sv/en/uk), inte en enspråkig sträng.')

  const ticker = /\b(BRK\.B|BRK|Duracell|Berkshire)\b/
  const dollar = /\$\s?\d/
  for (const name of readdirSync(LAGEN)) {
    if (!name.endsWith('.js') || name === 'i18n.js') continue
    const rel = `traderider/spel/lagen/${name}`
    const src = strip(read(rel))
    if (ticker.test(src)) unjustified.push(`${rel}: ticker eller varumärke`)
    if (dollar.test(src)) unjustified.push(`${rel}: hårdkodat belopp`)
    if (/https?:\/\/(?!fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(src)) unjustified.push(`${rel}: oväntad URL`)
    for (const hit of src.matchAll(/(?:fillText|textContent)\(\s*(['"`])([^'"`]*[åäöÅÄÖ][^'"`]*)\1/g)) {
      unjustified.push(`${rel}: synlig sträng utanför i18n: ${hit[2]}`)
    }
  }

  const steering = {
    'traderider/spel/lagen/orientation.js': new Set(),
    'traderider/spel/lagen/keys.js': new Set(),
    'traderider/spel/lagen/styrmotor.js': new Set(['450']),
  }
  for (const [rel, allowed] of Object.entries(steering)) {
    const src = strip(read(rel))
    for (const n of src.matchAll(/(?<![\w.])(-?\d{2,})(?![\w.])/g)) {
      if (!allowed.has(n[1])) unjustified.push(`${rel}: magiskt tal ${n[1]}`)
    }
  }

  if (read('traderider/spel/lagen/historia-data.js').includes('fetch(')) unjustified.push('historia-data.js hämtar data')
  const stale = 'nvda-rider/assets/routes-CbqPJAI2.js'
  if (existsSync(join(REPO, stale))) {
    if (read(stale).includes('nvda-fallback')) unjustified.push('nvda-rider-bundeln hämtar fortfarande fallback-filen')
    unjustified.push('nvda-rider/assets är en gammal bundle och ska inte publiceras')
  } else justified.push('nvda-rider/assets är borttagen. nvda-rider/index.html är bara en omdirigering.')

  return { unjustified, justified }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirect) {
  const { unjustified, justified } = scan()
  console.log('SCAN node traderider/app/spel-test/hardkod-scan.mjs')
  console.log(`unjustified: ${unjustified.length}`)
  for (const line of unjustified) console.log(`FAIL ${line}`)
  console.log(`justified: ${justified.length}`)
  for (const line of justified) console.log(`OK ${line}`)
  process.exit(unjustified.length ? 1 : 0)
}
