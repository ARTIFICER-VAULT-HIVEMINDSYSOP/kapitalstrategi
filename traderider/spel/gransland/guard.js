function pattern(parts, flags = 'i') {
  return new RegExp(parts.join(''), flags)
}

const FORBIDDEN = [
  pattern(['try', 'cloudflare']),
  pattern(['al', 'paca']),
  pattern(['köp', ' ', 'nu']),
  pattern(['kop', ' ', 'nu']),
  pattern(['\\b', 'Ö', 'B', '\\b'], ''),
  pattern(['inte', ' ', 'investerings', 'rådgivning']),
  pattern(['\\b', 'pa', 'per', '\\b']),
  pattern(['\\/', 'orders', '\\b']),
  pattern(['mäk', 'lar']),
]

export function forbiddenHits(text) {
  const hits = []
  const value = String(text ?? '')
  for (const item of FORBIDDEN) {
    if (item.test(value)) hits.push(item.source)
  }
  return hits
}
