/**
 * Trade Rider – tillägg på samma sida:
 *  1. RSI(14)-panel under grafen, på exakt samma riktiga kursdata som spelet visar (motorns quote.candles),
 *     följer vald period och tågets position. Saknas data visas «saknas».
 *  2. Växel «NVDA Line | Raket». Raket är en ny, egen vy (se raket.js) på samma data och samma Bollinger-räls.
 *  4. Trade Rider Academy (akademin.js): lektioner, kontrollfrågor och utmärkelser. Hash #tra. #academy är alias.
 *  3. Tillval «1P | 2P»: delad skärm i både NVDA Line (duo.js, två instanser av NVDA Lines egen motor) och Raket.
 *  5. KS /traderider/spel/: växelns första knapp heter «Trade Rider», hash #trade-rider (äldre #nvda-rider)/#racex/#tra,
 *     plus en liten skalrad med «← Traderider» (dator) och helskärmsknapp (Fullscreen API, CSS-reserv där API:t saknas).
 * Inget i NVDA Lines design, styrning eller mekanik ändras. Motorn läses via window.__trEngine (satt i exposeQa).
 */
import { rsiAtPoints, rsiZone, RSI_HIGH, RSI_LOW, RSI_PERIOD } from './rsi.js'
import { createRaket } from './raket.js'
import { createRabbit } from './rabbit.js'
import { createDuo } from './duo.js'
import { createAkademin } from './akademin.js'
import { isTypingTarget } from './keys.js'
import { t, onLang, mountSwitcher, setPriceKey, STRINGS } from './i18n.js'
import { readSide, cycleIndex, stepSide, ENTRY_SIDE } from './styrmotor.js'
import { MODES, modeFromHash, hashForView, selectMode } from './orientation.js'
import { mountEntrySnap, bindStepGestures, mountRatt } from './snapp.js'
import { mountInstruction } from './instruktion.js'
import { mountFas } from './faser.js'
import { scrubVisibleNames } from './synlig.js'

const bootHash = typeof window !== 'undefined' ? window.__trBootHash || '' : ''

const INK = '#1c1915'
const MUTED = '#8a8478'
const GREEN = '#76b900'
const RED = '#9a3b2a'

const css = `
.nlr-pill{position:fixed;z-index:30;box-sizing:border-box;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${INK}}
.nlr-rsi{display:flex;align-items:stretch;gap:10px;padding:6px 10px 6px 12px;pointer-events:none;max-height:64px;overflow:hidden}
.nlr-rsi-txt{display:flex;flex-direction:column;justify-content:center;min-width:78px}
.nlr-rsi-txt small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600}
.nlr-rsi-txt b{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.15}
.nlr-rsi-txt span{font-size:10px;color:${MUTED}}
.nlr-rsi canvas{flex:1;min-width:0;height:40px;max-height:52px;display:block}
.nlr-rsi.compact{padding:2px 8px;gap:8px;align-items:center}
.nlr-rsi.compact .nlr-rsi-txt{flex-direction:row;align-items:baseline;gap:6px;min-width:0}
.nlr-rsi.compact .nlr-rsi-txt span{display:none}
.nlr-rsi.compact .nlr-rsi-txt b{font-size:13px}
.nlr-rsi.compact canvas{height:16px;max-height:16px}
.nlr-toggle{display:flex;gap:2px;padding:4px}
.nlr-toggle button{border:0;background:transparent;border-radius:999px;padding:0 14px;height:100%;font:500 13px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${INK};cursor:pointer;white-space:nowrap}
.nlr-toggle button[aria-pressed="true"]{background:${INK};color:#f3ede2}
.nlr-toggle button:focus-visible{outline:2px solid ${GREEN};outline-offset:1px}
.tr-skal a{display:flex;align-items:center;border-radius:999px;padding:0 12px;height:100%;font:500 13px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${INK};text-decoration:none;white-space:nowrap}
.tr-skal a:focus-visible{outline:2px solid ${GREEN};outline-offset:1px}
.tr-skal .tr-fs-ico{font-size:15px;line-height:1}
.tr-skal .lang-switcher{display:flex;align-items:center;gap:2px;height:100%}
.tr-skal .lang-switcher-btn{border:0;background:transparent;border-radius:999px;padding:0 8px;height:calc(100% - 8px);font:600 11px "IBM Plex Sans",sans-serif;color:inherit;cursor:pointer}
.tr-skal .lang-switcher-btn.active{background:${INK};color:#f3ede2}
html[data-nlr-view="raket"] .tr-skal .lang-switcher-btn.active{background:#e8f4ff;color:#061022}
html[data-nlr-view="raket"] .tr-skal a{color:#e8f4ff !important;font:600 12px "IBM Plex Mono",ui-monospace,monospace !important;letter-spacing:.06em}
html.tr-fs-css,html.tr-fs-css body{height:100dvh;overflow:hidden}
html.tr-fs-css[data-nlr-view="akademin"],html.tr-fs-css[data-nlr-view="akademin"] body,html.tr-fs-css[data-nlr-view="tra"],html.tr-fs-css[data-nlr-view="tra"] body{overflow:auto}
a[href="/login"]{display:none !important}
.tr-sim{position:fixed;z-index:60;pointer-events:none;box-sizing:border-box;font:600 11px/1.25 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;color:${INK};background:rgba(246,242,234,.94);border:1px solid rgba(28,25,21,.16);border-radius:999px;padding:4px 10px;white-space:nowrap;max-width:calc(100vw - 16px);overflow:hidden;text-overflow:ellipsis}
html[data-nlr-view="raket"] .tr-sim{color:#e8f4ff;background:rgba(8,12,32,.85);border-color:rgba(64,224,255,.5);font:600 11px/1.25 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.04em}
html[data-nlr-view="akademin"] .nlr-ak-in{padding-top:calc(var(--tr-chrome-b, 72px) + 16px)}
html[data-nlr-view="tra"] .nlr-tra-in{padding-top:calc(var(--tr-chrome-b, 72px) + 16px)}
html[data-nlr-view="tra"] .tr-instr,html[data-nlr-view="tra"] .tr-instr-open{display:none !important}
.tr-chrome{position:fixed;z-index:70;display:flex;flex-wrap:wrap;align-items:center;gap:6px;box-sizing:border-box;pointer-events:none;max-width:calc(100vw - 16px)}
.tr-chrome>.nlr-pill,.tr-chrome>.tr-sim,.tr-chrome>.tr-instr-open{position:relative !important;inset:auto !important;pointer-events:auto;flex:0 1 auto;margin:0}
.tr-chrome>.nlr-toggle{max-width:100% !important;overflow:visible !important;flex-wrap:wrap;height:auto;align-items:center}
.tr-chrome .nlr-toggle button{height:28px}
.tr-chrome>.tr-sim{flex:0 1 auto;max-width:none;overflow:visible;text-overflow:clip}
html[data-nlr-solo="0"] header.pointer-events-none,html[data-nlr-solo="0"] [data-tr-linebar]{display:none !important}
html[data-tr-dock="top"],html[data-tr-dock="top"] body{height:100%;overflow:hidden}
html[data-tr-dock="top"] div.relative.h-dvh{margin-top:var(--tr-chrome-b,0px);height:calc(100dvh - var(--tr-chrome-b,0px));max-height:calc(100dvh - var(--tr-chrome-b,0px))}
html[data-tr-dock="top"] .nlr-duo.on,html[data-tr-dock="top"] .nlr-raket.on,html[data-tr-dock="top"] .nlr-rh.on,html[data-tr-dock="top"] .nlr-ak.on,html[data-tr-dock="top"] .nlr-tra.on{top:var(--tr-chrome-b,0px);bottom:auto;height:calc(100dvh - var(--tr-chrome-b,0px))}
html[data-tr-dock="top"] [data-tr-splash] .min-h-dvh{min-height:100%}
html[data-tr-dock="top"][data-nlr-view="akademin"] .nlr-ak-in,html[data-tr-dock="top"][data-nlr-view="tra"] .nlr-tra-in{padding-top:16px}
html[data-tr-dock="top"] .nlr-rh-hud{top:12px}
html[data-tr-dock="top"] .tr-fas{top:calc(var(--tr-header-b, var(--tr-chrome-b, 72px)) + 8px);max-height:calc(100dvh - var(--tr-header-b, 72px) - 16px);overflow:auto}
@media (max-height:560px){
div.relative.h-dvh>.absolute.top-36{display:none !important}
header.pointer-events-none .pointer-events-auto.flex-col>.rounded-xl.text-right{padding:2px 8px !important;width:max-content;max-width:min(220px,46vw)}
header.pointer-events-none .pointer-events-auto.flex-col>.rounded-xl.text-right>.tabular-nums{display:none !important}
header.pointer-events-none .pointer-events-auto.flex-col>.rounded-xl.text-right>.uppercase{white-space:nowrap}
}
@media (max-width:640px){.nlr-rsi-txt{min-width:64px}.nlr-rsi-txt b{font-size:14px}.nlr-toggle button{padding:0 9px;font-size:12px}.tr-skal{padding:3px}.tr-skal .tr-back{display:none}.tr-skal .tr-fs-txt{display:none}.tr-skal button{padding:0 9px}}
@media (max-width:520px){.nlr-toggle{max-width:calc(100vw - 16px);overflow-x:auto}.nlr-toggle button{padding:0 8px;font-size:11px}header.pointer-events-none{flex-wrap:wrap}header.pointer-events-none>.pointer-events-auto:first-child{min-width:0;max-width:100%;flex:1 1 100%}header.pointer-events-none .overflow-x-auto{max-width:100%}header.pointer-events-none .overflow-x-auto button{min-width:0;padding-left:6px;padding-right:6px;font-size:11px;height:32px}}
`

