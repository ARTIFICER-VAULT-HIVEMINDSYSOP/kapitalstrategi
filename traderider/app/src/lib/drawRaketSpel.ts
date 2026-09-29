/**
 * Raket-lägen: ritar klassiska raketgrafen (drawRocket) och lägger ett overlay ovanpå med
 * TP (grön), SL (amber), ingång, tvångsstängningsnivå (röd prickad), spökraket och markering för stort timdrag.
 * Linjerna är lodräta eftersom priset går i sidled i Raket-vyn.
 */
import { drawRocket, rocketProjection } from './drawRocket'
import { sampleBand } from './deskState'
import { ghostAt, liquidationPrice, type Game } from './rocketGame'

const GREEN = '#4dff9a'
const AMBER = '#ffc247'
const RED = '#ff4d5e'
const WHITE = '#f4fbff'
const GHOST = 'rgba(190,170,255,0.9)'

export function projectionFor(g: Game) {
  const d = g.desk
  const focus = sampleBand(d.bands, d.progress)
  if (!focus) return null
  const P = rocketProjection(d.viewport.width, d.viewport.height, d.progress, focus)
  const x0 = P.col(focus.sma)
  const perPrice = P.col(focus.sma + 1) - x0
  return { ...P, price: (x: number) => focus.sma + (x - x0) / (perPrice || 1) }
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: 'left' | 'right') {
  ctx.save()
  ctx.font = '700 11px "IBM Plex Sans", system-ui, sans-serif'
  const w = ctx.measureText(text).width + 14
  const left = align === 'left' ? x : x - w
  ctx.fillStyle = 'rgba(4,20,24,0.88)'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.roundRect(left, y - 10, w, 20, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, left + 7, y + 0.5)
  ctx.restore()
}

function vline(ctx: CanvasRenderingContext2D, g: Game, price: number, color: string, label: string, dash: number[], width: number, labelY: number) {
  const P = projectionFor(g)
  if (!P) return
  const W = g.desk.viewport.width
  const H = g.desk.viewport.height
  const x = P.col(price)
  if (x < 6 || x > W - 6) {
    // utanför bild: pil vid kanten
    const right = x > W - 6
    const ex = right ? W - 6 : 6
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    if (right) {
      ctx.moveTo(ex, labelY)
      ctx.lineTo(ex - 12, labelY - 8)
      ctx.lineTo(ex - 12, labelY + 8)
    } else {
      ctx.moveTo(ex, labelY)
      ctx.lineTo(ex + 12, labelY - 8)
      ctx.lineTo(ex + 12, labelY + 8)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    tag(ctx, `${label} ${price.toFixed(2)} ${right ? '→' : '←'}`, right ? ex - 16 : ex + 16, labelY, color, right ? 'right' : 'left')
    return
  }
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dash)
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, H)
  ctx.stroke()
  ctx.restore()
  const right = x < W - 150
  tag(ctx, `${label} ${price.toFixed(2)}`, right ? x + 6 : x - 6, labelY, color, right ? 'left' : 'right')
}

export function drawRaketSpel(canvas: HTMLCanvasElement | null, g: Game): void {
  // Ingen framtidstitt: klassiska Raket ritar kommande candles svagt ovanför raketen. I lägena med egen TP
  // (och särskilt i «Stor rörelse») skulle det avslöja riktningen, så bara nuvarande och nästa candle skickas med.
  const d = g.desk
  const cut = Math.min(d.candles.length, Math.floor(d.progress) + 2)
  drawRocket(canvas, { ...d, candles: d.candles.slice(0, cut), bands: d.bands.slice(0, cut) })
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const P = projectionFor(g)
  if (!ctx || !P) return
  const H = g.desk.viewport.height
  const W = g.desk.viewport.width
  const base = Math.max(P.headY + 70, Math.round(H * 0.56))

  // stort timdrag: markera raden, dölj riktningen tills den kommit
  if (g.shock) {
    const y = P.row(g.shock.index)
    if (y > -10 && y < H + 10) {
      ctx.save()
      ctx.strokeStyle = g.shock.revealed ? (g.shock.pct >= 0 ? GREEN : RED) : AMBER
      ctx.setLineDash([10, 6])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
      ctx.restore()
      tag(ctx, g.shock.revealed ? `Timdrag ${g.shock.pct >= 0 ? '+' : ''}${g.shock.pct.toFixed(2)} % (riktig historik)` : '⚡ Stort timdrag här — riktning dold', 8, y - 14, g.shock.revealed ? WHITE : AMBER, 'left')
    }
  }

  if (g.live) {
    const L = g.live
    vline(ctx, g, L.entry, 'rgba(244,251,255,0.75)', 'Ingång', [3, 5], 1.4, base + 44)
    const liq = liquidationPrice(g)
    if (liq != null && Number.isFinite(liq) && liq > 0) vline(ctx, g, liq, RED, 'Tvångsstängning', [2, 4], 1.6, base + 66)
    if (L.sl != null) vline(ctx, g, L.sl, AMBER, 'SL', [8, 5], 2.4, base + 22)
    vline(ctx, g, L.tp, GREEN, 'TP', [], 3, base)
  } else if (g.phase === 'setup') {
    const m = g.desk.candles[Math.floor(g.desk.progress)]?.c
    if (m) {
      const tpUp = m * (1 + g.targets.tpPct / 100)
      const tpDn = m * (1 - g.targets.tpPct / 100)
      vline(ctx, g, tpUp, 'rgba(77,255,154,0.55)', 'TP vid KÖP', [6, 6], 1.5, base)
      vline(ctx, g, tpDn, 'rgba(77,255,154,0.55)', 'TP vid SÄLJ', [6, 6], 1.5, base + 22)
    }
  }

  // spökraket: ditt förra varv vid samma förflutna tid
  const gs = ghostAt(g.ghost, g.elapsedMs)
  if (gs && g.phase !== 'setup') {
    const i = Math.max(0, Math.min(g.desk.candles.length - 1, Math.floor(gs.p)))
    const c = g.desk.candles[i]
    const y = P.row(gs.p)
    if (c && y > -20 && y < H + 20) {
      const x = P.col(c.c)
      ctx.save()
      ctx.globalAlpha = 0.75
      ctx.fillStyle = GHOST
      ctx.shadowColor = GHOST
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.moveTo(x, y - 20)
      ctx.quadraticCurveTo(x + 10, y - 4, x + 7, y + 12)
      ctx.lineTo(x - 7, y + 12)
      ctx.quadraticCurveTo(x - 10, y - 4, x, y - 20)
      ctx.fill()
      ctx.restore()
      tag(ctx, `Spöke${gs.p > g.desk.progress ? ' (före dig)' : ''}`, x + 12, y, GHOST, 'left')
    }
  }
}
