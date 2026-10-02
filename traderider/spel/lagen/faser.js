/**
 * Historia → Gränslandet → (live-platsen, bara i koden).
 * advance går aldrig själv till live. Korset finns bara när ett flöde är live.
 */
import { HISTORIA } from './historia-data.js'
import { historicalSource, openLiveSource } from './kalla.js'
import { useLiveFeed } from './live-port.js'
import { keyAction } from './keys.js'
import { applyIntent, wheelToIntent } from './orientation.js'
import { createGestureLock } from './styrmotor.js'
import { t, onLang } from './i18n.js'

export const PHASES = ['historia', 'granslandet', 'live']

export function createPhases(getFeed) {
  let phase = 'historia'
  const readFeed = typeof getFeed === 'function' ? getFeed : () => getFeed || null
  return {
    phases: PHASES,
    phase: () => phase,
    endHistoria() {
      if (phase === 'historia') phase = 'granslandet'
    },
    replay() {
      phase = 'historia'
    },
    advance() {
      if (phase === 'historia') phase = 'granslandet'
    },
    tryCross() {
      const feed = readFeed()
      if (phase !== 'granslandet' || !feed || feed.status() !== 'live') return false
      phase = 'live'
      return true
    },
    showCross() {
      const feed = readFeed()
      return phase === 'granslandet' && !!feed && feed.status() === 'live'
    },
    statusKey() {
      const feed = readFeed()
      if (!feed) return null
      const status = feed.status()
      if (status === 'av' || status === 'ansluter' || status === 'stangd' || status === 'fel') return `live.${status}`
      return null
    },
  }
}

export function summarySentence(state, translate) {
  const side = state?.side === 'buy' ? translate('btn.buy') : state?.side === 'sell' ? translate('btn.sell') : translate('btn.flat')
  const lev = Number.isFinite(state?.leverage) ? state.leverage : 1
  return translate('grans.summary', { side, lev })
}

export function createPlayback(bars, hooks) {
  let index = 0
  let done = false
  let ended = false
  return {
    index: () => index,
    done: () => done,
    start(reduced) {
      index = 0
      done = false
      ended = false
      if (reduced || bars.length <= 1) {
        index = Math.max(0, bars.length - 1)
        done = true
        hooks.onIndex(index)
        if (!ended) {
          ended = true
          hooks.onEnd()
        }
        return
      }
      hooks.onIndex(0)
    },
    tick() {
      if (done) return
      index += 1
      if (index >= bars.length - 1) {
        index = bars.length - 1
        done = true
        hooks.onIndex(index)
        if (!ended) {
          ended = true
          hooks.onEnd()
        }
        return
      }
      hooks.onIndex(index)
    },
  }
}

function reducedMotion() {
  try {
    const ask = globalThis.matchMedia || globalThis.window?.matchMedia
    return !!(typeof ask === 'function' && ask.call(globalThis.window || globalThis, '(prefers-reduced-motion: reduce)').matches)
  } catch {
    return false
  }
}

