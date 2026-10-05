import { visibleThrough } from './bars.js'

/**
 * Sys ihop historik och live på tidsstämpel.
 * Samma tidsstämpel behåller den historiska stapeln.
 * Luckor lämnas tomma. Inga påhittade värden. Inga staplar efter now.
 */
export function stitch(history, live, { now = Date.now(), intervalMs = 0 } = {}) {
  const pastHistory = visibleThrough(history, now)
  const pastLive = visibleThrough(live, now)
  const lastHistory = pastHistory.length ? pastHistory[pastHistory.length - 1].t : -Infinity
  const extra = []
  for (const bar of pastLive) {
    if (bar.t <= lastHistory) continue
    extra.push(bar)
  }
  const bars = pastHistory.concat(extra)
  const step = intervalMs > 0 ? intervalMs : inferInterval(pastHistory.length ? pastHistory : bars)
  const gaps = []
  if (step > 0) {
    for (let i = 1; i < bars.length; i++) {
      const delta = bars[i].t - bars[i - 1].t
      if (delta > step * 1.5) gaps.push({ after: bars[i - 1].t, before: bars[i].t, delta })
    }
  }
  return { bars, gaps }
}

function inferInterval(bars) {
  if (!bars || bars.length < 2) return 0
  const deltas = []
  for (let i = 1; i < bars.length; i++) {
    const delta = bars[i].t - bars[i - 1].t
    if (delta > 0) deltas.push(delta)
  }
  if (!deltas.length) return 0
  deltas.sort((a, b) => a - b)
  return deltas[Math.floor(deltas.length / 2)]
}
