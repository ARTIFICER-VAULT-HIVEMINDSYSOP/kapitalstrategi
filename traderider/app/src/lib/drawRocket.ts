/**
 * Tre lägen — läge 3 "Raket": orientation + theme layer over the shared chart.
 *
 * Same DeskState, same candles, same Bollinger bands (sampleBand / markFromCandles from deskState.ts).
 * Only the projection is rotated: time runs bottom → top (newest candle at the top of the feed),
 * price maps to X (higher price = further right). The rocket rides the current price at the top.
 */
import type { Band } from './bollinger'
import { markFromCandles, sampleBand, MIN_BAND_GAP_PX, type DeskState } from './deskState'
import { sideOf } from './market'
import type { Side } from './types'

type Pt = { x: number; y: number }

const CYAN = '#3ce6ff'
const CYAN_SOFT = 'rgba(60,230,255,0.16)'
const ORANGE = '#ffab4a'
const SELL_RED = '#ff6b7d'
const WHITE = '#f4fbff'
const MUTED = 'rgba(200,236,240,0.55)'

/** Rotated projection. `row(i)` = screen Y of candle index i, `col(price)` = screen X of a price. */
export function rocketProjection(width: number, height: number, progress: number, focus: Band) {
  const pxPerCandle = Math.max(10, Math.min(18, height / 38))
  const headY = Math.round(height * 0.22)
  const span = focus.upper - focus.lower
  const safeSpan = span > 1e-8 ? span : 1
  const gap = Math.max(MIN_BAND_GAP_PX, Math.min(width - 120, width * 0.5))
  const pxPerPrice = gap / safeSpan
  const center = width / 2
  return {
    pxPerCandle,
    headY,
    row: (i: number) => headY + (progress - i) * pxPerCandle,
    col: (price: number) => center + (price - focus.sma) * pxPerPrice,
  }
}

function visible(state: DeskState, height: number, pxPerCandle: number, headY: number) {
  const ahead = Math.ceil(headY / pxPerCandle) + 1
  const behind = Math.ceil((height - headY) / pxPerCandle) + 1
  return {
    i0: Math.max(0, Math.floor(state.progress) - behind),
    i1: Math.min(state.candles.length - 1, Math.ceil(state.progress) + ahead),
  }
}

function interpClose(state: DeskState): number | null {
  const n = state.candles.length
  if (n === 0) return null
  const i = Math.max(0, Math.min(n - 1, Math.floor(state.progress)))
  const j = Math.min(n - 1, i + 1)
  const t = Math.min(1, Math.max(0, state.progress - i))
  const a = state.candles[i].c
  const b = state.candles[j].c
  return a + (b - a) * t
}

function neonPath(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number, glow: number) {
  if (pts.length < 2) return
  ctx.save()
  ctx.beginPath()
  pts.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = glow
  ctx.stroke()
  ctx.restore()
}

function railTies(ctx: CanvasRenderingContext2D, pts: Pt[], color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.4
  for (let k = 0; k < pts.length; k += 1) {
    const p = pts[k]
    ctx.beginPath()
    ctx.moveTo(p.x - 7, p.y)
    ctx.lineTo(p.x + 7, p.y)
    ctx.stroke()
  }
  ctx.restore()
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: 'left' | 'right' | 'center') {
  ctx.save()
  ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'
  const w = ctx.measureText(text).width + 16
  const h = 20
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2
  ctx.beginPath()
  ctx.roundRect(left, y - h / 2, w, h, 10)
  ctx.fillStyle = 'rgba(6,34,38,0.78)'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(text, left + 8, y + 0.5)
  ctx.restore()
}

