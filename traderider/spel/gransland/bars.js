export function asTime(value, index = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? Math.round(value * 1000) : Math.round(value)
  }
  if (typeof value === 'string' && value) {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return index
}

export function asBars(input) {
  if (!Array.isArray(input)) return []
  const bars = []
  input.forEach((bar, index) => {
    if (!bar || typeof bar !== 'object') return
    const close = Number(bar.c ?? bar.close ?? bar.price)
    if (!Number.isFinite(close)) return
    const open = Number(bar.o ?? bar.open ?? close)
    const high = Number(bar.h ?? bar.high ?? Math.max(open, close))
    const low = Number(bar.l ?? bar.low ?? Math.min(open, close))
    bars.push({
      t: asTime(bar.t ?? bar.time ?? bar.date, index),
      o: Number.isFinite(open) ? open : close,
      h: Number.isFinite(high) ? high : close,
      l: Number.isFinite(low) ? low : close,
      c: close,
    })
  })
  bars.sort((a, b) => a.t - b.t)
  return bars
}

export function visibleThrough(bars, now) {
  return (bars || []).filter((bar) => Number.isFinite(bar.t) && bar.t <= now)
}
