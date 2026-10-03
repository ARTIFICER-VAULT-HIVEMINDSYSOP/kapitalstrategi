/**
 * En enda instrumentlista för webbläsaren och Workern.
 * FÖRSLAG (D2). Daniel har inte beslutat vilka instrument som ska gälla.
 * Alla rader är märkta proposal: true tills det beslutet finns.
 *
 * Förslag: 3 svenska aktier, OMXS30, 2 USA-aktier och BTC.
 * Yahoo-symbolen för OMXS30 är ^OMX, samma symbol som i mätningen.
 */
export const PROPOSAL = true

export const INSTRUMENTS = [
  { id: 'VOLV-B.ST', label: 'Volvo B', kind: 'stock', market: 'Stockholm', yahoo: 'VOLV-B.ST', proposal: true },
  { id: 'ERIC-B.ST', label: 'Ericsson B', kind: 'stock', market: 'Stockholm', yahoo: 'ERIC-B.ST', proposal: true },
  { id: 'HM-B.ST', label: 'H&M B', kind: 'stock', market: 'Stockholm', yahoo: 'HM-B.ST', proposal: true },
  { id: 'OMXS30', label: 'OMXS30', kind: 'index', market: 'Stockholm', yahoo: '^OMX', proposal: true },
  { id: 'AAPL', label: 'Apple', kind: 'stock', market: 'USA', yahoo: 'AAPL', proposal: true },
  { id: 'NVDA', label: 'USA-aktie', kind: 'stock', market: 'USA', yahoo: 'NVDA', proposal: true },
  { id: 'BTC-USD', label: 'Bitcoin', kind: 'crypto', market: 'crypto', coinbase: 'BTC-USD', kraken: 'XBTUSD', proposal: true },
]

export function instrumentById(id) {
  return INSTRUMENTS.find((item) => item.id === id || item.yahoo === id || item.coinbase === id) || null
}

export function yahooSymbols() {
  return INSTRUMENTS.filter((item) => item.yahoo).map((item) => item.yahoo)
}
