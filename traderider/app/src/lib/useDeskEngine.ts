/**
 * Tre lägen — shared engine hook.
 *
 * Runs the SAME desk engine as the dark desk (deskState.ts + market.ts + bollinger.ts):
 * createDesk / stepDesk / commandBuy / commandSell / commandFlatten / setDeskLeverage / togglePause.
 * Only the `draw` function (presentation) differs between modes. No broker relay: practice only.
 */
import { useEffect, useRef, useState } from 'react'
import {
  commandBuy,
  commandFlatten,
  commandSell,
  createDesk,
  setDeskLeverage,
  stepDesk,
  togglePause,
  type DeskState,
} from './deskState'
import type { Command } from './keys'
import type { Candle } from './types'

export type DrawFn = (canvas: HTMLCanvasElement | null, state: DeskState) => void

function measure(canvas: HTMLCanvasElement | null, state: DeskState): DeskState {
  if (!canvas) return state
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width < 10 || height < 10) return state
  if (width === state.viewport.width && height === state.viewport.height) return state
  return { ...state, viewport: { width, height } }
}

export function useDeskEngine(
  candles: Candle[],
  draw: DrawFn,
  keyToCommand: (key: string) => Command | null,
) {
  const [snap, setSnap] = useState(() => createDesk(candles))
  const stateRef = useRef(snap)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  function apply(fn: (state: DeskState) => DeskState) {
    stateRef.current = fn(stateRef.current)
    setSnap(stateRef.current)
    drawRef.current(canvasRef.current, stateRef.current)
  }

  function run(cmd: Command) {
    if (cmd === 'buy') apply(commandBuy)
    else if (cmd === 'sell') apply(commandSell)
    else if (cmd === 'flat') apply(commandFlatten)
    else if (cmd === 'lev_down') apply((s) => setDeskLeverage(s, s.leverage - 1))
    else if (cmd === 'lev_up') apply((s) => setDeskLeverage(s, s.leverage + 1))
    else apply(togglePause)
  }
  const runRef = useRef(run)
  runRef.current = run

  function reset() {
    const fresh = createDesk(candles)
    fresh.viewport = stateRef.current.viewport
    stateRef.current = fresh
    setSnap(fresh)
    drawRef.current(canvasRef.current, fresh)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }
      const cmd = keyToCommand(event.key)
      if (!cmd) return
      event.preventDefault()
      runRef.current(cmd)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyToCommand])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    stateRef.current = measure(canvas, stateRef.current)
    drawRef.current(canvas, stateRef.current)
    const observer = new ResizeObserver(() => {
      stateRef.current = measure(canvas, stateRef.current)
      drawRef.current(canvas, stateRef.current)
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
      drawRef.current(canvas, stateRef.current)
      acc += dt
      if (acc >= 160) {
        acc = 0
        setSnap(stateRef.current)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    // QA hook (screenshots / tests): same shape as the dark desk's __controlsTest subset.
    ;(window as unknown as { __rocketTest?: object }).__rocketTest = {
      getProgress: () => stateRef.current.progress,
      buy: () => runRef.current('buy'),
      sell: () => runRef.current('sell'),
      step: (dtMs: number) => apply((s) => stepDesk(s, dtMs)),
    }
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      delete (window as unknown as { __rocketTest?: object }).__rocketTest
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { snap, canvasRef, run, reset }
}