/** Own simple rocket. Local origin = rocket centre, nose points to -Y. */
function drawRocketShip(ctx: CanvasRenderingContext2D, side: Side, t: number) {
  const accent = side === 'long' ? CYAN : side === 'short' ? SELL_RED : WHITE
  // flame
  const flick = 0.85 + 0.15 * Math.sin(t / 45)
  const g = ctx.createLinearGradient(0, 18, 0, 18 + 46 * flick)
  g.addColorStop(0, 'rgba(255,240,200,0.95)')
  g.addColorStop(0.35, ORANGE)
  g.addColorStop(1, 'rgba(255,120,40,0)')
  ctx.beginPath()
  ctx.moveTo(-8, 18)
  ctx.quadraticCurveTo(0, 18 + 58 * flick, 8, 18)
  ctx.closePath()
  ctx.fillStyle = g
  ctx.shadowColor = ORANGE
  ctx.shadowBlur = 18
  ctx.fill()
  ctx.shadowBlur = 0
  // fins
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(-11, 4)
  ctx.lineTo(-21, 22)
  ctx.lineTo(-10, 18)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(11, 4)
  ctx.lineTo(21, 22)
  ctx.lineTo(10, 18)
  ctx.closePath()
  ctx.fill()
  // body
  const body = ctx.createLinearGradient(-12, 0, 12, 0)
  body.addColorStop(0, '#b9d6dc')
  body.addColorStop(0.45, '#ffffff')
  body.addColorStop(1, '#9fc3ca')
  ctx.beginPath()
  ctx.moveTo(0, -34)
  ctx.bezierCurveTo(14, -22, 13, 4, 10, 20)
  ctx.lineTo(-10, 20)
  ctx.bezierCurveTo(-13, 4, -14, -22, 0, -34)
  ctx.closePath()
  ctx.fillStyle = body
  ctx.fill()
  ctx.strokeStyle = 'rgba(8,40,46,0.8)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  // nose band
  ctx.beginPath()
  ctx.moveTo(-7.5, -22)
  ctx.quadraticCurveTo(0, -25, 7.5, -22)
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 2.4
  ctx.stroke()
  // window
  ctx.beginPath()
  ctx.arc(0, -8, 5.2, 0, Math.PI * 2)
  ctx.fillStyle = '#0b3940'
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.shadowColor = accent
  ctx.shadowBlur = 8
  ctx.stroke()
  ctx.shadowBlur = 0
  // centre fin
  ctx.fillStyle = accent
  ctx.fillRect(-1.3, 8, 2.6, 13)
}

