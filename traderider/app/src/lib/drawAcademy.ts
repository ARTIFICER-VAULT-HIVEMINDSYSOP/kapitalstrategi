/**
 * Traderider Academy — chart presentation over the shared engine state.
 * Standard orientation (time → right), history only (no look-ahead), with an RSI panel and a
 * per-lesson highlight of the element being taught.
 */
import type { Band } from './bollinger'
import { bandwidthPct, type LessonId, type PracticeTrade } from './academy'
import { sampleBand, type DeskState } from './deskState'
import { RSI_OVERBOUGHT, RSI_OVERSOLD } from './rsi'

export type AcademyOverlay = {
  lesson: LessonId
  rsi: (number | null)[]
  squeezeThr: number
  trade: PracticeTrade | null
  preview: { entry: number; stop: number | null; target: number | null } | null
}

const CYAN = '#3ce6ff'
const RED = '#ff6b7d'
const ORANGE = '#ffab4a'
const WHITE = '#f4fbff'
const VIOLET = 'rgba(176,140,255,0.22)'

function glow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: 'left' | 'right' = 'right') {
  ctx.save()
  ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'
  const w = ctx.measureText(text).width + 14
  const left = align === 'right' ? x - w : x
  ctx.beginPath()
  ctx.roundRect(left, y - 10, w, 20, 10)
  ctx.fillStyle = 'rgba(6,34,38,0.88)'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, left + 7, y + 0.5)
  ctx.restore()
}

function spotlight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  ctx.save()
  ctx.setLineDash([6, 5])
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 2
  glow(ctx, ORANGE, 12)
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 12)
  ctx.stroke()
  ctx.restore()
  tag(ctx, label, x + 10, y + 2, ORANGE, 'left')
}

