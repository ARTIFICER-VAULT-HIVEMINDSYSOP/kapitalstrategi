/**
 * Trade Rider Academy. Eget läge, inte Akademin.
 * Framsida med Robban, frågor före loppet, sedan en raket från vänster till höger.
 */
import { getLang, onLang, t } from './i18n.js'
import { drawRobbanCraft, robbanSvg } from './robban-art.js'
import { mountRobban } from './robban.js'
import { noteTradeRiderAcademy } from '../gransland/hooks/tra.js'

const SKY = '#070b16'
const INK = '#e8f4ff'
const GOLD = '#f5b942'
const CYAN = '#22d3ee'

const css = `
.nlr-tra{position:fixed;inset:0;z-index:50;background:${SKY};color:${INK};display:none;overflow:auto;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif}
.nlr-tra.on{display:block}
.nlr-tra-in{max-width:980px;margin:0 auto;padding:88px 16px 280px;box-sizing:border-box}
.nlr-tra-claim{display:inline-block;margin:0 0 14px;padding:4px 10px;border-radius:999px;border:1px solid rgba(34,211,238,.45);color:${CYAN};font:600 12px/1.3 "IBM Plex Sans",sans-serif}
.nlr-tra-stage{display:grid;grid-template-columns:168px minmax(0,1fr);gap:28px;align-items:start}
.nlr-tra-hero{width:168px;height:320px;overflow:hidden;justify-self:start}
.nlr-tra-hero svg{width:168px;height:320px;display:block}
.nlr-tra-copy h1{margin:0 0 8px;font:600 34px/1.05 Fraunces,Georgia,serif;color:#fff}
.nlr-tra .kick{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};font-weight:700}
.nlr-tra-copy p{margin:0 0 12px;font:500 15px/1.45 "IBM Plex Sans",sans-serif;color:#d5e4f7}
.nlr-tra-start,.nlr-tra-back{border:0;border-radius:999px;background:${GOLD};color:#0f172a;font:700 14px/1 "IBM Plex Sans",sans-serif;padding:10px 16px;cursor:pointer}
.nlr-tra-start:focus-visible,.nlr-tra-back:focus-visible{outline:3px solid ${CYAN};outline-offset:2px}
.nlr-tra-race{display:flex;flex-direction:column;gap:12px}
.nlr-tra-race h1{margin:0;font:600 28px/1.1 Fraunces,Georgia,serif}
.nlr-tra-risk{margin:0}
.nlr-tra canvas{width:100%;height:min(420px,62vh);background:#050814;border-radius:18px;border:1px solid rgba(34,211,238,.35);display:block}
@media (max-width:720px){
  .nlr-tra-stage{grid-template-columns:1fr;gap:16px}
  .nlr-tra-hero{width:112px;height:220px}
  .nlr-tra-hero svg{width:112px;height:220px}
  .nlr-tra-copy h1{font-size:28px}
  .nlr-tra-in{padding-bottom:300px}
}
@media (max-width:720px),(max-height:520px){
  .nlr-tra-copy{padding-right:184px;box-sizing:border-box}
}
@media (max-height:500px){
  .nlr-tra-race{gap:8px}
  .nlr-tra-race h1{font-size:22px}
  .nlr-tra canvas{height:min(160px,36vh)}
}
@media (prefers-reduced-motion:reduce){
  .nlr-tra canvas{scroll-behavior:auto}
}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const style = document.createElement('style')
  style.dataset.traStyle = '1'
  style.textContent = css
  document.head.appendChild(style)
}

/** Raketens x växer från vänster mot höger och börjar om vid kanten. */
export function rocketX(width, t) {
  const w = Math.max(160, width)
  const span = Math.max(80, w - 150)
  const travel = (Math.max(0, t) * 140) % span
  return 48 + travel
}

function laneY(width, x, t) {
  const n = x / Math.max(1, width)
  return 0.58 + Math.sin(n * Math.PI * 2 + t * 0.8) * 0.1 + Math.sin(n * 11 + t) * 0.035
}

function drawRocket(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(245,185,66,.35)'
  ctx.beginPath()
  ctx.moveTo(-34, 0)
  ctx.lineTo(-18, -6)
  ctx.lineTo(-18, 6)
  ctx.fill()
  ctx.fillStyle = '#f4f7fb'
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-16, -10)
  ctx.lineTo(18, -8)
  ctx.lineTo(34, 0)
  ctx.lineTo(18, 8)
  ctx.lineTo(-16, 10)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#22d3ee'
  ctx.fillRect(6, -4, 10, 8)
  ctx.fillStyle = '#f5b942'
  ctx.fillRect(-14, -3, 8, 6)
  ctx.restore()
}

function reducedMotion() {
  if (typeof matchMedia !== 'function') return false
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function drawRace(ctx, width, height, t) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = SKY
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 48; i++) {
    const sx = (i * 97 - t * 40) % width
    const x = sx < 0 ? sx + width : sx
    const y = (i * 53) % height
    ctx.fillStyle = i % 4 === 0 ? CYAN : '#9fb4d0'
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, 1)
  }
  ctx.beginPath()
  for (let x = 0; x <= width; x += 8) {
    const y = laneY(width, x + t * 28, t) * height
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()
  const rx = rocketX(width, t)
  const ry = laneY(width, rx, t) * height
  drawRocket(ctx, rx, ry)
  drawRobbanCraft(ctx, rx - 6, ry - 8, t)
}

export function createTradeRiderAcademy() {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'nlr-tra'
  root.dataset.tra = '1'
  document.body.appendChild(root)
  let visible = false
  let phase = 'home'
  let playing = false
  let raceOver = false
  let clock = 0
  let raf = 0
  let last = 0

  const guide = mountRobban({
    onAnswer() {
      if (visible && phase === 'home') paint()
    },
  })

  function paint() {
    if (phase === 'race') {
      root.innerHTML = `<div class="nlr-tra-in nlr-tra-race">
        <p class="nlr-tra-claim" data-tr-claim="1">${t('sim.claim')}</p>
        <h1>${t('tra.raceTitle')}</h1>
        <p class="nlr-tra-risk" data-tra-risk="1">${t('tra.raceNote')}</p>
        <canvas data-tra-canvas data-rocket-dir="ltr" aria-label="${t('tra.canvas')}"></canvas>
        <div><button type="button" class="nlr-tra-back" data-tra-back>${t('tra.back')}</button></div>
      </div>`
      draw()
      return
    }
    root.innerHTML = `<div class="nlr-tra-in">
      <p class="nlr-tra-claim" data-tr-claim="1">${t('sim.claim')}</p>
      <div class="nlr-tra-stage">
        <div class="nlr-tra-hero" data-robban-stand="1">${robbanSvg()}</div>
        <div class="nlr-tra-copy">
          <p class="kick">${t('tra.kicker')}</p>
          <h1>${t('tra.title')}</h1>
          <p>${t('tra.lead')}</p>
          ${guide.markup()}
          <button type="button" class="nlr-tra-start" data-tra-start>${t('tra.start')}</button>
        </div>
      </div>
    </div>`
    const svg = root.querySelector('[data-robban-stand] svg')
    if (svg) svg.setAttribute('aria-label', t('rb.figure'))
  }

  function draw() {
    const cv = root.querySelector('[data-tra-canvas]')
    if (!cv) return
    cv.dataset.rocketDir = 'ltr'
    cv.dataset.robbanRide = playing ? 'on' : 'off'
    cv.dataset.rocketMotion = reducedMotion() ? 'off' : 'on'
    cv.dataset.rocketX = String(Math.round(rocketX(cv.clientWidth || 640, clock)))
    const w = cv.clientWidth || 640
    const h = cv.clientHeight || 320
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    cv.width = Math.round(w * dpr)
    cv.height = Math.round(h * dpr)
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawRace(ctx, w, h, clock)
  }

  function resetScroll() {
    const go = () => {
      root.scrollTop = 0
      const doc = document.scrollingElement || document.documentElement
      if (doc) doc.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
      if (typeof window.scrollTo === 'function') window.scrollTo(0, 0)
    }
    go()
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go)
  }

  function courseBars() {
    const candles = window.__trEngine?.quote?.candles
    return Array.isArray(candles) ? candles : []
  }

  function courseSeconds() {
    const series = courseBars()
    if (series.length) return series.length * 0.28
    const cv = root.querySelector('[data-tra-canvas]')
    const width = Math.max(160, cv?.clientWidth || 640)
    return Math.max(80, width - 150) / 140
  }

  function finishRace() {
    if (raceOver || phase !== 'race') return
    raceOver = true
    playing = false
    cancelAnimationFrame(raf)
    draw()
    noteTradeRiderAcademy({
      reachedEnd: true,
      bars: courseBars(),
      replay() {
        raceOver = false
        clock = 0
        phase = 'race'
        playing = true
        paint()
        resetScroll()
        if (visible && !reducedMotion()) {
          last = performance.now()
          raf = requestAnimationFrame(frame)
        }
      },
    })
  }

  function advance(dt) {
    if (raceOver) return
    clock += Math.max(0, Number(dt) || 0)
    if (clock >= courseSeconds()) {
      clock = courseSeconds()
      finishRace()
      return
    }
    draw()
  }

  function frame(now) {
    if (!visible || !playing || raceOver) return
    if (reducedMotion()) {
      draw()
      if (courseBars().length) finishRace()
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    advance(dt)
    if (!raceOver) raf = requestAnimationFrame(frame)
  }

  root.addEventListener('click', (e) => {
    const start = e.target.closest('[data-tra-start]')
    const back = e.target.closest('[data-tra-back]')
    if (!start && !back) return
    phase = start ? 'race' : 'home'
    playing = Boolean(start)
    raceOver = false
    clock = 0
    paint()
    resetScroll()
    cancelAnimationFrame(raf)
    if (playing && !reducedMotion()) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  })

  onLang(() => {
    if (visible) paint()
  })

  return {
    show() {
      visible = true
      root.classList.add('on')
      guide.show()
      paint()
    },
    hide() {
      visible = false
      playing = false
      root.classList.remove('on')
      guide.hide()
      cancelAnimationFrame(raf)
    },
    step(dt) {
      if (!visible || phase !== 'race' || raceOver) return
      playing = true
      advance(dt)
    },
    state: () => ({ phase, playing, clock }),
  }
}
