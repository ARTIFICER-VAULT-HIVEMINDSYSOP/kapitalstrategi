/**
 * Akademin i NVDA Line-stil (tredje vyn i växeln «NVDA Line | Raket | Akademin»).
 * Lektioner, texter, uppgifter och pedagogik från KS Akademin (se akademin-logic.js); ombyggt på NVDA Lines
 * egna data och i NVDA Lines ljusa stil. Egen kod: inget porträtt, ingen mörk grafik, inget övningssaldo i dollar.
 * Tangenter: samma plan som övriga lägen (köp/sälj). Tempo är −/+, inte hävstångstangenterna.
 * Utmärkelser: märke per klarat delmoment + medalj per lektion, kort animation, sparas i localStorage.
 * All synlig text kommer från språkresursen.
 */
import * as A from './akademin-logic.js'
import { rsiAtPoints } from './rsi.js'
import { isTypingTarget, HINTS, keyAction } from './keys.js'
import { simTid } from './simtid.js'
import { t, onLang, getLang } from './i18n.js'
import { stepSide } from './styrmotor.js'
import { bindStepGestures } from './snapp.js'
import { positionFor } from './spar.js'
import { chapterHtml, gradeAnswer, gradeLabel } from '../../../school/hansan-riskskola/text.js'
import { mountRobban } from './robban.js'
import { drawRobbanCraft } from './robban-art.js'

const PAPER = '#f3ede2'
const INK = '#1c1915'
const INK2 = '#4a453d'
const MUTED = '#8a8478'
const GREEN = '#76b900'
const GREEN_D = '#4d7a00'
const RED = '#9a3b2a'
const AMBER = '#e8a33a'
const PTS_PER_SEC = 3

const css = `
.nlr-ak{position:fixed;inset:0;z-index:50;background:${PAPER};display:none;overflow:auto;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${INK}}
.nlr-ak.on{display:block}
.nlr-ak-in{max-width:1180px;margin:0 auto;padding:66px 16px 120px;display:grid;grid-template-columns:300px minmax(0,1fr);gap:14px}
.nlr-ak-card{border-radius:22px;padding:14px 16px;box-sizing:border-box}
.nlr-ak small,.nlr-ak .kick{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600}
.nlr-ak h1{margin:2px 0 4px;font:600 30px/1.05 Fraunces,Georgia,serif}
.nlr-ak h2{margin:4px 0 6px;font:600 24px/1.1 Fraunces,Georgia,serif}
.nlr-ak h3{margin:0;font:600 16px "IBM Plex Sans",sans-serif}
.nlr-ak p{margin:6px 0;font-size:14px;line-height:1.5;color:${INK2}}
.nlr-ak .muted{color:${MUTED};font-size:12px;line-height:1.45}
.nlr-ak aside{display:flex;flex-direction:column;gap:10px}
.nlr-ak main{display:flex;flex-direction:column;gap:12px;min-width:0}
.nlr-ak-xp .row{display:flex;justify-content:space-between;font-size:13px}
.nlr-ak-bar{height:6px;border-radius:3px;background:rgba(28,25,21,.08);overflow:hidden;margin:6px 0}
.nlr-ak-bar i{display:block;height:100%;background:${GREEN}}
.nlr-ak-lessons{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.nlr-ak-lesson{width:100%;display:flex;gap:10px;align-items:center;text-align:left;border:1px solid rgba(28,25,21,.1);background:rgba(246,242,234,.9);border-radius:16px;padding:10px 12px;cursor:pointer;font:500 14px "IBM Plex Sans",sans-serif;color:${INK}}
.nlr-ak-lesson small{display:block}
.nlr-ak-lesson.on{border-color:${INK};box-shadow:inset 0 0 0 1px ${INK}}
.nlr-ak-lesson:disabled{opacity:.55;cursor:default}
.nlr-ak-dot{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:600 12px "IBM Plex Sans",sans-serif;background:rgba(28,25,21,.07)}
.nlr-ak-dot.done{background:${GREEN};color:${INK}}
.nlr-ak-dot.open{background:${INK};color:${PAPER}}
.nlr-ak-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:14px;background:${INK};color:${PAPER};font:600 14px "IBM Plex Sans",sans-serif;padding:10px 16px;cursor:pointer}
.nlr-ak-btn.ghost{background:rgba(246,242,234,.95);color:${INK};border:1px solid rgba(28,25,21,.14)}
.nlr-ak-btn:disabled{opacity:.45;cursor:default}
.nlr-ak-chip{border:1px solid rgba(28,25,21,.12);background:rgba(246,242,234,.95);border-radius:999px;padding:6px 12px;font:500 13px "IBM Plex Sans",sans-serif;color:${INK};cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.nlr-ak-chip.on{background:${INK};color:${PAPER};border-color:${INK}}
.nlr-ak-chip.on-green{background:${GREEN};border-color:${GREEN_D};color:${INK}}
.nlr-ak-chip.on-red{background:${RED};border-color:${RED};color:${PAPER}}
.nlr-ak-chip:disabled{opacity:.45;cursor:default}
.nlr-ak kbd{font:600 10px/1 "IBM Plex Sans",sans-serif;padding:2px 5px;border-radius:5px;border:1px solid currentColor;opacity:.55;white-space:nowrap}
.nlr-ak-chart canvas{display:block;width:100%;height:360px}
.nlr-ak-chart .head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;color:${MUTED};margin-bottom:6px}
.nlr-ak-chart .head b{color:${INK};font-weight:600}
.nlr-ak-transport{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}
.nlr-ak-task .top{display:flex;justify-content:space-between;align-items:center}
.nlr-ak-badge{font:600 11px "IBM Plex Sans",sans-serif;padding:3px 9px;border-radius:999px;background:rgba(28,25,21,.07)}
.nlr-ak-badge.done{background:${GREEN}}
.nlr-ak-row{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.nlr-ak-choice{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.nlr-ak-choice>span{min-width:130px;font-size:12px;color:${MUTED};font-weight:600}
.nlr-ak-facts{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:${MUTED}}
.nlr-ak-facts b{color:${INK};font-weight:600}
.nlr-ak-note{margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(118,185,0,.1);font-size:14px;color:${INK}}
.nlr-ak-quiz{display:flex;flex-direction:column;gap:6px}
.nlr-ak-quiz button{text-align:left;border:1px solid rgba(28,25,21,.12);background:rgba(246,242,234,.95);border-radius:14px;padding:10px 12px;font:14px/1.4 "IBM Plex Sans",sans-serif;color:${INK};cursor:pointer}
.nlr-ak-dim{opacity:.6}
.nlr-ak-aw{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px;margin-top:8px}
.nlr-ak-aw figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;font-size:10px;line-height:1.2;color:${INK2}}
.nlr-ak-aw figure.locked{opacity:.35;filter:grayscale(1)}
.nlr-ak-aw svg{width:40px;height:40px}
.nlr-ak-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:70;display:none;align-items:center;gap:12px;padding:12px 16px;border-radius:20px;background:rgba(246,242,234,.97);border:1px solid rgba(28,25,21,.14);box-shadow:0 10px 30px rgba(28,25,21,.18);width:max-content;max-width:min(460px,calc(100vw - 24px));box-sizing:border-box;font-family:"IBM Plex Sans",sans-serif;color:${INK}}
.nlr-ak-toast.on{display:flex;animation:nlrAkIn .35s ease-out}
.nlr-ak-toast svg{width:56px;height:56px;flex:none;animation:nlrAkPop .7s cubic-bezier(.2,1.6,.4,1)}
.nlr-ak-toast .shine{animation:nlrAkShine 1.2s ease-out .2s both}
.nlr-ak-toast b{display:block;font-size:15px}
.nlr-ak-toast small,.nlr-ak-toast span{display:block}
.nlr-ak-toast span{font-size:13px;color:${INK2}}
@keyframes nlrAkIn{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes nlrAkPop{0%{transform:scale(.2) rotate(-25deg)}60%{transform:scale(1.18) rotate(6deg)}100%{transform:scale(1) rotate(0)}}
@keyframes nlrAkShine{from{transform:translateX(-40px)}to{transform:translateX(60px)}}
@media (prefers-reduced-motion:reduce){.nlr-ak-toast.on,.nlr-ak-toast svg,.nlr-ak-toast .shine{animation:none}}
.nlr-ak-claim{display:none;margin:0;padding:10px 12px;border-radius:0;background:rgba(118,185,0,.12);color:${INK};font-size:13px;line-height:1.45}
@media (max-width:820px){.nlr-ak-in{grid-template-columns:minmax(0,1fr);padding-top:60px}.nlr-ak aside{order:2}.nlr-ak-claim{display:block}.nlr-ak-chart canvas{height:300px}.nlr-ak h1{font-size:24px}.nlr-ak-choice>span{min-width:100%}.nlr-ak kbd{display:none}}
@media (max-width:480px){.nlr-ak-chart canvas{height:210px}}
`