export function drawAcademy(canvas: HTMLCanvasElement | null, state: DeskState, o: AcademyOverlay): void {
  if (!canvas) return
  const W = state.viewport.width
  const H = state.viewport.height
  if (W < 10 || H < 10) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  const rsiH = Math.round(H * 0.24)
  const chartH = H - rsiH - 12
  const padR = 78
  const nowX = W - padR - 20
  const shown = Math.min(80, Math.max(28, state.progress + 1))
  const pxc = Math.max(7, Math.min(24, (nowX - 12) / shown))
  const cur = Math.floor(state.progress)
  const i0 = Math.max(0, Math.floor(state.progress - nowX / pxc))
  const xOf = (i: number) => nowX - (state.progress - i) * pxc

  // price range from visible candles + bands + trade lines
  let lo = Infinity
  let hi = -Infinity
  for (let i = i0; i <= cur; i++) {
    const c = state.candles[i]
    const b = state.bands[i]
    if (c) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h) }
    if (b) { lo = Math.min(lo, b.lower); hi = Math.max(hi, b.upper) }
  }
  const lines = [o.trade?.stop, o.trade?.target, o.preview?.stop, o.preview?.target].filter((v): v is number => v != null)
  for (const v of lines) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  if (!Number.isFinite(lo)) return
  const pad = (hi - lo) * 0.08 || 1
  lo -= pad
  hi += pad
  const yOf = (p: number) => 10 + (1 - (p - lo) / (hi - lo)) * (chartH - 20)

  // grid
  ctx.strokeStyle = 'rgba(120,230,240,0.07)'
  ctx.lineWidth = 1
  for (let k = 0; k <= 5; k++) {
    const y = 10 + (k / 5) * (chartH - 20)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - padR, y); ctx.stroke()
    ctx.fillStyle = 'rgba(200,236,240,0.55)'
    ctx.font = '10px "IBM Plex Sans", sans-serif'
    ctx.fillText((hi - (k / 5) * (hi - lo)).toFixed(2), W - padR + 8, y + 3)
  }

  // squeeze zones (lesson 3)
  if (o.lesson === 3) {
    for (let i = i0; i <= cur; i++) {
      const b = state.bands[i]
      if (b && bandwidthPct(b) <= o.squeezeThr) {
        ctx.fillStyle = VIOLET
        ctx.fillRect(xOf(i) - pxc / 2, 0, pxc, chartH)
      }
    }
  }

  // band fill + lines
  const pts = (k: keyof Band) => {
    const out: Array<[number, number]> = []
    for (let i = i0; i <= cur; i++) {
      const b = state.bands[i]
      if (b) out.push([xOf(i), yOf(b[k])])
    }
    // extend to the interpolated "now"
    const nb = sampleBand(state.bands, state.progress)
    if (nb) out.push([nowX, yOf(nb[k])])
    return out
  }
  const up = pts('upper')
  const mid = pts('sma')
  const low = pts('lower')
  const emph = o.lesson === 3 || o.lesson === 4
  if (up.length > 1) {
    ctx.beginPath()
    up.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    for (let k = low.length - 1; k >= 0; k--) ctx.lineTo(low[k][0], low[k][1])
    ctx.closePath()
    ctx.fillStyle = emph ? 'rgba(60,230,255,0.10)' : 'rgba(60,230,255,0.05)'
    ctx.fill()
  }
  const stroke = (p: Array<[number, number]>, color: string, w: number, dash: number[] = []) => {
    if (p.length < 2) return
    ctx.save()
    ctx.setLineDash(dash)
    ctx.beginPath()
    p.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.strokeStyle = color
    ctx.lineWidth = w
    if (emph) glow(ctx, color, 10)
    ctx.stroke()
    ctx.restore()
  }
  stroke(up, CYAN, emph ? 2.6 : 1.4)
  stroke(low, RED, emph ? 2.6 : 1.4)
  stroke(mid, 'rgba(235,250,255,0.7)', emph ? 1.8 : 1.1, [5, 5])

  // candles
  for (let i = i0; i <= cur; i++) {
    const c = state.candles[i]
    if (!c) continue
    const x = xOf(i)
    ctx.strokeStyle = 'rgba(220,245,250,0.55)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, yOf(c.h)); ctx.lineTo(x, yOf(c.l)); ctx.stroke()
    const a = yOf(c.o)
    const b = yOf(c.c)
    ctx.fillStyle = c.c >= c.o ? 'rgba(60,230,255,0.75)' : 'rgba(255,107,125,0.75)'
    ctx.fillRect(x - pxc * 0.3, Math.min(a, b), pxc * 0.6, Math.max(1.5, Math.abs(b - a)))
  }

  const nowC = state.candles[cur]
  const nb = sampleBand(state.bands, state.progress)
  if (nowC) {
    const y = yOf(nowC.c)
    ctx.save()
    ctx.beginPath(); ctx.arc(nowX, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = WHITE; glow(ctx, WHITE, 12); ctx.fill()
    ctx.restore()
    tag(ctx, nowC.c.toFixed(2), W - 4, y, WHITE)
  }
  if (nb && emph) {
    tag(ctx, 'Övre räls', nowX - 10, yOf(nb.upper) - 14, CYAN)
    tag(ctx, 'Mittfil 20-SMA', nowX - 10, yOf(nb.sma) - 14, WHITE)
    tag(ctx, 'Undre räls', nowX - 10, yOf(nb.lower) + 14, RED)
  }

  // trade / preview lines (lessons 1–2)
  const hline = (p: number, color: string, label: string, from = 0) => {
    const y = yOf(p)
    ctx.save()
    ctx.setLineDash([8, 5])
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    glow(ctx, color, 8)
    ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(W - padR, y); ctx.stroke()
    ctx.restore()
    tag(ctx, label, W - padR - 6, y - 12, color)
  }
  const t = o.trade
  const pv = o.preview
  if (t) {
    const from = Math.max(0, xOf(t.openedAt))
    if (!t.closed) {
      ctx.fillStyle = 'rgba(255,107,125,0.08)'
      ctx.fillRect(from, Math.min(yOf(t.entry), yOf(t.stop)), W - padR - from, Math.abs(yOf(t.entry) - yOf(t.stop)))
      ctx.fillStyle = 'rgba(60,230,255,0.08)'
      ctx.fillRect(from, Math.min(yOf(t.entry), yOf(t.target)), W - padR - from, Math.abs(yOf(t.entry) - yOf(t.target)))
    }
    hline(t.stop, RED, `Stop-loss ${t.stop.toFixed(2)}`, from)
    hline(t.target, CYAN, `Take-profit ${t.target.toFixed(2)}`, from)
    hline(t.entry, WHITE, `Ingång ${t.entry.toFixed(2)}`, from)
    if (t.closed) tag(ctx, t.closed.reason === 'stop' ? 'Stop-loss träffad' : t.closed.reason === 'target' ? 'Take-profit träffad' : 'Serien slut', xOf(t.closed.at) + 8, yOf(t.closed.price), ORANGE, 'left')
  } else if (pv) {
    if (pv.stop != null) {
      ctx.fillStyle = 'rgba(255,107,125,0.10)'
      ctx.fillRect(0, Math.min(yOf(pv.entry), yOf(pv.stop)), W - padR, Math.abs(yOf(pv.entry) - yOf(pv.stop)))
      hline(pv.stop, RED, `Stop-loss ${pv.stop.toFixed(2)}`)
    }
    if (pv.target != null) hline(pv.target, CYAN, `Take-profit ${pv.target.toFixed(2)}`)
  }

  // RSI panel
  const top = chartH + 12
  const rY = (v: number) => top + (1 - v / 100) * rsiH
  ctx.fillStyle = 'rgba(4,26,30,0.6)'
  ctx.fillRect(0, top, W - padR, rsiH)
  ctx.fillStyle = 'rgba(255,107,125,0.10)'
  ctx.fillRect(0, rY(100), W - padR, rY(RSI_OVERBOUGHT) - rY(100))
  ctx.fillStyle = 'rgba(60,230,255,0.10)'
  ctx.fillRect(0, rY(RSI_OVERSOLD), W - padR, rY(0) - rY(RSI_OVERSOLD))
  for (const [v, label] of [[RSI_OVERBOUGHT, '70 överköpt'], [50, '50'], [RSI_OVERSOLD, '30 översålt']] as const) {
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = v === 50 ? 'rgba(244,251,255,0.25)' : 'rgba(244,251,255,0.6)'
    ctx.beginPath(); ctx.moveTo(0, rY(v)); ctx.lineTo(W - padR, rY(v)); ctx.stroke()
    ctx.restore()
    ctx.fillStyle = 'rgba(200,236,240,0.75)'
    ctx.font = '10px "IBM Plex Sans", sans-serif'
    ctx.fillText(label, W - padR + 8, rY(v) + 3)
  }
  ctx.save()
  ctx.beginPath()
  let started = false
  for (let i = i0; i <= cur; i++) {
    const v = o.rsi[i]
    if (v == null) continue
    const x = xOf(i)
    if (!started) { ctx.moveTo(x, rY(v)); started = true } else ctx.lineTo(x, rY(v))
  }
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = o.lesson === 4 ? 2.4 : 1.6
  if (o.lesson === 4) glow(ctx, ORANGE, 10)
  ctx.stroke()
  ctx.restore()
  ctx.fillStyle = 'rgba(200,236,240,0.75)'
  ctx.font = '600 10px "IBM Plex Sans", sans-serif'
  ctx.fillText('RSI 14', 8, top + 14)

  // lesson spotlight
  if (o.lesson === 1 && nowC && pv?.stop != null) spotlight(ctx, nowX - 150, Math.min(yOf(nowC.c), yOf(pv.stop)) - 16, 170, Math.abs(yOf(nowC.c) - yOf(pv.stop)) + 32, 'Risk per aktie = ingång − stopp')
  else if (o.lesson === 1 && nowC) spotlight(ctx, nowX - 40, yOf(nowC.c) - 26, 60, 52, 'Aktuell kurs')
  if (o.lesson === 2) {
    const ys = [t?.stop ?? pv?.stop, t?.target ?? pv?.target].filter((v): v is number => v != null).map(yOf)
    if (ys.length) spotlight(ctx, W - padR - 250, Math.min(...ys) - 22, 244, Math.max(...ys) - Math.min(...ys) + 44, 'Stop-loss och take-profit')
  }
  if (o.lesson === 3 && nb) spotlight(ctx, nowX - 260, yOf(nb.upper) - 22, 280, yOf(nb.lower) - yOf(nb.upper) + 44, 'Bollingerkorridoren (20, 2σ)')
  if (o.lesson === 4) spotlight(ctx, 4, top - 4, W - padR - 8, rsiH + 8, 'RSI 14 · 70 / 30')
}