const css = `
.tr-fas{position:fixed;z-index:70;left:50%;top:88px;transform:translateX(-50%);width:min(440px,calc(100vw - 24px));box-sizing:border-box;background:rgba(246,242,234,.97);color:#1c1915;border:1px solid rgba(28,25,21,.16);border-radius:16px;padding:14px 16px 16px;font:500 14px/1.45 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;box-shadow:0 10px 30px rgba(28,25,21,.12)}
.tr-fas[data-place="bottom"]{top:auto;bottom:12px;left:12px;right:12px;width:auto;transform:none}
.tr-fas[hidden]{display:none !important}
.tr-fas-badge{margin:0 0 4px;font:700 12px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em}
.tr-fas-range{margin:0 0 8px;font-size:12px;color:#8a8478}
.tr-fas canvas{width:100%;height:120px;display:block;background:#1c1915;border-radius:8px}
.tr-grans h2{margin:10px 0 6px;font:600 18px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif}
.tr-grans p{margin:0 0 8px}
.tr-grans button,.tr-grans a{display:inline-block;margin:4px 8px 0 0;padding:6px 10px;border-radius:999px;border:1px solid rgba(28,25,21,.2);background:#1c1915;color:#f3ede2;font:600 13px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;text-decoration:none;cursor:pointer}
.tr-grans button:focus-visible,.tr-grans a:focus-visible{outline:2px solid #76b900;outline-offset:2px}
@media (prefers-reduced-motion: reduce){.tr-fas{transition:none;animation:none}}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

function drawBars(canvas, bars, index) {
  const w = canvas.clientWidth || 400
  const h = 120
  const dpr = Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext?.('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#1c1915'
  ctx.fillRect(0, 0, w, h)
  const slice = bars.slice(0, index + 1)
  if (!slice.length) return
  let lo = Infinity
  let hi = -Infinity
  for (const bar of slice) {
    lo = Math.min(lo, bar.l)
    hi = Math.max(hi, bar.h)
  }
  const span = hi - lo || 1
  const slot = w / bars.length
  slice.forEach((bar, i) => {
    const x = i * slot + slot / 2
    const y = (v) => 8 + ((hi - v) / span) * (h - 16)
    ctx.strokeStyle = bar.c >= bar.o ? '#2f8f7a' : '#d45d75'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y(bar.h))
    ctx.lineTo(x, y(bar.l))
    ctx.stroke()
    const top = y(Math.max(bar.o, bar.c))
    const bot = y(Math.min(bar.o, bar.c))
    ctx.fillStyle = ctx.strokeStyle
    ctx.fillRect(x - 3, top, 6, Math.max(2, bot - top))
  })
}

export function mountFas(host, opts) {
  ensureStyle()
  const root = document.createElement('section')
  root.className = 'tr-fas'
  root.dataset.trFas = '1'
  root.hidden = true
  const badge = document.createElement('p')
  badge.className = 'tr-fas-badge'
  badge.dataset.trBadge = '1'
  const range = document.createElement('p')
  range.className = 'tr-fas-range'
  range.dataset.trRange = '1'
  const canvas = document.createElement('canvas')
  canvas.dataset.trChart = '1'
  const card = document.createElement('section')
  card.className = 'tr-grans'
  card.dataset.trGrans = '1'
  card.hidden = true
  const heading = document.createElement('h2')
  const summary = document.createElement('p')
  summary.dataset.trSummary = '1'
  const status = document.createElement('p')
  status.dataset.trLiveStatus = '1'
  status.hidden = true
  const replay = document.createElement('button')
  replay.type = 'button'
  replay.dataset.trReplay = '1'
  const menu = document.createElement('a')
  menu.dataset.trMenu = '1'
  menu.href = '/traderider/'
  card.append(heading, summary, status, replay, menu)
  root.append(badge, range, canvas, card)
  host.appendChild(root)

  const phases = createPhases(() => useLiveFeed())
  let side = 'flat'
  let leverage = 1
  let timer = 0
  let covering = false
  const lock = createGestureLock(480)
  const playback = createPlayback(HISTORIA.bars, {
    onIndex(index) {
      drawBars(canvas, HISTORIA.bars, index)
    },
    onEnd() {
      phases.endHistoria()
      paint()
      opts.onFreeze?.(true)
    },
  })

  function paint() {
    const place = opts.getPlace() === 'bottom' ? 'bottom' : 'chart'
    root.dataset.place = place
    card.dataset.place = place
    badge.textContent = t('hist.badge')
    range.textContent = t('hist.range', { from: HISTORIA.from, to: HISTORIA.to })
    heading.textContent = t('grans.title')
    summary.textContent = summarySentence({ side, leverage }, t)
    replay.textContent = t('grans.replay')
    menu.textContent = t('grans.menu')
    const key = phases.phase() === 'granslandet' ? phases.statusKey() : null
    if (key) {
      status.hidden = false
      status.textContent = t(key)
    } else {
      status.hidden = true
      status.textContent = ''
    }
    const cross = card.querySelector('[data-tr-cross]')
    if (phases.showCross()) {
      if (!cross) {
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.trCross = '1'
        button.textContent = t('grans.cross')
        button.addEventListener('click', () => {
          if (!phases.tryCross()) return
          const feed = useLiveFeed()
          if (feed) openLiveSource(feed, HISTORIA.seriesId)
          paint()
        })
        card.appendChild(button)
      } else cross.textContent = t('grans.cross')
    } else if (cross) cross.remove()
    const historia = phases.phase() === 'historia'
    badge.hidden = !historia
    range.hidden = !historia
    const showCard = !historia
    card.hidden = !showCard
    canvas.hidden = showCard && reducedMotion()
    root.hidden = !covering || opts.isActive?.() === false
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = 0
  }

  function play() {
    stop()
    side = 'flat'
    leverage = 1
    phases.replay()
    covering = true
    card.hidden = true
    canvas.hidden = false
    opts.onFreeze?.(false)
    playback.start(reducedMotion())
    if (!playback.done()) timer = setInterval(() => playback.tick(), 280)
    paint()
  }

  function onKey(e) {
    if (!covering || root.hidden || phases.phase() !== 'historia') return
    const action = keyAction(e, '1p', opts.getOrientation())
    if (!action?.intent) return
    e.preventDefault()
    e.stopPropagation()
    const next = applyIntent({ side, leverage }, action.intent)
    side = next.side
    leverage = next.leverage
    paint()
  }
  window.addEventListener('keydown', onKey, true)
  root.addEventListener('wheel', (e) => {
    if (!covering || phases.phase() !== 'historia') return
    const intent = wheelToIntent(e.deltaY)
    if (!intent || !lock.allow()) return
    e.preventDefault()
    const next = applyIntent({ side, leverage }, intent)
    side = next.side
    leverage = next.leverage
    paint()
  }, { passive: false })
  replay.addEventListener('click', () => play())
  onLang(paint)

  return {
    root,
    play,
    sync: paint,
    isCovering: () => covering && !root.hidden,
    phases,
    source: () => historicalSource(HISTORIA.bars),
  }
}
