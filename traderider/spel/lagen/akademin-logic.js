/**
 * Akademin – ren logik (ingen DOM). Innehåll och pedagogik hämtade från KS Akademin
 * (traderider/app/src/modes/Academy.tsx + lib/academy.ts): fyra lektioner, XP bara för lärande,
 * lektioner låses upp i tur och ordning, samma uppgiftskriterier. Ombyggt för NVDA Lines data
 * (motorns track.points: price, upper, lower, mid, t) – utan någon annan motor, inget övningssaldo,
 * ingen kurs-slippage. Positionsstorlek uttrycks som andel av saldot (inget påhittat belopp).
 * Nytt: utmärkelser per klarat delmoment, sparade lokalt (localStorage), ingen inloggning.
 * Texter hämtas från språkresursen när de visas.
 */
import { t } from './i18n.js'

export const STORE_KEY = 'nvda-line-akademin-v1'
export const MAX_RISK_PCT = 2
export const RISK_CHOICES = [0.5, 1, 2, 5]
export const STOP_SIGMAS = [1, 1.5, 2]
/** Mål som multiplar av stoppavståndet. Golvet är 1,5R; förvalet i lektionen är 2R. */
export const TP_R_MULTIPLES = [1.5, 2, 3]
export const DEFAULT_TP_R = 2
/** Andel träffar som krävs för jämnt utfall när vinsten är R gånger förlusten: 1 / (1 + R). */
export function breakEvenWinRate(rewardOverRisk) {
  if (!(rewardOverRisk > 0)) return 1
  return 1 / (1 + rewardOverRisk)
}

export const RSI_HIGH = 70
export const RSI_LOW = 30

export function lessonContent(id) {
  return {
    title: t(`lesson.${id}.title`),
    text: t(`lesson.${id}.text`),
    task: t(`lesson.${id}.task`, { max: MAX_RISK_PCT }),
  }
}

export function readText(key) {
  return t(`read.${key}`)
}

export const XP_TABLE = {
  l1_read: 10, l1_risk: 15, l1_size: 25,
  l2_read: 10, l2_bracket: 15, l2_open: 15, l2_closed: 30,
  l3_read: 10, l3_touch: 25, l3_squeeze: 25,
  l4_read: 10, l4_extreme: 15, l4_read_ok: 30,
}
export const XP_MAX = Object.values(XP_TABLE).reduce((a, b) => a + b, 0)
export const LEVELS = [0, 60, 140, 220]
export const LESSON_DONE = {
  1: ['l1_risk', 'l1_size'],
  2: ['l2_bracket', 'l2_open', 'l2_closed'],
  3: ['l3_touch', 'l3_squeeze'],
  4: ['l4_extreme', 'l4_read_ok'],
}

export const xpTotal = (earned) => [...earned].reduce((a, k) => a + (XP_TABLE[k] ?? 0), 0)
export function levelFor(xp) {
  let level = 1
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1
  return { level, from: LEVELS[level - 1], to: level < LEVELS.length ? LEVELS[level] : null }
}
export const lessonDone = (id, earned) => LESSON_DONE[id].every((k) => earned.has(k))
export function lessonUnlocked(id, earned) {
  for (let i = 1; i < id; i++) if (!lessonDone(i, earned)) return false
  return true
}

/* ---------- utmärkelser ---------- */
// Ett märke per klarat delmoment + en medalj per klar lektion. Raden säger vad man övat på – aldrig pengar, vinst eller riktig handel.
export const AWARDS = [
  { id: 'm_l1_risk', kind: 'märke', lesson: 1, needs: ['l1_risk'] },
  { id: 'm_l1_size', kind: 'märke', lesson: 1, needs: ['l1_size'] },
  { id: 'm_l2_bracket', kind: 'märke', lesson: 2, needs: ['l2_bracket'] },
  { id: 'm_l2_open', kind: 'märke', lesson: 2, needs: ['l2_open'] },
  { id: 'm_l2_closed', kind: 'märke', lesson: 2, needs: ['l2_closed'] },
  { id: 'm_l3_touch', kind: 'märke', lesson: 3, needs: ['l3_touch'] },
  { id: 'm_l3_squeeze', kind: 'märke', lesson: 3, needs: ['l3_squeeze'] },
  { id: 'm_l4_extreme', kind: 'märke', lesson: 4, needs: ['l4_extreme'] },
  { id: 'm_l4_read_ok', kind: 'märke', lesson: 4, needs: ['l4_read_ok'] },
  { id: 'medalj_1', kind: 'medalj', lesson: 1, needs: LESSON_DONE[1] },
  { id: 'medalj_2', kind: 'medalj', lesson: 2, needs: LESSON_DONE[2] },
  { id: 'medalj_3', kind: 'medalj', lesson: 3, needs: LESSON_DONE[3] },
  { id: 'medalj_4', kind: 'medalj', lesson: 4, needs: LESSON_DONE[4] },
]
export function awardView(a) {
  return { ...a, title: t(`award.${a.id}.title`), learned: t(`award.${a.id}.learned`), kindLabel: t(a.kind === 'medalj' ? 'kind.medal' : 'kind.mark') }
}
export function awardNote() {
  return t('award.note')
}

export function awardsFor(earned) {
  return AWARDS.filter((a) => a.needs.every((k) => earned.has(k))).map((a) => a.id)
}
export function newAwards(before, after) {
  const had = new Set(awardsFor(before))
  return awardsFor(after).filter((id) => !had.has(id))
}

