/**
 * Tidsetiketter för simulerade kurser. Tidsstämplarna är fiktiva (dag 1 kl. 09:30 räknat från 0),
 * så de visas som dag, vecka eller månad – aldrig som riktiga datum. Orden kommer från språkresursen.
 */
import { t } from './i18n.js'

export function simTid(ts, key) {
  if (!Number.isFinite(ts)) return '—'
  const d = Math.floor(ts / 86400) + 1
  const n = new Date(ts * 1000)
  const hh = String(n.getUTCHours()).padStart(2, '0')
  const mm = String(n.getUTCMinutes()).padStart(2, '0')
  if (key === 'live' || key === '5d') return t('time.dayClock', { d, hh, mm })
  if (key === '1mo' || key === '6mo' || key === '1y' || !key) return t('time.day', { d })
  if (key === '5y') return t('time.week', { n: Math.floor((d - 1) / 7) + 1 })
  return t('time.month', { n: Math.floor((d - 1) / 30) + 1 })
}
