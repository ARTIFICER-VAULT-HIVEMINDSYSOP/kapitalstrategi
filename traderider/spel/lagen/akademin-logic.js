/**
 * Akademin – ren logik (ingen DOM). Innehåll och pedagogik hämtade från KS Akademin
 * (traderider/app/src/modes/Academy.tsx + lib/academy.ts): fyra lektioner, XP bara för lärande,
 * lektioner låses upp i tur och ordning, samma uppgiftskriterier. Ombyggt för NVDA Lines data
 * (motorns track.points: price, upper, lower, mid, t) – utan någon annan motor, inget övningssaldo,
 * ingen kurs-slippage. Positionsstorlek uttrycks som andel av saldot (inget påhittat belopp).
 * Nytt: utmärkelser per klarat delmoment, sparade lokalt (localStorage), ingen inloggning.
 */
export const STORE_KEY = 'nvda-line-akademin-v1'
export const MAX_RISK_PCT = 2
export const RISK_CHOICES = [0.5, 1, 2, 5]
export const STOP_SIGMAS = [1, 1.5, 2]
export const TP_R_MULTIPLES = [1, 2, 3]
export const RSI_HIGH = 70
export const RSI_LOW = 30

export const LESSONS = {
  1: {
    title: 'Risk och positionsstorlek',
    text: 'Innan du tänker på vinst bestämmer du hur mycket du högst får förlora på en affär. En vanlig tumregel är att aldrig riskera mer än 1–2 % av saldot per affär. Risken per aktie är avståndet mellan ingång och stopp; positionsstorleken blir riskbudgeten delad med risken per aktie. Då blir en förlust hanterbar, oavsett hur säker du känner dig.',
    task: `Välj en risk på högst ${MAX_RISK_PCT} % av saldot, välj stoppavstånd och räkna fram hur stor del av saldot positionen blir.`,
  },
  2: {
    title: 'Stop-loss och take-profit',
    text: 'En stop-loss är kursen där du i förväg bestämt att affären var fel och ska stängas. En take-profit är kursen där du tar hem. Båda sätts innan du öppnar — inte när känslorna tagit över. Förhållandet mellan mål och risk (R) visar om upplägget är rimligt: 2R betyder att målet ligger dubbelt så långt bort som stoppet.',
    task: 'Välj riktning, sätt både stop-loss och take-profit, öppna övningsaffären och låt simuleringen köra tills en av dem träffas.',
  },
  3: {
    title: 'Bollingerband',
    text: 'Bollingerbanden (20 perioder, 2 standardavvikelser) bildar en korridor runt kursen. Den streckade mittlinjen är 20-perioders glidande medelvärde. Banden ovanför och under kursen visar när kursen rört sig ovanligt långt från medel. När banden drar ihop sig — en squeeze — är rörelsen ovanligt lugn; ofta följer en större rörelse, men banden säger inte åt vilket håll.',
    task: 'Pausa (P) och markera 1) en rälsberöring — kursen vid övre eller undre bandet, och 2) en squeeze — de markerade zonerna där bandbredden är som smalast.',
  },
  4: {
    title: 'RSI',
    text: 'RSI (14) jämför styrkan i de senaste uppgångarna med nedgångarna på en skala 0–100. Över 70 kallas överköpt, under 30 översålt. RSI ensamt är inget köp- eller säljbesked — det blir användbart tillsammans med banden: kurs vid övre räls och RSI över 70 är ett sträckt läge där nästa steg ofta är vila eller återgång mot mittlinjen.',
    task: "Vänta tills RSI går över 70 eller under 30, tryck 'Läs läget' och välj tolkningen som stämmer med både band och RSI.",
  },
}

