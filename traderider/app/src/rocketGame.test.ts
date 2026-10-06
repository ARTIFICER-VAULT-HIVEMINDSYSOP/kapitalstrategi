import { expect, test } from 'vitest'
import {
  accountRiskPct,
  breakEvenWinRate,
  createGame,
  DEFAULT_TARGETS,
  gameBuy,
  gameFlat,
  gameSell,
  gasSpeed,
  liquidationPrice,
  MAX_ACCOUNT_RISK_PCT,
  moveLine,
  RAKET_MODES,
  startRide,
  stepGame,
  togglePauseGame,
  validateTargets,
  GAS_MAX_CPS,
  GAS_MIN_CPS,
  MARGIN_COUNTDOWN_MS,
  type Game,
} from './lib/rocketGame'
import { raketCmdFromKey } from './lib/raketSpelKeys'
import type { Candle } from './lib/types'

/** Syntetiska candles för regeltester (inte i gränssnittet): 30 lugna, sedan en ramp. */
function series(rampPctPerCandle: number, n = 80, base = 100): Candle[] {
  const out: Candle[] = []
  let c = base
  for (let i = 0; i < n; i++) {
    if (i >= 30) c = c * (1 + rampPctPerCandle / 100)
    else c = base * (1 + (i % 2 === 0 ? 0.001 : -0.001))
    out.push({ t: 1_700_000_000 + i * 3600, o: c, h: c * 1.001, l: c * 0.999, c, v: 1000 })
  }
  return out
}

/** Stega fram en candle i taget (1 s per steg vid gas 0 = 0,25 candle/s → 4 steg per candle). */
function ride(g: Game, candles: number): Game {
  let s = g
  for (let k = 0; k < candles * 4 && s.phase === 'ride'; k++) s = stepGame(s, 1000)
  return s
}

test('gas styr farten, hävstången gör det inte', () => {
  expect(gasSpeed(0)).toBe(GAS_MIN_CPS)
  expect(gasSpeed(1)).toBe(GAS_MAX_CPS)
  const a = startRide(createGame(series(0.5), 'niva', { gas: 0.5, leverage: 1 }))
  const b = startRide(createGame(series(0.5), 'niva', { gas: 0.5, leverage: 4, targets: { tpPct: 2, slPct: 0.5 } }))
  expect(stepGame(a, 1000).desk.progress).toBeCloseTo(stepGame(b, 1000).desk.progress, 9)
})

test('TP vinner nivån', () => {
  let g = createGame(series(0.5), 'niva', { gas: 0, leverage: 1, targets: { tpPct: 2, slPct: 1 } })
  g = gameBuy(g)
  expect(g.phase).toBe('ride')
  expect(g.live?.side).toBe('long')
  g = ride(g, 40)
  expect(g.phase).toBe('won')
  expect(g.end?.reason).toBe('tp')
  expect(g.end?.r).toBeGreaterThanOrEqual(2 - 0.3)
  expect(g.message?.text).toContain('Nivå klarad')
})

test('SL stänger kontrollerat, nivån inte klarad', () => {
  let g = createGame(series(-0.5), 'niva', { gas: 0, leverage: 1, targets: { tpPct: 2, slPct: 1 } })
  g = ride(gameBuy(g), 40)
  expect(g.phase).toBe('lost')
  expect(g.end?.reason).toBe('sl')
  expect(g.message?.kind).toBe('sl')
})

test('margin call: nedräkning, ingen paus, sedan tvångsstängning', () => {
  let g = createGame(series(-0.6), 'niva', { gas: 0, leverage: 4, targets: { tpPct: 2, slPct: null } })
  g = gameBuy(g)
  let saw = false
  for (let k = 0; k < 400 && g.phase === 'ride'; k++) {
    g = stepGame(g, 250)
    if (g.margin.countdownMs != null) {
      saw = true
      expect(g.margin.countdownMs).toBeLessThanOrEqual(MARGIN_COUNTDOWN_MS)
      const p = togglePauseGame(g)
      expect(p.desk.paused).toBe(false)
      expect(p.message?.kind).toBe('margin')
    }
  }
  expect(saw).toBe(true)
  expect(g.end?.reason).toBe('margin')
  expect(g.desk.book.liquidated).toBe(true)
})

test('F under margin call = kontrollerad men sen stängning, rundan fortsätter', () => {
  let g = createGame(series(-0.6), 'niva', { gas: 0, leverage: 4, targets: { tpPct: 2, slPct: null } })
  g = gameBuy(g)
  for (let k = 0; k < 400 && g.margin.countdownMs == null && g.phase === 'ride'; k++) g = stepGame(g, 250)
  expect(g.margin.countdownMs).not.toBeNull()
  g = gameFlat(g)
  expect(g.phase).toBe('ride')
  expect(g.live).toBeNull()
  expect(g.message?.text).toContain('sent')
})

test('4× likvideras inte längre direkt vid öppning (enforce av i Raket-lägena)', () => {
  const g = gameSell(createGame(series(0.2), 'niva', { gas: 0, leverage: 4, targets: { tpPct: 2, slPct: null } }))
  expect(g.live?.side).toBe('short')
  expect(g.desk.book.liquidated).toBe(false)
  expect(liquidationPrice(g)).toBeGreaterThan(g.live!.entry)
})

