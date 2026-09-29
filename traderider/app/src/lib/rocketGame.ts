/**
 * Raket-lägen (utkast): körlägen, gasreglage, egen TP/SL, TP vinner nivån, margin call med panik.
 *
 * Bygger på samma motor som övriga lägen (deskState + market + bollinger) och samma riktiga historiska
 * NVDA-timcandles. Inga påhittade kurser, inga belopp i gränssnittet: resultat visas i procent av den egna
 * insatsen och i R (TP-avstånd / SL-avstånd). Övning — utfall kan bli både vinst och förlust, inget löfte.
 *
 * Skillnad mot klassiska Raket: gas (tempo) och hävstång (risk) är skilda. Gasen styr hur fort candlarna
 * rullar; hävstången styr positionens storlek och därmed hur snabbt marginalen tar slut.
 */
import { createDesk, candleAt, setDeskLeverage, type DeskState } from './deskState'
import { deriveQuote, flattenBook, markEquity, sideOf, submitBuy, submitSell, STARTING_CASH, type Book } from './market'
import type { Candle, Side } from './types'

export type RaketMode = 'niva' | 'tid' | 'budget' | 'stopp' | 'chock' | 'spoke'
export type Phase = 'setup' | 'ride' | 'won' | 'lost'
export type EndReason = 'tp' | 'sl' | 'margin' | 'time' | 'budget' | 'series'

export const RAKET_MODES: RaketMode[] = ['niva', 'tid', 'budget', 'stopp', 'chock', 'spoke']

export type ModeRules = {
  title: string
  short: string
  goal: string
  rules: string[]
  slRequired: boolean
  minRatio: number
  /** Minsta SL-avstånd i band-σ (stoppträning). */
  minSlSigma: number
  timeLimitCandles: number | null
  budgetR: number | null
}

export const MODE_RULES: Record<RaketMode, ModeRules> = {
  niva: {
    title: 'Nå din TP',
    short: 'Grundläget',
    goal: 'Öppna en position och nå din egen take profit.',
    rules: ['TP krävs, SL rekommenderas.', 'SL = kontrollerad stängning, nivån inte klarad.', 'Margin call = tvångsstängning, nivån misslyckad.'],
    slRequired: false,
    minRatio: 1.5,
    minSlSigma: 0,
    timeLimitCandles: null,
    budgetR: null,
  },
  tid: {
    title: 'Tidsattack',
    short: 'Mot klockan',
    goal: 'Nå din TP inom 30 timcandles. Gasen ger tempo, inte mindre risk.',
    rules: ['Klockan räknar candles från start.', 'Mer gas = mindre betänketid per candle.', 'Tiden ute = nivån inte klarad.'],
    slRequired: false,
    minRatio: 1.5,
    minSlSigma: 0,
    timeLimitCandles: 30,
    budgetR: null,
  },
  budget: {
    title: 'Riskbudget',
    short: 'Uthållighet',
    goal: 'Du har 3 R i riskbudget. Nå TP innan budgeten är slut.',
    rules: ['SL krävs: varje SL kostar 1 R.', 'Flera försök i samma runda.', 'Margin call avslutar direkt.'],
    slRequired: true,
    minRatio: 1.5,
    minSlSigma: 0,
    timeLimitCandles: null,
    budgetR: 3,
  },
  stopp: {
    title: 'Stoppträning',
    short: 'Sätt SL rätt',
    goal: 'Sätt SL utanför bruset (minst 1 σ) och TP på minst 2 R. Nå TP.',
    rules: ['SL krävs och måste vara minst 1 band-σ från ingången.', 'TP minst 2 R.', 'För tajt SL avvisas före start.'],
    slRequired: true,
    minRatio: 2,
    minSlSigma: 1,
    timeLimitCandles: null,
    budgetR: null,
  },
  chock: {
    title: 'Stor rörelse',
    short: 'Historiskt timdrag',
    goal: 'Ett av seriens största riktiga timdrag kommer snart. Sätt SL innan, nå TP inom 12 candles efter draget.',
    rules: ['Riktningen visas först när draget kommit.', 'SL krävs.', 'Ingen påhittad nyhet: bara den riktiga kursrörelsen.'],
    slRequired: true,
    minRatio: 1.5,
    minSlSigma: 0,
    timeLimitCandles: null,
    budgetR: null,
  },
  spoke: {
    title: 'Spöke',
    short: 'Mot ditt förra varv',
    goal: 'Ditt förra varv åker med som spöke. Nå TP — gärna tidigare än spöket.',
    rules: ['Spöket är din egen senaste runda i det här läget.', 'Samma candles, samma regler.', 'TP vinner nivån, oavsett spöket.'],
    slRequired: false,
    minRatio: 1.5,
    minSlSigma: 0,
    timeLimitCandles: null,
    budgetR: null,
  },
}

