import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = import.meta.dirname

/** { 'raket/index.html': { namn, mal }, ... } — the only pages allowed under /traderider/demo/. */
export function demoRedirects() {
  const all = JSON.parse(readFileSync(join(dir, 'demo-redirects.json'), 'utf8'))
  return Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith('_')))
}

/** The exact HTML every demo entry must contain. */
export function renderRedirect({ namn, mal }) {
  const kanonisk = mal.split('#')[0]
  return readFileSync(join(dir, 'demo-redirect.html'), 'utf8')
    .replaceAll('%NAMN%', namn)
    .replaceAll('%MAL%', mal)
    .replaceAll('%KANONISK%', kanonisk)
}
