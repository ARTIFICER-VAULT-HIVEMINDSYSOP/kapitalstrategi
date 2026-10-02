import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { STRINGS } from '../../spel/lagen/i18n.js'
import { scrubVisibleNames, visibleNameHits, hasBannedVisible } from '../../spel/lagen/synlig.js'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const PAGES = ['traderider/index.html', 'traderider/spel/index.html']

function page(rel) {
  const html = readFileSync(join(REPO, rel), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '')
  const window = new Window({ url: 'https://kapitalstrategi.example' + rel })
  window.document.write(html)
  return window.document
}

test('synlig text, titel, aria-label, alt och bilder saknar nvda och nvidia', () => {
  for (const rel of PAGES) {
    const hits = visibleNameHits(page(rel))
    assert.deepEqual(hits, [], rel)
  }
  for (const [lang, table] of Object.entries(STRINGS)) {
    for (const [key, value] of Object.entries(table)) {
      assert.equal(hasBannedVisible(value), false, `${lang} ${key}`)
    }
  }
  for (const rel of PAGES) {
    const doc = page(rel)
    const urls = visibleImageUrls(doc)
    for (const url of urls) {
      assert.equal(hasBannedVisible(url), false, url)
      const path = url.startsWith('/') ? join(REPO, url.split('?')[0].split('#')[0]) : ''
      if (!path) continue
      const bytes = readFileSync(path).toString('latin1')
      assert.equal(/nvda|nvidia/i.test(bytes), false, path)
    }
  }
})

test('hash och id får bära namnet, övrigt synligt byts och hittas', () => {
  const doc = page('traderider/index.html')
  const box = doc.createElement('div')
  box.id = 'nvda-line-rsi-style'
  const title = doc.createElement('span')
  title.textContent = 'NVDA Rider'
  const link = doc.createElement('a')
  link.href = '/traderider/spel/#nvda-rider'
  link.textContent = 'Trade Rider'
  const pic = doc.createElement('img')
  pic.alt = 'Nvidia chart'
  pic.src = '/traderider/art/rider-cover.jpg'
  const named = doc.createElement('img')
  named.alt = 'Trade Rider'
  named.src = '/images/nvidia-logo.png'
  doc.body.append(box, title, link, pic, named)
  doc.title = 'NVDA Rider'
  const before = visibleNameHits(doc)
  assert.ok(before.some((hit) => hit.includes('NVDA Rider')))
  assert.ok(before.some((hit) => hit.includes('Nvidia')))
  assert.ok(before.some((hit) => hit.includes('nvidia-logo')))
  assert.equal(before.some((hit) => hit.includes('#nvda-rider')), false)
  assert.equal(before.some((hit) => hit.includes('nvda-line-rsi-style')), false)
  scrubVisibleNames(doc, 'Trade Rider')
  assert.equal(title.textContent, 'Trade Rider')
  assert.equal(pic.alt, 'Trade Rider chart')
  assert.equal(doc.title, 'Trade Rider')
  assert.equal(link.getAttribute('href').includes('#nvda-rider'), true)
  assert.equal(box.id, 'nvda-line-rsi-style')
  const after = visibleNameHits(doc).filter((hit) => !hit.includes('nvidia-logo'))
  assert.deepEqual(after, [])
  assert.equal(hasBannedVisible('#nvda-rider'), false)
  assert.equal(hasBannedVisible('se #nvda-rider'), false)
})

test('panelen skriver om bundelns rubrik i loopen', () => {
  const panel = readFileSync(new URL('../../spel/lagen/panel.js', import.meta.url), 'utf8')
  const loop = panel.slice(panel.indexOf('const loop'))
  assert.match(loop, /refreshTitle\(\)/)
  assert.match(panel, /scrubVisibleNames/)
  const bundle = readFileSync(new URL('../../spel/assets/routes-CbqPJAI2.js', import.meta.url), 'utf8')
  assert.match(bundle, /children:`NVDA Rider`/)
  const doc = page('traderider/spel/index.html')
  const span = doc.createElement('span')
  span.textContent = 'NVDA Rider'
  doc.body.append(span)
  scrubVisibleNames(doc, STRINGS.sv['mode.trendRider.name'])
  assert.equal(span.textContent, 'Trade Rider')
  assert.deepEqual(visibleNameHits(doc), [])
})

function visibleImageUrls(doc) {
  const urls = []
  for (const el of doc.querySelectorAll('[style],style')) {
    const css = el.tagName === 'STYLE' ? el.textContent : el.getAttribute('style')
    for (const match of String(css || '').matchAll(/url\(([^)]+)\)/g)) {
      urls.push(match[1].replace(/^['"]|['"]$/g, ''))
    }
  }
  for (const el of doc.querySelectorAll('img,source')) {
    if (el.getAttribute('src')) urls.push(el.getAttribute('src'))
  }
  return urls
}
