import { t } from '../lagen/i18n.js'

export function formatHm(ms, timeZone = 'Europe/Stockholm') {
  if (!Number.isFinite(ms)) return ''
  try {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    }).formatToParts(new Date(ms))
    const hour = parts.find((part) => part.type === 'hour')?.value
    const minute = parts.find((part) => part.type === 'minute')?.value
    if (hour && minute) return `${hour}:${minute}`
  } catch {
    /* fall through */
  }
  const date = new Date(ms)
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

export function formatPrice(value) {
  if (!Number.isFinite(value)) return ''
  const [whole, frac] = value.toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return `${grouped},${frac}`
}

export function formatPct(value) {
  if (!Number.isFinite(value)) return ''
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(1).replace('.', ',')} %`
}

export function phaseLabel({ phase, fetching, unknown, source, time, delayed }) {
  if (unknown) return t('gl.unknown')
  if (fetching) return t('gl.fetching')
  if (phase === 'live' && source && time) {
    const clock = formatHm(time)
    const base = t('gl.live', { source, time: clock })
    return delayed ? `${base} · ${t('gl.delayed')}` : base
  }
  return t('hist.badge')
}

export function moneySentence(pct) {
  if (Number.isFinite(pct)) return t('gl.result', { pct: formatPct(pct) })
  return `${t('gl.money')}. ${t('gl.risk')}`
}
