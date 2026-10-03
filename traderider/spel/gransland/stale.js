import { CRYPTO_MAX_AGE_MS, STOCK_MAX_AGE_MS } from './config.js'

export function assessFreshness({ ok, time, delayed, now }) {
  if (!ok) return { fresh: false, reason: 'failed' }
  if (!Number.isFinite(time) || !Number.isFinite(now)) return { fresh: false, reason: 'failed' }
  const maxAge = delayed ? STOCK_MAX_AGE_MS : CRYPTO_MAX_AGE_MS
  if (now - time > maxAge) return { fresh: false, reason: 'stale' }
  return { fresh: true, reason: '' }
}
