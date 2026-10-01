import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { rsi, rsiAtPoints, rsiZone, RSI_PERIOD } from '../../spel/lagen/rsi.js'

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`)

test('för få värden ger bara null (saknas)', () => {
  assert.deepEqual(rsi([]), [])
  assert.deepEqual(rsi([1, 2, 3]), [null, null, null])
  const r = rsi(Array.from({ length: 14 }, (_, i) => 100 + i))
  assert.equal(r.length, 14)
  assert.ok(r.every((v) => v === null))
})

test('första värdet kommer på index 14 (period 14)', () => {
  const r = rsi(Array.from({ length: 20 }, (_, i) => 100 + i))
  assert.equal(r.findIndex((v) => v !== null), RSI_PERIOD)
})

test('bara uppgångar = 100, bara nedgångar = 0, platt = 50', () => {
  assert.equal(rsi(Array.from({ length: 30 }, (_, i) => 100 + i))[29], 100)
  assert.equal(rsi(Array.from({ length: 30 }, (_, i) => 200 - i))[29], 0)
  assert.equal(rsi(Array.from({ length: 30 }, () => 100))[29], 50)
})

test('Wilders klassiska exempel (44,34 … ) ger 70,46 och 66,25 (Wilder-utjämning)', () => {
  const c = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.0, 46.03, 46.41, 46.22, 45.64]
  const r = rsi(c)
  near(r[14], 70.46413502109705, 1e-9)
  near(r[15], 66.24961855355505, 1e-9)
  assert.ok(r.slice(14).every((v) => v >= 0 && v <= 100))
})

test('ogiltig kurs nollställer uppbyggnaden i stället för att gissa', () => {
  const c = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i))
  c[20] = NaN
  const r = rsi(c)
  assert.equal(r[20], null)
  assert.equal(r[21], null)
  assert.equal(r[34], null) // 21..34 = 14 förändringar behövs igen
  assert.notEqual(r[35], null)
})

test('zoner', () => {
  assert.equal(rsiZone(null), 'saknas')
  assert.equal(rsiZone(75), 'overkopt')
  assert.equal(rsiZone(70), 'overkopt')
  assert.equal(rsiZone(25), 'oversalt')
  assert.equal(rsiZone(50), 'neutral')
})

test('rsiAtPoints läser av via tidsstämpel, okänd punkt = null', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({ t: 1000 + i, c: 100 + i }))
  const pts = [{ t: 1003 }, { t: 1020 }, { t: 9999 }]
  assert.deepEqual(rsiAtPoints(candles, pts), [null, 100, null])
})

test('riktiga NVDA-data i bundeln: alla perioder ger RSI inom 0–100', () => {
  const data = JSON.parse(readFileSync(new URL('../../spel/data/nvda-fallback.json', import.meta.url), 'utf8'))
  for (const [key, series] of Object.entries(data)) {
    const r = rsi(series.candles.map((c) => c.c))
    const vals = r.filter((v) => v !== null)
    assert.ok(vals.length > 0, key)
    assert.ok(vals.every((v) => v >= 0 && v <= 100), key)
    assert.equal(r.slice(0, RSI_PERIOD).filter((v) => v !== null).length, 0, key)
  }
})