/** Gas 0..1 → candles per sekund. Hävstången påverkar inte längre farten i de nya lägena. */
export const GAS_MIN_CPS = 0.25
export const GAS_MAX_CPS = 3
export function gasSpeed(gas: number): number {
  const g = Math.max(0, Math.min(1, Number.isFinite(gas) ? gas : 0))
  return GAS_MIN_CPS + (GAS_MAX_CPS - GAS_MIN_CPS) * g
}

/** Marginal = eget kapital / insats vid öppning. */
export const MARGIN_WARN = 0.92
export const MARGIN_CALL = 0.85
export const MARGIN_LIQUIDATE = 0.75
export const MARGIN_COUNTDOWN_MS = 5000
/** Minsta TP-avstånd från ingången (%), och minsta avstånd till aktuell kurs när TP flyttas under ronden. */
export const TP_MIN_PCT = 0.8
export const TP_MIN_FROM_MARK_PCT = 0.5
export const SL_MIN_PCT = 0.2
export const CHOCK_WINDOW = 12
export const CHOCK_LEAD = 8

export type Targets = { tpPct: number; slPct: number | null }
export type Live = { tp: number; sl: number | null; slAtEntry: number | null; entry: number; side: 'long' | 'short'; stake: number }
export type GhostSample = { ms: number; p: number; s: Side }
export type GhostRun = { mode: RaketMode; samples: GhostSample[]; tpMs: number | null; reason: EndReason | null }
export type Message = { kind: 'info' | 'warn' | 'sl' | 'tp' | 'margin'; text: string }

export type Game = {
  mode: RaketMode
  desk: DeskState
  phase: Phase
  gas: number
  targets: Targets
  live: Live | null
  startProgress: number
  deadline: number | null
  usedR: number
  margin: { level: number | null; countdownMs: number | null; warn: boolean }
  message: Message | null
  /** pct = rundans resultat i procent av startinsatsen (övningskapital), inga belopp i gränssnittet. */
  end: { reason: EndReason; r: number | null; pct: number; candles: number; ms: number; beatGhost: boolean | null } | null
  elapsedMs: number
  trace: GhostSample[]
  ghost: GhostRun | null
  shock: { index: number; pct: number; t: number; revealed: boolean } | null
}

export function firstBandIndex(desk: DeskState): number {
  const i = desk.bands.findIndex(Boolean)
  return i < 0 ? 0 : i
}

/** Maximal band-σ (i % av kursen) för startpunkten, så att seriens första hopp inte blåser upp minsta TP-avståndet. */
export const CALM_START_SIGMA_PCT = 2

/** Första candle med band där bandets σ är högst 2 % av kursen. Faller tillbaka på första bandet. */
export function calmStartIndex(desk: DeskState): number {
  const first = firstBandIndex(desk)
  for (let i = first; i < desk.bands.length - 40; i++) {
    const b = desk.bands[i]
    const c = desk.candles[i]
    if (b && c && (b.stdev / c.c) * 100 <= CALM_START_SIGMA_PCT) return i
  }
  return first
}

/** Justera TP/SL uppåt tills de klarar lägets regler (används för förval, aldrig mitt i en runda). */
export function fitTargets(g: Game, t: Targets): Targets {
  const rules = MODE_RULES[g.mode]
  const up = (x: number) => Math.ceil(x * 10 - 1e-9) / 10
  let sl = t.slPct
  if (sl != null && rules.minSlSigma > 0) sl = Math.max(sl, up(sigmaPct(g) * rules.minSlSigma))
  let tp = Math.max(t.tpPct, up(minTpPct(g)))
  if (sl != null) tp = Math.max(tp, up(sl * rules.minRatio))
  return { tpPct: Math.round(tp * 10) / 10, slPct: sl == null ? null : Math.round(sl * 10) / 10 }
}

