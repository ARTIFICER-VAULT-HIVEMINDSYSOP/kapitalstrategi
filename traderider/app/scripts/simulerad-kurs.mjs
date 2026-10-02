#!/usr/bin/env node
/**
 * Simulerad kursserie för NVDA Rider, Raket och Akademin.
 *
 * Inga verkliga marknadsdata: en deterministisk geometrisk brownsk rörelse (GBM) med fast frö
 * och växlande drift. Samma frö ger alltid samma fil. Tidsstämplarna är fiktiva (dag 1 kl. 09:30
 * räknat från 0) och visas i spelen som «Dag N», «Vecka N» eller «Månad N», aldrig som datum.
 *
 * Användning: node scripts/simulerad-kurs.mjs <utfil.json> [<utfil2.json> ...]
 */
import { writeFileSync } from 'node:fs'

export const SEED = 20261001
export const SLUTKURS = 118.4 // fiktiv slutkurs, ingen koppling till någon verklig aktie
export const DRIFT = 0.1 // årlig drift i snitt
export const VOL = 0.4 // årlig volatilitet
export const T0 = 9.5 * 3600 // «Dag 1 kl. 09:30»

// nyckel: [antal staplar, sekunder per stapel i fiktiv tid, år per stapel i handelstid]
export const SERIER = {
  '1d:1m': [337, 60, 1 / (252 * 390)],
  '5d:5m': [837, 300, 1 / (252 * 78)],
  '5d:15m': [280, 900, 1 / (252 * 26)],
  '1mo:30m': [674, 1800, 1 / (252 * 13)],
  '1mo:1h': [359, 3600, 1 / (252 * 6.5)],
  '3mo:1d': [63, 86400, 1 / 252],
  '6mo:1d': [126, 86400, 1 / 252],
  '1y:1d': [251, 86400, 1 / 252],
  '5y:1wk': [262, 7 * 86400, 1 / 52],
  '10y:1wk': [523, 7 * 86400, 1 / 52],
  'max:1mo': [332, 30 * 86400, 1 / 12],
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(s) {
  let h = 2166136261
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

const r2 = (x) => (x >= 1 ? Math.round(x * 100) / 100 : Math.round(x * 10000) / 10000)

export function serie(key) {
  const [n, sek, dt] = SERIER[key]
  const rnd = mulberry32(SEED ^ hash(key))
  const z = () => {
    const u = Math.max(rnd(), 1e-12)
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
  }
  const sd = VOL * Math.sqrt(dt)
  const regim = Math.max(8, Math.round(n / 6))
  // driftens utslag per regim är i samma storlek som bruset, så att trender syns utan att skena
  const amp = (0.5 * sd * Math.sqrt(regim)) / (regim * dt)
  let mu = DRIFT
  let s = 100
  const raw = []
  for (let i = 0; i < n; i++) {
    if (i % regim === 0) mu = DRIFT + amp * z() // växlande drift: trender upp och ned
    const o = s
    const c = o * Math.exp((mu - (VOL * VOL) / 2) * dt + sd * z())
    const h = Math.max(o, c) * Math.exp(Math.abs(z()) * sd * 0.5)
    const l = Math.min(o, c) * Math.exp(-Math.abs(z()) * sd * 0.5)
    raw.push({ t: T0 + i * sek, o, h, l, c })
    s = c
  }
  const k = SLUTKURS / raw[raw.length - 1].c
  const candles = raw.map((x) => ({ t: x.t, o: r2(x.o * k), h: r2(x.h * k), l: r2(x.l * k), c: r2(x.c * k) }))
  const [range, interval] = key.split(':')
  return {
    symbol: 'SIM',
    currency: 'USD',
    price: candles[candles.length - 1].c,
    prevClose: r2(candles[0].o * 0.995),
    range,
    interval,
    exchangeTz: 'UTC',
    fetchedAt: 0,
    simulerad: true,
    kalla: `Simulerade kurser – inte verkliga marknadsdata (GBM, frö ${SEED})`,
    candles,
  }
}

export function allaSerier() {
  return Object.fromEntries(Object.keys(SERIER).map((k) => [k, serie(k)]))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ut = process.argv.slice(2)
  if (!ut.length) {
    console.error('ange minst en utfil')
    process.exit(2)
  }
  const json = JSON.stringify(allaSerier())
  for (const f of ut) writeFileSync(f, json + '\n')
  console.log(`skrev ${ut.join(', ')} (${json.length} byte, frö ${SEED})`)
}
