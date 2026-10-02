/**
 * Ingångens snäpplista och hjul/svep. Varje steg anropar styrmotorns stepSide.
 * Ratten är bara en pekare – samma cykel, ingen egen logik. Av vid reduced-motion.
 */
import { stepSide, stepFromDelta, SNAP_TOP_TO_BOTTOM, createGestureLock, ENTRY_SIDE } from './styrmotor.js'
import { t, onLang } from './i18n.js'

const css = `
.tr-snap{position:fixed;z-index:36;right:12px;top:calc(var(--tr-chrome-b, 88px) + 8px);bottom:132px;width:min(200px,46vw);overflow:hidden;border-radius:18px;background:rgba(246,242,234,.94);border:1px solid rgba(28,25,21,.16);box-shadow:0 8px 28px rgba(28,25,21,.12);display:flex;flex-direction:column}
.tr-snap-view{flex:1;overflow:hidden;scroll-snap-type:y mandatory;scrollbar-width:none}
.tr-snap-view::-webkit-scrollbar{display:none}
.tr-snap-opt{scroll-snap-align:center;height:100%;width:100%;border:0;background:transparent;font:600 18px/1.2 "IBM Plex Sans",sans-serif;color:#1c1915;cursor:pointer}
.tr-snap-opt[aria-selected="true"]{background:rgba(118,185,0,.18)}
.tr-snap-help{margin:0;padding:8px 10px 10px;font:500 11px/1.35 "IBM Plex Sans",sans-serif;color:#4a453d}
html[data-nlr-view="raket"] .tr-snap{background:rgba(8,12,32,.9);border-color:rgba(64,224,255,.45);color:#e8f4ff}
html[data-nlr-view="raket"] .tr-snap-opt{color:#e8f4ff;font-family:"IBM Plex Mono",ui-monospace,monospace}
html[data-nlr-view="raket"] .tr-snap-help{color:#b9c9ea}
.tr-ratt{position:fixed;z-index:80;width:28px;height:28px;margin:0;pointer-events:none;display:none;color:#1c1915}
@media (prefers-reduced-motion:reduce){.tr-snap-view{scroll-behavior:auto}}
@media (max-width:520px){.tr-snap{top:calc(var(--tr-chrome-b, 120px) + 8px);bottom:auto;height:132px;left:auto;right:8px;width:min(120px,34vw)}}
html[data-nlr-view="raket"] .tr-snap,html[data-nlr-view="rabbit"] .tr-snap,html[data-nlr-view="akademin"] .tr-snap,html[data-nlr-mode="2p"] .tr-snap{display:none !important}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const s = document.createElement('style')
  s.id = 'tr-snap-style'
  s.textContent = css
  document.head.appendChild(s)
}

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function labelFor(side) {
  if (side === 'buy') return t('btn.buy')
  if (side === 'sell') return t('btn.sell')
  return t('pos.flat')
}

/**
 * Tre synliga snäpp: KÖP överst, stängd i mitten, SÄLJ nederst.
 * Hjul, svep och piltangenter (när listan har fokus) tar exakt ett steg.
 */
export function mountEntrySnap(host, { getSide, applyDir }) {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'tr-snap'
  const view = document.createElement('div')
  view.className = 'tr-snap-view'
  view.tabIndex = 0
  view.setAttribute('role', 'listbox')
  view.setAttribute('aria-label', t('snap.aria'))
  const buttons = SNAP_TOP_TO_BOTTOM.map((side) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'tr-snap-opt'
    b.dataset.side = side
    b.setAttribute('role', 'option')
    b.textContent = labelFor(side)
    view.appendChild(b)
    return b
  })
  const help = document.createElement('p')
  help.className = 'tr-snap-help'
  help.textContent = t('snap.help')
  root.append(view, help)
  ;(host || document.body).appendChild(root)
  const live = document.createElement('div')
  live.className = 'tr-snap-live'
  live.setAttribute('aria-live', 'polite')
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)'
  root.appendChild(live)

  function paint() {
    view.setAttribute('aria-label', t('snap.aria'))
    help.textContent = t('snap.help')
    const cur = getSide() || ENTRY_SIDE
    for (const b of buttons) {
      const on = b.dataset.side === cur
      b.setAttribute('aria-selected', on ? 'true' : 'false')
      b.textContent = labelFor(b.dataset.side)
      if (on) b.id = 'tr-snap-current'
    }
    view.setAttribute('aria-activedescendant', 'tr-snap-current')
    const i = Math.max(0, SNAP_TOP_TO_BOTTOM.indexOf(cur))
    const top = i * view.clientHeight
    view.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' })
    live.textContent = labelFor(cur)
  }

  const lock = createGestureLock(480)
  function take(delta) {
    if (!lock.allow()) return
    const cur = getSide() || ENTRY_SIDE
    const next = stepFromDelta(cur, delta)
    if (next === cur) return
    applyDir(delta < 0 ? 1 : -1)
    paint()
  }
  view.addEventListener('wheel', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.deltaY === 0) return
    take(e.deltaY)
  }, { passive: false })
  let y0 = null
  view.addEventListener('touchstart', (e) => {
    y0 = e.changedTouches[0]?.clientY ?? null
  }, { passive: true })
  view.addEventListener('touchend', (e) => {
    if (y0 == null) return
    const dy = (e.changedTouches[0]?.clientY ?? y0) - y0
    y0 = null
    if (Math.abs(dy) < 28) return
    e.preventDefault()
    take(dy)
  }, { passive: false })
  view.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    e.stopPropagation()
    take(e.key === 'ArrowUp' ? -1 : 1)
  })
  for (const b of buttons) {
    b.addEventListener('click', () => {
      const cur = getSide() || ENTRY_SIDE
      const want = cycleIndexSafe(b.dataset.side)
      const have = cycleIndexSafe(cur)
      if (want === have) return
      applyDir(want > have ? 1 : -1)
      paint()
    })
  }
  const off = onLang(paint)
  requestAnimationFrame(paint)
  return {
    root,
    paint,
    destroy() {
      off()
      root.remove()
    },
  }
}

function cycleIndexSafe(side) {
  return side === 'buy' ? 2 : side === 'sell' ? 0 : 1
}

/** Hjul och svep på en spelyta. Ett gest = ett anrop till applyDir(±1). */
export function bindStepGestures(el, { enabled, getSide, applyDir }) {
  if (!el) return () => {}
  const lock = createGestureLock(480)
  const wheel = (e) => {
    if (enabled && !enabled()) return
    if (e.target?.closest?.('input,textarea,select,.tr-snap')) return
    e.preventDefault()
    if (e.deltaY === 0 || !lock.allow()) return
    const cur = getSide()
    const next = stepFromDelta(cur, e.deltaY)
    if (next !== cur) applyDir(e.deltaY < 0 ? 1 : -1)
  }
  let y0 = null
  const start = (e) => {
    if (enabled && !enabled()) return
    y0 = e.changedTouches[0]?.clientY ?? null
  }
  const end = (e) => {
    if (y0 == null) return
    const dy = (e.changedTouches[0]?.clientY ?? y0) - y0
    y0 = null
    if (enabled && !enabled()) return
    if (Math.abs(dy) < 36) return
    if (!lock.allow()) return
    const cur = getSide()
    const next = stepFromDelta(cur, dy)
    if (next !== cur) applyDir(dy < 0 ? 1 : -1)
  }
  el.addEventListener('wheel', wheel, { passive: false })
  el.addEventListener('touchstart', start, { passive: true })
  el.addEventListener('touchend', end, { passive: true })
  return () => {
    el.removeEventListener('wheel', wheel)
    el.removeEventListener('touchstart', start)
    el.removeEventListener('touchend', end)
  }
}

/** Valfri ratt-pekare. Av om reduced-motion eller om flaggan är falsk. */
export const RATT_ENABLED = true

export function mountRatt() {
  if (!RATT_ENABLED || typeof document === 'undefined' || reducedMotion()) return () => {}
  ensureStyle()
  const el = document.createElement('div')
  el.className = 'tr-ratt'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = '<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3"/><path d="M16 5 V13 M16 19 V27 M5 16 H13 M19 16 H27"/></svg>'
  document.body.appendChild(el)
  const move = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') {
      el.style.display = 'none'
      return
    }
    const play = e.target?.closest?.('canvas,.tr-snap,.nlr-raket,.nlr-duo')
    const ui = e.target?.closest?.('button,a,input,textarea,select,.nlr-toggle,.tr-skal')
    if (!play || ui) {
      el.style.display = 'none'
      if (play && play.style) play.style.cursor = ''
      return
    }
    el.style.display = 'block'
    el.style.left = `${e.clientX}px`
    el.style.top = `${e.clientY}px`
    const tilt = Math.max(-40, Math.min(40, (e.clientX - innerWidth / 2) / 14))
    el.style.transform = `translate(-50%,-50%) rotate(${tilt}deg)`
  }
  const hide = () => { el.style.display = 'none' }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerleave', hide)
  return () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerleave', hide)
    el.remove()
  }
}

export { stepSide, ENTRY_SIDE }