/** Seriens största riktiga timdrag (efter att banden finns). */
export function findShock(candles: Candle[], from: number): { index: number; pct: number; t: number } | null {
  let best: { index: number; pct: number; t: number } | null = null
  for (let i = Math.max(1, from + CHOCK_LEAD); i < candles.length - 2; i++) {
    const pct = (candles[i].c / candles[i - 1].c - 1) * 100
    if (!best || Math.abs(pct) > Math.abs(best.pct)) best = { index: i, pct, t: candles[i].t }
  }
  return best
}

export function markNow(g: Game): number | null {
  const c = candleAt(g.desk)
  return c ? c.c : null
}

/** Band-σ i procent av kursen vid aktuell candle. */
export function sigmaPct(g: Game): number {
  const i = Math.max(0, Math.min(g.desk.bands.length - 1, Math.floor(g.desk.progress)))
  const b = g.desk.bands[i]
  const m = markNow(g)
  if (!b || !m) return 0
  return (b.stdev / m) * 100
}

export function minTpPct(g: Game): number {
  return Math.max(TP_MIN_PCT, Math.round(sigmaPct(g) * 10) / 10)
}

/** Regler mot fusk + lägets krav. Tom lista = OK. */
export function validateTargets(g: Game, t: Targets = g.targets): string[] {
  const rules = MODE_RULES[g.mode]
  const errs: string[] = []
  const minTp = minTpPct(g)
  if (!(t.tpPct >= minTp)) errs.push(`TP måste ligga minst ${minTp.toFixed(1)} % från ingången (minsta avstånd, ingen TP precis vid kursen).`)
  if (rules.slRequired && t.slPct == null) errs.push('Det här läget kräver stop-loss.')
  if (t.slPct != null) {
    if (!(t.slPct >= SL_MIN_PCT)) errs.push(`SL måste ligga minst ${SL_MIN_PCT.toFixed(1)} % från ingången.`)
    const ratio = t.tpPct / t.slPct
    if (ratio + 1e-9 < rules.minRatio) errs.push(`TP måste vara minst ${rules.minRatio} R (TP-avstånd ÷ SL-avstånd), nu ${ratio.toFixed(2)} R.`)
    if (rules.minSlSigma > 0) {
      const s = sigmaPct(g) * rules.minSlSigma
      if (t.slPct + 1e-9 < s) errs.push(`SL är innanför bruset: minst ${s.toFixed(2)} % (1 band-σ) krävs i stoppträning.`)
    }
  }
  return errs
}

export function createGame(candles: Candle[], mode: RaketMode, opts: Partial<{ targets: Targets; gas: number; leverage: number; ghost: GhostRun | null }> = {}): Game {
  let desk = createDesk(candles)
  desk.paused = true
  const start = mode === 'chock' ? firstBandIndex(desk) : calmStartIndex(desk)
  let shock: Game['shock'] = null
  let startProgress = start
  if (mode === 'chock') {
    const s = findShock(candles, start)
    if (s) {
      shock = { ...s, revealed: false }
      startProgress = Math.max(start, s.index - CHOCK_LEAD)
    }
  }
  desk = { ...desk, progress: startProgress }
  if (opts.leverage) desk = setDeskLeverage(desk, opts.leverage)
  const rules = MODE_RULES[mode]
  const targets = opts.targets ?? { tpPct: 2, slPct: rules.slRequired ? 1 : 1 }
  return {
    mode,
    desk,
    phase: 'setup',
    gas: opts.gas ?? 0.35,
    targets,
    live: null,
    startProgress,
    deadline:
      rules.timeLimitCandles != null ? startProgress + rules.timeLimitCandles : shock ? Math.min(candles.length - 1, shock.index + CHOCK_WINDOW) : null,
    usedR: 0,
    margin: { level: null, countdownMs: null, warn: false },
    message: { kind: 'info', text: 'Ställ in TP och SL, välj hävstång och gas. Starta med KÖP (→/D) eller SÄLJ (←/A).' },
    end: null,
    elapsedMs: 0,
    trace: [],
    ghost: mode === 'spoke' ? opts.ghost ?? null : null,
    shock,
  }
}

export function startRide(g: Game): Game {
  if (g.phase !== 'setup') return g
  const errs = validateTargets(g)
  if (errs.length) return { ...g, message: { kind: 'warn', text: errs[0] } }
  return { ...g, phase: 'ride', desk: { ...g.desk, paused: false }, message: { kind: 'info', text: 'Rundan är igång. KÖP → / SÄLJ ← öppnar position.' } }
}

