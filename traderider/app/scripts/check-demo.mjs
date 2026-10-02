import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { demoRedirects, renderRedirect } from './demo-redirect.mjs'

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
  // spärrad demoram (permanent): inga rester får ligga under /traderider/demo/
  'DemoFrame',
  'RiderDesk',
  'Övningskapital',
  '$100,000',
  '20-SMA',
  'Paus · mellanslag',
  'Alla lägen',
  'Hävstång − · [',
  'Hävstång + · ]',
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

// Spärrad demoram: varje fil under /traderider/demo/ ska vara exakt omdirigeringen i demo-redirects.json
// (se DEMO_REDIRECTS i vite.demo.config.ts). Faller om ett bygge har återställt demoramen eller lämnat bundlar kvar.
const expected = demoRedirects()
const present = []
async function allFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await allFiles(path)
    else present.push(relative(root, path).split('\\').join('/'))
  }
}
await allFiles(root)
const problems = []
for (const rel of present) {
  if (!(rel in expected)) problems.push(`${rel}: not a redirect entry (demo bundles must not be deployed)`)
  else if ((await readFile(join(root, rel), 'utf8')) !== renderRedirect(expected[rel])) problems.push(`${rel}: not the redirect to ${expected[rel].mal}`)
}
for (const rel of Object.keys(expected)) if (!present.includes(rel)) problems.push(`${rel}: missing redirect`)
if (problems.length) {
  console.error('blocked demo frame: every /traderider/demo/ entry must be a redirect and nothing else may remain:\n' + problems.join('\n'))
  process.exit(1)
}
console.log('demo bundle has no broker or external desk links')
console.log(`all ${present.length} demo files are redirects (${Object.entries(expected).map(([k, v]) => `${k} -> ${v.mal}`).join(', ')})`)
