/**
 * Gemensam kursläsning för graf och avatar.
 * sampleIndex är RaceX-grafens interpolation (samma formel som raketens priceAt).
 * sampleX är Trade Riders interpolation längs punktens x (motorns sampel av track.points).
 * Inga egna kurser och inga slumptal.
 */

export function sampleIndex(points, cursor, field = 'price') {
  if (!points || !points.length) return NaN
  const i = Math.max(0, Math.min(points.length - 1, Math.floor(cursor)))
  const j = Math.min(points.length - 1, i + 1)
  const u = Math.min(1, Math.max(0, cursor - i))
  return points[i][field] + (points[j][field] - points[i][field]) * u
}

function lerpSample(i, a, b, u) {
  const mix = (p, q) => p + (q - p) * u
  return { i, price: mix(a.price, b.price), t: mix(a.t, b.t) }
}

/** Binärsök på x och lerpa, samma steg som grafens sampel av tågets position. */
export function sampleX(points, x) {
  if (!points || !points.length) return { i: 0, price: NaN, t: NaN }
  if (!Number.isFinite(x)) return lerpSample(0, points[0], points[0], 0)
  const first = points[0]
  const last = points[points.length - 1]
  if (points.length === 1 || x <= first.x) return lerpSample(0, first, points[1] ?? first, 0)
  if (x >= last.x) return lerpSample(points.length - 1, points[points.length - 2] ?? last, last, 1)
  let lo = 0
  let hi = points.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (points[mid].x <= x) lo = mid
    else hi = mid
  }
  const a = points[lo]
  const b = points[hi]
  const u = (x - a.x) / (b.x - a.x || 1)
  return lerpSample(lo, a, b, u)
}
