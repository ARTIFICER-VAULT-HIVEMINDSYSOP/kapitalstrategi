import { t } from '../lagen/i18n.js'
import { formatPrice, formatPct } from './labels.js'

const css = `
.gl-root{position:fixed;z-index:80;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:calc(var(--tr-chrome-b, 72px) + 12px) 12px 12px;box-sizing:border-box;overflow:auto;background:rgba(28,25,21,.28);font:500 15px/1.45 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#1c1915}
.gl-root[hidden]{display:none !important}
.gl-card{width:min(640px,100%);box-sizing:border-box;background:#f6f2ea;border:1px solid rgba(28,25,21,.16);border-radius:18px;padding:16px;box-shadow:0 16px 40px rgba(28,25,21,.18)}
.gl-root[data-variant="racex"] .gl-card{background:#10183f;color:#eaf6ff;border-color:rgba(46,230,255,.35)}
.gl-root[data-variant="rabbit"] .gl-card{background:#1c120f;color:#f4efe6;border-color:rgba(231,177,90,.35)}
.gl-badge{margin:0 0 6px;font:700 13px/1.3 "IBM Plex Sans",sans-serif;letter-spacing:.04em}
.gl-frozen{margin:0 0 8px;font-size:14px}
.gl-chart{width:100%;height:180px;display:block;background:#1c1915;border-radius:10px}
.gl-root[data-shot="frozen"] .gl-chart{height:240px}
.gl-choice{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.gl-choice button,.gl-choice a{display:block;box-sizing:border-box;width:100%;text-align:center;text-decoration:none;border-radius:999px;padding:12px 14px;font:700 16px/1.2 "IBM Plex Sans",sans-serif;cursor:pointer}
.gl-enter{background:#76b900;color:#1c1915;border:0}
.gl-secondary{background:transparent;color:inherit;border:1px solid rgba(28,25,21,.28)}
.gl-root[data-variant="racex"] .gl-secondary,.gl-root[data-variant="rabbit"] .gl-secondary{border-color:rgba(255,255,255,.35);color:#f4efe6}
.gl-money,.gl-risk{margin:8px 0 0}
.gl-split{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.gl-half{border:1px solid rgba(28,25,21,.12);border-radius:12px;padding:8px 10px}
.gl-root[data-variant="racex"] .gl-half,.gl-root[data-variant="rabbit"] .gl-half{border-color:rgba(255,255,255,.16)}
.gl-half b{display:block;font:700 20px/1.2 "IBM Plex Sans",sans-serif;font-variant-numeric:tabular-nums}
.gl-controls{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.gl-controls button{border-radius:999px;border:1px solid rgba(28,25,21,.2);background:#1c1915;color:#f3ede2;font:600 13px "IBM Plex Sans",sans-serif;padding:6px 10px;cursor:pointer}
.gl-figures{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:8px;font-size:13px}
.gl-figures span{font-variant-numeric:tabular-nums}
@media (max-width:520px){.gl-root{padding:12px}.gl-split{grid-template-columns:1fr}.gl-chart{height:140px}.gl-choice button,.gl-choice a{font-size:15px;padding:11px 12px}}
@media (prefers-reduced-motion: reduce){.gl-root{scroll-behavior:auto}}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const style = document.createElement('style')
  style.setAttribute('data-gl-style', '1')
  style.textContent = css
  document.head.appendChild(style)
}

function priceJump(left, right) {
  if (!(left > 0) || !(right > 0)) return false
  return Math.max(left, right) / Math.min(left, right) > 3
}

function chartWindow(bars) {
  if (bars.length <= 140) return bars
  let split = 0
  for (let i = bars.length - 1; i > 0; i--) {
    if (priceJump(bars[i - 1].c, bars[i].c)) {
      split = i
      break
    }
  }
  if (!split) return bars.slice(-120)
  return bars.slice(Math.max(0, split - 24), split).concat(bars.slice(split).slice(-100))
}

function scaleRuns(bars) {
  const runs = []
  for (const bar of bars) {
    const prev = runs.length ? runs[runs.length - 1].at(-1) : null
    if (!prev || priceJump(prev.c, bar.c)) runs.push([bar])
    else runs[runs.length - 1].push(bar)
  }
  return runs
}

function drawChart(canvas, bars, gaps) {
  const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 0
  const h = canvas.clientHeight || 180
  if (w < 2) return
  const dpr = Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext?.('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#1c1915'
  ctx.fillRect(0, 0, w, h)
  const shown = chartWindow(bars)
  if (!shown.length) return
  const slot = w / shown.length
  const gapBefore = new Set((gaps || []).map((gap) => gap.before))
  let index = 0
  for (const run of scaleRuns(shown)) {
    let lo = Infinity
    let hi = -Infinity
    for (const bar of run) {
      lo = Math.min(lo, bar.l)
      hi = Math.max(hi, bar.h)
    }
    const span = hi - lo || 1
    const y = (v) => 10 + ((hi - v) / span) * (h - 20)
    run.forEach((bar, i) => {
      const at = index + i
      const x = at * slot + slot / 2
      const up = bar.c >= bar.o
      const last = at === shown.length - 1
      ctx.strokeStyle = up ? '#2f8f7a' : '#d45d75'
      ctx.fillStyle = ctx.strokeStyle
      ctx.lineWidth = last ? 3 : 2
      ctx.beginPath()
      ctx.moveTo(x, y(bar.h))
      ctx.lineTo(x, y(bar.l))
      ctx.stroke()
      const top = y(Math.max(bar.o, bar.c))
      const bot = y(Math.min(bar.o, bar.c))
      const body = Math.max(3, Math.min(8, slot * 0.62))
      ctx.fillRect(x - body / 2, top, body, Math.max(2, bot - top))
      if (i === 0 && at > 0) {
        ctx.strokeStyle = 'rgba(243,237,226,.75)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(at * slot + 1, 8)
        ctx.lineTo(at * slot + 1, h - 8)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (gapBefore.has(bar.t)) {
        ctx.strokeStyle = 'rgba(243,237,226,.7)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(at * slot + 1, 8)
        ctx.lineTo(at * slot + 1, h - 8)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
    index += run.length
  }
}

function figureRow(pack) {
  if (!pack) return ''
  const last = (series) => {
    for (let i = series.length - 1; i >= 0; i--) {
      const value = series[i]
      if (typeof value === 'number' && Number.isFinite(value)) return formatPrice(value)
    }
    return ''
  }
  const band = [...pack.bollinger].reverse().find((item) => item && Number.isFinite(item.sma))
  const macd = [...pack.macd.line].reverse().find((item) => Number.isFinite(item))
  const parts = [
    ['RSI', last(pack.rsi)],
    ['MACD', Number.isFinite(macd) ? formatPrice(macd) : ''],
    ['Bollinger', band ? formatPrice(band.sma) : ''],
    ['SMA', last(pack.sma)],
    ['EMA', last(pack.ema)],
    ['ATR', last(pack.atr)],
  ]
  return parts.filter(([, value]) => value).map(([name, value]) => `<span>${name} ${value}</span>`).join('')
}

export function mountView(host, session, opts = {}) {
  ensureStyle()
  const root = document.createElement('section')
  root.className = 'gl-root'
  root.dataset.glRoot = '1'
  root.dataset.variant = session.variant()
  root.setAttribute('aria-label', t('gl.title'))
  if (opts.shot) root.dataset.shot = opts.shot
  const card = document.createElement('div')
  card.className = 'gl-card'
  const badge = document.createElement('p')
  badge.className = 'gl-badge'
  badge.dataset.glBadge = '1'
  const frozen = document.createElement('p')
  frozen.className = 'gl-frozen'
  frozen.dataset.glFrozen = '1'
  const canvas = document.createElement('canvas')
  canvas.className = 'gl-chart'
  canvas.dataset.glChart = '1'
  const figures = document.createElement('div')
  figures.className = 'gl-figures'
  figures.dataset.glFigures = '1'
  const money = document.createElement('p')
  money.className = 'gl-money'
  money.dataset.glMoney = '1'
  const choice = document.createElement('div')
  choice.className = 'gl-choice'
  choice.dataset.glChoice = '1'
  const enter = document.createElement('button')
  enter.type = 'button'
  enter.className = 'gl-enter'
  enter.dataset.glEnter = '1'
  const crypto = document.createElement('button')
  crypto.type = 'button'
  crypto.className = 'gl-enter'
  crypto.dataset.glCrypto = '1'
  const again = document.createElement('button')
  again.type = 'button'
  again.className = 'gl-secondary'
  again.dataset.glAgain = '1'
  const replay = document.createElement('button')
  replay.type = 'button'
  replay.className = 'gl-secondary'
  replay.dataset.glReplay = '1'
  const menu = document.createElement('a')
  menu.className = 'gl-secondary'
  menu.dataset.glMenu = '1'
  menu.href = '/traderider/'
  const split = document.createElement('div')
  split.className = 'gl-split'
  split.dataset.glSplit = '1'
  choice.append(enter, crypto, again, replay, menu)
  card.append(badge, frozen, canvas, figures, split, money, choice)
  root.append(card)
  host.appendChild(root)

  function paint() {
    const snap = session.snapshot()
    root.dataset.glPhase = snap.phase
    root.dataset.variant = snap.variant
    root.dataset.glUnknown = snap.unknown ? '1' : '0'
    root.dataset.glFetching = snap.fetching ? '1' : '0'
    badge.textContent = snap.label
    frozen.hidden = snap.phase !== 'gransland'
    frozen.textContent = snap.phase === 'gransland' ? t('gl.frozen') : ''
    drawChart(canvas, snap.bars, snap.gaps)
    const showNumbers = snap.phase === 'live' && !snap.unknown && !snap.fetching && Number.isFinite(snap.price)
    figures.hidden = !showNumbers
    figures.innerHTML = showNumbers ? figureRow(snap.figures) : ''
    split.hidden = snap.players.length < 2 && !showNumbers
    split.innerHTML = ''
    const halves = snap.players.length > 1 ? snap.players : showNumbers ? snap.players : []
    if (snap.players.length > 1 || showNumbers) {
      split.hidden = false
      for (const player of halves.length ? halves : snap.players) {
        const half = document.createElement('div')
        half.className = 'gl-half'
        half.dataset.glHalf = String(player.id)
        const who = document.createElement('small')
        who.textContent = t('gl.player', { n: player.id })
        const price = document.createElement('b')
        price.dataset.glPrice = String(player.id)
        price.textContent = showNumbers ? formatPrice(snap.price) : ''
        if (!showNumbers) price.hidden = true
        half.append(who, price)
        if (showNumbers) {
          const controls = document.createElement('div')
          controls.className = 'gl-controls'
          for (const [key, label] of [['buy', t('btn.buy')], ['sell', t('btn.sell')], ['flat', t('btn.flat')]]) {
            const button = document.createElement('button')
            button.type = 'button'
            button.dataset.glSide = key
            button.dataset.glPlayer = String(player.id)
            button.textContent = label
            button.addEventListener('click', () => {
              session.steer(player.id, key)
              paint()
            })
            controls.append(button)
          }
          half.append(controls)
        }
        split.append(half)
      }
    }
    money.textContent = snap.phase === 'historia' ? '' : (snap.players[0]?.money || '')
    enter.hidden = snap.phase !== 'gransland' || snap.fetching
    enter.textContent = t('gl.choice')
    crypto.hidden = !snap.unknown
    crypto.textContent = t('gl.crypto')
    again.hidden = !snap.unknown
    again.textContent = t('gl.again')
    replay.hidden = snap.phase === 'historia'
    replay.textContent = t('grans.replay')
    menu.hidden = snap.phase === 'historia'
    menu.textContent = t('grans.menu')
    choice.hidden = enter.hidden && crypto.hidden && again.hidden && replay.hidden && menu.hidden
    const last = snap.bars[snap.bars.length - 1]
    root.dataset.glLast = last ? String(last.t) : ''
    root.dataset.glBars = String(snap.bars.length)
  }

  enter.addEventListener('click', async () => {
    await session.enterReal()
    paint()
  })
  crypto.addEventListener('click', async () => {
    await session.switchCrypto()
    paint()
  })
  function leaveToHistory() {
    session.replay()
    off()
    session.stop()
    root.remove()
  }
  again.addEventListener('click', leaveToHistory)
  replay.addEventListener('click', leaveToHistory)
  menu.addEventListener('click', () => {
    opts.onMenu?.()
  })
  const off = session.onChange(paint)
  paint()
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => paint())
  }
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => paint())
    observer.observe(canvas)
    const previousClose = root.remove
    root.remove = function removeRoot() {
      observer.disconnect()
      return previousClose.call(root)
    }
  }

  return {
    root,
    paint,
    markReady() {
      root.dataset.glReady = '1'
    },
    close() {
      off()
      session.stop()
      root.remove()
    },
  }
}
