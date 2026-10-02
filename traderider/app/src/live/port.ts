/**
 * Strukturell beredskap för ett riktigt realtidsflöde.
 * Ett framtida flöde ska vara realtid. Aldrig fördröjt, återuppspelat eller simulerat.
 * liveFeed är null tills någon anropar attachLiveFeed. Inget nätanrop görs här.
 */
export interface LiveTick {
  symbol: string
  t: number
  price: number
}

export type LiveStatus = 'av' | 'ansluter' | 'live' | 'stangd' | 'fel'

export interface LiveFeed {
  status(): LiveStatus
  subscribe(symbol: string, onTick: (tick: LiveTick) => void): () => void
}

export const liveFeed: LiveFeed | null = null

let attached: LiveFeed | null = null

export function attachLiveFeed(feed: LiveFeed | null): void {
  attached = feed
}

export function useLiveFeed(): LiveFeed | null {
  return attached ?? liveFeed
}

export function resetLiveFeedForTests(): void {
  attached = null
}
