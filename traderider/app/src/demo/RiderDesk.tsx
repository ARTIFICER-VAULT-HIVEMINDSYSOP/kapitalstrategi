import { useCallback, useMemo } from 'react'
import { FacePortrait } from '../face/FacePortrait'
import { drawRide } from '../lib/drawRide'
import { markFromCandles, trackSpeed } from '../lib/deskState'
import { formatPct, money, px } from '../lib/format'
import { commandFromKey } from '../lib/keys'
import { LEVERAGE_MAX, STARTING_CASH, markEquity, sideOf, unrealizedPnl } from '../lib/market'
import type { Candle } from '../lib/types'
import { useDeskEngine } from '../lib/useDeskEngine'
import { demoCopy } from './copy'
import { useLang } from './lang'
import { statusLabel } from './statusText'

export function RiderDesk({ candles }: { candles: Candle[] }) {
  const { lang } = useLang()
  const copy = demoCopy(lang)
  const ride = copy.ride
  const labels = copy.rocket
  const draw = useCallback((canvas: HTMLCanvasElement | null, state: Parameters<typeof drawRide>[1]) => {
    drawRide(canvas, state, ride)
  }, [ride])
  const onKey = useCallback((key: string) => commandFromKey(key), [])
  const { snap, canvasRef, run, reset } = useDeskEngine(candles, draw, onKey)
  const closes = useMemo(() => snap.candles.map((c) => c.c), [snap.candles])
  const marked = markFromCandles(snap.candles, snap.progress)
  const side = sideOf(snap.book)
  const equity = marked.close == null ? null : markEquity(snap.book, marked.close)
  const unreal = marked.close == null ? null : unrealizedPnl(snap.book, marked.close)
  const ended = snap.progress >= snap.candles.length - 1
  const tone = marked.pct == null ? '' : marked.pct >= 0 ? 'rd-up' : 'rd-down'

  return (
    <section className="rd-page" data-mode="tag">
      <div className="rd-inner">
        <div className="rd-stats">
          <div className="rd-stat"><span>{labels.close}</span><b>{px(marked.close)}</b></div>
          <div className="rd-stat"><span>{labels.vs}</span><b className={tone}>{formatPct(marked.pct)}</b></div>
          <div className="rd-stat"><span>{labels.position}</span><b>{side === 'long' ? labels.long : side === 'short' ? labels.short : labels.flat}</b></div>
          <div className="rd-stat"><span>{labels.leverage}</span><b>{snap.leverage}× / {LEVERAGE_MAX}×</b></div>
          <div className="rd-stat"><span>{labels.equity}</span><b>{money(equity ?? STARTING_CASH)}</b></div>
          <div className="rd-stat"><span>{labels.unreal}</span><b className={unreal == null ? '' : unreal >= 0 ? 'rd-up' : 'rd-down'}>{money(unreal)}</b></div>
        </div>
        <div className="rd-stage">
          <canvas ref={canvasRef} className="rd-canvas" aria-label={copy.modes.tag.title} />
          <FacePortrait
            theme="rider"
            className="rd-face"
            size={72}
            input={{
              pnl: (equity ?? STARTING_CASH) - STARTING_CASH,
              basis: STARTING_CASH,
              side,
              leverage: snap.leverage,
              maxLeverage: LEVERAGE_MAX,
              closes,
              index: Math.floor(snap.progress),
              price: marked.close ?? closes[0] ?? 0,
              phase: ended ? 'done' : 'ride',
            }}
          />
        </div>
        <div className="rd-actions">
          <button type="button" className="rd-key rd-buy" onClick={() => run('buy')}>{labels.buy}</button>
          <button type="button" className="rd-key rd-sell" onClick={() => run('sell')}>{labels.sell}</button>
          <button type="button" className="rd-key" onClick={() => run('flat')}>{labels.flat}</button>
          <button type="button" className="rd-key" onClick={() => run('lev_down')}>{labels.levDown}</button>
          <button type="button" className="rd-key" onClick={() => run('lev_up')}>{labels.levUp}</button>
          <button type="button" className="rd-key" onClick={() => run('pause')}>{snap.paused ? labels.run : labels.pause}</button>
        </div>
        <p className="rd-status">{statusLabel(lang, snap.status)}</p>
        <p className="rd-status">{trackSpeed(snap.leverage).toFixed(2)} {labels.perSec}</p>
        <button type="button" className="rd-key" onClick={reset}>{labels.restart}</button>
      </div>
    </section>
  )
}
