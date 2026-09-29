/**
 * Raket-lägen (utkast): sex körlägen ovanpå samma motor och samma riktiga NVDA-timcandles som klassiska Raket.
 * Gas (tempo) och hävstång (risk) är skilda. Egen TP/SL. TP vinner nivån, SL stänger kontrollerat,
 * margin call ger larm + nedräkning och sedan tvångsstängning. Övning, inga riktiga pengar, ingen rådgivning.
 */
import { useEffect, useRef, useState } from 'react'
import { candleAt, markFromCandles } from '../lib/deskState'
import { drawRaketSpel, projectionFor } from '../lib/drawRaketSpel'
import { formatPct, px } from '../lib/format'
import { sideOf } from '../lib/market'
import { raketCmdFromKey, type RaketCmd } from '../lib/raketSpelKeys'
import { createAlarm } from '../lib/rocketAlarm'
import {
  createGame,
  fitTargets,
  gameBuy,
  gameFlat,
  gameSell,
  ghostFrom,
  gasSpeed,
  minTpPct,
  MARGIN_CALL,
  MARGIN_LIQUIDATE,
  MARGIN_WARN,
  MODE_RULES,
  moveLine,
  nudgeLine,
  RAKET_MODES,
  setGas,
  setLeverage,
  setTargets,
  sigmaPct,
  stepGame,
  togglePauseGame,
  validateTargets,
  type Game,
  type GhostRun,
  type RaketMode,
  type Targets,
} from '../lib/rocketGame'
import type { Candle } from '../lib/types'
import { RocketDesk } from './RocketDesk'
import './rocket.css'
import './raketspel.css'

const GHOST_KEY = 'traderider.raket.spoke.v1'
const CALM_KEY = 'traderider.raket.lugn.v1'
const SOUND_KEY = 'traderider.raket.ljud.v1'
const MODE_KEY = 'traderider.raket.lage.v1'

type Tab = RaketMode | 'klassisk'

const DEFAULT_TARGETS: Record<RaketMode, Targets> = {
  niva: { tpPct: 2, slPct: 1 },
  tid: { tpPct: 1.5, slPct: 1 },
  budget: { tpPct: 1.5, slPct: 1 },
  stopp: { tpPct: 3, slPct: 1.5 },
  chock: { tpPct: 3, slPct: 2 },
  spoke: { tpPct: 2, slPct: 1 },
}

function store(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

function loadGhost(): GhostRun | null {
  const raw = store(GHOST_KEY)
  if (!raw) return null
  try {
    const g = JSON.parse(raw) as GhostRun
    return Array.isArray(g.samples) ? g : null
  } catch {
    return null
  }
}

function initialTab(): Tab {
  if (typeof window === 'undefined') return 'niva'
  const q = new URLSearchParams(window.location.search).get('lage')
  const all: Tab[] = [...RAKET_MODES, 'klassisk']
  if (q && (all as string[]).includes(q)) return q as Tab
  const s = store(MODE_KEY)
  if (s && (all as string[]).includes(s)) return s as Tab
  return 'niva'
}

function newGame(candles: Candle[], mode: RaketMode, prev?: Game | null): Game {
  const g = createGame(candles, mode, {
    targets: DEFAULT_TARGETS[mode],
    gas: prev?.gas ?? 0.35,
    leverage: prev?.desk.leverage ?? 2,
    ghost: mode === 'spoke' ? loadGhost() : null,
  })
  return { ...g, targets: fitTargets(g, g.targets) }
}

function measure(canvas: HTMLCanvasElement | null, g: Game): Game {
  if (!canvas) return g
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width < 10 || height < 10) return g
  if (width === g.desk.viewport.width && height === g.desk.viewport.height) return g
  return { ...g, desk: { ...g.desk, viewport: { width, height } } }
}

const tabLabel = (t: Tab) => (t === 'klassisk' ? 'Fri åkning' : MODE_RULES[t].title)
const tabShort = (t: Tab) => (t === 'klassisk' ? 'Klassiska Raket' : MODE_RULES[t].short)

