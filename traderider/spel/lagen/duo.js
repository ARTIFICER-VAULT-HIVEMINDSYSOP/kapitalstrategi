/**
 * NVDA Line 2P (delad skärm, tillval). Två instanser av NVDA Lines EGEN motor (samma klass, samma ritning av
 * tåget, samma räls) på samma simulerade kurser och samma period. Varje halva har egen position, hävstång och eget
 * simulerat resultat (motorns befintliga P&L-logik). Spelare 1: WASD + mellanslag, spelare 2: pilar + 0; P/R gäller båda.
 * Vänster/höger på bred skärm, över/under på smal. Inget ändras i 1P-läget.
 */
import { keyAction, PREVENT_DEFAULT, HINTS } from './keys.js'
import { simTid } from './simtid.js'
import { t, onLang } from './i18n.js'
import { stepSide, readSide } from './styrmotor.js'
import { bindStepGestures } from './snapp.js'

const css = `
.nlr-duo{position:fixed;inset:0;z-index:45;display:none;background:#f3ede2;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#1c1915}
.nlr-duo.on{display:block}
.nlr-duo-half{position:absolute;overflow:hidden}
.nlr-duo-half canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.nlr-duo-div{position:absolute;background:rgba(28,25,21,.18)}
.nlr-duo-card{position:absolute;box-sizing:border-box;padding:6px 12px;border-radius:16px}
.nlr-duo-card small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a8478;font-weight:600}
.nlr-duo-card b{display:block;font-size:16px;font-weight:600;font-variant-numeric:tabular-nums}
.nlr-duo-who{left:12px;top:12px;max-width:42%}
.nlr-duo-pnl{right:12px;top:12px;text-align:right;max-width:calc(100% - 128px)}
.nlr-duo-ctl{position:absolute;left:50%;transform:translateX(-50%);bottom:10px;width:min(560px,calc(100% - 20px));display:flex;flex-direction:column;gap:6px}
.nlr-duo-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.nlr-duo-row button{min-width:0;padding:0 6px}
.nlr-duo-row svg{width:18px;height:18px;flex:none}
.nlr-duo kbd{font:600 10px/1 "IBM Plex Sans",sans-serif;padding:2px 5px;border-radius:5px;border:1px solid currentColor;opacity:.5;margin:0 3px;white-space:nowrap}
.nlr-duo-info{min-width:0;flex:1;padding:0 6px;font-size:12px;color:#8a8478;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nlr-duo-info b{color:#1c1915;font-weight:500}
.nlr-duo.narrow .nlr-duo-row button{height:40px}
.nlr-duo.narrow .nlr-duo-card b{font-size:14px}
`
const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>'
const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
const ICON_FLAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>'
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
// samma Tailwind-klasser som NVDA Lines egna knappar (finns i sidans CSS)
const BTN = 'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-wide ring-1 transition-colors duration-150 disabled:opacity-60 '
const OFF_BUY = 'bg-surface/92 text-graphite ring-line backdrop-blur-sm hover:bg-nvda-soft'
const OFF = 'bg-surface/92 text-graphite ring-line backdrop-blur-sm hover:bg-paper-deep'
const ON_BUY = 'bg-nvda text-ink ring-nvda-deep'
const ON_SELL = 'bg-danger text-paper ring-danger'
const ON_FLAT = 'bg-paper-deep text-ink ring-line-strong'

function fmtMoney(v) {
  // samma form som NVDA Lines P&L-kort (motorns eget simulerade resultat)
  if (!Number.isFinite(v)) return '—'
  return `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(2)}`
}
function fmtPrice(v) {
  return Number.isFinite(v) && v > 0 ? `$${v.toFixed(2)}` : '—'
}
function periodName(k) {
  return { live: '1D', '5d': '5D', '1mo': '1M', '6mo': '6M', '1y': '1Y', '5y': '5Y', max: 'Max' }[k] ?? k
}