function el(tag, cls, html) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html != null) e.innerHTML = html
  return e
}

function findButton(re) {
  return [...document.querySelectorAll('button')].find((b) => re.test((b.textContent ?? '').trim()))
}

/** Kopiera utseendet från en befintlig bricka (periodväljaren) så att tilläggen får samma stil. */
function copySkin(from, to) {
  if (!from) return
  const cs = getComputedStyle(from)
  for (const k of ['backgroundColor', 'border', 'borderRadius', 'boxShadow', 'backdropFilter']) to.style[k] = cs[k]
  to.style.webkitBackdropFilter = cs.backdropFilter
}

function waitEngine() {
  return new Promise((resolve) => {
    const tick = () => {
      const e = window.__trEngine
      if (e && e.track && e.track.points && e.track.points.length && findButton(/^(Live|1D)$/)) return resolve(e)
      setTimeout(tick, 100)
    }
    tick()
  })
}

const BAND_LABEL = /^(Övning|Practice|Тренування|På grafen|On chart|На графіку|När|When|Коли|Band|Bands|Смуги|1D|5D|1M|6M|1Y|5Y|Max|Maks|Live)$/

function shownBox(el) {
  if (!el) return null
  const cs = getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null
  return r
}

function progressMeter() {
  const root = document.querySelector('div.relative.h-dvh')
  if (!root) return null
  return [...root.querySelectorAll('div')].find((node) => {
    const cls = String(node.className)
    return cls.includes('h-1') && cls.includes('max-w-3xl') && cls.includes('rounded-full')
  }) ?? null
}

function practiceCard() {
  const header = document.querySelector('header.pointer-events-none')
  if (!header || getComputedStyle(header).display === 'none') return null
  const notes = new Set([STRINGS.sv['hud.resultNote'], STRINGS.en['hud.resultNote'], STRINGS.uk['hud.resultNote']])
  const names = [STRINGS.sv['hud.result'], STRINGS.en['hud.result'], STRINGS.uk['hud.result']]
  for (const node of header.querySelectorAll('div')) {
    if (node.children.length !== 2) continue
    const head = (node.children[0].textContent || '').trim()
    const note = (node.children[1].textContent || '').trim()
    if (!notes.has(note)) continue
    if (!names.some((name) => head === name || head.startsWith(`${name} `) || head.startsWith(`${name} ·`))) continue
    return node
  }
  return null
}

function tradeButtons() {
  return [...document.querySelectorAll('button[data-tr="buy"],button[data-tr="sell"],button[data-tr="flat"]')].filter((b) => {
    const r = b.getBoundingClientRect()
    return r.width > 8 && r.height > 8
  })
}