export function drawRocket(canvas: HTMLCanvasElement | null, state: DeskState): void {
  if (!canvas) return
  const width = state.viewport.width
  const height = state.viewport.height
  if (width < 10 || height < 10) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const bw = Math.round(width * dpr)
  const bh = Math.round(height * dpr)
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const focus = sampleBand(state.bands, state.progress)
  if (!focus) {
    ctx.fillStyle = WHITE
    ctx.font = '14px "IBM Plex Sans", sans-serif'
    ctx.fillText('Väntar på ett 20-perioders band.', 16, 32)
    return
  }
  const P = rocketProjection(width, height, state.progress, focus)
  const { i0, i1 } = visible(state, height, P.pxPerCandle, P.headY)
  const side = sideOf(state.book)
  const now = typeof performance !== 'undefined' ? performance.now() : 0

  // time grid (horizontal lines = time, flowing upward)
  ctx.save()
  ctx.font = '10px "IBM Plex Sans", sans-serif'
  ctx.textBaseline = 'middle'
  for (let i = i0; i <= i1; i++) {
    const c = state.candles[i]
    if (!c) continue
    const d = new Date(c.t * 1000)
    const y = P.row(i)
    const isDay = d.getUTCHours() === 13 || i % 7 === 0
    ctx.strokeStyle = isDay ? 'rgba(120,230,240,0.12)' : 'rgba(120,230,240,0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
    if (i % 7 === 0) {
      ctx.fillStyle = MUTED
      ctx.textAlign = 'left'
      ctx.fillText(d.toISOString().slice(5, 10) + ' ' + d.toISOString().slice(11, 16) + 'Z', 8, y - 7)
    }
  }
  ctx.restore()

  const rail = (which: 'upper' | 'sma' | 'lower'): Pt[] => {
    const pts: Pt[] = []
    for (let i = i0; i <= i1; i++) {
      const b = state.bands[i]
      if (!b) continue
      pts.push({ x: P.col(b[which]), y: P.row(i) })
    }
    return pts
  }
  const up = rail('upper')
  const mid = rail('sma')
  const lo = rail('lower')

  // channel fill
  if (up.length > 1 && lo.length > 1) {
    ctx.save()
    ctx.beginPath()
    up.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    for (let k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k].x, lo[k].y)
    ctx.closePath()
    ctx.fillStyle = CYAN_SOFT
    ctx.globalAlpha = 0.5
    ctx.fill()
    ctx.restore()
  }

  // corridor walls: shade outside the Bollinger corridor (left of lower band, right of upper band)
  if (up.length > 1 && lo.length > 1) {
    ctx.save()
    ctx.fillStyle = 'rgba(2,18,22,0.45)'
    ctx.beginPath()
    ctx.moveTo(0, lo[0].y)
    lo.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.lineTo(0, lo[lo.length - 1].y)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(width, up[0].y)
    up.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.lineTo(width, up[up.length - 1].y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // candles, rotated: wick = low→high along X, body = open→close
  for (let i = i0; i <= i1; i++) {
    const c = state.candles[i]
    if (!c) continue
    const y = P.row(i)
    const future = i > state.progress
    ctx.globalAlpha = future ? 0.18 : 0.55
    ctx.strokeStyle = 'rgba(220,245,250,0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(P.col(c.l), y)
    ctx.lineTo(P.col(c.h), y)
    ctx.stroke()
    const a = P.col(c.o)
    const b = P.col(c.c)
    ctx.fillStyle = c.c >= c.o ? CYAN : SELL_RED
    ctx.fillRect(Math.min(a, b), y - P.pxPerCandle * 0.18, Math.max(1.5, Math.abs(b - a)), Math.max(2, P.pxPerCandle * 0.36))
  }
  ctx.globalAlpha = 1

  // rails (active one brighter, with ties)
  const layers: Array<{ pts: Pt[]; color: string; on: boolean }> = [
    { pts: lo, color: SELL_RED, on: side === 'short' },
    { pts: mid, color: 'rgba(235,250,255,0.75)', on: side === 'flat' },
    { pts: up, color: CYAN, on: side === 'long' },
  ]
  for (const l of layers) {
    neonPath(ctx, l.pts, l.color, l.on ? 3.2 : 1.6, l.on ? 16 : 6)
    if (l.on) railTies(ctx, l.pts, l.color)
  }

  // price feed: closes up to "now", flowing upward into the rocket
  const nowClose = interpClose(state)
  const feed: Pt[] = []
  for (let i = i0; i <= Math.floor(state.progress); i++) {
    const c = state.candles[i]
    if (c) feed.push({ x: P.col(c.c), y: P.row(i) })
  }
  if (nowClose != null) feed.push({ x: P.col(nowClose), y: P.headY })
  neonPath(ctx, feed, WHITE, 2.4, 12)

  // top fade (future region) and bottom fade
  const topFade = ctx.createLinearGradient(0, 0, 0, P.headY * 0.9)
  topFade.addColorStop(0, 'rgba(5,30,34,0.85)')
  topFade.addColorStop(1, 'rgba(5,30,34,0)')
  ctx.fillStyle = topFade
  ctx.fillRect(0, 0, width, P.headY * 0.9)
  const botFade = ctx.createLinearGradient(0, height - 70, 0, height)
  botFade.addColorStop(0, 'rgba(5,30,34,0)')
  botFade.addColorStop(1, 'rgba(5,30,34,0.9)')
  ctx.fillStyle = botFade
  ctx.fillRect(0, height - 70, width, 70)

  // rail labels at the head row
  const labelY = P.headY - 44
  pill(ctx, '◀ Vänstervägg · undre band · SÄLJ', P.col(focus.lower) - 6, labelY, SELL_RED, 'right')
  pill(ctx, 'Mittfil · 20-SMA', P.col(focus.sma), labelY - 26, 'rgba(235,250,255,0.85)', 'center')
  pill(ctx, 'Högervägg · övre band · KÖP ▶', P.col(focus.upper) + 6, labelY, CYAN, 'left')

  // rocket at the current price, top of the feed
  if (nowClose != null) {
    const x = P.col(nowClose)
    const back = state.candles[Math.max(0, Math.floor(state.progress) - 1)]
    const dx = back ? x - P.col(back.c) : 0
    const tilt = Math.max(-0.45, Math.min(0.45, Math.atan2(dx, P.pxPerCandle * 1.6)))
    ctx.save()
    ctx.translate(x, P.headY)
    ctx.rotate(tilt)
    drawRocketShip(ctx, side, now)
    ctx.restore()
    const marked = markFromCandles(state.candles, state.progress)
    const txt = marked.close != null ? `NVDA ${marked.close.toFixed(2)}` : 'NVDA —'
    pill(ctx, txt, x + 28, P.headY + 4, ORANGE, 'left')
  }
}
