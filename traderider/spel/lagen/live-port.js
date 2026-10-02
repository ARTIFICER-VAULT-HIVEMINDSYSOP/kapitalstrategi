/**
 * Samma beredskap som appens LiveFeed. liveFeed är null.
 * Inget nätanrop och ingen WebSocket görs här.
 * Ett framtida flöde ska vara realtid. Aldrig fördröjt, återuppspelat eller simulerat.
 */
export const liveFeed = null

let attached = null

export function attachLiveFeed(feed) {
  attached = feed || null
}

export function useLiveFeed() {
  return attached || liveFeed
}

export function resetLiveFeedForTests() {
  attached = null
}