/* ---------- lagring (lokalt, ingen inloggning) ---------- */
export function loadProgress(storage) {
  try {
    const raw = storage?.getItem(STORE_KEY)
    const d = raw ? JSON.parse(raw) : null
    const earned = new Set((d?.earned ?? []).filter((k) => k in XP_TABLE))
    const awards = {}
    for (const id of awardsFor(earned)) awards[id] = d?.awards?.[id] ?? null
    return { earned, awards }
  } catch {
    return { earned: new Set(), awards: {} }
  }
}
export function saveProgress(storage, prog) {
  try {
    storage?.setItem(STORE_KEY, JSON.stringify({ v: 1, earned: [...prog.earned], awards: prog.awards }))
    return true
  } catch {
    return false
  }
}
/** Lägg till XP-nycklar; returnerar nytt tillstånd + nyss upplåsta utmärkelser (och sparar). */
export function earnKeys(storage, prog, keys, now = Date.now()) {
  const earned = new Set(prog.earned)
  keys.forEach((k) => k in XP_TABLE && earned.add(k))
  const fresh = newAwards(prog.earned, earned)
  const awards = { ...prog.awards }
  for (const id of fresh) awards[id] = now
  const next = { earned, awards }
  saveProgress(storage, next)
  return { prog: next, fresh }
}

/* ---------- marknadslogik på NVDA Lines punkter ---------- */
export const bandStdev = (pt) => Math.max(0, (pt.upper - pt.mid) / 2)
export function stopPrice(entry, stdev, sigmas, side) {
  const d = Math.max(0.01, stdev * sigmas)
  return side === 'long' ? entry - d : entry + d
}
export function takeProfitPrice(entry, stop, r, side) {
  const risk = Math.abs(entry - stop)
  return side === 'long' ? entry + risk * r : entry - risk * r
}
export const riskAllowed = (pct) => pct > 0 && pct <= MAX_RISK_PCT
/** Andel av saldot som positionen blir: risk % / risk per aktie %, högst 100 % (ingen belåning). */
export function positionShare(riskPct, entry, stop) {
  const perSharePct = entry > 0 ? (Math.abs(entry - stop) / entry) * 100 : 0
  if (!(perSharePct > 0)) return { perSharePct: 0, sharePct: 0, capped: false }
  const raw = (riskPct / perSharePct) * 100
  return { perSharePct, sharePct: Math.min(100, raw), capped: raw > 100 }
}
export function openPractice(points, index, side, stop, target) {
  if (stop == null || target == null) return { error: 'ak.err.both' }
  const entry = points[index]?.price
  if (!(entry > 0)) return { error: 'ak.err.price' }
  if (side === 'long' && !(stop < entry && target > entry)) return { error: 'ak.err.long' }
  if (side === 'short' && !(stop > entry && target < entry)) return { error: 'ak.err.short' }
  return { side, entry, stop, target, openedAt: index, checkedTo: index }
}
/** Går igenom punkterna efter senaste kontroll (stängningskurser); stopp kontrolleras före mål. */
export function advancePractice(t, points, upTo) {
  if (t.closed) return t
  const last = Math.min(points.length - 1, Math.floor(upTo))
  const res = (price) => {
    const move = (t.side === 'long' ? price - t.entry : t.entry - price) / t.entry
    const r = (t.side === 'long' ? price - t.entry : t.entry - price) / Math.abs(t.entry - t.stop)
    return { pct: move * 100, r }
  }
  for (let i = t.checkedTo + 1; i <= last; i++) {
    const c = points[i].price
    const hitStop = t.side === 'long' ? c <= t.stop : c >= t.stop
    const hitTarget = t.side === 'long' ? c >= t.target : c <= t.target
    if (hitStop || hitTarget) return { ...t, checkedTo: i, closed: { reason: hitStop ? 'stop' : 'target', price: c, at: i, ...res(c) } }
  }
  if (last >= points.length - 1 && last > t.openedAt) {
    const c = points[points.length - 1].price
    return { ...t, checkedTo: last, closed: { reason: 'series_end', price: c, at: last, ...res(c) } }
  }
  return { ...t, checkedTo: Math.max(t.checkedTo, last) }
}
export function percentB(close, pt) {
  const w = pt.upper - pt.lower
  return w > 1e-9 ? (close - pt.lower) / w : null
}
export const bandwidthPct = (pt) => (pt.mid > 0 ? ((pt.upper - pt.lower) / pt.mid) * 100 : 0)
export function squeezeThreshold(points) {
  const w = points.map(bandwidthPct).filter((v) => v > 0).sort((a, b) => a - b)
  return w.length ? w[Math.floor((w.length - 1) * 0.25)] : 0
}
export function isTouch(close, pt) {
  const pb = percentB(close, pt)
  return pb != null && (pb >= 0.95 || pb <= 0.05)
}
export const rsiExtreme = (r) => r != null && (r >= RSI_HIGH || r <= RSI_LOW)
export function correctRead(close, pt, r) {
  const pb = percentB(close, pt) ?? 0.5
  if (r >= RSI_HIGH && pb >= 0.8) return 'stretched_up'
  if (r <= RSI_LOW && pb <= 0.2) return 'stretched_down'
  return 'rsi_only'
}