export function setGas(g: Game, gas: number): Game {
  return { ...g, gas: Math.max(0, Math.min(1, Math.round(gas * 100) / 100)) }
}

export function setLeverage(g: Game, n: number): Game {
  return { ...g, desk: { ...setDeskLeverage(g.desk, n), status: g.desk.status } }
}

export function setTargets(g: Game, t: Targets): Game {
  if (g.phase !== 'setup') return g
  const tp = Math.max(0.1, Math.min(15, Math.round(t.tpPct * 10) / 10))
  const sl = t.slPct == null ? null : Math.max(0.1, Math.min(10, Math.round(t.slPct * 10) / 10))
  return { ...g, targets: { tpPct: tp, slPct: sl } }
}

function levelFor(book: Book, mark: number, stake: number): number {
  return stake > 0 ? markEquity(book, mark) / stake : 1
}

function openLive(g: Game, book: Book): Game {
  const side = sideOf(book)
  const entry = book.avgFill
  const mark = markNow(g)
  if ((side !== 'long' && side !== 'short') || entry == null || mark == null) return g
  let tpPct = g.targets.tpPct
  const minTp = minTpPct(g)
  let note = ''
  if (tpPct < minTp) {
    tpPct = minTp
    note = ` TP flyttad till minsta avstånd ${minTp.toFixed(1)} %.`
  }
  const dir = side === 'long' ? 1 : -1
  const tp = entry * (1 + (dir * tpPct) / 100)
  const sl = g.targets.slPct == null ? null : entry * (1 - (dir * g.targets.slPct) / 100)
  const stake = markEquity(book, mark)
  return {
    ...g,
    live: { tp, sl, slAtEntry: sl, entry, side, stake },
    margin: { level: 1, countdownMs: null, warn: false },
    message: { kind: 'info', text: `${side === 'long' ? 'Köp (long)' : 'Sälj (short)'} på ${entry.toFixed(2)}. TP ${tp.toFixed(2)}${sl != null ? ` · SL ${sl.toFixed(2)}` : ' · ingen SL'}.${note}` },
  }
}

function closeLive(g: Game, kind: 'manual' | 'sl' | 'tp' | 'margin'): Game {
  const c = candleAt(g.desk)
  if (!c) return g
  const res = flattenBook(g.desk.book, deriveQuote(c.c), c.t)
  const book = kind === 'margin' ? { ...res.book, liquidated: true } : res.book
  return { ...g, desk: { ...g.desk, book }, live: null, margin: { level: null, countdownMs: null, warn: false } }
}

function rMultiple(live: Live, exit: number): number | null {
  if (live.slAtEntry == null) return null
  const risk = Math.abs(live.entry - live.slAtEntry)
  if (!(risk > 0)) return null
  const dir = live.side === 'long' ? 1 : -1
  return (dir * (exit - live.entry)) / risk
}

function finish(g: Game, reason: EndReason, r: number | null): Game {
  const won = reason === 'tp'
  const ghostTp = g.ghost?.tpMs ?? null
  return {
    ...g,
    phase: won ? 'won' : 'lost',
    desk: { ...g.desk, paused: true },
    end: {
      reason,
      r,
      pct: (() => {
        const m = markNow(g)
        return m == null ? 0 : (markEquity(g.desk.book, m) / STARTING_CASH - 1) * 100
      })(),
      candles: Math.max(0, Math.floor(g.desk.progress) - g.startProgress),
      ms: g.elapsedMs,
      beatGhost: won && g.mode === 'spoke' && g.ghost ? ghostTp == null || g.elapsedMs < ghostTp : null,
    },
  }
}