function MarginGauge({ level }: { level: number | null }) {
  const v = level == null ? null : Math.max(0, Math.min(1.05, level))
  const toPct = (x: number) => ((Math.max(MARGIN_LIQUIDATE, Math.min(1, x)) - MARGIN_LIQUIDATE) / (1 - MARGIN_LIQUIDATE)) * 100
  const tone = v == null ? 'idle' : v < MARGIN_CALL ? 'call' : v < MARGIN_WARN ? 'warn' : 'ok'
  return (
    <div className={`rs-gauge rs-gauge-${tone}`} aria-label={`Marginal ${v == null ? '—' : Math.round(v * 100) + ' %'}`}>
      <div className="rs-gauge-head">
        <span>Marginal</span>
        <strong>{v == null ? '—' : `${Math.round(v * 100)} %`}</strong>
      </div>
      <div className="rs-gauge-track">
        <div className="rs-gauge-fill" style={{ width: `${v == null ? 0 : toPct(v)}%` }} />
        <i style={{ left: `${toPct(MARGIN_CALL)}%` }} title="Margin call 85 %" />
        <i style={{ left: `${toPct(MARGIN_WARN)}%` }} title="Varning 92 %" />
      </div>
      <div className="rs-gauge-scale">
        <span>75 % tvång</span>
        <span>85 % call</span>
        <span>100 %</span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`rs-stat ${tone ? `rs-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Setup({ g, apply }: { g: Game; apply: (fn: (g: Game) => Game) => void }) {
  const [unit, setUnit] = useState<'pct' | 'price'>('pct')
  const rules = MODE_RULES[g.mode]
  const m = candleAt(g.desk)?.c ?? null
  const errs = validateTargets(g)
  const t = g.targets
  const slOn = t.slPct != null
  const upTp = m ? m * (1 + t.tpPct / 100) : null
  const upSl = m && slOn ? m * (1 - (t.slPct as number) / 100) : null
  const dnTp = m ? m * (1 - t.tpPct / 100) : null
  const dnSl = m && slOn ? m * (1 + (t.slPct as number) / 100) : null
  const ratio = slOn ? t.tpPct / (t.slPct as number) : null
  const setTp = (v: number) => apply((s) => setTargets(s, { ...s.targets, tpPct: v }))
  const setSl = (v: number | null) => apply((s) => setTargets(s, { ...s.targets, slPct: v }))
  return (
    <div className="rs-setup" role="dialog" aria-label="Inställningar före start">
      <h3>Före start · {rules.title}</h3>
      <p className="rs-setup-goal">{rules.goal}</p>
      <div className="rs-unit" role="group" aria-label="Ange TP/SL som">
        <button type="button" aria-pressed={unit === 'pct'} onClick={() => setUnit('pct')}>Procent</button>
        <button type="button" aria-pressed={unit === 'price'} onClick={() => setUnit('price')}>Pris (NVDA)</button>
      </div>
      <div className="rs-fields">
        <label className="rs-field rs-field-tp">
          <span>Take profit (TP)</span>
          {unit === 'pct' ? (
            <input type="number" step={0.1} min={0.1} max={15} value={t.tpPct} onChange={(e) => setTp(Number(e.target.value))} aria-label="TP i procent" />
          ) : (
            <input type="number" step={0.01} value={upTp == null ? '' : upTp.toFixed(2)} onChange={(e) => m && setTp(Math.abs(Number(e.target.value) / m - 1) * 100)} aria-label="TP-pris vid KÖP" />
          )}
          <em>{unit === 'pct' ? '%' : 'vid KÖP'}</em>
        </label>
        <label className="rs-field rs-field-sl">
          <span>Stop-loss (SL){rules.slRequired ? ' · krävs' : ''}</span>
          {unit === 'pct' ? (
            <input type="number" step={0.1} min={0.1} max={10} disabled={!slOn} value={slOn ? (t.slPct as number) : ''} onChange={(e) => setSl(Number(e.target.value))} aria-label="SL i procent" />
          ) : (
            <input type="number" step={0.01} disabled={!slOn} value={upSl == null ? '' : upSl.toFixed(2)} onChange={(e) => m && setSl(Math.abs(1 - Number(e.target.value) / m) * 100)} aria-label="SL-pris vid KÖP" />
          )}
          <em>{unit === 'pct' ? '%' : 'vid KÖP'}</em>
        </label>
        {rules.slRequired ? null : (
          <label className="rs-check">
            <input type="checkbox" checked={!slOn} onChange={(e) => setSl(e.target.checked ? null : 1)} /> Ingen SL (då kan bara TP eller margin call stänga)
          </label>
        )}
      </div>
      <table className="rs-preview">
        <tbody>
          <tr>
            <th>NVDA nu</th>
            <td colSpan={2}>{px(m)}</td>
          </tr>
          <tr>
            <th>Vid KÖP →</th>
            <td className="rs-tp">TP {px(upTp)}</td>
            <td className="rs-sl">SL {slOn ? px(upSl) : '—'}</td>
          </tr>
          <tr>
            <th>Vid SÄLJ ←</th>
            <td className="rs-tp">TP {px(dnTp)}</td>
            <td className="rs-sl">SL {slOn ? px(dnSl) : '—'}</td>
          </tr>
          <tr>
            <th>R (TP ÷ SL)</th>
            <td colSpan={2}>{ratio == null ? 'ingen SL = ingen R' : `${ratio.toFixed(2)} R · krav ${rules.minRatio} R`}</td>
          </tr>
        </tbody>
      </table>
      <p className="rs-rulenote">
        Minsta TP-avstånd nu {minTpPct(g).toFixed(1)} % (större av 0,8 % och 1 band-σ = {sigmaPct(g).toFixed(2)} %). Priserna räknas från
        fyllnadskursen när du öppnar.
      </p>
      {errs.length ? (
        <ul className="rs-errs" role="status">
          {errs.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : (
        <p className="rs-ok" role="status">✓ Klart att åka. Starta med KÖP (→/D) eller SÄLJ (←/A).</p>
      )}
      <div className="rs-setup-go">
        <button type="button" className="rs-go rs-go-sell" disabled={errs.length > 0} onClick={() => apply(gameSell)}>← SÄLJ · starta short</button>
        <button type="button" className="rs-go rs-go-buy" disabled={errs.length > 0} onClick={() => apply(gameBuy)}>KÖP · starta long →</button>
      </div>
    </div>
  )
}

function EndCard({ g, onRestart }: { g: Game; onRestart: () => void }) {
  const e = g.end
  if (!e) return null
  const title =
    e.reason === 'tp'
      ? 'Nivå klarad – TP nådd (övning)'
      : e.reason === 'sl'
        ? 'Stop-loss nådd – stängd kontrollerat (övning)'
        : e.reason === 'margin'
          ? 'Margin call – positionen tvångsstängd (övning)'
          : e.reason === 'budget'
            ? 'Riskbudgeten slut (övning)'
            : e.reason === 'time'
              ? 'Tiden ute – TP inte nådd (övning)'
              : 'Serien slut – TP inte nådd (övning)'
  const tone = e.reason === 'tp' ? 'win' : e.reason === 'sl' || e.reason === 'budget' ? 'sl' : e.reason === 'margin' ? 'margin' : 'neutral'
  return (
    <div className={`rs-end rs-end-${tone}`} role="dialog" aria-label={title}>
      <h3>{title}</h3>
      <div className="rs-end-grid">
        <Stat label="Resultat" value={e.r == null ? '— (ingen SL)' : `${e.r >= 0 ? '+' : ''}${e.r.toFixed(2)} R`} />
        <Stat label="Av insatsen" value={formatPct(e.pct)} tone={e.pct >= 0 ? 'up' : 'down'} />
        <Stat label="Candles" value={String(e.candles)} />
        <Stat label="Tid" value={`${(e.ms / 1000).toFixed(1)} s`} />
      </div>
      {e.beatGhost != null ? <p className="rs-end-note">{e.beatGhost ? '👻 Du nådde TP före spöket.' : 'Spöket var snabbare den här gången.'}</p> : null}
      {e.reason === 'tp' ? (
        <p className="rs-end-note">Historiskt utfall i en övning. Samma drag hade lika gärna kunnat gå emot dig — det är därför SL finns.</p>
      ) : e.reason === 'margin' ? (
        <p className="rs-end-note">Hävstången förstorade rörelsen tills marginalen tog slut. Lägre hävstång eller en SL stänger tidigare och kontrollerat.</p>
      ) : null}
      <button type="button" className="rs-go rs-go-buy" onClick={onRestart}>Ny runda (R)</button>
    </div>
  )
}

export function RaketSpel({ candles }: { candles: Candle[] }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const startMode: RaketMode = tab === 'klassisk' ? 'niva' : tab
  const gameRef = useRef<Game>(newGame(candles, startMode))
  const [g, setSnap] = useState<Game>(gameRef.current)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frozenRef = useRef(false)
  const alarmRef = useRef(createAlarm())
  const dragRef = useRef<'tp' | 'sl' | null>(null)
  const [calm, setCalm] = useState<boolean>(() => {
    const s = store(CALM_KEY)
    if (s === '1' || s === '0') return s === '1'
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  })
  const [sound, setSound] = useState<boolean>(() => store(SOUND_KEY) !== '0')

  function commit(next: Game) {
    const prev = gameRef.current
    gameRef.current = next
    if (prev.phase === 'ride' && (next.phase === 'won' || next.phase === 'lost') && next.mode === 'spoke') {
      save(GHOST_KEY, JSON.stringify({ ...ghostFrom(next), samples: next.trace.slice(0, 4000) }))
    }
    const panic = next.margin.countdownMs != null
    if (panic && !alarmRef.current.running()) alarmRef.current.start()
    if (!panic && alarmRef.current.running()) alarmRef.current.stop()
    drawRaketSpel(canvasRef.current, next)
  }
  function apply(fn: (s: Game) => Game) {
    commit(fn(gameRef.current))
    setSnap(gameRef.current)
  }
  function switchMode(t: Tab) {
    setTab(t)
    save(MODE_KEY, t)
    try {
      const u = new URL(window.location.href)
      u.searchParams.set('lage', t)
      window.history.replaceState(null, '', u)
    } catch {
      /* ignore */
    }
    if (t !== 'klassisk') {
      const fresh = newGame(candles, t, gameRef.current)
      fresh.desk.viewport = gameRef.current.desk.viewport
      apply(() => fresh)
    }
  }
  function restart() {
    const fresh = newGame(candles, gameRef.current.mode, gameRef.current)
    fresh.desk.viewport = gameRef.current.desk.viewport
    apply(() => fresh)
  }
  function run(cmd: RaketCmd) {
    switch (cmd) {
      case 'buy':
        return apply(gameBuy)
      case 'sell':
        return apply(gameSell)
      case 'flat':
        return apply(gameFlat)
      case 'pause':
        return apply(togglePauseGame)
      case 'lev_up':
        return apply((s) => setLeverage(s, s.desk.leverage + 1))
      case 'lev_down':
        return apply((s) => setLeverage(s, s.desk.leverage - 1))
      case 'lev_1':
      case 'lev_2':
      case 'lev_3':
      case 'lev_4':
        return apply((s) => setLeverage(s, Number(cmd.slice(4))))
      case 'gas_up':
        return apply((s) => setGas(s, s.gas + 0.1))
      case 'gas_down':
        return apply((s) => setGas(s, s.gas - 0.1))
      case 'tp_out':
        return apply((s) => nudgeLine(s, 'tp', 1))
      case 'tp_in':
        return apply((s) => nudgeLine(s, 'tp', -1))
      case 'sl_out':
        return apply((s) => nudgeLine(s, 'sl', 1))
      case 'sl_in':
        return apply((s) => nudgeLine(s, 'sl', -1))
      case 'restart':
        if (gameRef.current.phase === 'won' || gameRef.current.phase === 'lost') restart()
        return
    }
  }
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    alarmRef.current.setEnabled(sound)
    save(SOUND_KEY, sound ? '1' : '0')
    if (sound && gameRef.current.margin.countdownMs != null) alarmRef.current.start()
  }, [sound])
  useEffect(() => save(CALM_KEY, calm ? '1' : '0'), [calm])

  useEffect(() => {
    if (tab === 'klassisk') return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const cmd = raketCmdFromKey(event.key)
      if (!cmd) return
      event.preventDefault()
      runRef.current(cmd)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab])

  useEffect(() => {
    if (tab === 'klassisk') return
    const canvas = canvasRef.current
    if (!canvas) return
    commit(measure(canvas, gameRef.current))
    const observer = new ResizeObserver(() => commit(measure(canvas, gameRef.current)))
    observer.observe(canvas)
    let frame = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      let next = measure(canvas, gameRef.current)
      if (!frozenRef.current) next = stepGame(next, dt)
      commit(next)
      acc += dt
      if (acc >= 120) {
        acc = 0
        setSnap(gameRef.current)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    ;(window as unknown as { __raketSpelTest?: object }).__raketSpelTest = {
      get: () => gameRef.current,
      freeze: (on: boolean) => {
        frozenRef.current = on
      },
      step: (ms: number, times = 1) => {
        for (let k = 0; k < times; k++) apply((s) => stepGame(s, ms))
        return gameRef.current
      },
      cmd: (c: RaketCmd) => runRef.current(c),
      mode: (m: Tab) => switchMode(m),
      targets: (t: Targets) => apply((s) => setTargets(s, t)),
      gas: (v: number) => apply((s) => setGas(s, v)),
      lev: (v: number) => apply((s) => setLeverage(s, v)),
      restart: () => restart(),
      x: (price: number) => projectionFor(gameRef.current)?.col(price) ?? null,
    }
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      alarmRef.current.stop()
      delete (window as unknown as { __raketSpelTest?: object }).__raketSpelTest
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = gameRef.current
    if (!s.live) return
    const P = projectionFor(s)
    if (!P) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const dTp = Math.abs(P.col(s.live.tp) - x)
    const dSl = s.live.sl == null ? Infinity : Math.abs(P.col(s.live.sl) - x)
    const which = dTp <= dSl ? 'tp' : 'sl'
    if (Math.min(dTp, dSl) > 24) return
    dragRef.current = which
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const which = dragRef.current
    if (!which) return
    const P = projectionFor(gameRef.current)
    if (!P) return
    const rect = e.currentTarget.getBoundingClientRect()
    apply((s) => moveLine(s, which, P.price(e.clientX - rect.left)))
  }
  function onPointerUp() {
    dragRef.current = null
  }

  const tabs: Tab[] = [...RAKET_MODES, 'klassisk']
  const tabBar = (
    <nav className="rs-tabs" aria-label="Raket-lägen">
      {tabs.map((t) => (
        <button key={t} type="button" aria-pressed={tab === t} onClick={() => switchMode(t)}>
          <strong>{tabLabel(t)}</strong>
          <span>{tabShort(t)}</span>
        </button>
      ))}
    </nav>
  )

  if (tab === 'klassisk') {
    return (
      <div className="rs-wrap">
        <header className="rs-head">
          <p className="rs-kicker">Raket · övning på riktiga historiska NVDA-timcandles</p>
          <h1>Välj körläge</h1>
          {tabBar}
        </header>
        <RocketDesk candles={candles} label="" />
      </div>
    )
  }

  const rules = MODE_RULES[g.mode]
  const side = sideOf(g.desk.book)
  const marked = markFromCandles(g.desk.candles, g.desk.progress)
  const candle = candleAt(g.desk)
  const when = candle ? new Date(candle.t * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'
  const panic = g.margin.countdownMs != null
  const secs = panic ? Math.max(0, Math.ceil((g.margin.countdownMs as number) / 1000)) : 0
  const elapsedCandles = Math.max(0, Math.floor(g.desk.progress) - g.startProgress)
  const clock =
    g.deadline != null ? `${Math.max(0, Math.ceil(g.deadline - g.desk.progress))} kvar` : `${elapsedCandles} st`
  const L = g.live
  const rNow =
    L && L.slAtEntry != null && marked.close != null
      ? ((L.side === 'long' ? 1 : -1) * (marked.close - L.entry)) / Math.abs(L.entry - L.slAtEntry)
      : null
  const msgTone = g.message?.kind ?? 'info'

  return (
    <div className={`rs-wrap ${panic ? 'rs-panic' : ''} ${calm ? 'rs-calm' : ''}`} data-phase={g.phase} data-panic={panic ? '1' : '0'}>
      {panic ? <div className="rs-vignette" aria-hidden="true" /> : null}
      <header className="rs-head">
        <p className="rs-kicker">Raket · övning på riktiga historiska NVDA-timcandles · inga riktiga pengar</p>
        <h1>
          {rules.title} <small>{rules.short}</small>
        </h1>
        {tabBar}
        <div className="rs-rules">
          <p>
            <strong>Mål:</strong> {rules.goal}
          </p>
          <ul>
            {rules.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
            <li>TP vinner nivån. SL = kontrollerad stängning. Margin call = larm, nedräkning, sedan tvångsstängning.</li>
          </ul>
        </div>
      </header>

      <section className="rs-hud" aria-label="Instrument">
        <Stat label="NVDA" value={px(marked.close)} />
        <Stat label="Mot föreg." value={formatPct(marked.pct)} tone={marked.pct == null ? undefined : marked.pct >= 0 ? 'up' : 'down'} />
        <Stat label="Position" value={side === 'long' ? 'Long (köpt)' : side === 'short' ? 'Short (sålt)' : 'Platt'} tone={side === 'long' ? 'up' : side === 'short' ? 'down' : undefined} />
        <Stat label="Hävstång" value={`${g.desk.leverage}× / 4×`} tone={g.desk.leverage >= 3 ? 'warn' : undefined} />
        <Stat label="Gas" value={`${Math.round(g.gas * 100)} % · ${gasSpeed(g.gas).toFixed(1)}/s`} />
        <Stat label="TP" value={L ? px(L.tp) : `${g.targets.tpPct.toFixed(1)} %`} tone="tpc" />
        <Stat label="SL" value={L ? (L.sl == null ? 'ingen' : px(L.sl)) : g.targets.slPct == null ? 'ingen' : `${g.targets.slPct.toFixed(1)} %`} tone="slc" />
        <Stat label="R nu" value={rNow == null ? '—' : `${rNow >= 0 ? '+' : ''}${rNow.toFixed(2)} R`} tone={rNow == null ? undefined : rNow >= 0 ? 'up' : 'down'} />
        <Stat label="Klocka (candles)" value={clock} tone={g.deadline != null && g.deadline - g.desk.progress < 6 ? 'warn' : undefined} />
        {rules.budgetR != null ? <Stat label="Riskbudget" value={`${rules.budgetR - g.usedR} R kvar av ${rules.budgetR}`} tone={g.usedR > 0 ? 'warn' : undefined} /> : null}
        <MarginGauge level={g.margin.level} />
      </section>

      <section className="rs-arena">
        <button type="button" className="rs-edge rs-edge-sell" onClick={() => run('sell')} aria-label="SÄLJ">
          <span className="rs-edge-arrow">←</span>
          <span>SÄLJ</span>
          <kbd>← / A</kbd>
        </button>

        <div className={`rs-chart ${panic ? 'rs-shake' : ''}`}>
          <div className="rs-chart-head">
            <span>NVDA · 1h · {when}</span>
            <span>{g.desk.paused && g.phase === 'ride' ? '⏸ Paus' : g.phase === 'ride' ? '▶ Rundan pågår' : g.phase === 'setup' ? 'Ställ in och starta' : 'Rundan slut'}</span>
          </div>
          <canvas
            ref={canvasRef}
            className="rs-canvas"
            aria-label="Raketgrafen: tiden flödar uppåt, pris åt höger. Grön linje TP, gul SL, röd prickad = tvångsstängning. Dra linjerna för att flytta TP/SL."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {g.message ? (
            <p className={`rs-msg rs-msg-${msgTone}`} role={msgTone === 'margin' ? undefined : 'status'}>
              {g.message.text}
            </p>
          ) : null}
          {panic ? (
            <div className="rs-alarm" role="alert" aria-live="assertive">
              <p className="rs-alarm-title">⚠ MARGIN CALL</p>
              <p className="rs-alarm-bell">🔔 LARM</p>
              <p className="rs-alarm-count" aria-label={`${secs} sekunder kvar`}>
                {secs}
              </p>
              <p className="rs-alarm-text">
                Marginal {Math.round((g.margin.level ?? 0) * 100)} % · tvångsstängning vid 75 % eller när nedräkningen når 0.
              </p>
              <p className="rs-alarm-text">
                <kbd>F</kbd> stäng platt · eller tryck motsatt sida ({side === 'long' ? '← SÄLJ' : 'KÖP →'}) · ingen paus nu
              </p>
            </div>
          ) : null}
          {g.phase === 'setup' ? <Setup g={g} apply={apply} /> : null}
          {g.phase === 'won' || g.phase === 'lost' ? <EndCard g={g} onRestart={restart} /> : null}
        </div>

        <div className="rs-gas">
          <label htmlFor="rs-gas-input">
            Gas <strong>{Math.round(g.gas * 100)} %</strong>
          </label>
          <input
            id="rs-gas-input"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(g.gas * 100)}
            onChange={(e) => apply((s) => setGas(s, Number(e.target.value) / 100))}
            aria-valuetext={`Gas ${Math.round(g.gas * 100)} procent, ${gasSpeed(g.gas).toFixed(2)} candles per sekund`}
          />
          <span className="rs-gas-keys">
            <kbd>E</kbd> mer · <kbd>Q</kbd> mindre
          </span>
          <span className="rs-gas-note">Tempo, inte risk</span>
        </div>

        <button type="button" className="rs-edge rs-edge-buy" onClick={() => run('buy')} aria-label="KÖP">
          <span>KÖP</span>
          <span className="rs-edge-arrow">→</span>
          <kbd>→ / D</kbd>
        </button>
      </section>

      <section className="rs-controls">
        <div className="rs-lev" role="group" aria-label="Hävstång">
          <span>Hävstång (risk)</span>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} type="button" aria-pressed={g.desk.leverage === n} onClick={() => apply((s) => setLeverage(s, n))}>
              {n}×
            </button>
          ))}
        </div>
        <div className="rs-chips">
          <button type="button" onClick={() => run('flat')}>F · platt</button>
          <button type="button" onClick={() => run('pause')}>Mellanslag · paus</button>
          <button type="button" onClick={() => run('tp_out')}>T · TP längre</button>
          <button type="button" onClick={() => run('tp_in')}>G · TP närmare</button>
          <button type="button" onClick={() => run('sl_out')}>Y · SL längre</button>
          <button type="button" onClick={() => run('sl_in')}>H · SL närmare</button>
        </div>
        <div className="rs-toggles">
          <label>
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Larmljud
          </label>
          <label>
            <input type="checkbox" checked={calm} onChange={(e) => setCalm(e.target.checked)} /> Mindre rörelse (inget blink/skak, larmet finns kvar)
          </label>
        </div>
        <p className="rs-keys">
          Tangenter: <kbd>→</kbd>/<kbd>D</kbd> KÖP · <kbd>←</kbd>/<kbd>A</kbd> SÄLJ · <kbd>↑</kbd>/<kbd>W</kbd>/<kbd>]</kbd> hävstång upp ·{' '}
          <kbd>↓</kbd>/<kbd>S</kbd>/<kbd>[</kbd> ner · <kbd>1</kbd>–<kbd>4</kbd> direkt (max 4×) · <kbd>F</kbd> platt · <kbd>Mellanslag</kbd> paus ·{' '}
          <kbd>E</kbd>/<kbd>Q</kbd> gas · <kbd>T</kbd>/<kbd>G</kbd> TP · <kbd>Y</kbd>/<kbd>H</kbd> SL · <kbd>R</kbd> ny runda. Dra TP/SL-linjerna med mus
          eller finger.
        </p>
      </section>
    </div>
  )
}