/** Kortet får inte ligga över köpraden när spelplanen är nedskjuten under lägesraden. */
function fitPracticeCard() {
  const card = practiceCard()
  if (!card) return
  const note = card.children[1]
  const row = card.previousElementSibling
  const tile = row?.firstElementChild
  const short = innerHeight <= 560
  const restorePrice = () => {
    if (!row?.dataset.trFitPrice) return
    delete row.dataset.trFitPrice
    if (tile) tile.style.padding = ''
    for (const child of row.querySelectorAll('[data-tr-fit-hide]')) {
      child.style.display = ''
      delete child.dataset.trFitHide
    }
  }
  if (!short) {
    note.style.display = ''
    card.style.marginTop = ''
    restorePrice()
    return
  }
  note.style.display = 'none'
  card.style.marginTop = ''
  restorePrice()
  const limitFor = () => {
    const r = card.getBoundingClientRect()
    let limit = Infinity
    for (const b of tradeButtons()) {
      const br = b.getBoundingClientRect()
      const iw = Math.min(r.right, br.right) - Math.max(r.left, br.left)
      if (iw <= 2) continue
      limit = Math.min(limit, br.top)
    }
    return limit
  }
  const crosses = () => {
    const limit = limitFor()
    return Number.isFinite(limit) && card.getBoundingClientRect().bottom > limit + 0.5
  }
  if (crosses() && tile && tile.children.length >= 2) {
    row.dataset.trFitPrice = '1'
    tile.style.padding = '2px 8px'
    for (const child of [tile.children[0], tile.children[2]]) {
      if (!child) continue
      child.style.display = 'none'
      child.dataset.trFitHide = '1'
    }
  }
  const limit = limitFor()
  if (Number.isFinite(limit)) {
    const over = card.getBoundingClientRect().bottom - (limit - 4)
    if (over > 1) card.style.marginTop = `${-Math.ceil(over)}px`
  }
}

/** Underkanten på sidhuvudet och korten som ligger i den övre delen av spelplanen. */
function bandFloor(pane) {
  let floor = pane.top
  const topLimit = pane.top + pane.height * 0.62
  const take = (r) => {
    if (!r || r.height > pane.height * 0.7) return
    if (r.bottom <= pane.top + 1 || r.top > topLimit) return
    floor = Math.max(floor, r.bottom)
  }
  take(shownBox(document.querySelector('header.pointer-events-none')))
  for (const node of document.querySelectorAll('div, span, small, p, button')) {
    if (node.closest('.nlr-rsi, .tr-chrome, [data-tr-splash], .nlr-raket, .nlr-duo, .nlr-rh, .nlr-ak, .nlr-tra')) continue
    if (node.children.length) continue
    const text = (node.textContent || '').trim()
    if (!BAND_LABEL.test(text)) continue
    let tile = node
    for (let n = node.parentElement; n && n !== document.body; n = n.parentElement) {
      const r = n.getBoundingClientRect()
      if (r.height > 140 || r.height < 8) break
      tile = n
    }
    take(shownBox(tile))
  }
  return floor
}

function periodLabel(eng) {
  const key = eng.spec?.key
  return { live: '1D', '5d': '5D', '1mo': '1M', '6mo': '6M', '1y': '1Y', '5y': '5Y', max: t('period.max') }[key] ?? key ?? '—'
}

