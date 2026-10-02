/**
 * Spårposition för SÄLJ / FLAT / KÖP.
 * FLAT är alltid mittpunkten mellan de två spårens positioner, härledd – inte ett fast tal.
 * Samma funktion i Trade Rider, RaceX, Akademin och Rabbit Hole.
 */
export function positionFor(side, kop, salj) {
  if (side === 'buy' || side === 'long') return kop
  if (side === 'sell' || side === 'short') return salj
  return (kop + salj) / 2
}

/** Äldre Trade Rider: FLAT lämnade tåget på senaste rälsen (KÖP eller SÄLJ), inte i mitten. */
export function legacyFlatOnRail(side, kop, salj) {
  return side === 'sell' || side === 'short' ? salj : kop
}

function projectY(worldY, height, z, camY) {
  return height / 2 + (worldY - height / 2 - camY) * z
}

/** Världskoordinat för en kurs, samma avbildning som Trade Rider-motorn (utan lutningen, som är gemensam). */
export function worldRailY(price, minPrice, maxPrice, log = false) {
  const C = (v) => (log ? Math.log(Math.max(v, 1e-4)) : v)
  const o = C(minPrice)
  const s = C(maxPrice)
  const span = s - o || 1
  return 280 + (1 - (C(price) - o) / span) * 780
}

export function lineTracks(viewport, band, log = false) {
  const buy = worldRailY(band.upper, band.min, band.max, log)
  const sell = worldRailY(band.lower, band.min, band.max, log)
  const flatWorld = positionFor('flat', buy, sell)
  const z = 0.92
  const gap = Math.abs(sell - buy)
  const viewH = viewport.height / z
  const camY = gap < viewH * 0.64 ? flatWorld - viewH * 0.46 : flatWorld - viewH * 0.55
  return {
    buy: projectY(buy, viewport.height, z, camY),
    sell: projectY(sell, viewport.height, z, camY),
    flat: projectY(positionFor('flat', buy, sell), viewport.height, z, camY),
    world: { buy, sell, flat: flatWorld },
  }
}

export function columnX(value, lo, hi, width, pad, log) {
  const L = (v) => (log ? Math.log(Math.max(v, 1e-9)) : v)
  const a = L(lo)
  const b = L(hi)
  return pad + ((L(value) - a) / (b - a || 1)) * (width - pad * 2)
}

export function raketTracks(viewport, band, log = false) {
  const pad = viewport.width <= 640 ? 40 : Math.max(120, viewport.width * 0.18)
  const buy = columnX(band.upper, band.lo, band.hi, viewport.width, pad, log)
  const sell = columnX(band.lower, band.lo, band.hi, viewport.width, pad, log)
  return { buy, sell, flat: positionFor('flat', buy, sell), pad }
}

/** Rabbit Hole: styraxeln är sidled (högre pris åt höger). Spåren följer bredden. */
export function steerLanes(span, highPriceSide) {
  const margin = Math.max(36, span * 0.16)
  const low = margin
  const high = span - margin
  const buy = highPriceSide === 'left' || highPriceSide === 'up' ? low : high
  const sell = buy === high ? low : high
  return { buy, sell, flat: positionFor('flat', buy, sell) }
}

export function academyTracks(viewport, band) {
  const canvasH = viewport.width < 500 ? 300 : 360
  const ch = canvasH - 80
  const y = (v) => 6 + (1 - (v - band.lo) / (band.hi - band.lo || 1)) * (ch - 12)
  const buy = y(band.upper)
  const sell = y(band.lower)
  return { buy, sell, flat: positionFor('flat', buy, sell) }
}

export function tracksForMode(mode, viewport, band) {
  if (mode === 'raket') return raketTracks(viewport, band, !!band.log)
  if (mode === 'rabbit') return steerLanes(viewport.width, 'right')
  if (mode === 'akademin') return academyTracks(viewport, band)
  return lineTracks(viewport, band, !!band.log)
}
