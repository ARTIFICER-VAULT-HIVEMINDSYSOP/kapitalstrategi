import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '../../demo')
const banned = [
  'alpaca',
  'paper-api',
  'BrokerPanel',
  'brokerProxy',
  'brokerSession',
  'grok.me',
  'drum-moss',
  'ForceX',
  '/api/broker',
  'Paper desk',
  'Paper book',
  'Gå live',
  'GÅ LIVE',
]

async function files(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await files(path)))
    else if (/\.(js|html|css)$/.test(entry.name)) out.push(path)
  }
  return out
}

const found = []
for (const path of await files(root)) {
  const text = await readFile(path, 'utf8')
  for (const word of banned) {
    if (text.includes(word)) found.push(`${path}: ${word}`)
  }
}
if (found.length) {
  console.error(found.join('\n'))
  process.exit(1)
}

// Spärrad variant: varje ingång under /traderider/demo/ ska vara omdirigeringen till /nvda-rider/
// (se REDIRECTED_TO_NVDA_RIDER i vite.demo.config.ts). Faller om ett bygge har återställt demoramen.
const redirect = await readFile(join(import.meta.dirname, 'nvda-rider-redirect.html'), 'utf8')
const entries = []
async function htmlEntries(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await htmlEntries(path)
    else if (entry.name.endsWith('.html')) entries.push(path)
  }
}
await htmlEntries(root)
const notRedirected = []
for (const path of entries) {
  if ((await readFile(path, 'utf8')) !== redirect) notRedirected.push(path)
}
if (notRedirected.length) {
  console.error('demo entries must redirect to /nvda-rider/ (blocked variant):\n' + notRedirected.join('\n'))
  process.exit(1)
}
console.log('demo bundle has no broker or external desk links')
console.log(`all ${entries.length} demo entries redirect to /nvda-rider/`)
