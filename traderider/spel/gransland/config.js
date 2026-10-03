/**
 * WORKER_URL är null tills Workern är deployad.
 * Aktier och index blir då OKÄND, utan nätanrop.
 * Krypto hämtas direkt i webbläsaren och behöver inte den här adressen.
 */
export const WORKER_URL = null

export const POLL_MS = 45_000
export const BACKOFF_START_MS = 60_000
export const BACKOFF_MAX_MS = 5 * 60_000
export const CRYPTO_MAX_AGE_MS = 3 * 60 * 1000
export const STOCK_MAX_AGE_MS = 4 * 24 * 60 * 60 * 1000

export function nextDelay(previous, status) {
  if (status === 429 || status === 'error') {
    const base = previous && previous >= BACKOFF_START_MS ? previous * 2 : BACKOFF_START_MS
    return Math.min(base, BACKOFF_MAX_MS)
  }
  return POLL_MS
}
