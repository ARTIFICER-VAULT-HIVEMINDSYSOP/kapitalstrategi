/**
 * Läge 3 — Raket. Same engine (useDeskEngine → deskState/market/bollinger), same NVDA candles,
 * rotated presentation (drawRocket) + teal/neon theme (rocket.css). Practice only, no broker.
 */
import { useMemo } from 'react'
import { drawRocket } from '../lib/drawRocket'
import { markFromCandles, sampleBand, trackSpeed } from '../lib/deskState'
import { formatPct, money, px } from '../lib/format'
import { markEquity, sideOf, unrealizedPnl, LEVERAGE_MAX, STARTING_CASH } from '../lib/market'
import { commandFromRocketKey } from '../lib/rocketKeys'
import { rsi, rsiZone, sampleRsi, RSI_OVERBOUGHT, RSI_OVERSOLD, RSI_PERIOD } from '../lib/rsi'
import { useDeskEngine } from '../lib/useDeskEngine'
import type { Candle } from '../lib/types'
import { FacePortrait } from '../face/FacePortrait'
import { demoCopy, type DemoCopy } from '../demo/copy'
import { useLang } from '../demo/lang'
import { statusLabel } from '../demo/statusText'
import './rocket.css'

function navHint(pctB: number | null, r: number | null, ui: DemoCopy['rocket']): string {
  if (pctB == null || r == null) return ui.hintWait
  const nearUpper = pctB >= 0.85
  const nearLower = pctB <= 0.15
  if (nearUpper && r >= RSI_OVERBOUGHT) return ui.hintUpperHot
  if (nearLower && r <= RSI_OVERSOLD) return ui.hintLowerHot
  if (nearUpper) return ui.hintUpper
  if (nearLower) return ui.hintLower
  if (pctB > 0.5) return ui.hintAbove
  return ui.hintBelow
}

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <span className="rk-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        {dir === 'right' ? (
          <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M19 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rk-glass rk-stat">
      <div className="rk-stat-label">{label}</div>
      <div className={`rk-stat-value ${tone === 'up' ? 'rk-up' : tone === 'down' ? 'rk-down' : ''}`}>{value}</div>
    </div>
  )
}

function RsiGauge({ value, labels }: { value: number | null; labels: DemoCopy['rocket'] }) {
  const zone = rsiZone(value)
  const pct = value == null ? 50 : Math.max(0, Math.min(100, value))
  return (
    <div className="rk-glass rk-rsi" aria-label={`RSI ${RSI_PERIOD}: ${value == null ? '—' : value.toFixed(1)}`}>
      <div className="rk-rsi-title">RSI {RSI_PERIOD}</div>
      <div className="rk-rsi-track">
        <div className="rk-rsi-zone rk-rsi-ob" style={{ height: `${100 - RSI_OVERBOUGHT}%` }} />
        <div className="rk-rsi-zone rk-rsi-os" style={{ height: `${RSI_OVERSOLD}%` }} />
        <div className="rk-rsi-line" style={{ bottom: `${RSI_OVERBOUGHT}%` }}><span>70</span></div>
        <div className="rk-rsi-line rk-rsi-mid" style={{ bottom: '50%' }}><span>50</span></div>
        <div className="rk-rsi-line" style={{ bottom: `${RSI_OVERSOLD}%` }}><span>30</span></div>
        <div className={`rk-rsi-knob rk-z-${zone}`} style={{ bottom: `${pct}%` }} />
      </div>
      <div className={`rk-rsi-value rk-z-${zone}`}>{value == null ? '—' : value.toFixed(1)}</div>
      <div className="rk-rsi-zone-label">
        {zone === 'overbought' ? labels.overbought : zone === 'oversold' ? labels.oversold : zone === 'neutral' ? labels.neutral : labels.waiting}
      </div>
    </div>
  )
}

