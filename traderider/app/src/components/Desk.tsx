import { useEffect, useRef, useState } from 'react'
import { Blotter } from './Blotter'
import { drawRide } from '../lib/drawRide'
import '../lib/controlsApi'
import {
  commandBuy,
  commandFlatten,
  commandSell,
  createDesk,
  markFromCandles,
  setDeskLeverage,
  stepDesk,
  togglePause,
  trackSpeed,
  trainScreenY,
  type DeskState,
} from '../lib/deskState'
import { formatPct, px as formatPx } from '../lib/format'
import { commandFromKey, type Command } from '../lib/keys'
import { sideOf } from '../lib/market'
import type { Candle, NvdaSource } from '../lib/types'

type DeskProps = {
  candles: Candle[]
  source: NvdaSource
  label: string
  autoRun?: boolean
}

function measure(canvas: HTMLCanvasElement | null, state: DeskState): DeskState {
  if (!canvas) return state
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width < 10 || height < 10) return state
  if (width === state.viewport.width && height === state.viewport.height) return state
  return { ...state, viewport: { width, height } }
}

export function Desk({ candles, source, label, autoRun = true }: DeskProps) {
  const [snap, setSnap] = useState(() => createDesk(candles))
  const stateRef = useRef(snap)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const applyRef = useRef<(fn: (state: DeskState) => DeskState) => void>(() => {})
  const runRef = useRef<(cmd: Command) => void>(() => {})
  const mounted = useRef(true)

  function apply(fn: (state: DeskState) => DeskState) {
    stateRef.current = fn(stateRef.current)
    setSnap(stateRef.current)
    drawRide(canvasRef.current, stateRef.current)
  }
  applyRef.current = apply

  function run(cmd: Command) {
    if (cmd === 'buy') apply(commandBuy)
    else if (cmd === 'sell') apply(commandSell)
    else if (cmd === 'flat') apply(commandFlatten)
    else if (cmd === 'lev_down') apply((state) => setDeskLeverage(state, state.leverage - 1))
    else if (cmd === 'lev_up') apply((state) => setDeskLeverage(state, state.leverage + 1))
    else apply(togglePause)
    // Bara lokal övning: ingen order lämnar webbläsaren (ingen mäklare, inga nycklar).
  }
  runRef.current = run

  function onReset() {
    const fresh = createDesk(candles)
    fresh.viewport = stateRef.current.viewport
    fresh.status = 'Local book reset. Flat on the 20-SMA.'
    stateRef.current = fresh
    setSnap(fresh)
    drawRide(canvasRef.current, fresh)
  }

  useEffect(() => {
    mounted.current = true
    window.__controlsTest = {
      getTrainY: () => trainScreenY(stateRef.current),
      getSpeed: () => trackSpeed(stateRef.current.leverage),
      getLeverage: () => stateRef.current.leverage,
      getProgress: () => stateRef.current.progress,
      getSide: () => sideOf(stateRef.current.book),
      buy: () => applyRef.current(commandBuy),
      sell: () => applyRef.current(commandSell),
      flatten: () => applyRef.current(commandFlatten),
      setLeverage: (n) => applyRef.current((state) => setDeskLeverage(state, n)),
      step: (dtMs) => applyRef.current((state) => stepDesk(state, dtMs)),
      pause: () => applyRef.current(togglePause),
    }
    return () => {
      mounted.current = false
      delete window.__controlsTest
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }
      const cmd = commandFromKey(event.key)
      if (!cmd) return
      event.preventDefault()
      runRef.current(cmd)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    stateRef.current = measure(canvas, stateRef.current)
    drawRide(canvas, stateRef.current)
    if (!autoRun || !canvas) return

    const observer = new ResizeObserver(() => {
      stateRef.current = measure(canvas, stateRef.current)
      drawRide(canvas, stateRef.current)
    })
    observer.observe(canvas)

    let frame = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      stateRef.current = measure(canvas, stateRef.current)
      stateRef.current = stepDesk(stateRef.current, dt)
      drawRide(canvas, stateRef.current)
      acc += dt
      if (acc >= 160) {
        acc = 0
        setSnap(stateRef.current)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [autoRun])

  const speed = trackSpeed(snap.leverage)
  const marked = markFromCandles(snap.candles, snap.progress)
  const pctTone =
    marked.pct == null ? 'text-ink' : marked.pct > 0 ? 'text-nvda' : marked.pct < 0 ? 'text-brick' : 'text-ink'

  return (
    <div data-desk="traderider" className="min-h-screen overflow-x-clip bg-paper text-ink">
      <header className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-3 border-b border-brass px-3 py-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/60">Trade Rider</p>
          <h1 className="font-display text-4xl font-medium leading-none">Traderider</h1>
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60">Close</p>
          <p className="font-display text-3xl tabular-nums leading-none">{formatPx(marked.close)}</p>
          <p className={`mt-1 text-sm tabular-nums ${pctTone}`}>{formatPct(marked.pct)} vs previous close</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          {source === 'fallback' ? (
            <p className="mb-2 border border-brick/40 px-3 py-2 text-sm text-brick" role="status">
              {label}. Medföljande kursserie, inte en livehämtning.
            </p>
          ) : (
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink/55">{label} candles · 1h</p>
          )}
          <canvas
            ref={canvasRef}
            className="ride-canvas"
            aria-label="Chart. The train sits on railroad tracks along the active Bollinger rail."
          />
          <p className="mt-2 text-sm leading-snug">{snap.status}</p>
          <p className="mt-1 text-xs tabular-nums text-ink/60">
            Mark {formatPx(marked.close)} · {formatPct(marked.pct)} · {snap.leverage}× · {speed.toFixed(2)} candles/s ·{' '}
            {snap.paused ? 'paused' : 'running'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <DeskButton label="Buy" hint="W" tone="nvda" onClick={() => run('buy')} />
            <DeskButton label="Sell" hint="S" tone="brick" onClick={() => run('sell')} />
            <DeskButton label="Flat" hint="F" onClick={() => run('flat')} />
            <DeskButton label="Lev −" hint="[" onClick={() => run('lev_down')} />
            <DeskButton label="Lev +" hint="]" onClick={() => run('lev_up')} />
            <DeskButton
              label={snap.paused ? 'Run' : 'Pause'}
              hint="Space"
              pressed={snap.paused}
              onClick={() => run('pause')}
            />
          </div>
        </section>
        <aside className="flex min-w-0 flex-col gap-3">
          <Blotter state={snap} onReset={onReset} />
          <section className="armor-panel px-3 py-3">
            <h2 className="font-display text-2xl leading-none">Practice book</h2>
            <p className="mt-2 text-sm leading-snug">
              Local practice only. No broker, no keys, no orders leave this browser.
            </p>
          </section>
        </aside>
      </main>
    </div>
  )
}

function DeskButton({
  label,
  hint,
  onClick,
  tone,
  pressed,
}: {
  label: string
  hint: string
  onClick: () => void
  tone?: 'nvda' | 'brick'
  pressed?: boolean
}) {
  const color = tone === 'nvda' ? 'text-nvda' : tone === 'brick' ? 'text-brick' : 'text-ink'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="desk-key min-h-11 min-w-0 px-2 py-2 text-sm font-medium"
    >
      <span className={color}>{label}</span>
      <span className="ml-1 hidden text-[10px] uppercase tracking-wide text-ink/45 sm:inline">{hint}</span>
    </button>
  )
}
