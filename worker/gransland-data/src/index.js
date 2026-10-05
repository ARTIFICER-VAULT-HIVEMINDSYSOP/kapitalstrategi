/**
 * Gränslandet-data. Utkast, inte deployad.
 * Yahoo chart v8 för den fasta instrumentlistan, plus en kryptoreserv
 * om webbläsaren inte får läsa Coinbase eller Kraken direkt.
 * Ingen order, inget konto, ingen nyckel.
 */
import {
  CACHE_TTL_SECONDS,
  corsOrigin,
  isCryptoAllowed,
  isYahooAllowed,
  nextBackoff,
  normalizeYahooChart,
  yahooChartUrl,
} from './logic.js'

let backoffMs = 0
let backoffUntil = 0

function json(body, status, origin) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  }
  const allowed = corsOrigin(origin)
  if (allowed) {
    headers['access-control-allow-origin'] = allowed
    headers.vary = 'Origin'
  }
  return new Response(JSON.stringify(body), { status, headers })
}

function preflight(origin) {
  const allowed = corsOrigin(origin)
  if (!allowed) return json({ status: 'okand' }, 403, origin)
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': allowed,
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-max-age': '600',
      vary: 'Origin',
    },
  })
}

async function readCache(request) {
  if (typeof caches === 'undefined' || !caches.default) return null
  return caches.default.match(request)
}

async function writeCache(request, response, ctx) {
  if (typeof caches === 'undefined' || !caches.default) return
  const stored = new Response(response.body, response)
  stored.headers.set('cache-control', `public, max-age=${CACHE_TTL_SECONDS}`)
  const put = caches.default.put(request, stored)
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(put)
  else await put
}

async function fetchYahoo(symbol) {
  const now = Date.now()
  if (now < backoffUntil) return { status: 429, bars: [], backoff: true }
  const res = await fetch(yahooChartUrl(symbol), {
    headers: { accept: 'application/json', 'user-agent': 'kapitalstrategi-gransland' },
  })
  if (res.status === 429) {
    backoffMs = nextBackoff(backoffMs)
    backoffUntil = Date.now() + backoffMs
    console.log(JSON.stringify({ event: 'yahoo', symbol, status: 429, backoffMs }))
    return { status: 429, bars: [] }
  }
  if (!res.ok) {
    console.log(JSON.stringify({ event: 'yahoo', symbol, status: res.status }))
    return { status: res.status, bars: [] }
  }
  backoffMs = 0
  backoffUntil = 0
  const bars = normalizeYahooChart(await res.json())
  console.log(JSON.stringify({ event: 'yahoo', symbol, status: 200, bars: bars.length }))
  return { status: 200, bars }
}

async function fetchCoinbaseCandle() {
  const res = await fetch('https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60', {
    headers: { accept: 'application/json', 'user-agent': 'kapitalstrategi-gransland' },
  })
  if (!res.ok) return { status: res.status, bars: [] }
  const rows = await res.json()
  if (!Array.isArray(rows)) return { status: 200, bars: [] }
  const bars = rows
    .map((row) => ({
      t: Number(row[0]) * 1000,
      l: Number(row[1]),
      h: Number(row[2]),
      o: Number(row[3]),
      c: Number(row[4]),
    }))
    .filter((bar) => [bar.t, bar.o, bar.h, bar.l, bar.c].every(Number.isFinite))
    .sort((a, b) => a.t - b.t)
  return { status: 200, bars }
}

export default {
  async fetch(request, _env, ctx) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    if (request.method === 'OPTIONS') return preflight(origin)
    if (request.method !== 'GET') return json({ status: 'okand' }, 405, origin)
    if (!corsOrigin(origin) && origin) return json({ status: 'okand' }, 403, origin)

    if (url.pathname === '/chart') {
      const symbol = url.searchParams.get('symbol') || ''
      if (!isYahooAllowed(symbol)) return json({ status: 'okand', symbol }, 404, origin)
      const cacheKey = new Request(`https://gransland.cache/chart/${encodeURIComponent(symbol)}`)
      const hit = await readCache(cacheKey)
      if (hit) return withCors(hit, origin)
      const loaded = await fetchYahoo(symbol)
      if (loaded.status !== 200 || !loaded.bars.length) return json({ status: 'okand', symbol }, loaded.status === 429 ? 429 : 502, origin)
      const response = json({ symbol, source: 'Yahoo', delayed: true, fetchedAt: Date.now(), bars: loaded.bars }, 200, origin)
      await writeCache(cacheKey, response.clone(), ctx)
      return response
    }

    if (url.pathname === '/crypto') {
      const symbol = url.searchParams.get('symbol') || 'BTC-USD'
      if (!isCryptoAllowed(symbol)) return json({ status: 'okand', symbol }, 404, origin)
      const cacheKey = new Request('https://gransland.cache/crypto/BTC-USD')
      const hit = await readCache(cacheKey)
      if (hit) return withCors(hit, origin)
      const loaded = await fetchCoinbaseCandle()
      if (!loaded.bars.length) return json({ status: 'okand', symbol }, 502, origin)
      const response = json({
        symbol: 'BTC-USD',
        source: 'Coinbase',
        delayed: false,
        fetchedAt: Date.now(),
        bars: loaded.bars,
      }, 200, origin)
      await writeCache(cacheKey, response.clone(), ctx)
      return response
    }

    return json({ status: 'okand' }, 404, origin)
  },
}

function withCors(response, origin) {
  const headers = new Headers(response.headers)
  const allowed = corsOrigin(origin)
  if (allowed) {
    headers.set('access-control-allow-origin', allowed)
    headers.set('vary', 'Origin')
  }
  return new Response(response.body, { status: response.status, headers })
}