function order(g: Game, action: 'buy' | 'sell'): Game {
  if (g.phase === 'setup') {
    const started = startRide(g)
    if (started.phase !== 'ride') return started
    g = started
  }
  if (g.phase !== 'ride') return g
  const c = candleAt(g.desk)
  if (!c) return g
  const before = sideOf(g.desk.book)
  const quote = deriveQuote(c.c)
  const res = action === 'buy' ? submitBuy(g.desk.book, quote, g.desk.leverage, c.t, false) : submitSell(g.desk.book, quote, g.desk.leverage, c.t, false)
  let next: Game = { ...g, desk: { ...g.desk, book: res.book } }
  if (res.event === 'opened_long' || res.event === 'opened_short') return openLive(next, res.book)
  if (res.event === 'no_implicit_reverse') {
    const wasPanic = g.margin.countdownMs != null
    next = { ...next, live: null, margin: { level: null, countdownMs: null, warn: false } }
    return {
      ...next,
      message: {
        kind: 'info',
        text: wasPanic
          ? 'Stängd under margin call — kontrollerat, men sent. Nivån fortsätter.'
          : `Positionen stängd manuellt (${before === 'long' ? 'long' : 'short'}). Tryck igen för att öppna andra sidan.`,
      },
    }
  }
  if (res.event === 'rejected') return { ...next, message: { kind: 'warn', text: 'Avvisad: insatsen räcker inte till en hel aktie.' } }
  return next
}

export const gameBuy = (g: Game) => order(g, 'buy')
export const gameSell = (g: Game) => order(g, 'sell')

export function gameFlat(g: Game): Game {
  if (g.phase !== 'ride' || !g.live) return g
  const wasPanic = g.margin.countdownMs != null
  const next = closeLive(g, 'manual')
  return {
    ...next,
    message: { kind: 'info', text: wasPanic ? 'Platt under margin call — kontrollerat, men sent. Nivån fortsätter.' : 'Platt. Positionen stängd manuellt.' },
  }
}

export function togglePauseGame(g: Game): Game {
  if (g.phase !== 'ride') return g
  if (g.margin.countdownMs != null) return { ...g, message: { kind: 'margin', text: 'Ingen paus under margin call. Stäng (F) eller vänd — nedräkningen fortsätter.' } }
  return { ...g, desk: { ...g.desk, paused: !g.desk.paused } }
}

/** Flytta TP/SL under ronden (pris). Regler: TP aldrig närmare än minsta avstånd, SL alltid på förlustsidan av kursen. */
export function moveLine(g: Game, which: 'tp' | 'sl', price: number): Game {
  if (!g.live || !Number.isFinite(price)) return g
  const mark = markNow(g)
  if (mark == null) return g
  const dir = g.live.side === 'long' ? 1 : -1
  if (which === 'tp') {
    const minFromEntry = g.live.entry * (1 + (dir * minTpPct(g)) / 100)
    const minFromMark = mark * (1 + (dir * TP_MIN_FROM_MARK_PCT) / 100)
    const floor = dir > 0 ? Math.max(minFromEntry, minFromMark) : Math.min(minFromEntry, minFromMark)
    const tp = dir > 0 ? Math.max(floor, price) : Math.min(floor, price)
    return { ...g, live: { ...g.live, tp } }
  }
  const maxSl = mark * (1 - (dir * SL_MIN_PCT) / 100)
  const sl = dir > 0 ? Math.min(maxSl, price) : Math.max(maxSl, price)
  return { ...g, live: { ...g.live, sl, slAtEntry: g.live.slAtEntry ?? sl } }
}

export function nudgeLine(g: Game, which: 'tp' | 'sl', steps: number): Game {
  if (g.phase === 'setup') {
    if (which === 'tp') return setTargets(g, { ...g.targets, tpPct: g.targets.tpPct + steps * 0.1 })
    const base = g.targets.slPct ?? 1
    return setTargets(g, { ...g.targets, slPct: base + steps * 0.1 })
  }
  if (!g.live) return g
  const dir = g.live.side === 'long' ? 1 : -1
  const step = g.live.entry * 0.001 * steps
  if (which === 'tp') return moveLine(g, 'tp', g.live.tp + dir * step)
  const cur = g.live.sl ?? g.live.entry * (1 - dir * 0.01)
  return moveLine(g, 'sl', cur - dir * step)
}

/** Pris där marginalen når tvångsgränsen (för linjen i grafen). */
export function liquidationPrice(g: Game): number | null {
  if (!g.live) return null
  const book = g.desk.book
  if (book.shares === 0) return null
  // equity(m) = cash + shares*m = LIQ*stake → m = (LIQ*stake - cash)/shares
  return (MARGIN_LIQUIDATE * g.live.stake - book.cash) / book.shares
}

