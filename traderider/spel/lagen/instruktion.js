/**
 * En gemensam instruktionspanel för Trade Rider, Raket och Rabbit Hole.
 * Texten kommer från orientation + i18n, så den följer bindningarna.
 */
import { instructionText } from './orientation.js'
import { t, onLang } from './i18n.js'

const css = `
.tr-instr{position:fixed;z-index:80;left:50%;top:88px;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));box-sizing:border-box;background:rgba(246,242,234,.98);color:#1c1915;border:1px solid rgba(28,25,21,.18);border-radius:16px;padding:16px 16px 14px;font:500 14px/1.45 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;box-shadow:0 12px 32px rgba(28,25,21,.16)}
.tr-instr[hidden]{display:none !important}
.tr-instr h2{margin:0 0 8px;font:600 16px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif}
.tr-instr p{margin:0 0 12px}
.tr-instr button,.tr-instr-open{border:0;border-radius:999px;background:#1c1915;color:#f3ede2;font:600 13px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;padding:8px 14px;cursor:pointer}
.tr-instr button:focus-visible,.tr-instr-open:focus-visible{outline:2px solid #76b900;outline-offset:2px}
.tr-instr-open{position:fixed;z-index:66;top:58px;right:12px}
.tr-instr-open[hidden]{display:none !important}
@media (max-width:520px){.tr-instr{top:auto;bottom:12px;left:12px;right:12px;width:auto;transform:none;max-height:42vh;overflow:auto}.tr-instr-open{top:auto;bottom:12px;left:12px;right:auto}}
@media (prefers-reduced-motion: reduce){.tr-instr,.tr-instr-open{transition:none;animation:none}}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

export function mountInstruction(host, opts) {
  ensureStyle()
  const root = document.createElement('section')
  root.className = 'tr-instr'
  root.dataset.trInstr = '1'
  root.setAttribute('role', 'region')
  const heading = document.createElement('h2')
  heading.id = 'tr-instr-title'
  const body = document.createElement('p')
  body.dataset.trInstrBody = '1'
  const start = document.createElement('button')
  start.type = 'button'
  start.dataset.trInstrStart = '1'
  root.append(heading, body, start)
  root.setAttribute('aria-labelledby', heading.id)
  const reopen = document.createElement('button')
  reopen.type = 'button'
  reopen.className = 'tr-instr-open'
  reopen.dataset.trInstrOpen = '1'
  reopen.hidden = true
  host.append(root, reopen)

  let open = false
  const starters = new Set()

  function paint() {
    const active = opts.isActive?.() !== false
    heading.textContent = t('instr.title')
    body.textContent = instructionText(opts.getOrientation(), t)
    start.textContent = t('instr.start')
    reopen.textContent = t('instr.open')
    root.hidden = !open || !active
    reopen.hidden = open || !active
  }

  function show() {
    open = true
    paint()
    start.focus()
  }

  function hide() {
    open = false
    paint()
  }

  start.addEventListener('click', () => {
    hide()
    for (const fn of starters) fn()
  })
  reopen.addEventListener('click', show)
  onLang(paint)
  paint()

  return {
    root,
    reopen,
    show,
    hide,
    sync: paint,
    isOpen: () => open && !root.hidden,
    onStart(fn) {
      starters.add(fn)
    },
  }
}