export function createDuo({ engine: main, skinFrom }) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const root = document.createElement('div')
  root.className = 'nlr-duo'
  root.setAttribute('aria-label', t('duo.aria'))
  document.body.appendChild(root)
  const divider = document.createElement('div')
  divider.className = 'nlr-duo-div'
  root.appendChild(divider)
  const skin = skinFrom ? getComputedStyle(skinFrom) : null
  const applySkin = (el) => {
    if (!skin) return
    for (const k of ['backgroundColor', 'border', 'boxShadow', 'backdropFilter']) el.style[k] = skin[k]
  }

  let halves = []
  let visible = false
  let started = false

  function rects() {
    const W = innerWidth
    const H = innerHeight
    root.classList.toggle('narrow', W <= 700)
    if (W > 700) {
      const w = Math.floor(W / 2)
      return [{ x: 0, y: 0, w, h: H }, { x: w, y: 0, w: W - w, h: H }]
    }
    const h = Math.floor(H / 2)
    return [{ x: 0, y: 0, w: W, h }, { x: 0, y: h, w: W, h: H - h }]
  }

  function layout() {
    const rs = rects()
    halves.forEach((hv, i) => {
      Object.assign(hv.el.style, { left: `${rs[i].x}px`, top: `${rs[i].y}px`, width: `${rs[i].w}px`, height: `${rs[i].h}px` })
      // halvor som börjar överst lämnar plats för växlarna (centrerade överst)
      const chromeB = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tr-chrome-b')) || 60
      const top = rs[i].y === 0 ? `${Math.round(chromeB + 8)}px` : '12px'
      hv.el.querySelectorAll('.nlr-duo-card').forEach((c) => (c.style.top = top))
    })
    const r = rs[1]
    Object.assign(divider.style, r.x > 0 ? { left: `${r.x}px`, top: '0', width: '1px', height: '100%' } : { left: '0', top: `${r.y}px`, width: '100%', height: '1px' })
    for (const hv of halves) hv.eng?.resize()
  }

  function makeHalf(i) {
    const hint = HINTS[i === 0 ? 'p1' : 'p2']
    const el = document.createElement('div')
    el.className = 'nlr-duo-half'
    el.dataset.player = String(i + 1)
    el.innerHTML = `
      <canvas></canvas>
      <div class="nlr-duo-card nlr-duo-who"><small data-k="who"></small><b data-k="pos"></b></div>
      <div class="nlr-duo-card nlr-duo-pnl"><small data-k="pnlLabel"></small><b data-k="pnl">—</b></div>
      <div class="nlr-duo-ctl">
        <div class="nlr-duo-row">
          <button type="button" data-k="buy" class="${BTN}${OFF_BUY}">${ICON_UP}<span data-k="buyLbl"></span><kbd>${hint.buy}</kbd></button>
          <button type="button" data-k="sell" class="${BTN}${OFF}">${ICON_DOWN}<span data-k="sellLbl"></span><kbd>${hint.sell}</kbd></button>
          <button type="button" data-k="flat" class="${BTN}${OFF}"><i data-k="flatIcon" style="display:contents">${ICON_FLAT}</i><span data-k="flatLbl"></span><kbd>${hint.flat}</kbd></button>
        </div>
        <div class="flex items-center gap-2 rounded-xl bg-surface/92 p-1.5 ring-1 ring-line backdrop-blur-sm">
          <button type="button" data-k="play" class="flex h-11 min-w-11 items-center justify-center rounded-lg bg-ink text-paper">▶</button>
          <div class="flex items-center rounded-lg bg-paper-deep/80">
            <button type="button" data-k="levDown" class="flex h-11 min-w-11 items-center justify-center text-graphite disabled:opacity-35"><kbd>${hint.levDown}</kbd>−</button>
            <div class="min-w-12 px-1 text-center"><div class="text-[10px] uppercase tracking-[0.12em] text-muted" data-k="levName"></div><div class="text-sm font-semibold tabular-nums leading-none" data-k="lev">1×</div></div>
            <button type="button" data-k="levUp" class="flex h-11 min-w-11 items-center justify-center text-graphite disabled:opacity-35"><kbd>${hint.levUp}</kbd>+</button>
          </div>
          <span class="nlr-duo-info" data-k="info">—</span>
        </div>
      </div>`
    root.appendChild(el)
    el.querySelectorAll('.nlr-duo-card').forEach(applySkin)
    const q = (k) => el.querySelector(`[data-k="${k}"]`)
    const bind = (k, fn) => {
      const b = q(k)
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        fn()
      })
      b.addEventListener('click', (e) => {
        if (e.detail === 0) fn()
      })
    }
    bind('buy', () => act(i + 1, 'buy'))
    bind('sell', () => act(i + 1, 'sell'))
    bind('flat', () => act(i + 1, 'flat'))
    bind('levDown', () => act(i + 1, 'levDown'))
    bind('levUp', () => act(i + 1, 'levUp'))
    bind('play', () => act(0, 'pause'))
    return { el, q, canvas: el.querySelector('canvas'), eng: null, hud: null }
  }

  function newEngine(canvas) {
    // motorn sätter window.__trEngine/__controlsTest i konstruktorn – återställ så att 1P-läget pekar rätt
    const saved = [window.__trEngine, window.__controlsTest]
    const Eng = main.constructor
    const e = new Eng(canvas, main.quote, main.spec, main.sprites)
    window.__trEngine = saved[0]
    window.__controlsTest = saved[1]
    e.unbind() // tangenter fördelas per spelare här i stället
    e.setLeverage(1)
    e.train.flat = true // 2P börjar utan position
    return e
  }

  function build() {
    destroy()
    halves = [makeHalf(0), makeHalf(1)]
    layout()
    halves.forEach((hv, i) => {
      hv.eng = newEngine(hv.canvas)
      bindStepGestures(hv.canvas, {
        enabled: () => visible,
        getSide: () => readSide(hv.eng?.train),
        applyDir: (dir) => act(i + 1, dir > 0 ? 'buy' : 'sell'),
      })
      if (i === 1) hv.eng.audio.setMuted(true) // ett ljud räcker
      hv.eng.onHud = (h) => {
        hv.hud = h
        paint(i)
      }
      hv.eng.start()
      hv.hud = hv.eng.hudSnap()
      paint(i)
    })
    started = false
  }

  function destroy() {
    for (const hv of halves) {
      hv.eng?.destroy()
      hv.el.remove()
    }
    halves = []
  }

  function paint(i) {
    const hv = halves[i]
    const h = hv?.hud
    if (!h) return
    const q = hv.q
    const hint = HINTS[i === 0 ? 'p1' : 'p2']
    q('who').textContent = t('duo.player', { n: i + 1 })
    q('buyLbl').textContent = t('btn.buy')
    q('sellLbl').textContent = t('btn.sell')
    q('flatLbl').textContent = t('btn.flat')
    q('levName').textContent = t('btn.leverage')
    q('play').setAttribute('aria-label', t('btn.playPause'))
    q('levDown').setAttribute('aria-label', t('btn.lower', { key: hint.levDown }))
    q('levUp').setAttribute('aria-label', t('btn.raise', { key: hint.levUp }))
    const pos = h.finished ? t('pos.goal') : h.flat ? t('pos.flat') : h.side === 'buy' ? t('pos.long') : t('pos.short')
    q('pos').textContent = pos
    q('pnlLabel').textContent = t('hud.result')
    q('pnl').textContent = t('hud.resultNote')
    q('pnl').style.color = '#1c1915'
    q('lev').textContent = `${h.leverage}×`
    q('levDown').disabled = h.leverage <= 1
    q('levUp').disabled = h.leverage >= 10
    q('play').textContent = h.playing ? '❚❚' : '▶'
    const d = h.date ? simTid(h.date, h.rangeKey) : ''
    q('info').innerHTML = `<b>${pos}</b> · ${fmtPrice(h.price)} · ${periodName(h.rangeKey)}${d ? ` · ${d}` : ''}`
    q('buy').className = BTN + (!h.flat && h.side === 'buy' ? ON_BUY : OFF_BUY)
    q('sell').className = BTN + (!h.flat && h.side === 'sell' ? ON_SELL : OFF)
    const fb = q('flat')
    fb.className = BTN + (h.flat ? ON_FLAT : OFF)
    fb.disabled = !!h.flat
    fb.setAttribute('aria-pressed', String(!!h.flat))
    fb.title = h.flat ? t('flat.already') : t('flat.close')
    q('flatIcon').innerHTML = h.flat ? ICON_CHECK : ICON_FLAT
  }

  /** player: 1/2, 0 = båda (paus/omstart). */
  function act(player, action) {
    if (!halves.length) return
    if (action === 'reset') {
      build()
      return
    }
    if (action === 'pause') {
      const anyPlaying = halves.some((hv) => hv.eng.playing)
      for (const hv of halves) anyPlaying ? hv.eng.pause() : hv.eng.play()
      started = true
      return
    }
    const hv = halves[player - 1]
    if (!hv) return
    const e = hv.eng
    if (action === 'buy' || action === 'sell') {
      const cur = readSide(e.train)
      const next = stepSide(cur, action === 'buy' ? 1 : -1)
      if (next === cur) return
      if (next === 'flat') e.flat()
      else if (typeof e.applySide === 'function') e.applySide(next)
      else e.choose(next)
      if (!started) {
        // samma start för båda – rakt jämförbart
        started = true
        for (const o of halves) o.eng.playing || o.eng.play()
      }
    } else if (action === 'flat') e.flat()
    else if (action === 'levDown') e.nudgeLeverage(-1)
    else if (action === 'levUp') e.nudgeLeverage(1)
    paint(player - 1)
  }

  addEventListener(
    'keydown',
    (e) => {
      if (!visible) return
      const a = keyAction(e, '2p')
      if (!a) return
      e.preventDefault()
      e.stopImmediatePropagation()
      act(a.player, a.action)
    },
    true,
  )
  addEventListener(
    'keyup',
    (e) => {
      if (visible && PREVENT_DEFAULT.has(e.code) && keyAction(e, '2p')) e.preventDefault()
    },
    true,
  )
  addEventListener('resize', () => visible && layout())
  onLang(() => {
    root.setAttribute('aria-label', t('duo.aria'))
    halves.forEach((_, i) => paint(i))
  })

  return {
    show() {
      visible = true
      root.classList.add('on')
      build()
    },
    hide() {
      visible = false
      root.classList.remove('on')
      destroy()
    },
    visible: () => visible,
    placeCards() {
      if (!halves.length) return
      const rs = rects()
      const chromeB = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tr-chrome-b')) || 60
      halves.forEach((hv, i) => {
        const top = rs[i].y === 0 ? `${Math.round(chromeB + 8)}px` : '12px'
        hv.el.querySelectorAll('.nlr-duo-card').forEach((c) => {
          c.style.top = top
        })
      })
    },
    engines: () => halves.map((h) => h.eng),
    hud: (i) => halves[i]?.hud ?? null,
    act,
  }
}