export function stepGame(g: Game, dtMs: number): Game {
  if (g.phase !== 'ride' || !(dtMs > 0)) return g
  const panic = g.margin.countdownMs != null
  const desk = g.desk
  const max = desk.candles.length - 1
  let progress = desk.progress
  if (!desk.paused || panic) progress = Math.min(max, desk.progress + gasSpeed(g.gas) * (dtMs / 1000))
  let next: Game = { ...g, desk: { ...desk, progress }, elapsedMs: g.elapsedMs + dtMs }
  if (Math.floor(progress) !== Math.floor(desk.progress) || next.trace.length === 0 || next.elapsedMs - (next.trace[next.trace.length - 1]?.ms ?? 0) > 250) {
    next = { ...next, trace: [...next.trace, { ms: next.elapsedMs, p: progress, s: sideOf(next.desk.book) }] }
  }
  if (next.shock && !next.shock.revealed && progress >= next.shock.index) {
    const s = next.shock
    next = { ...next, shock: { ...s, revealed: true }, message: { kind: 'warn', text: `Timdraget kom: ${s.pct >= 0 ? '+' : ''}${s.pct.toFixed(2)} % (NVDA ${new Date(s.t * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC, riktig historik).` } }
  }
  const mark = markNow(next)
  if (mark != null && next.live) {
    const L = next.live
    const long = L.side === 'long'
    if (long ? mark >= L.tp : mark <= L.tp) {
      const r = rMultiple(L, mark)
      const closed = closeLive(next, 'tp')
      return finish({ ...closed, message: { kind: 'tp', text: 'Nivå klarad – TP nådd (övning).' } }, 'tp', r)
    }
    if (L.sl != null && (long ? mark <= L.sl : mark >= L.sl)) {
      const closed = closeLive(next, 'sl')
      if (next.mode === 'budget') {
        const usedR = next.usedR + 1
        const budget = MODE_RULES.budget.budgetR ?? 3
        if (usedR >= budget) return finish({ ...closed, usedR, message: { kind: 'sl', text: 'Riskbudgeten är slut — tredje stop-loss.' } }, 'budget', -1)
        return { ...closed, usedR, message: { kind: 'sl', text: `Stop-loss nådd – positionen stängd kontrollerat (övning). Riskbudget kvar: ${budget - usedR} R.` } }
      }
      return finish({ ...closed, message: { kind: 'sl', text: 'Stop-loss nådd – positionen stängd kontrollerat (övning).' } }, 'sl', -1)
    }
    const level = levelFor(next.desk.book, mark, L.stake)
    let countdownMs = next.margin.countdownMs
    let message = next.message
    if (level < MARGIN_LIQUIDATE || (countdownMs != null && countdownMs - dtMs <= 0)) {
      const closed = closeLive(next, 'margin')
      return finish({ ...closed, message: { kind: 'margin', text: 'Margin call – positionen tvångsstängd (övning).' } }, 'margin', rMultiple(L, mark))
    }
    if (level < MARGIN_CALL) {
      if (countdownMs == null) {
        countdownMs = MARGIN_COUNTDOWN_MS
        message = { kind: 'margin', text: 'MARGIN CALL! Marginalen under 85 %. Stäng (F) eller vänd innan nedräkningen tar slut.' }
      } else countdownMs -= dtMs
    } else if (countdownMs != null) {
      countdownMs = null
      message = { kind: 'info', text: 'Marginalen återhämtade sig över 85 %. Larmet av — risken finns kvar.' }
    }
    next = { ...next, margin: { level, countdownMs, warn: level < MARGIN_WARN }, message }
  }
  if (next.deadline != null && progress >= next.deadline && next.phase === 'ride') {
    const closed = next.live ? closeLive(next, 'manual') : next
    return finish({ ...closed, message: { kind: 'warn', text: 'Tiden är ute — TP inte nådd.' } }, 'time', null)
  }
  if (progress >= max) {
    const closed = next.live ? closeLive(next, 'manual') : next
    return finish({ ...closed, message: { kind: 'warn', text: 'Den historiska serien är slut — TP inte nådd.' } }, 'series', null)
  }
  return next
}

export function ghostFrom(g: Game): GhostRun {
  return { mode: g.mode, samples: g.trace, tpMs: g.end?.reason === 'tp' ? g.end.ms : null, reason: g.end?.reason ?? null }
}

export function ghostAt(ghost: GhostRun | null, ms: number): GhostSample | null {
  if (!ghost || ghost.samples.length === 0) return null
  let last = ghost.samples[0]
  for (const s of ghost.samples) {
    if (s.ms > ms) break
    last = s
  }
  return last
}
