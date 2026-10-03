import { instrumentById } from './instruments.js'

export const COINBASE_ORIGIN = 'https://api.exchange.coinbase.com'
export const KRAKEN_ORIGIN = 'https://api.kraken.com'

export function parseCoinbaseCandles(payload) {
  if (!Array.isArray(payload)) return []
  const bars = []
  for (const row of payload) {
    if (!Array.isArray(row) || row.length < 5) continue
    const t = Number(row[0])
    const low = Number(row[1])
    const high = Number(row[2])
    const open = Number(row[3])
    const close = Number(row[4])
    if (![t, low, high, open, close].every(Number.isFinite)) continue
    bars.push({ t: t < 1e12 ? t * 1000 : t, o: open, h: high, l: low, c: close })
  }
  bars.sort((a, b) => a.t - b.t)
  return bars
}

export function parseKrakenCandles(payload) {
  const result = payload?.result
  if (!result || typeof result !== 'object') return []
  const key = Object.keys(result).find((name) => name !== 'last')
  const rows = key ? result[key] : null
  if (!Array.isArray(rows)) return []
  const bars = []
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue
    const t = Number(row[0])
    const open = Number(row[1])
    const high = Number(row[2])
    const low = Number(row[3])
    const close = Number(row[4])
    if (![t, low, high, open, close].every(Number.isFinite)) continue
    bars.push({ t: t < 1e12 ? t * 1000 : t, o: open, h: high, l: low, c: close })
  }
  bars.sort((a, b) => a.t - b.t)
  return bars
}

export function parseKrakenPrice(payload) {
  const result = payload?.result
  if (!result) return null
  const key = Object.keys(result)[0]
  const last = Number(result[key]?.c?.[0])
  return Number.isFinite(last) ? last : null
}

async function readJson(res) {
  if (!res || typeof res.json !== 'function') return null
  return res.json()
}

export async function fetchCoinbase(fetchImpl, product = 'BTC-USD') {
  let tickerRes
  let candleRes
  try {
    ;[tickerRes, candleRes] = await Promise.all([
      fetchImpl(`${COINBASE_ORIGIN}/products/${product}/ticker`, { credentials: 'omit' }),
      fetchImpl(`${COINBASE_ORIGIN}/products/${product}/candles?granularity=60`, { credentials: 'omit' }),
    ])
  } catch (error) {
    return { ok: false, reason: 'failed', source: 'Coinbase', error }
  }
  const status = !tickerRes?.ok ? tickerRes?.status : !candleRes?.ok ? candleRes?.status : 200
  if (status !== 200) return { ok: false, reason: 'failed', source: 'Coinbase', status: status || 0 }
  const ticker = await readJson(tickerRes)
  const candles = await readJson(candleRes)
  const bars = parseCoinbaseCandles(candles)
  const price = Number(ticker?.price)
  const time = Date.parse(ticker?.time)
  if (!bars.length || !Number.isFinite(price)) return { ok: false, reason: 'failed', source: 'Coinbase' }
  return {
    ok: true,
    bars,
    price,
    time: Number.isFinite(time) ? time : bars[bars.length - 1].t,
    source: 'Coinbase',
    delayed: false,
    status: 200,
  }
}

export async function fetchKraken(fetchImpl, pair = 'XBTUSD') {
  let tickerRes
  let candleRes
  try {
    ;[tickerRes, candleRes] = await Promise.all([
      fetchImpl(`${KRAKEN_ORIGIN}/0/public/Ticker?pair=${pair}`, { credentials: 'omit' }),
      fetchImpl(`${KRAKEN_ORIGIN}/0/public/OHLC?pair=${pair}&interval=1`, { credentials: 'omit' }),
    ])
  } catch (error) {
    return { ok: false, reason: 'failed', source: 'Kraken', error }
  }
  const status = !tickerRes?.ok ? tickerRes?.status : !candleRes?.ok ? candleRes?.status : 200
  if (status !== 200) return { ok: false, reason: 'failed', source: 'Kraken', status: status || 0 }
  const ticker = await readJson(tickerRes)
  const candles = await readJson(candleRes)
  const bars = parseKrakenCandles(candles)
  const price = parseKrakenPrice(ticker)
  if (!bars.length || !Number.isFinite(price)) return { ok: false, reason: 'failed', source: 'Kraken' }
  const received = Date.now()
  return { ok: true, bars, price, time: received, source: 'Kraken', delayed: false, status: 200 }
}

export async function fetchCrypto(fetchImpl) {
  const coinbase = await fetchCoinbase(fetchImpl)
  if (coinbase.ok) return coinbase
  const kraken = await fetchKraken(fetchImpl)
  if (kraken.ok) return kraken
  const status = coinbase.status === 429 || kraken.status === 429 ? 429 : coinbase.status || kraken.status || 0
  return { ok: false, reason: 'failed', source: kraken.source || coinbase.source || '', status }
}

export async function fetchStock(fetchImpl, { workerUrl, symbol }) {
  if (!workerUrl) return { ok: false, reason: 'no-worker', network: false, source: 'Yahoo', delayed: true }
  const base = String(workerUrl).replace(/\/$/, '')
  let res
  try {
    res = await fetchImpl(`${base}/chart?symbol=${encodeURIComponent(symbol)}`, { credentials: 'omit' })
  } catch (error) {
    return { ok: false, reason: 'failed', source: 'Yahoo', delayed: true, error }
  }
  if (!res?.ok) return { ok: false, reason: 'failed', source: 'Yahoo', delayed: true, status: res?.status || 0 }
  const body = await readJson(res)
  if (!body || body.status === 'okand' || !Array.isArray(body.bars) || !body.bars.length) {
    return { ok: false, reason: 'failed', source: 'Yahoo', delayed: true, status: res.status }
  }
  const bars = body.bars.map((bar) => ({ t: Number(bar.t), o: Number(bar.o), h: Number(bar.h), l: Number(bar.l), c: Number(bar.c) }))
    .filter((bar) => [bar.t, bar.o, bar.h, bar.l, bar.c].every(Number.isFinite))
  const last = bars[bars.length - 1]
  if (!last) return { ok: false, reason: 'failed', source: 'Yahoo', delayed: true }
  return {
    ok: true,
    bars,
    price: last.c,
    time: Number(body.fetchedAt) || last.t,
    source: 'Yahoo',
    delayed: true,
    status: 200,
  }
}

export async function loadInstrument(fetchImpl, { id, workerUrl }) {
  const instrument = instrumentById(id)
  if (!instrument) return { ok: false, reason: 'failed', network: false }
  if (instrument.kind === 'crypto') return fetchCrypto(fetchImpl)
  return fetchStock(fetchImpl, { workerUrl, symbol: instrument.yahoo })
}