function medalSvg(a, uid) {
  const col = a.kind === 'medalj' ? AMBER : a.lesson % 2 ? GREEN : '#3d4a5c'
  const inner = a.kind === 'medalj'
    ? `<path d="M22 6 L28 22 L20 22 Z" fill="${RED}"/><path d="M42 6 L36 22 L44 22 Z" fill="${GREEN}"/><circle cx="32" cy="38" r="17" fill="${col}" stroke="${INK}" stroke-width="2"/><circle cx="32" cy="38" r="11" fill="none" stroke="${PAPER}" stroke-width="1.6"/><text x="32" y="43" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="14" fill="${INK}">${a.lesson}</text>`
    : `<path d="M32 6 L54 18 L54 42 L32 58 L10 42 L10 18 Z" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M22 32 l7 7 l13 -14" fill="none" stroke="${a.lesson % 2 ? INK : PAPER}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="cl${uid}"><rect width="64" height="64" rx="32"/></clipPath></defs>${inner}<g clip-path="url(#cl${uid})"><rect class="shine" x="-10" y="0" width="10" height="64" fill="rgba(255,255,255,.55)" transform="skewX(-20)"/></g></svg>`
}

const fmtP = (v) => (Number.isFinite(v) ? `$${v.toFixed(2)}` : '—')
const fmt1 = (v) => (Number.isFinite(v) ? v.toFixed(1).replace('.', ',') : '—')
const fmt2 = (v) => (Number.isFinite(v) ? v.toFixed(2).replace('.', ',') : '—')