export const READ_TEXT = {
  stretched_up: 'Sträckt uppåt: kursen vid övre bandet och RSI ≥ 70. Nästa steg brukar vara vila eller återgång mot mittlinjen — öva på att inte jaga köp här.',
  stretched_down: 'Sträckt nedåt: kursen vid undre bandet och RSI ≤ 30. Nästa steg brukar vara vila eller återgång mot mittlinjen — öva på att inte jaga sälj här.',
  rsi_only: 'RSI är extremt men kursen är inne i korridoren. Signalerna säger olika — vänta på bekräftelse från banden.',
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
  { id: 'm_l1_risk', kind: 'märke', lesson: 1, needs: ['l1_risk'], title: 'Riskbudget', learned: 'Du valde en risk inom 2 %-regeln innan du tänkte på utfallet.' },
  { id: 'm_l1_size', kind: 'märke', lesson: 1, needs: ['l1_size'], title: 'Positionsstorlek', learned: 'Du räknade fram positionens storlek ur risk och stoppavstånd.' },
  { id: 'm_l2_bracket', kind: 'märke', lesson: 2, needs: ['l2_bracket'], title: 'Stopp och mål', learned: 'Du satte både stop-loss och take-profit innan affären öppnades.' },
  { id: 'm_l2_open', kind: 'märke', lesson: 2, needs: ['l2_open'], title: 'Plan före ingång', learned: 'Du öppnade övningsaffären först när planen var komplett.' },
  { id: 'm_l2_closed', kind: 'märke', lesson: 2, needs: ['l2_closed'], title: 'Följde planen', learned: 'Du lät stopp eller mål avgöra – processen räknas, inte utfallet.' },
  { id: 'm_l3_touch', kind: 'märke', lesson: 3, needs: ['l3_touch'], title: 'Rälsberöring', learned: 'Du kände igen när kursen står vid övre eller undre bandet (%B).' },
  { id: 'm_l3_squeeze', kind: 'märke', lesson: 3, needs: ['l3_squeeze'], title: 'Squeeze', learned: 'Du hittade en squeeze – ovanligt smala band, utan att veta riktningen.' },
  { id: 'm_l4_extreme', kind: 'märke', lesson: 4, needs: ['l4_extreme'], title: 'RSI-extrem', learned: 'Du väntade in RSI över 70 eller under 30 innan du läste läget.' },
  { id: 'm_l4_read_ok', kind: 'märke', lesson: 4, needs: ['l4_read_ok'], title: 'Läste läget', learned: 'Du tolkade band och RSI tillsammans – en bild av läget, inget löfte.' },
  { id: 'medalj_1', kind: 'medalj', lesson: 1, needs: LESSON_DONE[1], title: 'Lektion 1 · Risk', learned: 'Risk och positionsstorlek: förlusten bestäms innan affären.' },
  { id: 'medalj_2', kind: 'medalj', lesson: 2, needs: LESSON_DONE[2], title: 'Lektion 2 · Stopp och mål', learned: 'Stop-loss, take-profit och R sätts innan känslorna tar över.' },
  { id: 'medalj_3', kind: 'medalj', lesson: 3, needs: LESSON_DONE[3], title: 'Lektion 3 · Bollingerband', learned: 'Korridoren, rälsberöringar och squeeze – och vad banden inte säger.' },
  { id: 'medalj_4', kind: 'medalj', lesson: 4, needs: LESSON_DONE[4], title: 'Lektion 4 · RSI', learned: 'RSI tillsammans med banden, aldrig ensamt som besked.' },
]
export const AWARD_NOTE = 'En utmärkelse visar vad du har övat på i Akademin. Den är ingen licens och inget råd, och den har ingenting med pengar, vinst i handel eller riktig handel att göra.'

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
  if (stop == null || target == null) return { error: 'Sätt både stop-loss och take-profit innan du öppnar.' }
  const entry = points[index]?.price
  if (!(entry > 0)) return { error: 'Kurs saknas här.' }
  if (side === 'long' && !(stop < entry && target > entry)) return { error: 'Long: stop under och mål över ingångskursen.' }
  if (side === 'short' && !(stop > entry && target < entry)) return { error: 'Short: stop över och mål under ingångskursen.' }
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
