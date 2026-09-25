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
console.log('demo bundle has no broker or external desk links')
