/**
 * Synliga namn. Hash-token (#nvda-rider) och id-attribut är interna och rörs inte.
 * Övrig synlig text, titel, aria-label, alt och titel-attribut byts till lägesnamnet.
 */
const HASH = /#[A-Za-z0-9_-]+/g
const BANNED = /nvda(?:\s*(?:line|rider))?|nvidia/gi

export function withoutInternalHash(value) {
  return String(value ?? '').replace(HASH, '')
}

export function hasBannedVisible(value) {
  return /nvda|nvidia/i.test(withoutInternalHash(value))
}

function replaceBanned(value, replacement) {
  return String(value ?? '')
    .replace(HASH, (hash) => `\u0000${hash}\u0000`)
    .replace(BANNED, replacement)
    .replace(/\u0000(#[A-Za-z0-9_-]+)\u0000/g, (_mark, hash) => hash)
}

function walkText(scope, visit) {
  const doc = scope.ownerDocument || scope
  const root = scope.nodeType === 9 ? scope.body : scope
  if (!root || !doc.createTreeWalker) return
  const walker = doc.createTreeWalker(root, 4)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const parent = node.parentElement
    if (!parent || parent.closest('script,style,noscript')) continue
    visit(node)
  }
}

export function scrubVisibleNames(root, replacement = 'Trade Rider') {
  if (!root) return
  const doc = root.nodeType === 9 ? root : root.ownerDocument
  if (doc && hasBannedVisible(doc.title)) doc.title = replaceBanned(doc.title, replacement)
  const scope = root.nodeType === 9 ? root : root
  walkText(scope, (node) => {
    if (hasBannedVisible(node.nodeValue)) node.nodeValue = replaceBanned(node.nodeValue, replacement)
  })
  const host = scope.nodeType === 9 ? scope : scope
  const els = host.querySelectorAll ? host.querySelectorAll('[aria-label],[alt],[title]') : []
  for (const el of els) {
    for (const attr of ['aria-label', 'alt', 'title']) {
      const value = el.getAttribute(attr)
      if (value && hasBannedVisible(value)) el.setAttribute(attr, replaceBanned(value, replacement))
    }
  }
}

function pushHit(hits, where, value) {
  if (hasBannedVisible(value)) hits.push(`${where}: ${String(value).trim()}`)
}

export function visibleNameHits(root) {
  const hits = []
  if (!root) return hits
  const doc = root.nodeType === 9 ? root : root.ownerDocument
  if (doc) pushHit(hits, 'title', doc.title)
  walkText(root, (node) => pushHit(hits, 'text', node.nodeValue))
  const host = root.nodeType === 9 ? root : root
  if (!host.querySelectorAll) return hits
  for (const el of host.querySelectorAll('[aria-label],[alt],[title]')) {
    for (const attr of ['aria-label', 'alt', 'title']) {
      const value = el.getAttribute(attr)
      if (value) pushHit(hits, attr, value)
    }
  }
  const urls = new Set()
  for (const el of host.querySelectorAll('img,source,video,image')) {
    for (const attr of ['src', 'srcset', 'poster', 'href']) {
      const value = el.getAttribute(attr)
      if (value) urls.add(value)
    }
  }
  const styled = host.querySelectorAll ? host.querySelectorAll('[style],style') : []
  for (const el of styled) {
    const css = el.tagName === 'STYLE' ? el.textContent : el.getAttribute('style')
    for (const match of String(css || '').matchAll(/url\(([^)]+)\)/g)) {
      urls.add(match[1].replace(/^['"]|['"]$/g, ''))
    }
  }
  for (const url of urls) pushHit(hits, 'bild', url)
  return hits
}