export function createAkademin({ engine, skinFrom, storage = window.localStorage }) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const root = document.createElement('div')
  root.className = 'nlr-ak'
  root.setAttribute('aria-label', t('ak.aria'))
  document.body.appendChild(root)
  const toast = document.createElement('div')
  toast.className = 'nlr-ak-toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  document.body.appendChild(toast)
  const guide = mountRobban({ onAnswer() { if (visible) build() } })

  let prog = A.loadProgress(storage)
  let lesson = [1, 2, 3, 4].find((l) => !A.lessonDone(l, prog.earned)) ?? 4
  let noteKey = ''
  let hansaMsg = ''
  let noteVars = null
  let riskPct = null
  let sigma = 1.5
  let sizeCalc = null
  let side = 'long'
  let rMult = 2
  let slSet = false
  let tpSet = false
  let trade = null
  let quiz = null
  let pts = []
  let rsi = []
  let sqThr = 0
  let p = 0
  let playing = false
  let tempo = 1
  let visible = false
  let raf = 0
  let last = 0
  let toastQ = []
  let toastT = 0

  function data() {
    if (pts === engine.track?.points) return
    pts = engine.track?.points ?? []
    rsi = rsiAtPoints(engine.quote?.candles ?? [], pts)
    sqThr = A.squeezeThreshold(pts)
    p = Math.min(30, Math.max(0, pts.length - 1))
    trade = null
    quiz = null
  }
  const idx = () => Math.max(0, Math.min(pts.length - 1, Math.floor(p)))
  const cur = () => pts[idx()]
  const read = () => prog.earned.has(`l${lesson}_read`)

  function earn(...keys) {
    const r = A.earnKeys(storage, prog, keys)
    prog = r.prog
    if (r.fresh.length) {
      toastQ.push(...r.fresh)
      if (!toast.classList.contains('on')) nextToast()
    }
  }
  function nextToast() {
    const id = toastQ.shift()
    clearTimeout(toastT)
    if (!id) {
      toast.classList.remove('on')
      return
    }
    const a = A.awardView(A.AWARDS.find((x) => x.id === id))
    toast.classList.remove('on')
    void toast.offsetWidth
    toast.innerHTML = `${medalSvg(a, 't' + id)}<div><small style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600">${t('ak.toast', { kind: a.kindLabel })}</small><b>${a.title}</b><span>${a.learned}</span></div>`
    toast.dataset.award = id
    toast.classList.add('on')
    toastT = setTimeout(nextToast, toastQ.length ? 1700 : 4200)
  }

  function pick(l) {
    if (!A.lessonUnlocked(l, prog.earned)) return
    lesson = l
    noteKey = ''
    noteVars = null
    quiz = null
    build()
  }

  function computeSize() {
    const pt = cur()
    const pct = String(riskPct).replace('.', ',')
    if (riskPct == null || !pt) return setNote('ak.err.riskFirst')
    if (!A.riskAllowed(riskPct)) return setNote('ak.err.riskHigh', { pct, max: A.MAX_RISK_PCT })
    const stop = A.stopPrice(pt.price, A.bandStdev(pt), sigma, 'long')
    const s = A.positionShare(riskPct, pt.price, stop)
    sizeCalc = { ...s, entry: pt.price, stop }
    earn('l1_risk', 'l1_size')
    setNote('ak.sizeOk', { pct, stop: fmtP(stop), per: fmt1(s.perSharePct), share: fmt1(s.sharePct), cap: s.capped ? t('ak.sizeCap') : '' })
  }
  function asCycle(v) {
    return v === 'long' ? 'buy' : v === 'short' ? 'sell' : 'flat'
  }
  function fromCycle(v) {
    return v === 'buy' ? 'long' : v === 'sell' ? 'short' : 'flat'
  }
  function stepLesson(dir) {
    const next = fromCycle(stepSide(asCycle(side), dir))
    if (next !== side) {
      side = next
      slSet = false
      tpSet = false
    }
  }
  function l2Lines() {
    const pt = cur()
    if (!pt || (side !== 'long' && side !== 'short')) return { stop: null, target: null }
    const stop = slSet ? A.stopPrice(pt.price, A.bandStdev(pt), sigma, side) : null
    const target = stop != null && tpSet ? A.takeProfitPrice(pt.price, stop, rMult, side) : null
    return { stop, target }
  }
  function openL2() {
    if (side !== 'long' && side !== 'short') return setNote('ak.err.side')
    const { stop, target } = l2Lines()
    const opened = A.openPractice(pts, idx(), side, stop, target)
    if (opened.error) return setNote(opened.error)
    trade = opened
    earn('l2_open')
    playing = true
    setNote('ak.opened', { side: t(side === 'long' ? 'side.long' : 'side.short'), entry: fmtP(opened.entry), stop: fmtP(opened.stop), target: fmtP(opened.target) })
  }
  function markTouch() {
    const pt = cur()
    if (!pt) return
    const pb = A.percentB(pt.price, pt)
    if (A.isTouch(pt.price, pt)) {
      earn('l3_touch')
      setNote('ak.touchOk', { pb: fmt2(pb), rail: t(pb >= 0.5 ? 'ak.railUp' : 'ak.railDown') })
    } else setNote('ak.touchNo', { pb: fmt2(pb) })
  }
  function markSqueeze() {
    const pt = cur()
    if (!pt) return
    const bw = A.bandwidthPct(pt)
    if (bw <= sqThr) {
      earn('l3_squeeze')
      setNote('ak.squeezeOk', { bw: fmt1(bw), lim: fmt1(sqThr) })
    } else setNote('ak.squeezeNo', { bw: fmt1(bw), lim: fmt1(sqThr) })
  }
  function readMarket() {
    const pt = cur()
    const r = rsi[idx()]
    if (!pt || r == null) return setNote('ak.rsiMissing')
    if (!A.rsiExtreme(r)) return setNote('ak.rsiWait', { n: fmt1(r) })
    playing = false
    earn('l4_extreme')
    quiz = { answer: A.correctRead(pt.price, pt, r), rsi: r, pb: A.percentB(pt.price, pt) ?? 0.5 }
    setNote('')
  }
  function answer(a) {
    if (!quiz) return
    if (a === quiz.answer) {
      earn('l4_read_ok')
      quiz = null
      setNote('ak.readOk')
    } else setNote('ak.readNo', { pb: fmt2(quiz.pb), rsi: fmt1(quiz.rsi) })
  }
  function setNote(key, vars) {
    noteKey = key || ''
    noteVars = vars || null
    build()
  }
  function rewind() {
    p = Math.min(30, Math.max(0, pts.length - 1))
    trade = null
    quiz = null
    playing = false
    build()
  }

  /* ---------- DOM ---------- */
  let ungesture = () => {}
  function build() {
    const L = A.lessonContent(lesson)
    const hk = HINTS['1p']
    const xp = A.xpTotal(prog.earned)
    const lv = A.levelFor(xp)
    const lvPct = lv.to == null ? 100 : ((xp - lv.from) / (lv.to - lv.from)) * 100
    const done = A.lessonDone(lesson, prog.earned)
    const allDone = [1, 2, 3, 4].every((l) => A.lessonDone(l, prog.earned))
    const unlocked = new Set(A.awardsFor(prog.earned))
    const rd = read()
    const pt = cur()
    const l1Stop = pt ? A.stopPrice(pt.price, A.bandStdev(pt), sigma, 'long') : null
    const { stop: l2Stop, target: l2Target } = l2Lines()
    const chip = (label, on, attrs = '', cls = 'on') => `<button type="button" class="nlr-ak-chip ${on ? cls : ''}" ${attrs}>${label}</button>`
    const choice = (label, opts, val, key, fmt) =>
      `<div class="nlr-ak-choice"><span>${label}</span>${opts.map((o) => chip(fmt(o), val === o, `data-act="${key}" data-v="${o}"`)).join('')}</div>`
    let task = ''
    if (rd && lesson === 1) {
      task = `<div class="nlr-ak-row">
        ${choice(t('ak.riskOf'), A.RISK_CHOICES, riskPct, 'risk', (v) => `${String(v).replace('.', ',')} %`)}
        ${choice(t('ak.stopSigma'), A.STOP_SIGMAS, sigma, 'sigma', (v) => `${String(v).replace('.', ',')}σ`)}
        <div><button type="button" class="nlr-ak-btn" data-act="size">${t('ak.calc')}</button></div>
        <div class="nlr-ak-facts"><span>${t('ak.entry')} <b data-k="f_price">${fmtP(pt?.price)}</b></span><span>${t('ak.stop')} <b data-k="f_stop">${fmtP(l1Stop)}</b></span><span>${t('ak.riskShare')} <b>${sizeCalc ? fmt1(sizeCalc.perSharePct) + ' %' : '—'}</b></span><span>${t('ak.position')} <b>${sizeCalc ? t('ak.ofBalance', { n: fmt1(sizeCalc.sharePct) }) : '—'}</b></span></div>
      </div>`
    } else if (rd && lesson === 2) {
      const locked = !!trade && !trade.closed
      task = `<div class="nlr-ak-row">
        <div class="nlr-ak-choice"><span>${t('ak.direction')}</span>${chip(`${t('side.long')} <kbd>${hk.buy}</kbd>`, side === 'long', `data-act="side" data-v="long" ${locked ? 'disabled' : ''}`, 'on-green')}${chip(`${t('side.short')} <kbd>${hk.sell}</kbd>`, side === 'short', `data-act="side" data-v="short" ${locked ? 'disabled' : ''}`, 'on-red')}</div>
        ${choice(t('ak.stopSigma'), A.STOP_SIGMAS, sigma, 'sigma', (v) => `${String(v).replace('.', ',')}σ`)}
        ${choice(t('ak.targetR'), A.TP_R_MULTIPLES, rMult, 'r', (v) => `${v}R`)}
        <div class="nlr-ak-choice"><span>${t('ak.plan')}</span>${chip(slSet ? t('ak.slSet', { price: fmtP(locked ? trade.stop : l2Stop) }) : t('ak.setSl'), slSet, 'data-act="sl"', 'on-red')}${chip(tpSet ? t('ak.tpSet', { price: fmtP(locked ? trade.target : l2Target) }) : t('ak.setTp'), tpSet, `data-act="tp" ${slSet ? '' : 'disabled'}`, 'on-green')}</div>
        <div><button type="button" class="nlr-ak-btn" data-act="open" ${!slSet || !tpSet || locked ? 'disabled' : ''}>${t('ak.open')}</button></div>
        ${!slSet || !tpSet ? `<span class="muted">${t('ak.openLocked')}</span>` : ''}
        ${trade ? `<div class="nlr-ak-facts"><span>${t('ak.entry')} <b>${fmtP(trade.entry)}</b></span><span>${t('ak.slWord')} <b>${fmtP(trade.stop)}</b></span><span>${t('ak.tpWord')} <b>${fmtP(trade.target)}</b></span><span>${t('ak.status')} <b>${t(trade.closed ? (trade.closed.reason === 'stop' ? 'ak.stStop' : trade.closed.reason === 'target' ? 'ak.stTarget' : 'ak.stEnd') : 'ak.stOpen')}</b></span></div>` : ''}
      </div>`
    } else if (rd && lesson === 3) {
      task = `<div class="nlr-ak-row"><div class="nlr-ak-choice">
        <button type="button" class="nlr-ak-btn ${prog.earned.has('l3_touch') ? 'ghost' : ''}" data-act="touch">${prog.earned.has('l3_touch') ? t('ak.touchDone') : t('ak.touch')}</button>
        <button type="button" class="nlr-ak-btn ${prog.earned.has('l3_squeeze') ? 'ghost' : ''}" data-act="squeeze">${prog.earned.has('l3_squeeze') ? t('ak.squeezeDone') : t('ak.squeeze')}</button></div>
        <div class="nlr-ak-facts"><span>%B <b data-k="f_pb">${pt ? fmt2(A.percentB(pt.price, pt)) : '—'}</b></span><span>${t('ak.bandwidth')} <b data-k="f_bw">${pt ? fmt1(A.bandwidthPct(pt)) + ' %' : '—'}</b></span><span>${t('ak.squeezeLimit')} <b>${fmt1(sqThr)} %</b></span></div></div>`
    } else if (rd && lesson === 4) {
      const r = rsi[idx()]
      task = `<div class="nlr-ak-row"><div><button type="button" class="nlr-ak-btn" data-act="readm">${t('ak.readMarket')}</button></div>
        <div class="nlr-ak-facts"><span>RSI 14 <b data-k="f_rsi">${r == null ? '—' : fmt1(r)}</b></span><span>%B <b data-k="f_pb">${pt ? fmt2(A.percentB(pt.price, pt)) : '—'}</b></span></div>
        ${quiz ? `<div class="nlr-ak-quiz">${['stretched_up', 'stretched_down', 'rsi_only'].map((k) => `<button type="button" data-act="ans" data-v="${k}">${A.readText(k)}</button>`).join('')}</div>` : ''}</div>`
    }
    let slot = root.querySelector(':scope > .nlr-ak-in')
    if (!slot) {
      slot = document.createElement('div')
      slot.className = 'nlr-ak-in'
      root.appendChild(slot)
    }
    slot.innerHTML = `
      <aside>
        <div class="nlr-ak-card sk"><span class="kick">${t('ak.kicker')}</span><h1>${t('mode.akademin')}</h1><p class="muted" data-tr-claim="1">${t('sim.claim')}</p><p class="muted">${t('ak.lead')}</p></div>
        <div class="nlr-ak-card sk nlr-ak-xp"><div class="row"><b>${t('ak.level', { n: lv.level })}</b><span>${t('ak.xp', { xp, max: A.XP_MAX })}</span></div><div class="nlr-ak-bar"><i style="width:${lvPct}%"></i></div><p class="muted">${t('ak.xpNote')}</p></div>
        <ol class="nlr-ak-lessons">${[1, 2, 3, 4].map((l) => {
          const open = A.lessonUnlocked(l, prog.earned)
          const d = A.lessonDone(l, prog.earned)
          return `<li><button type="button" class="nlr-ak-lesson ${lesson === l ? 'on' : ''}" data-act="pick" data-v="${l}" ${open ? '' : 'disabled'}><span class="nlr-ak-dot ${d ? 'done' : open ? 'open' : ''}">${d ? '✓' : open ? l : '🔒'}</span><span><small>${t('ak.lessonOf', { n: l })}</small>${A.lessonContent(l).title}</span></button></li>`
        }).join('')}</ol>
        <div class="nlr-ak-card sk" data-k="awards"><div class="row" style="display:flex;justify-content:space-between"><h3>${t('ak.awards')}</h3><span class="muted">${unlocked.size} / ${A.AWARDS.length}</span></div>
          <div class="nlr-ak-aw">${A.AWARDS.map((raw) => { const a = A.awardView(raw); return `<figure class="${unlocked.has(a.id) ? '' : 'locked'}" title="${unlocked.has(a.id) ? a.learned : t('ak.locked')}" data-award="${a.id}">${medalSvg(a, 'o' + a.id)}<figcaption>${a.title}</figcaption></figure>` }).join('')}</div>
          <p class="muted">${t('ak.saved', { note: A.awardNote() })}</p></div>
        <p class="muted">${t('ak.disclaimer')}</p>
      </aside>
      <main>
        <p class="nlr-ak-claim" data-tr-claim="1">${t('sim.claim')}</p>
        <section class="nlr-ak-card sk"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kick">${t('ak.lessonOf', { n: lesson })}</span><span class="muted">${[1, 2, 3, 4].map((l) => (A.lessonDone(l, prog.earned) ? '●' : l === lesson ? '◉' : '○')).join(' ')}</span></div>
          <h2>${L.title}</h2><p>${L.text}</p>
          ${!rd ? `<div><button type="button" class="nlr-ak-btn" data-act="read">${t('ak.read')}</button></div>` : ''}</section>
        ${guide.markup()}
        <section class="nlr-ak-card sk nlr-ak-chart"><div class="head"><span data-k="chartHead">—</span><span data-k="chartFacts">—</span></div>
          <canvas aria-label="${t('ak.canvas')}"></canvas>
          <div class="nlr-ak-transport">
            <button type="button" class="nlr-ak-chip" data-act="play"><span data-k="playTxt">${playing ? t('ak.pause') : t('ak.play')}</span> <kbd>P</kbd></button>
            <button type="button" class="nlr-ak-chip" data-act="tempoDown">${t('ak.tempoDown')} <kbd>−</kbd></button>
            <button type="button" class="nlr-ak-chip" data-act="tempoUp">${t('ak.tempoUp')} <kbd>+</kbd></button>
            <span class="muted" data-k="tempoTxt"></span>
            <button type="button" class="nlr-ak-chip" data-act="rewind">${t('ak.rewind')} <kbd>R</kbd></button>
          </div></section>
        <section class="nlr-ak-card sk nlr-ak-task ${rd ? '' : 'nlr-ak-dim'}"><div class="top"><h3>${t('ak.task')}</h3><span class="nlr-ak-badge ${done ? 'done' : ''}">${done ? t('ak.done') : rd ? t('ak.going') : t('ak.readFirst')}</span></div>
          <p>${L.task}</p>${task}
          ${noteKey ? `<div class="nlr-ak-note" data-k="note">${t(noteKey, noteVars)}</div>` : ''}
          ${rd && done && lesson < 4 ? `<div style="margin-top:10px"><button type="button" class="nlr-ak-btn" data-act="pick" data-v="${lesson + 1}">${t('ak.next', { n: lesson + 1 })}</button></div>` : ''}
          ${allDone ? `<div class="nlr-ak-note">${t('ak.allDone')}</div>` : ''}
        </section>
        <section class="nlr-ak-card sk" data-chapter="hansan">${chapterHtml(getLang())}${hansaMsg ? `<p data-k="hansaMsg">${hansaMsg}</p>` : ''}</section>
      </main>`
    if (skinFrom) {
      const cs = getComputedStyle(skinFrom)
      root.querySelectorAll('.sk').forEach((c) => {
        for (const k of ['backgroundColor', 'border', 'boxShadow']) c.style[k] = cs[k]
      })
    }
    hud()
    draw()
    ungesture()
    const canvas = root.querySelector('canvas')
    ungesture = bindStepGestures(canvas, {
      enabled: () => visible && lesson === 2,
      getSide: () => asCycle(side),
      applyDir: (dir) => {
        if (!read() || (trade && !trade.closed)) return
        stepLesson(dir)
        build()
      },
    })
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]')
    if (!b || b.disabled) return
    const act = b.dataset.act
    const v = b.dataset.v
    if (act === 'pick') return pick(Number(v))
    if (act === 'read') {
      earn(`l${lesson}_read`)
      return build()
    }
    if (act === 'risk') {
      riskPct = Number(v)
      sizeCalc = null
    } else if (act === 'sigma') {
      sigma = Number(v)
      sizeCalc = null
    } else if (act === 'size') return computeSize()
    else if (act === 'side') {
      if (!trade || trade.closed) stepLesson(v === 'long' ? 1 : -1)
    } else if (act === 'r') rMult = Number(v)
    else if (act === 'sl') {
      slSet = true
      if (tpSet) earn('l2_bracket')
    } else if (act === 'tp') {
      tpSet = true
      if (slSet) earn('l2_bracket')
    } else if (act === 'open') return openL2()
    else if (act === 'touch') return markTouch()
    else if (act === 'squeeze') return markSqueeze()
    else if (act === 'readm') return readMarket()
    else if (act === 'ans') return answer(v)
    else if (act === 'play') playing = !playing
    else if (act === 'tempoDown') tempo = Math.max(1, tempo - 1)
    else if (act === 'tempoUp') tempo = Math.min(4, tempo + 1)
    else if (act === 'rewind') return rewind()
    else if (act === 'hansa') hansaMsg = gradeLabel(getLang(), gradeAnswer(b.dataset.lesson, Number(b.dataset.qi), Number(v)))
    build()
  })

  addEventListener(
    'keydown',
    (e) => {
      if (!visible || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      const c = e.code
      const hit = keyAction(e, '1p')
      let used = true
      if (c === 'Minus' || c === 'NumpadSubtract') tempo = Math.max(1, tempo - 1)
      else if (c === 'Equal' || c === 'NumpadAdd') tempo = Math.min(4, tempo + 1)
      else if (hit?.action === 'pause') playing = !playing
      else if (hit?.action === 'reset') return e.preventDefault(), e.stopImmediatePropagation(), rewind()
      else if (hit?.action === 'buy' && lesson === 2 && read() && (!trade || trade.closed)) stepLesson(1)
      else if (hit?.action === 'sell' && lesson === 2 && read() && (!trade || trade.closed)) stepLesson(-1)
      else if (hit) used = 'swallow'
      else used = false
      if (!used) return
      e.stopImmediatePropagation() // NVDA Lines dolda tåg ska inte reagera
      if (used === 'swallow') {
        if (c === 'Space' || c.startsWith('Arrow')) e.preventDefault()
        return
      }
      e.preventDefault()
      build()
    },
    true,
  )

  function hud() {
    const pt = cur()
    const q = (k) => root.querySelector(`[data-k="${k}"]`)
    if (!q('chartHead')) return
    const r = rsi[idx()]
    const d = pt ? simTid(pt.t, engine.spec?.key) : '—'
    q('chartHead').textContent = t('ak.chartHead', { when: d })
    q('chartFacts').innerHTML = t('ak.chartFacts', { price: `<b>${fmtP(pt?.price)}</b>`, rsi: `<b>${r == null ? '—' : fmt1(r)}</b>`, pb: `<b>${pt ? fmt2(A.percentB(pt.price, pt)) : '—'}</b>` })
    q('playTxt').textContent = playing ? t('ak.pause') : t('ak.play')
    q('tempoTxt').textContent = t('ak.tempo', { n: tempo, state: playing ? t('ak.playing') : t('ak.paused'), end: p >= pts.length - 1 ? t('ak.seriesEnd') : '' })
    const set = (k, v) => {
      const el = q(k)
      if (el) el.textContent = v
    }
    set('f_price', fmtP(pt?.price))
    set('f_stop', pt ? fmtP(A.stopPrice(pt.price, A.bandStdev(pt), sigma, 'long')) : '—')
    set('f_pb', pt ? fmt2(A.percentB(pt.price, pt)) : '—')
    set('f_bw', pt ? fmt1(A.bandwidthPct(pt)) + ' %' : '—')
    set('f_rsi', r == null ? '—' : fmt1(r))
  }

  /* ---------- graf: tiden åt höger, bara historik fram till nu (ingen framtid) ---------- */
  function draw() {
    const cv = root.querySelector('.nlr-ak-chart canvas')
    if (!cv || !pts.length) return
    cv.dataset.robbanRide = playing ? 'on' : 'off'
    const W = cv.clientWidth
    const H = cv.clientHeight
    if (!W || !H) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
    }
    const c = cv.getContext('2d')
    if (!c) return
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, W, H)
    const rsiH = 70
    const gap = 10
    const ch = H - rsiH - gap
    const n = W < 500 ? 50 : 90
    const i1 = idx()
    const i0 = Math.max(0, i1 - n + 1)
    let lo = Infinity
    let hi = -Infinity
    const lines = []
    if (trade) lines.push(trade.stop, trade.target, trade.entry)
    else if (lesson === 1 && read() && sizeCalc) lines.push(sizeCalc.stop)
    else if (lesson === 2) {
      const l = l2Lines()
      if (l.stop != null) lines.push(l.stop)
      if (l.target != null) lines.push(l.target)
    }
    for (let i = i0; i <= i1; i++) {
      lo = Math.min(lo, pts[i].lower, pts[i].price)
      hi = Math.max(hi, pts[i].upper, pts[i].price)
    }
    for (const v of lines) if (Number.isFinite(v)) (lo = Math.min(lo, v)), (hi = Math.max(hi, v))
    const pad = (hi - lo) * 0.08 || 1
    lo -= pad
    hi += pad
    const padR = 64
    const x = (i) => ((i - i0) / Math.max(1, n - 1)) * (W - padR - 8) + 4
    const y = (v) => 6 + (1 - (v - lo) / (hi - lo)) * (ch - 12)
    // rutnät
    c.strokeStyle = 'rgba(28,25,21,0.06)'
    c.lineWidth = 1
    for (let gy = 0; gy < ch; gy += 48) {
      c.beginPath()
      c.moveTo(0, gy + 0.5)
      c.lineTo(W, gy + 0.5)
      c.stroke()
    }
    // squeeze-zoner (lektion 3)
    if (lesson === 3) {
      c.fillStyle = 'rgba(232,163,58,0.16)'
      for (let i = i0; i <= i1; i++) if (A.bandwidthPct(pts[i]) <= sqThr) c.fillRect(x(i) - (W - padR) / n / 2, 0, (W - padR) / n + 0.5, ch)
    }
    // band + räls i NVDA Line-stil
    const path = (f) => {
      c.beginPath()
      for (let i = i0; i <= i1; i++) (i === i0 ? c.moveTo : c.lineTo).call(c, x(i), y(pts[i][f]))
    }
    c.beginPath()
    for (let i = i0; i <= i1; i++) (i === i0 ? c.moveTo : c.lineTo).call(c, x(i), y(pts[i].upper))
    for (let i = i1; i >= i0; i--) c.lineTo(x(i), y(pts[i].mid))
    c.closePath()
    c.fillStyle = 'rgba(118,185,0,0.10)'
    c.fill()
    c.beginPath()
    for (let i = i0; i <= i1; i++) (i === i0 ? c.moveTo : c.lineTo).call(c, x(i), y(pts[i].mid))
    for (let i = i1; i >= i0; i--) c.lineTo(x(i), y(pts[i].lower))
    c.closePath()
    c.fillStyle = 'rgba(154,59,42,0.08)'
    c.fill()
    const hl = lesson === 3
    c.lineWidth = hl ? 3 : 2.2
    c.strokeStyle = GREEN
    path('upper')
    c.stroke()
    c.strokeStyle = '#b24a36'
    path('lower')
    c.stroke()
    c.setLineDash([5, 6])
    c.lineWidth = 1.2
    c.strokeStyle = 'rgba(74,69,61,0.55)'
    path('mid')
    c.stroke()
    c.setLineDash([])
    c.lineWidth = 1.8
    c.strokeStyle = INK
    path('price')
    c.stroke()
    const pt = pts[i1]
    c.fillStyle = INK
    c.beginPath()
    c.arc(x(i1), y(pt.price), 3.5, 0, Math.PI * 2)
    c.fill()
    if (playing) drawRobbanCraft(c, x(i1), y(pt.price), p)
    const railFlat = positionFor('flat', y(pt.upper), y(pt.lower))
    c.strokeStyle = 'rgba(28,25,21,0.35)'
    c.setLineDash([2, 3])
    c.beginPath()
    c.moveTo(x(i1) - 8, railFlat)
    c.lineTo(x(i1) + 8, railFlat)
    c.stroke()
    c.setLineDash([])
    const tag = (txt, v, col) => {
      c.font = '600 11px "IBM Plex Sans", sans-serif'
      const tw = c.measureText(txt).width + 12
      const yy = Math.max(10, Math.min(ch - 10, y(v)))
      c.fillStyle = 'rgba(246,242,234,0.96)'
      c.strokeStyle = col
      c.beginPath()
      c.roundRect(W - tw - 2, yy - 9, tw, 18, 9)
      c.fill()
      c.stroke()
      c.fillStyle = col
      c.textBaseline = 'middle'
      c.fillText(txt, W - tw + 4, yy + 0.5)
    }
    tag(fmtP(pt.price), pt.price, INK)
    const hline = (v, col, label) => {
      if (!Number.isFinite(v)) return
      c.setLineDash([6, 5])
      c.strokeStyle = col
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(0, y(v))
      c.lineTo(W - padR, y(v))
      c.stroke()
      c.setLineDash([])
      tag(`${label} ${fmtP(v)}`, v, col)
    }
    if (trade) {
      hline(trade.stop, RED, 'SL')
      hline(trade.target, GREEN_D, 'TP')
      c.fillStyle = trade.side === 'long' ? GREEN_D : RED
      if (trade.openedAt >= i0) {
        c.beginPath()
        c.arc(x(trade.openedAt), y(trade.entry), 5, 0, Math.PI * 2)
        c.fill()
      }
    } else if (lesson === 1 && sizeCalc) hline(sizeCalc.stop, RED, t('ak.stop'))
    else if (lesson === 2) {
      const l = l2Lines()
      hline(l.stop, RED, 'SL')
      hline(l.target, GREEN_D, 'TP')
    }
    // RSI-panel (70/30)
    const ry = ch + gap
    const yr = (v) => ry + 4 + (1 - v / 100) * (rsiH - 8)
    c.fillStyle = lesson === 4 ? 'rgba(232,163,58,0.10)' : 'rgba(28,25,21,0.03)'
    c.fillRect(0, ry, W - padR + 4, rsiH)
    c.setLineDash([3, 4])
    for (const [lv, col] of [[70, RED], [30, GREEN_D]]) {
      c.strokeStyle = col
      c.beginPath()
      c.moveTo(0, yr(lv))
      c.lineTo(W - padR, yr(lv))
      c.stroke()
      c.fillStyle = col
      c.font = '600 9px "IBM Plex Sans", sans-serif'
      c.fillText(String(lv), W - padR + 8, yr(lv))
    }
    c.setLineDash([])
    c.strokeStyle = INK
    c.lineWidth = 1.4
    c.beginPath()
    let pen = false
    for (let i = i0; i <= i1; i++) {
      const v = rsi[i]
      if (v == null) {
        pen = false
        continue
      }
      pen ? c.lineTo(x(i), yr(v)) : c.moveTo(x(i), yr(v))
      pen = true
    }
    c.stroke()
    c.fillStyle = MUTED
    c.font = '600 10px "IBM Plex Sans", sans-serif'
    c.fillText('RSI 14', 6, ry + 10) // symbol, same in every language
    if (lesson === 4 || lesson === 3) {
      c.save()
      c.setLineDash([6, 5])
      c.strokeStyle = AMBER
      c.lineWidth = 2
      c.beginPath()
      if (lesson === 4) c.roundRect(1, ry - 2, W - padR + 2, rsiH + 4, 10)
      else c.roundRect(1, 1, W - padR + 2, ch - 2, 10)
      c.stroke()
      c.restore()
    }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000 || 0)
    last = now
    if (playing && pts.length) {
      p = Math.min(pts.length - 1, p + PTS_PER_SEC * tempo * dt)
      if (p >= pts.length - 1) playing = false
      if (trade && !trade.closed) {
        const nx = A.advancePractice(trade, pts, p)
        if (nx !== trade) {
          trade = nx
          if (nx.closed) {
            earn('l2_closed')
            const signed = (n) => `${n >= 0 ? '+' : '−'}${fmt2(Math.abs(n))}`
            noteKey = nx.closed.reason === 'stop' ? 'ak.closed.stop' : nx.closed.reason === 'target' ? 'ak.closed.target' : 'ak.closed.end'
            noteVars = { r: signed(nx.closed.r), pct: signed(nx.closed.pct) }
            build()
          }
        }
      }
    }
    draw()
    hud()
    if (visible) raf = requestAnimationFrame(frame)
  }

  onLang(() => {
    root.setAttribute('aria-label', t('ak.aria'))
    if (visible) build()
  })

  return {
    show() {
      data()
      visible = true
      root.classList.add('on')
      guide.show()
      build()
      last = performance.now()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    },
    hide() {
      visible = false
      playing = false
      guide.hide()
      root.classList.remove('on')
      toast.classList.remove('on')
      cancelAnimationFrame(raf)
    },
    // för tester/skärmdumpar
    state: () => ({ lesson, p, playing, tempo, side, earned: [...prog.earned], awards: { ...prog.awards }, trade, quiz, note: noteKey ? t(noteKey, noteVars) : '' }),
    seek(i) {
      playing = false
      p = Math.max(0, Math.min(pts.length - 1, i))
      build()
    },
    step(sec = 0.05) {
      if (!pts.length) data()
      visible = true
      playing = true
      frame((last || performance.now()) + sec * 1000)
    },
    find(kind) {
      for (let i = 20; i < pts.length; i++) {
        const pt = pts[i]
        if (kind === 'touch' && A.isTouch(pt.price, pt)) return i
        if (kind === 'squeeze' && A.bandwidthPct(pt) <= sqThr) return i
        if (kind === 'extreme' && A.rsiExtreme(rsi[i])) return i
      }
      return -1
    },
    pick,
  }
}