test('regler mot fusk: TP för nära, för låg R, SL krävs', () => {
  const g = createGame(series(0.5), 'budget', { targets: { tpPct: 0.3, slPct: null } })
  const errs = validateTargets(g)
  expect(errs.some((e) => e.includes('TP måste ligga'))).toBe(true)
  expect(errs.some((e) => e.includes('kräver stop-loss'))).toBe(true)
  const r = validateTargets(g, { tpPct: 1, slPct: 1 })
  expect(r.some((e) => e.includes('R'))).toBe(true)
  expect(startRide({ ...g }).phase).toBe('setup')
})

test('TP kan inte flyttas in till kursen under ronden', () => {
  let g = gameBuy(createGame(series(0.5), 'niva', { gas: 0, leverage: 1, targets: { tpPct: 3, slPct: 1 } }))
  const entry = g.live!.entry
  g = moveLine(g, 'tp', entry * 1.0001)
  expect(g.live!.tp).toBeGreaterThanOrEqual(entry * 1.005 - 1e-9)
})

test('riskbudget: SL kostar 1 R, rundan fortsätter tills budgeten är slut', () => {
  let g = createGame(series(-0.5), 'budget', { gas: 0, leverage: 1, targets: { tpPct: 1.5, slPct: 1 } })
  g = ride(gameBuy(g), 15)
  expect(g.usedR).toBe(1)
  expect(g.phase).toBe('ride')
  g = ride(gameBuy(g), 10)
  g = ride(gameBuy(g), 10)
  expect(g.phase).toBe('lost')
  expect(g.end?.reason).toBe('budget')
})

test('tidsattack: tiden ute utan TP', () => {
  let g = createGame(series(0.001, 120), 'tid', { gas: 0, leverage: 1, targets: { tpPct: 1.5, slPct: 1 } })
  g = ride(gameBuy(g), 40)
  expect(g.end?.reason).toBe('time')
})

test('stort drag: start före seriens största timdrag, riktningen dold tills det kommer', () => {
  const c = series(0.01, 90)
  c[60] = { ...c[60], c: c[59].c * 0.95, o: c[59].c, l: c[59].c * 0.94 }
  for (let i = 61; i < c.length; i++) c[i] = { ...c[i], c: c[60].c, o: c[60].c, h: c[60].c * 1.001, l: c[60].c * 0.999 }
  let g = createGame(c, 'chock', { gas: 0, leverage: 1, targets: { tpPct: 3, slPct: 2 } })
  expect(g.shock?.index).toBe(60)
  expect(g.shock?.revealed).toBe(false)
  expect(g.startProgress).toBe(52)
  g = ride(gameSell(g), 9)
  expect(g.shock?.revealed).toBe(true)
  expect(g.phase).toBe('won')
})

test('förval är 1:2 med SL satt, och hävstången håller förlusten inom taket', () => {
  expect(breakEvenWinRate(2)).toBeCloseTo(1 / 3, 6)
  expect(breakEvenWinRate(1.5)).toBeCloseTo(0.4, 6)
  expect(breakEvenWinRate(3)).toBeCloseTo(0.25, 6)
  for (const mode of RAKET_MODES) {
    const t = DEFAULT_TARGETS[mode]
    expect(t.slPct).not.toBeNull()
    expect(t.tpPct / (t.slPct as number)).toBeCloseTo(2, 6)
    const g = createGame(series(0.2), mode)
    expect(g.targets).toEqual(t)
    expect(g.desk.leverage).toBe(1)
    expect(accountRiskPct(t.slPct as number, g.desk.leverage)).toBeLessThanOrEqual(MAX_ACCOUNT_RISK_PCT)
    expect(validateTargets(g)).toEqual([])
  }
  const wide = createGame(series(0.2), 'niva', { leverage: 4, targets: { tpPct: 2, slPct: 1 } })
  expect(validateTargets(wide).some((e) => e.includes('övningsinsatsen'))).toBe(true)
  expect(startRide(wide).phase).toBe('setup')
  const fitted = createGame(series(0.2), 'niva', { leverage: 4, targets: { tpPct: 1, slPct: 0.5 } })
  expect(accountRiskPct(0.5, 4)).toBe(MAX_ACCOUNT_RISK_PCT)
  expect(validateTargets(fitted)).toEqual([])
})

test('tangentschema', () => {
  expect(raketCmdFromKey('ArrowRight')).toBe('buy')
  expect(raketCmdFromKey('d')).toBe('buy')
  expect(raketCmdFromKey('ArrowLeft')).toBe('sell')
  expect(raketCmdFromKey('A')).toBe('sell')
  expect(raketCmdFromKey('ArrowUp')).toBe('lev_up')
  expect(raketCmdFromKey('W')).toBe('lev_up')
  expect(raketCmdFromKey(']')).toBe('lev_up')
  expect(raketCmdFromKey('ArrowDown')).toBe('lev_down')
  expect(raketCmdFromKey('[')).toBe('lev_down')
  expect(raketCmdFromKey('3')).toBe('lev_3')
  expect(raketCmdFromKey('F')).toBe('flat')
  expect(raketCmdFromKey(' ')).toBe('pause')
  expect(raketCmdFromKey('E')).toBe('gas_up')
  expect(raketCmdFromKey('q')).toBe('gas_down')
})