async function main() {
  const eng = await waitEngine()
  const style = el('style')
  style.id = 'nvda-line-rsi-style'
  style.textContent = css
  document.head.appendChild(style)

  const periodPill = findButton(/^(Live|1D)$/)?.parentElement ?? null
  const TITLE_RE = /^(?:NVDA (?:Line|Rider)|Trade Rider)$/
  let titleEl = [...document.querySelectorAll('h1,h2,div,span')].find((x) => TITLE_RE.test((x.textContent ?? '').trim()))
  let titlePill = titleEl?.closest('div[class*="rounded"]') ?? titleEl?.parentElement ?? null

  function refreshTitle() {
    const name = t(MODES.trendRider.nameKey)
    const fresh = [...document.querySelectorAll('h1,h2,div,span')].find((x) => TITLE_RE.test((x.textContent ?? '').trim()))
    if (fresh) titleEl = fresh
    if (titleEl?.isConnected) {
      if ((titleEl.textContent ?? '').trim() !== name) titleEl.textContent = name
      titleEl.dataset.trTradeTitle = '1'
      titlePill = titleEl.closest('div[class*="rounded"]') ?? titleEl.parentElement ?? titlePill
    }
    scrubVisibleNames(document, name)
  }

  // ---------- 1. RSI-panel ----------
  const panel = el('div', 'nlr-pill nlr-rsi')
  panel.setAttribute('role', 'img')
  panel.dataset.nlr = 'rsi'
  const txt = el('div', 'nlr-rsi-txt', `<small>RSI ${RSI_PERIOD}</small><b>—</b><span>—</span>`)
  const cv = el('canvas')
  panel.append(txt, cv)
  copySkin(periodPill, panel)
  document.body.appendChild(panel)

  let cacheTrack = null
  let cacheQuote = null
  let series = []
  const valueEl = txt.querySelector('b')
  const zoneEl = txt.querySelector('span')

  function recompute() {
    if (eng.track === cacheTrack && eng.quote === cacheQuote) return
    cacheTrack = eng.track
    cacheQuote = eng.quote
    series = rsiAtPoints(eng.quote?.candles ?? [], eng.track?.points ?? [])
  }

  function layoutPanel() {
    const mobile = innerWidth <= 640
    let h = mobile ? 50 : 58
    let canvasH = h - 12
    const park = () => {
      panel.style.top = `${innerHeight + 16}px`
      panel.style.height = `${h}px`
      panel.style.maxHeight = '64px'
      panel.style.overflow = 'hidden'
      cv.style.height = `${canvasH}px`
      cv.style.maxHeight = '52px'
    }
    const buy = document.querySelector('button[data-tr="buy"]')
    const grid = buy?.parentElement
    if (!grid) return park()
    const row = grid.getBoundingClientRect()
    const anchor = row.height > innerHeight * 0.45 ? buy.getBoundingClientRect() : row
    const pane = document.querySelector('div.relative.h-dvh')?.getBoundingClientRect()
    if (!pane || anchor.width < 2 || anchor.top > pane.bottom - 8 || anchor.bottom < pane.top + 8) return park()
    const minTop = Math.round(bandFloor(pane) + 4)
    const aboveMax = Math.round(anchor.top - h - 4)
    let top = Math.round(anchor.top - h - 8)
    if (top > aboveMax) top = aboveMax
    panel.classList.remove('compact')
    panel.style.padding = ''
    if (top < minTop) {
      let low = anchor.bottom
      for (const el of document.querySelectorAll('button')) {
        if (el.closest('.tr-chrome, header.pointer-events-none, [data-tr-splash], .nlr-raket, .nlr-duo, .nlr-rh, .nlr-ak, .nlr-tra')) continue
        const r = el.getBoundingClientRect()
        if (r.width < 8 || r.height < 8 || r.bottom > pane.bottom + 2 || r.top < anchor.top - 8) continue
        if (r.bottom > low) low = r.bottom
      }
      const meter = progressMeter()
      const meterBox = shownBox(meter)
      if (meterBox && meterBox.top >= anchor.top - 4 && meterBox.bottom <= pane.bottom + 2) low = Math.max(low, meterBox.bottom)
      const below = Math.round(low + 2)
      const room = Math.floor(pane.bottom - below - 2)
      if (room < 12) return park()
      const compactH = Math.min(28, room)
      top = below
      h = compactH
      canvasH = Math.max(10, compactH - 4)
      panel.classList.add('compact')
      panel.style.padding = compactH < 24 ? '0 8px' : ''
    }
    panel.style.left = `${Math.round(Math.max(pane.left, anchor.left))}px`
    panel.style.width = `${Math.round(Math.min(anchor.width, pane.width, innerWidth))}px`
    panel.style.top = `${top}px`
    panel.style.height = `${h}px`
    panel.style.maxHeight = '64px'
    panel.style.overflow = 'hidden'
    cv.style.height = `${canvasH}px`
    cv.style.maxHeight = '52px'
    cv.style.width = '100%'
  }

  function drawPanel() {
    recompute()
    const dpr = Math.min(2, devicePixelRatio || 1)
    const W = Math.min(innerWidth, Math.max(10, cv.clientWidth || 10))
    const H = Math.min(52, Math.max(10, parseFloat(cv.style.height) || 40))
    const bw = Math.min(2048, Math.round(W * dpr))
    const bh = Math.min(128, Math.round(H * dpr))
    if (cv.width !== bw || cv.height !== bh) {
      cv.width = bw
      cv.height = bh
    }
    const c = cv.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, W, H)
    const n = series.length
    const hud = eng.hudSnap ? eng.hudSnap() : null
    const idx = hud ? Math.max(0, Math.min(n - 1, hud.candleIndex)) : 0
    const cur = n ? series[idx] : null
    const pad = 4
    const y = (v) => pad + (1 - v / 100) * (H - pad * 2)
    const x = (i) => (n <= 1 ? 0 : (i / (n - 1)) * (W - 22))
    // zoner och nivåer
    c.fillStyle = 'rgba(154,59,42,0.08)'
    c.fillRect(0, y(100), W - 22, y(RSI_HIGH) - y(100))
    c.fillStyle = 'rgba(118,185,0,0.10)'
    c.fillRect(0, y(RSI_LOW), W - 22, y(0) - y(RSI_LOW))
    c.setLineDash([3, 4])
    c.lineWidth = 1
    for (const [lv, col] of [[RSI_HIGH, RED], [RSI_LOW, '#4d7a00']]) {
      c.strokeStyle = col
      c.globalAlpha = 0.7
      c.beginPath()
      c.moveTo(0, y(lv))
      c.lineTo(W - 22, y(lv))
      c.stroke()
      c.globalAlpha = 1
      if (panel.classList.contains('compact')) continue
      c.fillStyle = col
      c.font = '600 9px "IBM Plex Sans", sans-serif'
      c.textBaseline = 'middle'
      c.fillText(String(lv), W - 18, y(lv))
    }
    c.setLineDash([])
    const valid = series.some((v) => v != null)
    if (!valid) {
      c.fillStyle = MUTED
      c.font = '500 12px "IBM Plex Sans", sans-serif'
      c.textBaseline = 'middle'
      c.fillText(t('rsi.missing', { n: RSI_PERIOD + 1 }), 6, H / 2)
    } else {
      // linje, med luckor där RSI saknas; passerad del mörkare
      for (const part of ['past', 'future']) {
        c.strokeStyle = part === 'past' ? INK : 'rgba(28,25,21,0.28)'
        c.lineWidth = part === 'past' ? 1.6 : 1.2
        c.beginPath()
        let pen = false
        const from = part === 'past' ? 0 : idx
        const to = part === 'past' ? idx : n - 1
        for (let i = from; i <= to; i++) {
          const v = series[i]
          if (v == null) {
            pen = false
            continue
          }
          if (!pen) c.moveTo(x(i), y(v))
          else c.lineTo(x(i), y(v))
          pen = true
        }
        c.stroke()
      }
      // position
      c.strokeStyle = 'rgba(28,25,21,0.25)'
      c.beginPath()
      c.moveTo(x(idx), pad)
      c.lineTo(x(idx), H - pad)
      c.stroke()
      if (cur != null) {
        c.fillStyle = cur >= RSI_HIGH ? RED : cur <= RSI_LOW ? '#4d7a00' : INK
        c.beginPath()
        c.arc(x(idx), y(cur), 3.2, 0, Math.PI * 2)
        c.fill()
      }
    }
    const z = rsiZone(cur)
    const warming = cur == null && valid && idx < RSI_PERIOD
    const rsiVal = cur == null ? (warming ? t('rsi.warming', { n: RSI_PERIOD + 1 }) : t('rsi.none')) : cur.toFixed(1)
    valueEl.textContent = cur == null ? '—' : cur.toFixed(1)
    valueEl.style.color = z === 'overkopt' ? RED : z === 'oversalt' ? '#4d7a00' : INK
    zoneEl.textContent = `${periodLabel(eng)} · ${z === 'overkopt' ? t('rsi.zoneHigh') : z === 'oversalt' ? t('rsi.zoneLow') : z === 'neutral' ? t('rsi.zoneMid') : rsiVal}`
    panel.setAttribute('aria-label', t('rsi.aria', { period: RSI_PERIOD, range: periodLabel(eng), value: cur == null ? rsiVal : cur.toFixed(1) }))
  }

  // ---------- 2. Växel NVDA Line | Raket ----------
  const toggle = el('div', 'nlr-pill nlr-toggle')
  toggle.setAttribute('role', 'group')
  toggle.setAttribute('aria-label', t('mode.aria'))
  const bLine = el('button', '', t(MODES.trendRider.nameKey))
  const bRaket = el('button', '', t(MODES.raket.nameKey))
  const bAcademy = el('button', '', t(MODES.akademin.nameKey))
  const bRabbit = el('button', '', t(MODES.rabbitHole.nameKey))
  bLine.type = bRaket.type = bAcademy.type = bRabbit.type = 'button'
  toggle.append(bLine, bRaket, bAcademy, bRabbit)
  copySkin(periodPill, toggle)
  toggle.style.zIndex = '60'
  document.body.appendChild(toggle)

  function layoutToggle() {
    const mobile = innerWidth <= 640
    const pr = periodPill?.getBoundingClientRect()
    const tr = titlePill?.getBoundingClientRect()
    const h = mobile ? 36 : pr ? Math.round(pr.height) : 40
    toggle.style.height = `${h}px`
    if (!mobile && tr) {
      toggle.style.left = `${Math.round(tr.right + 10)}px`
      toggle.style.top = `${Math.round(tr.top + (tr.height - h) / 2)}px`
    } else if (pr) {
      // mobil: under periodväljaren – och under kurs-/P&L-brickorna till höger så att raden inte lägger sig över dem
      const right = view === 'line' ? document.querySelector('header.pointer-events-none > div.pointer-events-auto:last-child') : null
      const rb = right ? right.getBoundingClientRect().bottom : 0
      toggle.style.left = `${Math.round(pr.left)}px`
      toggle.style.top = `${Math.round(Math.max(pr.bottom, rb) + 8)}px`
    }
  }

  const raket = createRaket({ engine: eng, skinFrom: periodPill })
  const duo = createDuo({ engine: eng, skinFrom: periodPill })
  const akademin = createAkademin({ engine: eng, skinFrom: periodPill })
  const rabbit = createRabbit()
  let view = 'line'
  let mode = '1p'
  let resumeLine = false

  function orientationFor(v = view) {
    if (v === 'raket') return MODES.raket.orientation
    if (v === 'rabbit') return MODES.rabbitHole.orientation
    return MODES.trendRider.orientation
  }
  const instr = mountInstruction(document.body, {
    getOrientation: () => orientationFor(),
    isActive: () => true,
  })
  const fas = mountFas(document.body, {
    getOrientation: () => orientationFor(),
    getPlace: () => (view === 'rabbit' ? 'bottom' : 'chart'),
    isActive: () => !instr.isOpen(),
    onFreeze: (frozen) => (frozen ? rabbit.freeze() : rabbit.resume()),
  })
  instr.onStart(() => {
    if (eng.playing) eng.pause()
    fas.play()
  })

  // ---------- 3. Växel 1P | 2P ----------
  const modeToggle = el('div', 'nlr-pill nlr-toggle')
  modeToggle.setAttribute('role', 'group')
  modeToggle.setAttribute('aria-label', t('players.aria'))
  const b1 = el('button', '', t('players.1'))
  const b2 = el('button', '', t('players.2'))
  b1.type = b2.type = 'button'
  b1.title = t('players.1title')
  b2.title = t('players.2title')
  modeToggle.append(b1, b2)
  copySkin(periodPill, modeToggle)
  modeToggle.style.zIndex = '60'
  document.body.appendChild(modeToggle)

  // ---------- 5. Skalrad: tillbaka till Traderider + helskärm ----------
  const skal = el('div', 'nlr-pill nlr-toggle tr-skal')
  skal.setAttribute('role', 'group')
  skal.setAttribute('aria-label', t('shell.aria'))
  const back = el('a', 'tr-back', t('shell.back'))
  back.href = '/traderider/'
  const bFs = el('button', 'tr-fs', '<span class="tr-fs-ico" aria-hidden="true">⛶</span><span class="tr-fs-txt"></span>')
  const langSlot = el('span', 'tr-lang-slot')
  bFs.type = 'button'
  skal.append(back, bFs, langSlot)
  mountSwitcher(langSlot)
  copySkin(periodPill, skal)
  skal.style.zIndex = '60'
  document.body.appendChild(skal)

  // ---------- 6. Synlig etikett: simulerade kurser, inte verkliga marknadsdata (i varje läge) ----------
  const sim = el('div', 'tr-sim', t('sim.label'))
  sim.setAttribute('role', 'note')
  sim.dataset.trSim = '1'
  document.body.appendChild(sim)
  function layoutSim() {
    const anchor = innerWidth <= 520 ? skal : modeToggle.style.display !== 'none' ? modeToggle : toggle
    const r = anchor.getBoundingClientRect()
    const w = sim.getBoundingClientRect().width
    sim.style.left = `${Math.round(Math.min(Math.max(8, r.left), innerWidth - w - 8))}px`
    sim.style.top = `${Math.round(r.bottom + 6)}px`
  }
  function syncGameHeader() {
    const header = document.querySelector('header.pointer-events-none')
    if (header) header.style.visibility = view === 'rabbit' ? 'hidden' : ''
  }
  const docEl = document.documentElement
  const fsApi = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen)
  const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || docEl.classList.contains('tr-fs-css')
  function fsLabel() {
    const on = fsOn()
    bFs.setAttribute('aria-pressed', String(on))
    bFs.setAttribute('aria-label', on ? t('shell.fsExit') : t('shell.fs'))
    bFs.title = on ? t('shell.fsExit') : t('shell.fs')
    bFs.querySelector('.tr-fs-ico').textContent = on ? '✕' : '⛶'
    bFs.querySelector('.tr-fs-txt').textContent = on ? t('shell.fsExitShort') : t('shell.fsShort')
  }
  bFs.onclick = async () => {
    try {
      if (fsApi) {
        if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document)
        else await (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl)
      } else {
        // t.ex. iPhone Safari: inget Fullscreen API för sidor – spelytan fyller redan fönstret, vi låser bara scrollen.
        docEl.classList.toggle('tr-fs-css')
        scrollTo(0, 0)
      }
    } catch {
      docEl.classList.toggle('tr-fs-css')
    }
    bFs.blur()
    fsLabel()
    dispatchEvent(new Event('resize'))
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && docEl.classList.contains('tr-fs-css')) {
      docEl.classList.remove('tr-fs-css')
      fsLabel()
    }
  })
  document.addEventListener('fullscreenchange', fsLabel)
  document.addEventListener('webkitfullscreenchange', fsLabel)
  fsLabel()

  function apply(push = true) {
    const lineSolo = view === 'line' && mode === '1p'
    document.documentElement.dataset.nlrView = view // Raket-läget får HUD-stil på växlarna (CSS i raket.js)
    bLine.setAttribute('aria-pressed', String(view === 'line'))
    bRaket.setAttribute('aria-pressed', String(view === 'raket'))
    bAcademy.setAttribute('aria-pressed', String(view === 'akademin'))
    bRabbit.setAttribute('aria-pressed', String(view === 'rabbit'))
    document.title = viewTitle()
    modeToggle.style.display = view === 'akademin' || view === 'rabbit' ? 'none' : ''
    b1.setAttribute('aria-pressed', String(mode === '1p'))
    b2.setAttribute('aria-pressed', String(mode === '2p'))
    if (!lineSolo) {
      if (eng.playing) {
        resumeLine = true
        eng.pause()
      }
      panel.style.display = 'none'
    }
    if (view === 'akademin') {
      duo.hide()
      raket.hide()
      rabbit.hide()
      akademin.show()
    } else if (view === 'rabbit') {
      akademin.hide()
      duo.hide()
      raket.hide()
      rabbit.show()
    } else if (view === 'raket') {
      akademin.hide()
      rabbit.hide()
      duo.hide()
      raket.setMode(mode)
      raket.show()
    } else if (mode === '2p') {
      akademin.hide()
      rabbit.hide()
      raket.hide()
      duo.visible() || duo.show()
    } else {
      akademin.hide()
      rabbit.hide()
      raket.hide()
      duo.hide()
      panel.style.display = ''
      if (resumeLine && !instr.isOpen() && !fas.isCovering()) eng.play()
      resumeLine = false
    }
    instr.sync()
    fas.sync()
    syncGameHeader()
    if (instr.isOpen() || fas.isCovering()) {
      if (eng.playing) eng.pause()
    }
    syncSnap()
    if (push) {
      const slug = hashForView(view)
      const h = slug + (mode === '2p' && view !== 'akademin' && view !== 'rabbit' ? '-2p' : '')
      try {
        history.replaceState(history.state, '', `#${h}`)
      } catch {
        /* ignore */
      }
    }
  }
  function viewTitle() {
    if (view === 'raket') return t(MODES.raket.nameKey)
    if (view === 'akademin') return t(MODES.akademin.nameKey)
    if (view === 'rabbit') return t(MODES.rabbitHole.nameKey)
    return t(MODES.trendRider.nameKey)
  }
  function setView(v, push = true) {
    if (v === view) return
    view = v
    apply(push)
  }
  function setMode(m, push = true) {
    if (m === mode) return
    mode = m
    apply(push)
  }
  bLine.setAttribute('aria-pressed', 'true')
  bRaket.setAttribute('aria-pressed', 'false')
  bAcademy.setAttribute('aria-pressed', 'false')
  bRabbit.setAttribute('aria-pressed', 'false')
  b1.setAttribute('aria-pressed', 'true')
  b2.setAttribute('aria-pressed', 'false')
  bLine.onclick = () => setView(selectMode({ via: 'click', value: 1 }))
  bRaket.onclick = () => setView(selectMode({ via: 'click', value: 2 }))
  bAcademy.onclick = () => setView(selectMode({ via: 'click', value: 3 }))
  bRabbit.onclick = () => setView(selectMode({ via: 'click', value: 4 }))
  b1.onclick = () => setMode('1p')
  b2.onclick = () => setMode('2p')
  let hashBooted = false
  const fromHash = (source) => {
    const h = source == null ? location.hash : source
    view = modeFromHash(h)
    mode = String(h).includes('2p') ? '2p' : '1p'
    const slug = hashForView(view) + (mode === '2p' && view !== 'akademin' && view !== 'rabbit' ? '-2p' : '')
    apply(location.hash !== `#${slug}`)
  }
  addEventListener('hashchange', () => fromHash(location.hash))
  addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      const next = selectMode({ via: 'key', value: e.code })
      if (!next) return
      e.preventDefault()
      setView(next)
    },
    true,
  )

  function labelChrome() {
    toggle.setAttribute('aria-label', t('mode.aria'))
    bLine.textContent = t(MODES.trendRider.nameKey)
    bRaket.textContent = t(MODES.raket.nameKey)
    bAcademy.textContent = t(MODES.akademin.nameKey)
    bRabbit.textContent = t(MODES.rabbitHole.nameKey)
    modeToggle.setAttribute('aria-label', t('players.aria'))
    b1.textContent = t('players.1')
    b2.textContent = t('players.2')
    b1.title = t('players.1title')
    b2.title = t('players.2title')
    skal.setAttribute('aria-label', t('shell.aria'))
    back.textContent = t('shell.back')
    sim.textContent = t('sim.label')
    document.title = viewTitle()
    refreshTitle()
    instr.sync()
    fas.sync()
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.content = t('page.desc')
    fsLabel()
    entrySnap?.paint()
  }

  let entrySide = ENTRY_SIDE
  let entryDone = false
  const entrySnap = mountEntrySnap(document.body, {
    getSide: () => entrySide,
    applyDir: (dir) => {
      entrySide = stepEntry(dir)
    },
  })
  function stepEntry(dir) {
    return stepSide(entrySide, dir)
  }
  window.__trCommitEntry = () => {
    const eng = window.__trEngine
    if (!eng?.train) return
    let guard = 0
    while (readSide(eng.train) !== entrySide && guard++ < 3) {
      const cur = cycleIndex(readSide(eng.train))
      const dir = cycleIndex(entrySide) > cur ? 1 : -1
      eng.choose(dir > 0 ? 'buy' : 'sell')
    }
    entryDone = true
    entrySnap.root.style.display = 'none'
  }
  function syncSnap() {
    const splash = document.querySelector('[data-tr-splash]')
    const show = view === 'line' && mode === '1p' && !entryDone && !splash
    entrySnap.root.style.display = show ? '' : 'none'
  }
  bindStepGestures(document.body, {
    enabled: () => entryDone && view === 'line' && mode === '1p',
    getSide: () => readSide(window.__trEngine?.train),
    applyDir: (dir) => window.__trEngine?.choose(dir > 0 ? 'buy' : 'sell'),
  })
  mountRatt()
  onLang(labelChrome)

  // Mellanslag = FLAT i 1P: hindra att en fokuserad knapp (t.ex. kör/paus) dessutom aktiveras på keyup.
  addEventListener(
    'keyup',
    (e) => {
      if (view === 'line' && mode === '1p' && e.code === 'Space' && !isTypingTarget(e.target)) e.preventDefault()
    },
    true,
  )

  function layoutMode() {
    const narrow = innerWidth <= 520
    if (narrow) {
      toggle.style.maxWidth = 'calc(100vw - 16px)'
      if (mode === '2p' || view === 'akademin' || view === 'rabbit') {
        toggle.style.left = '8px'
        toggle.style.top = '8px'
        toggle.style.height = '36px'
      }
      const rowTop = Math.round(toggle.getBoundingClientRect().bottom + 6)
      modeToggle.style.height = toggle.style.height || '36px'
      modeToggle.style.left = '8px'
      modeToggle.style.top = `${rowTop}px`
      const mw = modeToggle.getBoundingClientRect().width
      skal.style.height = modeToggle.style.height
      skal.style.left = `${Math.round(8 + mw + 8)}px`
      skal.style.top = `${rowTop}px`
      return
    }
    toggle.style.maxWidth = ''
    if (mode === '2p' || view === 'akademin') {
      const h = innerWidth <= 640 ? 36 : 40
      toggle.style.height = `${h}px`
      const tw = toggle.getBoundingClientRect().width
      const mw = view === 'akademin' ? -8 : modeToggle.getBoundingClientRect().width
      const sw = skal.getBoundingClientRect().width
      const left = Math.max(4, Math.round((innerWidth - tw - 8 - mw - 8 - sw) / 2))
      toggle.style.left = `${left}px`
      toggle.style.top = '10px'
      modeToggle.style.height = `${h}px`
      modeToggle.style.left = `${left + Math.round(tw) + 8}px`
      modeToggle.style.top = '10px'
      skal.style.height = `${h}px`
      skal.style.left = `${left + Math.round(tw) + 8 + Math.round(mw) + 8}px`
      skal.style.top = '10px'
      return
    }
    const r = toggle.getBoundingClientRect()
    modeToggle.style.height = toggle.style.height
    modeToggle.style.left = `${Math.round(r.right + 8)}px`
    modeToggle.style.top = toggle.style.top
    const m = modeToggle.getBoundingClientRect()
    skal.style.height = toggle.style.height
    skal.style.left = `${Math.round(m.right + 8)}px`
    skal.style.top = toggle.style.top
  }

  const chrome = el('div', 'tr-chrome')
  chrome.append(toggle, modeToggle, skal, sim, instr.reopen)
  document.body.appendChild(chrome)

  function linePriceTile() {
    const captions = new Set([
      STRINGS.sv['sim.price'], STRINGS.en['sim.price'], STRINGS.uk['sim.price'],
      STRINGS.sv['hist.price'], STRINGS.en['hist.price'], STRINGS.uk['hist.price'],
    ])
    for (const node of document.querySelectorAll('header div')) {
      if (node.children.length) continue
      const text = (node.textContent || '').trim()
      if (!captions.has(text) || !String(node.className).includes('uppercase')) continue
      return node.parentElement
    }
    return null
  }

  function syncPriceCaption() {
    const historia = fas.isCovering() && fas.phases.phase() === 'historia'
    setPriceKey(historia ? 'hist.price' : null)
    const simLabels = new Set([STRINGS.sv['sim.price'], STRINGS.en['sim.price'], STRINGS.uk['sim.price']])
    if (!historia) {
      for (const node of document.querySelectorAll('[data-tr-price-swap]')) {
        node.textContent = t('sim.price')
        delete node.dataset.trPriceSwap
      }
      return
    }
    const want = t('hist.price')
    for (const node of document.querySelectorAll('div, small, span, b')) {
      if (node.childNodes.length !== 1 || node.childNodes[0].nodeType !== 3) continue
      if (!simLabels.has((node.textContent || '').trim())) continue
      node.textContent = want
      node.dataset.trPriceSwap = '1'
    }
  }

  function layoutChrome() {
    const narrow = innerWidth <= 640
    const solo = view === 'line' && mode === '1p'
    document.documentElement.dataset.nlrSolo = solo ? '1' : '0'
    document.documentElement.dataset.nlrMode = mode
    const hpx = narrow ? 32 : solo ? 34 : 40
    for (const pill of [toggle, modeToggle, skal]) {
      pill.style.height = 'auto'
      pill.style.minHeight = `${hpx}px`
    }
    for (const node of [toggle, modeToggle, skal, sim]) {
      node.style.left = ''
      node.style.top = ''
      node.style.right = ''
      node.style.bottom = ''
    }
    const splashEl = document.querySelector('[data-tr-splash]')
    const splashOn = !!(splashEl && getComputedStyle(splashEl).display !== 'none' && !splashEl.hidden)
    if (!fas.isCovering()) sim.style.display = splashOn && narrow && solo ? 'none' : ''
    sim.style.flex = '0 1 auto'
    sim.style.maxWidth = 'none'
    const tight = innerWidth <= 1024 || innerHeight <= 520
    const dock = tight || !(view === 'line' && mode === '1p')
    document.documentElement.dataset.trDock = dock ? 'top' : 'band'
    let left = 8
    let top = 8
    let maxW = innerWidth - 16
    const header = document.querySelector('header.pointer-events-none')
    const headerShown = !!(header && getComputedStyle(header).display !== 'none' && header.getBoundingClientRect().height > 2)
    if (dock) {
      left = 0
      top = 0
      maxW = innerWidth
      chrome.style.width = '100%'
      chrome.style.padding = '8px'
      chrome.style.boxSizing = 'border-box'
      chrome.style.background = view === 'raket' ? '#061022' : view === 'rabbit' ? '#140e0c' : '#f3ede2'
    } else {
      chrome.style.width = ''
      chrome.style.padding = ''
      chrome.style.boxSizing = ''
      chrome.style.background = ''
    }
    if (!dock && solo) {
      const title = document.querySelector('[data-tr-trade-title]')
      const tile = linePriceTile()
      let anchorRight = 16
      if (title) anchorRight = Math.max(anchorRight, title.getBoundingClientRect().right)
      if (headerShown) {
        for (const button of header.querySelectorAll('button')) {
          const r = button.getBoundingClientRect()
          if (r.width > 2 && r.top < 140) anchorRight = Math.max(anchorRight, r.right)
        }
      }
      left = Math.round(anchorRight + 10)
      top = Math.round(title ? title.getBoundingClientRect().top : 12)
      let limitLeft = tile ? tile.getBoundingClientRect().left : innerWidth - 8
      const resultNames = new Set([STRINGS.sv['hud.result'], STRINGS.en['hud.result'], STRINGS.uk['hud.result']])
      const headerEl = headerShown ? header : null
      if (headerEl) {
        for (const node of headerEl.querySelectorAll('div')) {
          if (node.children.length) continue
          const text = (node.textContent || '').trim()
          if (![...resultNames].some((name) => text === name || text.startsWith(`${name} ·`) || text.startsWith(`${name} `))) continue
          const r = node.parentElement.getBoundingClientRect()
          if (r.width > 2 && r.top < 240) limitLeft = Math.min(limitLeft, r.left)
        }
      }
      maxW = Math.max(280, Math.round(limitLeft - left - 12))
    }
    if (!dock) {
      if (left < 8) left = 8
      if (left + 120 > innerWidth) left = 8
      maxW = Math.min(maxW, innerWidth - left - 8)
    }
    chrome.style.left = `${left}px`
    chrome.style.top = `${top}px`
    chrome.style.maxWidth = `${Math.round(maxW)}px`
    chrome.style.gap = solo && !narrow ? '4px' : '6px'
    const bottom = Math.round(chrome.getBoundingClientRect().bottom)
    document.documentElement.style.setProperty('--tr-chrome-b', `${bottom}px`)
    const headerBottom = headerShown ? Math.round(header.getBoundingClientRect().bottom) : bottom
    document.documentElement.style.setProperty('--tr-header-b', `${headerBottom}px`)
    const buy = document.querySelector('button[data-tr="buy"]')
    const shell = buy?.parentElement?.parentElement
    if (shell && !shell.closest('.nlr-duo, .nlr-raket')) shell.dataset.trLinebar = '1'
    placeSplash(bottom)
    syncPriceCaption()
    fitPracticeCard()
    const sig = `${dock}:${bottom}:${innerWidth}`
    if (sig !== layoutChrome.sig) {
      layoutChrome.sig = sig
      if (view === 'line' && mode === '2p') duo.layout?.()
      else if (view === 'line' && mode === '1p') window.__trEngine?.resize?.()
    }
  }

  function pinClaim(splash) {
    const inner = splash?.querySelector('p')?.parentElement
    if (!inner) return null
    let line = inner.querySelector('[data-tr-claim-line]')
    const kicker = inner.querySelector('p:not([data-tr-claim-line])')
    if (!line) {
      line = document.createElement('p')
      line.setAttribute('data-tr-claim', '1')
      line.setAttribute('data-tr-claim-line', '1')
      line.style.cssText = 'margin:8px 0;font:600 13px/1.35 "IBM Plex Sans",sans-serif'
      if (kicker) kicker.insertAdjacentElement('afterend', line)
      else inner.prepend(line)
    }
    const text = t('sim.claim')
    if (line.textContent !== text) line.textContent = text
    return inner
  }

  function placeSplash(chromeBottom) {
    const splash = document.querySelector('[data-tr-splash]')
    const innerFromClaim = pinClaim(splash)
    const kicker = splash?.querySelector('p:not([data-tr-claim-line])')
    const body = splash?.querySelectorAll('p')[2]
    if (body) body.setAttribute('data-tr-claim', '1')
    const inner = innerFromClaim || kicker?.parentElement
    if (!inner) return
    if (!inner.dataset.trPadBase) inner.dataset.trPadBase = String(parseFloat(getComputedStyle(inner).paddingTop) || 0)
    const base = Number(inner.dataset.trPadBase) || 0
    const hidden = splash.hidden || getComputedStyle(splash).display === 'none'
    const dock = document.documentElement.dataset.trDock === 'top'
    if (hidden || !dock) {
      inner.style.justifyContent = ''
      inner.style.paddingBottom = ''
      inner.style.paddingTop = `${base}px`
      if (hidden) return
      const overlap = chromeBottom + 8 - kicker.getBoundingClientRect().top
      inner.style.paddingTop = `${base + Math.max(0, overlap)}px`
      return
    }
    const splashHeader = document.querySelector('header.pointer-events-none')
    const splashHeaderShown = !!(splashHeader && getComputedStyle(splashHeader).display !== 'none' && splashHeader.getBoundingClientRect().height > 2)
    const splashTop = splash.getBoundingClientRect().top
    let floor = chromeBottom + 8
    if (splashHeaderShown) floor = Math.max(floor, splashHeader.getBoundingClientRect().bottom + 8)
    inner.style.justifyContent = 'flex-start'
    inner.style.paddingBottom = '16px'
    inner.style.paddingTop = `${Math.max(base, Math.round(floor - splashTop))}px`
  }

  const watch = new ResizeObserver(() => layoutChrome())
  const headerWatch = document.querySelector('header.pointer-events-none')
  const splashWatch = document.querySelector('[data-tr-splash]')
  if (headerWatch) watch.observe(headerWatch)
  if (splashWatch) watch.observe(splashWatch)

  const loop = () => {
    refreshTitle()
    layoutPanel()
    syncGameHeader()
    if (fas.isCovering()) sim.style.display = 'none'
    layoutChrome()
    syncSnap()
    if (view === 'line' && mode === '1p') drawPanel()
    setTimeout(() => requestAnimationFrame(loop), 90)
  }
  loop()
  const firstHash = location.hash || bootHash
  if (!hashBooted) {
    hashBooted = true
    if (firstHash) fromHash(firstHash)
    else apply(true)
  }
  syncSnap()

  window.__nvdaLineRsi = {
    series: () => {
      recompute()
      return series
    },
    current: () => {
      const hud = eng.hudSnap()
      return { index: hud.candleIndex, rsi: series[hud.candleIndex] ?? null, period: eng.spec?.key }
    },
    view: () => view,
    mode: () => mode,
    setView,
    setMode,
    raket,
    duo,
    akademin,
  }
}

main()
