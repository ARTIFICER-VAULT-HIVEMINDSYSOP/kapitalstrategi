/**
 * Gemensam datakälla. Samma läsning för den inbäddade serien och ett LiveFeed.
 */
export function historicalSource(bars) {
  const ticks = bars.map((bar) => ({ t: bar.t, price: bar.c }))
  return {
    kind: 'historia',
    read() {
      return ticks.map((tick) => ({ ...tick }))
    },
  }
}

export function openLiveSource(feed, symbol) {
  const ticks = []
  const stop = feed.subscribe(symbol, (tick) => {
    ticks.push({ t: tick.t, price: tick.price })
  })
  return {
    kind: 'live',
    read() {
      return ticks.map((tick) => ({ ...tick }))
    },
    stop,
  }
}