export function RocketDesk({ candles, label }: { candles: Candle[]; label: string }) {
  const { lang } = useLang()
  const ui = demoCopy(lang).rocket
  const { snap, canvasRef, run, reset } = useDeskEngine(candles, drawRocket, commandFromRocketKey)
  const rsiSeries = useMemo(() => rsi(candles.map((c) => c.c)), [candles])
  const closes = useMemo(() => snap.candles.map((c) => c.c), [snap.candles])
  const marked = markFromCandles(snap.candles, snap.progress)
  const band = sampleBand(snap.bands, snap.progress)
  const r = sampleRsi(rsiSeries, snap.progress)
  const pctB = band && marked.close != null && band.upper > band.lower ? (marked.close - band.lower) / (band.upper - band.lower) : null
  const side = sideOf(snap.book)
  const mark = marked.close
  const equity = mark == null ? null : markEquity(snap.book, mark)
  const unreal = mark == null ? null : unrealizedPnl(snap.book, mark)
  const ended = snap.progress >= snap.candles.length - 1
  const candle = snap.candles[Math.min(snap.candles.length - 1, Math.floor(snap.progress))]
  const when = candle ? new Date(candle.t * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'

  return (
    <div className="rk-page" data-mode="raket">
      <div className="rk-backdrop" aria-hidden="true">
        <div className="rk-glow" />
        <svg className="rk-skyline" viewBox="0 0 1440 360" preserveAspectRatio="none">
          <g fill="#0a3a40" stroke="#1fd3e6" strokeOpacity="0.35">
            <rect x="40" y="120" width="70" height="240" /><rect x="130" y="60" width="54" height="300" />
            <rect x="200" y="160" width="90" height="200" /><rect x="310" y="30" width="46" height="330" />
            <rect x="370" y="140" width="80" height="220" /><rect x="980" y="90" width="60" height="270" />
            <rect x="1060" y="10" width="44" height="350" /><rect x="1120" y="130" width="96" height="230" />
            <rect x="1230" y="70" width="58" height="290" /><rect x="1300" y="170" width="110" height="190" />
          </g>
          <g fill="#5ff3ff" fillOpacity="0.35">
            {Array.from({ length: 70 }, (_, k) => (
              <rect key={k} x={[52, 142, 214, 318, 384, 992, 1070, 1134, 1242, 1316][k % 10] + ((k * 7) % 30)} y={60 + ((k * 37) % 280)} width="4" height="6" />
            ))}
          </g>
        </svg>
        <div className="rk-floor" />
      </div>

      <div className="rk-inner">
        <header className="rk-hero">
          <div>
            <p className="rk-kicker">{ui.kicker}</p>
            <h1 className="rk-title">{ui.title}</h1>
            <p className="rk-sub">{ui.sub}</p>
          </div>
          <div className="rk-stats">
            <Stat label={ui.close} value={px(mark)} />
            <Stat label={ui.vs} value={formatPct(marked.pct)} tone={marked.pct == null ? undefined : marked.pct >= 0 ? 'up' : 'down'} />
            <Stat label={ui.position} value={side === 'long' ? ui.long : side === 'short' ? ui.short : ui.flat} />
            <Stat label={ui.leverage} value={`${snap.leverage}× / 4×`} />
            <Stat label={ui.equity} value={money(equity)} />
            <Stat label={ui.unreal} value={money(unreal)} tone={unreal == null ? undefined : unreal >= 0 ? 'up' : 'down'} />
          </div>
        </header>

        <section className="rk-arena">
          <button type="button" className="rk-edge rk-edge-left rk-pill" onClick={() => run('sell')} aria-label={ui.sell}>
            <Arrow dir="left" />
            <span className="rk-pill-text">{ui.sell}</span>
            <span className="rk-key">← / A</span>
          </button>

          <div className="rk-glass rk-chart">
            <div className="rk-chart-head">
              <span>NVDA · 1h · {label.startsWith('Fallback') || label === '' ? ui.series : label}</span>
              <span>{when}</span>
            </div>
            <canvas ref={canvasRef} className="rk-canvas" aria-label="NVDA-grafen roterad: tiden flödar uppåt, pris åt höger. Raketen följer aktuell kurs högst upp i flödet." />
            <FacePortrait
              theme="raket"
              className="rk-face"
              input={{
                pnl: equity == null ? 0 : equity - STARTING_CASH,
                basis: STARTING_CASH,
                side,
                leverage: snap.leverage,
                maxLeverage: LEVERAGE_MAX,
                closes,
                index: Math.floor(snap.progress),
                price: mark ?? closes[0] ?? 0,
                phase: ended ? 'done' : 'ride',
              }}
            />
            {ended ? (
              <div className="rk-glass rk-end">
                <h3>{ui.endTitle}</h3>
                <p>{ui.endBody(money(equity), money(STARTING_CASH))}</p>
                <button type="button" className="rk-pill rk-pill-small" onClick={reset}>
                  <span className="rk-pill-text">{ui.restartPractice}</span>
                  <Arrow dir="right" />
                </button>
              </div>
            ) : null}
          </div>

          <RsiGauge value={r} labels={ui} />

          <button type="button" className="rk-edge rk-edge-right rk-pill" onClick={() => run('buy')} aria-label={ui.buy}>
            <span className="rk-pill-text">{ui.buy}</span>
            <Arrow dir="right" />
            <span className="rk-key">→ / D</span>
          </button>
        </section>

        <section className="rk-lower">
          <div className="rk-glass rk-card">
            <h2>{ui.next}</h2>
            <p className="rk-nav">{navHint(pctB, r, ui)}</p>
            <p className="rk-meta">
              %B {pctB == null ? '—' : pctB.toFixed(2)} · Övre {px(band?.upper ?? null)} · 20-SMA {px(band?.sma ?? null)} · Undre{' '}
              {px(band?.lower ?? null)} · RSI {r == null ? '—' : r.toFixed(1)}
            </p>
          </div>
          <div className="rk-glass rk-card">
            <h2>{ui.status}</h2>
            <p className="rk-nav">{statusLabel(lang, snap.status)}</p>
            <div className="rk-controls">
              <button type="button" className="rk-chip" onClick={() => run('flat')}>{ui.flatKey}</button>
              <button type="button" className="rk-chip" onClick={() => run('lev_down')}>{ui.levDown}</button>
              <button type="button" className="rk-chip" onClick={() => run('lev_up')}>{ui.levUp}</button>
              <button type="button" className="rk-chip" onClick={() => run('pause')}>{snap.paused ? ui.run : ui.pause}</button>
              <button type="button" className="rk-chip" onClick={reset}>{ui.restart}</button>
            </div>
            <p className="rk-meta">{trackSpeed(snap.leverage).toFixed(2)} {ui.perSec} · {snap.paused ? ui.paused : ui.riding}</p>
          </div>
          <div className="rk-glass rk-card">
            <h2>{ui.aboutTitle}</h2>
            <p className="rk-meta">{ui.about}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
