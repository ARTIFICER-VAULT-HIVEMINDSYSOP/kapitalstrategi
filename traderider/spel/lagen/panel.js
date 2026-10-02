/**
 * NVDA Rider – tillägg på samma sida:
 *  1. RSI(14)-panel under grafen, på exakt samma riktiga kursdata som spelet visar (motorns quote.candles),
 *     följer vald period och tågets position. Saknas data visas «saknas».
 *  2. Växel «NVDA Line | Raket». Raket är en ny, egen vy (se raket.js) på samma data och samma Bollinger-räls.
 *  4. Akademin (akademin.js): KS Akademins lektioner i NVDA Line-stil, med utmärkelser.
 *  3. Tillval «1P | 2P»: delad skärm i både NVDA Line (duo.js, två instanser av NVDA Lines egen motor) och Raket.
 *  5. KS /traderider/spel/ (utkast 2026-10-01): växelns första knapp heter «NVDA Rider», hash #nvda-rider/#raket/#akademin,
 *     plus en liten skalrad med «← Traderider» (dator) och helskärmsknapp (Fullscreen API, CSS-reserv där API:t saknas).
 * Inget i NVDA Lines design, styrning eller mekanik ändras. Motorn läses via window.__trEngine (satt i exposeQa).
 */
import { rsiAtPoints, rsiZone, RSI_HIGH, RSI_LOW, RSI_PERIOD } from './rsi.js'
import { createRaket } from './raket.js'
import { createRabbit } from './rabbit.js'
import { createDuo } from './duo.js'
import { createAkademin } from './akademin.js'
import { isTypingTarget } from './keys.js'
import { t, onLang, mountSwitcher } from './i18n.js'
import { readSide, cycleIndex, stepSide, ENTRY_SIDE } from './styrmotor.js'
import { MODES, modeFromHash, hashForView } from './orientation.js'
import { mountEntrySnap, bindStepGestures, mountRatt } from './snapp.js'

const INK = '#1c1915'
const MUTED = '#8a8478'
const GREEN = '#76b900'
const RED = '#9a3b2a'

const css = `
.nlr-pill{position:fixed;z-index:30;box-sizing:border-box;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${INK}}
.nlr-rsi{display:flex;align-items:stretch;gap:10px;padding:6px 10px 6px 12px;pointer-events:none}
.nlr-rsi-txt{display:flex;flex-direction:column;justify-content:center;min-width:78px}
.nlr-rsi-txt small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600}
.nlr-rsi-txt b{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.15}
.nlr-rsi-txt span{font-size:10px;color:${MUTED}}
.nlr-rsi canvas{flex:1;min-width:0;height:100%;display:block}
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
html.tr-fs-css[data-nlr-view="akademin"],html.tr-fs-css[data-nlr-view="akademin"] body{overflow:auto}
a[href="/login"]{display:none !important}
.tr-sim{position:fixed;z-index:60;pointer-events:none;box-sizing:border-box;font:600 11px/1.25 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;color:${INK};background:rgba(246,242,234,.94);border:1px solid rgba(28,25,21,.16);border-radius:999px;padding:4px 10px;white-space:nowrap;max-width:calc(100vw - 16px);overflow:hidden;text-overflow:ellipsis}
html[data-nlr-view="raket"] .tr-sim{color:#e8f4ff;background:rgba(8,12,32,.85);border-color:rgba(64,224,255,.5);font:600 11px/1.25 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.04em}
html[data-nlr-view="akademin"] .nlr-ak-in{padding-top:96px}
@media (max-width:640px){.nlr-rsi-txt{min-width:64px}.nlr-rsi-txt b{font-size:14px}.nlr-toggle button{padding:0 9px;font-size:12px}.tr-skal{padding:3px}.tr-skal .tr-back{display:none}.tr-skal .tr-fs-txt{display:none}.tr-skal button{padding:0 9px}}
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
  const titleEl = [...document.querySelectorAll('h1,h2,div,span')].find((x) => /^NVDA (Line|Rider)$/.test((x.textContent ?? '').trim()))
  const titlePill = titleEl?.closest('div[class*="rounded"]') ?? titleEl?.parentElement ?? null

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
    const buy = document.querySelector('button[data-tr="buy"]')
    const grid = buy?.parentElement
    if (!grid) return
    const r = grid.getBoundingClientRect()
    const mobile = innerWidth <= 640
    const h = mobile ? 50 : 58
    panel.style.left = `${Math.round(r.left)}px`
    panel.style.width = `${Math.round(r.width)}px`
    panel.style.top = `${Math.round(r.top - h - 8)}px`
    panel.style.height = `${h}px`
  }

  function drawPanel() {
    recompute()
    const dpr = Math.min(2, devicePixelRatio || 1)
    const W = Math.max(10, cv.clientWidth)
    const H = Math.max(10, cv.clientHeight)
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
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
      c.fillText(`RSI saknas – för få candles i perioden (minst ${RSI_PERIOD + 1}).`, 6, H / 2)
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
  const bAk = el('button', '', t(MODES.rabbitHole.nameKey))
  bLine.type = bRaket.type = bAk.type = 'button'
  toggle.append(bLine, bRaket, bAk)
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
    const r = toggle.getBoundingClientRect()
    const w = sim.getBoundingClientRect().width
    sim.style.left = `${Math.round(Math.min(Math.max(8, r.left), innerWidth - w - 8))}px`
    sim.style.top = `${Math.round(r.bottom + 6)}px`
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
    bAk.setAttribute('aria-pressed', String(view === 'rabbit'))
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
      if (resumeLine) eng.play()
      resumeLine = false
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
  bAk.setAttribute('aria-pressed', 'false')
  b1.setAttribute('aria-pressed', 'true')
  b2.setAttribute('aria-pressed', 'false')
  bLine.onclick = () => setView('line')
  bRaket.onclick = () => setView('raket')
  bAk.onclick = () => setView('rabbit')
  b1.onclick = () => setMode('1p')
  b2.onclick = () => setMode('2p')
  const fromHash = () => {
    const h = location.hash
    view = modeFromHash(h)
    mode = h.includes('2p') ? '2p' : '1p'
    apply(false)
  }
  addEventListener('hashchange', fromHash)

  function labelChrome() {
    toggle.setAttribute('aria-label', t('mode.aria'))
    bLine.textContent = t(MODES.trendRider.nameKey)
    bRaket.textContent = t(MODES.raket.nameKey)
    bAk.textContent = t(MODES.rabbitHole.nameKey)
    modeToggle.setAttribute('aria-label', t('players.aria'))
    b1.textContent = t('players.1')
    b2.textContent = t('players.2')
    b1.title = t('players.1title')
    b2.title = t('players.2title')
    skal.setAttribute('aria-label', t('shell.aria'))
    back.textContent = t('shell.back')
    sim.textContent = t('sim.label')
    document.title = t('page.title')
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
    const show = view === 'line' && mode === '1p' && !entryDone
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
    if (mode === '2p' || view === 'akademin') {
      // delad skärm / Akademin: båda växlarna centrerade överst, över delningen
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

  const loop = () => {
    layoutPanel()
    layoutToggle()
    layoutMode()
    layoutSim()
    if (view === 'line') drawPanel()
    setTimeout(() => requestAnimationFrame(loop), 90)
  }
  loop()
  if (location.hash) fromHash()
  else apply(true)
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
