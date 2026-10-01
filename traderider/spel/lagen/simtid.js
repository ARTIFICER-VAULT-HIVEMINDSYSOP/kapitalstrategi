/**
 * Tidsetiketter för simulerade kurser. Tidsstämplarna är fiktiva (dag 1 kl. 09:30 räknat från 0),
 * så de visas som «Dag N», «Vecka N» eller «Månad N» – aldrig som riktiga datum.
 */
export function simTid(t, key) {
  if (!Number.isFinite(t)) return '—'
  const d = Math.floor(t / 86400) + 1
  const n = new Date(t * 1000)
  const hh = String(n.getUTCHours()).padStart(2, '0')
  const mm = String(n.getUTCMinutes()).padStart(2, '0')
  if (key === 'live' || key === '5d') return `Dag ${d} ${hh}:${mm}`
  if (key === '1mo' || key === '6mo' || key === '1y' || !key) return `Dag ${d}`
  if (key === '5y') return `Vecka ${Math.floor((d - 1) / 7) + 1}`
  return `Månad ${Math.floor((d - 1) / 30) + 1}`
}

export const SIM_ETIKETT = 'Simulerade kurser – inte verkliga marknadsdata'
