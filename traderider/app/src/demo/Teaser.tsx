import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FacePortrait } from '../face/FacePortrait'
import type { FaceThemeId } from '../face/faceDraw'
import { squeezeThreshold } from '../lib/academy'
import { drawAcademy, type AcademyOverlay } from '../lib/drawAcademy'
import { drawRide } from '../lib/drawRide'
import { drawRocket } from '../lib/drawRocket'
import { markFromCandles, type DeskState } from '../lib/deskState'
import { LEVERAGE_MAX, STARTING_CASH, markEquity, sideOf } from '../lib/market'
import { rsi } from '../lib/rsi'
import type { Candle } from '../lib/types'
import { useDeskEngine } from '../lib/useDeskEngine'
import { demoCopy, type ModeId } from './copy'
import { useLang } from './lang'

const THEME: Record<ModeId, FaceThemeId> = { tag: 'rider', akademin: 'akademin', raket: 'raket' }

function ignoreKey(): null {
  return null
}

export function ModeTeaser({ candles, mode }: { candles: Candle[]; mode: ModeId }) {
  const { lang } = useLang()
  const labels = demoCopy(lang).ride
  const rsiSeries = useMemo(() => rsi(candles.map((c) => c.c)), [candles])
  const draw = useCallback(
    (canvas: HTMLCanvasElement | null, state: DeskState) => {
      if (mode === 'tag') {
        drawRide(canvas, state, labels)
        return
      }
      if (mode === 'raket') {
        drawRocket(canvas, state)
        return
      }
      const overlay: AcademyOverlay = {
        lesson: 3,
        rsi: rsiSeries,
        squeezeThr: squeezeThreshold(state.bands),
        trade: null,
        preview: null,
      }
      drawAcademy(canvas, state, overlay)
    },
    [labels, mode, rsiSeries],
  )
  const { snap, canvasRef, run, reset } = useDeskEngine(candles, draw, ignoreKey)
  const runRef = useRef(run)
  const resetRef = useRef(reset)
  runRef.current = run
  resetRef.current = reset
  const acted = useRef(false)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) runRef.current('pause')
  }, [])

  useEffect(() => {
    if (reduced.current) return
    if (snap.progress >= candles.length - 1.2) {
      acted.current = false
      resetRef.current()
      return
    }
    if (!acted.current && snap.progress > 1.2) {
      acted.current = true
      runRef.current('lev_up')
      if (mode !== 'akademin') runRef.current('buy')
    }
  }, [candles.length, mode, snap.progress])

  const mark = markFromCandles(snap.candles, snap.progress).close
  const equity = mark == null ? STARTING_CASH : markEquity(snap.book, mark)
  const ended = snap.progress >= snap.candles.length - 1

  return (
    <div className="td-teaser">
      <canvas ref={canvasRef} aria-hidden="true" />
      <FacePortrait
        theme={THEME[mode]}
        className="td-teaser-face"
        size={64}
        input={{
          pnl: equity - STARTING_CASH,
          basis: STARTING_CASH,
          side: sideOf(snap.book),
          leverage: snap.leverage,
          maxLeverage: LEVERAGE_MAX,
          closes: snap.candles.map((c) => c.c),
          index: Math.floor(snap.progress),
          price: mark ?? snap.candles[0]?.c ?? 0,
          phase: ended ? 'done' : 'ride',
        }}
      />
    </div>
  )
}
