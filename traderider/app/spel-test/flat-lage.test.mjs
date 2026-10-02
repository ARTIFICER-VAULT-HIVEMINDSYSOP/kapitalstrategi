import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { positionFor, legacyFlatOnRail, tracksForMode } from '../../spel/lagen/spar.js'

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]
const BAND = { upper: 110, lower: 90, min: 80, max: 120, lo: 80, hi: 120 }
const MODES = ['line', 'raket', 'rabbit', 'akademin']

test('FLAT är mittpunkten mellan KÖP och SÄLJ i varje läge och två vyer', () => {
  for (const mode of MODES) {
    for (const viewport of VIEWPORTS) {
      for (const log of [false, true]) {
        const tracks = tracksForMode(mode, viewport, { ...BAND, log })
        const mid = (tracks.buy + tracks.sell) / 2
        assert.ok(Math.abs(tracks.flat - mid) < 1e-6, `${mode} ${viewport.width} log=${log} ${tracks.flat} ${mid}`)
        assert.ok(Math.abs(tracks.flat - positionFor('flat', tracks.buy, tracks.sell)) < 1e-6)
        assert.notEqual(tracks.buy, tracks.sell)
      }
    }
  }
})

test('äldre FLAT låg på senaste rälsen, inte i mitten', () => {
  const buy = 280
  const sell = 1060
  assert.equal(legacyFlatOnRail('buy', buy, sell), buy)
  assert.equal(legacyFlatOnRail('sell', buy, sell), sell)
  assert.equal(positionFor('flat', buy, sell), (buy + sell) / 2)
  assert.notEqual(legacyFlatOnRail('buy', buy, sell), positionFor('flat', buy, sell))
})

test('Trade Rider-motorn sätter FLAT till (övre + undre) / 2', () => {
  const src = readFileSync(new URL('../../spel/assets/routes-CbqPJAI2.js', import.meta.url), 'utf8')
  assert.match(src, /e\.flat\?\(c\.upperY\+c\.lowerY\)\/2/)
  assert.match(src, /e\.flat=!0,e\.switching=!1,e\.grounded=!0/)
})
