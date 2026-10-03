/**
 * Raket (ny, egen vy för NVDA Line – ingen kod eller grafik från andra Raket-/tågvarianter).
 * Samma simulerade kurser och samma Bollinger-räls som NVDA Line (motorns track.points för vald period),
 * vriden på höjden: tiden går uppåt, högre pris åt höger. Grön BUY-räls till höger (övre bandet),
 * röd SELL-räls till vänster (undre bandet), streckad mittlinje. Raketen åker på vald sidas räls, nosen framåt;
 * flat (ingen position) = lugnt längs mittlinjen.
 * 1P eller 2P (delad skärm, samma data, samma period och samma klocka; egen position, hävstång, resultat,
 * asteroider och boost per spelare). Resultat visas bara i procent av den egna positionen. Övning – vinst och förlust är lika möjliga.
 *
 * Stil (bara Raket-läget): cyber-HUD – djupt marinblå/lila bakgrund (inte svart), neon i cyan och magenta,
 * tunna ramlinjer med hörnmarkeringar, monospace-siffror, diskreta scanlines, neonhorisont i perspektiv,
 * stjärnor i tre lager med parallax, partiklar, asteroider med splitter och glitch vid förlust ≥ GLITCH_AT %.
 * Raketen själv är i metall (guldgradient med högdager, färger från KS guldknappar).
 * prefers-reduced-motion: ingen parallax, inga partiklar, statiska stjärnor och scanlines, ingen glitch.
 */
import { keyAction, PREVENT_DEFAULT } from './keys.js'
import { MODES, controlHints } from './orientation.js'
import { simTid } from './simtid.js'
import { t, onLang } from './i18n.js'
import { stepSide, readSide } from './styrmotor.js'
import { positionFor } from './spar.js'
import { mountEntrySnap, bindStepGestures } from './snapp.js'
import { noteRaceXEnd, resetRaceXHook } from '../gransland/hooks/racex.js'

// HUD-palett (kontrast mot BG_PANEL kontrolleras i test/raket-stil.test.mjs – WCAG AA)
const BG_TOP = '#0d1238' // djupt marinblå
const BG_BOT = '#1a1040' // lila
const BG_PANEL = '#0a0f2e'
const TEXT = '#eaf6ff'
const TEXT2 = '#b9c9ea'
const MUTED = '#93a8d4'
const CYAN = '#2ee6ff'
const MAGENTA = '#ff4fc0'
const BUY = '#8cf03c' // BUY = grön
const BUY_D = '#5fb81c'
const SELL = '#ff5a6a' // SELL = röd
const SELL_D = '#c23848'
const ON_DARK = '#061022' // text på neonfärgad knapp
const PTS_PER_SEC = 5
const LEV_MIN = 1
const LEV_MAX = 4
const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
// Metall från KS guldknappar (PR #24: --gold-metal-base/-specular/-bevel)
const GOLD = ['#f4e3b0', '#e3c47c', '#d0ab5c', '#b8923f', '#8a6628']
const GOLD_EDGE = 'rgba(66,44,10,0.95)'
const GOLD_INK = '#0a1628'
export const HUD = { BG_TOP, BG_BOT, BG_PANEL, TEXT, TEXT2, MUTED, CYAN, MAGENTA, BUY, SELL, ON_DARK }

const corners = (c, a = 10, t = 1.5) =>
  [
    `linear-gradient(${c},${c}) left top/${a}px ${t}px`,
    `linear-gradient(${c},${c}) left top/${t}px ${a}px`,
    `linear-gradient(${c},${c}) right top/${a}px ${t}px`,
    `linear-gradient(${c},${c}) right top/${t}px ${a}px`,
    `linear-gradient(${c},${c}) left bottom/${a}px ${t}px`,
    `linear-gradient(${c},${c}) left bottom/${t}px ${a}px`,
    `linear-gradient(${c},${c}) right bottom/${a}px ${t}px`,
    `linear-gradient(${c},${c}) right bottom/${t}px ${a}px`,
  ].map((g) => g + ' no-repeat').join(',')
const HUD_BOX = `background:${corners('rgba(46,230,255,.9)')},rgba(10,15,46,.84);border:1px solid rgba(46,230,255,.28);border-radius:4px;box-shadow:0 0 18px rgba(46,230,255,.10),inset 0 0 18px rgba(46,230,255,.05)`

const css = `
.nlr-raket{position:fixed;inset:0;z-index:50;background:${BG_TOP};display:none;font-family:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:${TEXT};overflow:hidden}
.nlr-raket.on{display:block}
.nlr-raket>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.nlr-rk-scan{position:absolute;left:0;right:0;top:-3px;bottom:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(170,225,255,.05) 0 1px,transparent 1px 3px);animation:nlrRkScan .5s linear infinite;will-change:transform}
@keyframes nlrRkScan{from{transform:translateY(0)}to{transform:translateY(3px)}}
.nlr-rk-pl{position:absolute;box-sizing:border-box;pointer-events:none}
.nlr-rk-pl>*{pointer-events:auto}
.nlr-rk-card{position:absolute;box-sizing:border-box;padding:8px 14px;${HUD_BOX}}
.nlr-rk-card small{display:block;font:600 10px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${MUTED}}
.nlr-rk-card b{display:block;font:600 20px ${MONO};font-variant-numeric:tabular-nums;color:${TEXT};text-shadow:0 0 10px rgba(46,230,255,.35)}
.nlr-rk-card span{font:500 11px ${MONO};color:${TEXT2}}
.nlr-rk-quote{right:14px;top:12px;text-align:right;min-width:150px}
.nlr-rk-pnl{right:14px;top:104px;text-align:right;min-width:150px;max-width:min(280px,calc(100% - 180px))}
.nlr-rk-pnl b{font-size:24px}
.nlr-rk-boost{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:4px}
.nlr-rk-boost i{display:block;width:64px;height:5px;border-radius:1px;background:rgba(147,168,212,.22);overflow:hidden}
.nlr-rk-boost i u{display:block;height:100%;width:0;background:${CYAN};box-shadow:0 0 8px ${CYAN}}
.nlr-rk-pnl.alert{border-color:rgba(255,90,106,.85);box-shadow:0 0 22px rgba(255,90,106,.35),inset 0 0 18px rgba(255,90,106,.10)}
.nlr-rk-pnl.glitch{animation:nlrRkGlitch .18s steps(2,end) 1}
@keyframes nlrRkGlitch{0%{transform:translate(0,0);clip-path:inset(0 0 0 0)}25%{transform:translate(-3px,1px);clip-path:inset(10% 0 35% 0)}50%{transform:translate(3px,-1px);clip-path:inset(40% 0 8% 0)}75%{transform:translate(-2px,0);clip-path:inset(0 0 60% 0)}100%{transform:translate(0,0);clip-path:inset(0 0 0 0)}}
.nlr-rk-who{left:14px;top:64px;font:600 12px ${MONO};letter-spacing:.12em;text-transform:uppercase;padding:6px 12px;color:${CYAN}}
.nlr-rk-ctl{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;width:min(616px,calc(100% - 24px));display:flex;flex-direction:column;gap:8px;z-index:5}
.nlr-rk-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.nlr-rk-side{height:52px;border-radius:4px;border:1px solid rgba(46,230,255,.35);background:rgba(10,15,46,.86);color:${TEXT};font:600 15px ${MONO};letter-spacing:.14em;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;padding:0 6px;min-width:0;box-shadow:inset 0 0 14px rgba(46,230,255,.06)}
.nlr-rk-side svg{width:18px;height:18px;flex:none}
.nlr-rk-side.buy{border-color:rgba(140,240,60,.55);color:${BUY}}
.nlr-rk-side.sell{border-color:rgba(255,90,106,.6);color:${SELL}}
.nlr-rk-side.flat{color:${TEXT}}
.nlr-rk-side.buy.on{background:${BUY};border-color:${BUY};color:${ON_DARK};box-shadow:0 0 18px rgba(140,240,60,.55)}
.nlr-rk-side.sell.on{background:${SELL};border-color:${SELL};color:${ON_DARK};box-shadow:0 0 18px rgba(255,90,106,.55)}
.nlr-rk-side.flat.on{background:rgba(46,230,255,.14);border-color:${CYAN};color:${TEXT};box-shadow:0 0 14px rgba(46,230,255,.3)}
.nlr-rk-side:disabled{cursor:default}
.nlr-rk-side:focus-visible,.nlr-rk-bar button:focus-visible{outline:2px solid ${MAGENTA};outline-offset:2px}
.nlr-rk-kbd{font:600 10px/1 ${MONO};padding:2px 5px;border-radius:3px;border:1px solid currentColor;opacity:.8;letter-spacing:0;white-space:nowrap}
.nlr-rk-bar{position:relative;display:flex;align-items:center;gap:10px;padding:6px 10px;font-size:13px}
.nlr-rk-bar button{border:0;background:transparent;cursor:pointer;color:${TEXT};font:600 13px ${MONO};height:32px;min-width:32px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.nlr-rk-bar button:disabled{opacity:.4;cursor:default}
.nlr-rk-bar .play{background:${CYAN};color:${ON_DARK};width:40px;height:40px;border-radius:4px;box-shadow:0 0 14px rgba(46,230,255,.5)}
.nlr-rk-lev{display:flex;align-items:center;gap:4px;background:rgba(46,230,255,.07);border:1px solid rgba(46,230,255,.2);border-radius:3px;padding:2px 6px}
.nlr-rk-lev span{display:flex;flex-direction:column;align-items:center;min-width:34px;line-height:1.1}
.nlr-rk-lev b{display:block;font:600 15px ${MONO};color:${MAGENTA};text-shadow:0 0 8px rgba(255,79,192,.5)}
.nlr-rk-lev small{font:600 9px ${MONO};letter-spacing:.14em;color:${MUTED}}
.nlr-rk-info{color:${TEXT2};font:500 12px ${MONO};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.nlr-rk-info b{display:inline;font:600 12px ${MONO};color:${TEXT};text-shadow:none;letter-spacing:.06em}
.nlr-rk-note{margin:0;text-align:center;font:500 11px ${MONO};color:${MUTED};text-shadow:0 0 4px ${BG_TOP},0 0 2px ${BG_TOP}}
.nlr-rk-prog{height:3px;background:rgba(147,168,212,.18);overflow:hidden}
.nlr-rk-prog i{display:block;height:100%;background:linear-gradient(90deg,${CYAN},${MAGENTA});box-shadow:0 0 8px ${CYAN};width:0}
.nlr-rk-end{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;padding:18px 22px;display:none;max-width:calc(100% - 32px);z-index:2}
.nlr-rk-end.on{display:block}
.nlr-rk-end h3,.nlr-rk-start h3{margin:0 0 6px;font:600 20px ${MONO};letter-spacing:.24em;text-transform:uppercase;color:${CYAN};text-shadow:0 0 12px rgba(46,230,255,.6)}
.nlr-rk-end p{margin:4px 0;font:500 13px ${MONO};color:${TEXT2}}
.nlr-rk-end button{margin-top:8px;border:0;border-radius:4px;background:${CYAN};color:${ON_DARK};font:600 14px ${MONO};letter-spacing:.08em;padding:10px 18px;cursor:pointer;box-shadow:0 0 14px rgba(46,230,255,.5)}
.nlr-rk-start{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);text-align:center;padding:14px 18px;max-width:calc(100% - 32px);z-index:2}
.nlr-rk-start p{margin:3px 0;font:500 12px ${MONO};color:${TEXT2}}
.nlr-rk-div{position:absolute;background:${MAGENTA};box-shadow:0 0 10px ${MAGENTA};display:none}
@media (max-width:640px){.nlr-rk-kbd{display:none}.nlr-rk-quote{top:auto;bottom:196px;right:12px;min-width:0;max-width:132px}.nlr-rk-pnl{top:auto;bottom:196px;right:auto;left:12px;text-align:left;min-width:0;max-width:calc(100% - 160px)}.nlr-rk-pnl .nlr-rk-boost{justify-content:flex-start}.nlr-rk-card b{font-size:16px}.nlr-rk-pnl b{font-size:18px}.nlr-rk-info{font-size:11px}.nlr-rk-side{font-size:14px;letter-spacing:.08em}.nlr-rk-boost i{width:44px}.nlr-rk-note{font-size:10px}.nlr-rk-card span{font-size:10px}.nlr-rk-start{top:12%;left:12px;right:auto;transform:none;max-width:calc(100% - 148px);text-align:left}}
/* 2P: kompakta halvor */
.nlr-rk-2p .nlr-rk-quote{display:none}
.nlr-rk-2p .nlr-rk-pnl{top:12px;bottom:auto;right:12px;left:auto;text-align:right;min-width:0;max-width:min(220px,46%)}
.nlr-rk-2p .nlr-rk-pnl .nlr-rk-boost{justify-content:flex-end}
.nlr-rk-2p .nlr-rk-who{top:12px;left:8px;max-width:42%}
.nlr-rk-2p .nlr-rk-ctl{bottom:10px;gap:6px}
.nlr-rk-2p .nlr-rk-side{height:44px;font-size:13px}
.nlr-rk-2p .nlr-rk-bar{padding:4px 8px;gap:6px}
.nlr-rk-2p .nlr-rk-bar .play{width:34px;height:34px}
.nlr-rk-2p.narrow .nlr-rk-side{height:38px}
.nlr-rk-2p.narrow .nlr-rk-kbd{display:inline}
.nlr-rk-2p.narrow .nlr-rk-card b{font-size:15px}
.nlr-rk-2p.narrow .nlr-rk-card{padding:5px 10px}
.nlr-rk-2p.narrow .nlr-rk-boost{display:none}
.nlr-rk-2p.narrow .nlr-rk-ctl{bottom:6px;gap:4px}
.nlr-rk-2p.narrow .nlr-rk-bar .play{width:30px;height:30px}
.nlr-rk-2p.narrow .nlr-rk-bar button{height:28px;min-width:28px}
@media (prefers-reduced-motion:reduce){.nlr-rk-pnl.glitch,.nlr-rk-scan{animation:none}}
/* Växlarna (panel.js) i HUD-stil – bara när Raket är aktivt */
html[data-nlr-view="raket"] .nlr-toggle{${HUD_BOX.replace(/;/g, ' !important;')} !important;backdrop-filter:none !important}
html[data-nlr-view="raket"] .nlr-toggle button{color:${TEXT} !important;font:600 12px ${MONO} !important;letter-spacing:.06em;border-radius:3px !important}
html[data-nlr-view="raket"] .nlr-toggle button[aria-pressed="true"]{background:${CYAN} !important;color:${ON_DARK} !important;box-shadow:0 0 12px rgba(46,230,255,.55)}
html[data-nlr-view="raket"] .nlr-toggle button:focus-visible{outline:2px solid ${MAGENTA} !important}
.nlr-rk-2p .nlr-rk-start{left:50%;right:auto;transform:translateX(-50%);text-align:center;top:46%;max-width:min(480px,calc(100% - 24px))}
.nlr-rk-2p.narrow .nlr-rk-start{top:40%}
.nlr-rk-2p.narrow .nlr-rk-start p{display:none}
.nlr-raket.short .nlr-rk-boost,.nlr-raket.short .nlr-rk-note,.nlr-raket.short .nlr-rk-pnl span{display:none}
.nlr-raket.short.nlr-rk-2p.narrow .nlr-rk-note{display:block}
.nlr-raket.short .nlr-rk-start [data-k="startBody"]{display:none}
.nlr-raket.short:not(.nlr-rk-2p) .nlr-rk-quote{top:8px;max-width:148px}
.nlr-raket.short:not(.nlr-rk-2p) .nlr-rk-pnl{display:none}
.nlr-raket.short.live:not(.nlr-rk-2p) .nlr-rk-pnl{display:block;top:8px;right:auto;bottom:auto;left:12px;text-align:left;min-width:0;max-width:min(220px,46%);padding:4px 8px}
.nlr-raket.short.live:not(.nlr-rk-2p) .nlr-rk-pnl b,.nlr-raket.short.live:not(.nlr-rk-2p) .nlr-rk-pnl .nlr-rk-boost{display:none}
.nlr-raket.short.live:not(.nlr-rk-2p) .nlr-rk-pnl small{font-size:11px;letter-spacing:.04em;text-transform:none}
.nlr-raket.short .nlr-rk-start{top:12px;left:12px;transform:none;text-align:left;max-width:min(340px,calc(100% - 200px))}
.nlr-raket.short.nlr-rk-2p .nlr-rk-pnl{max-width:min(148px,34%);max-height:44px;overflow:hidden}
.nlr-raket.short.nlr-rk-2p .nlr-rk-who{max-height:32px;overflow:hidden}
.nlr-raket.short.nlr-rk-2p .nlr-rk-start{left:50%;transform:translateX(-50%);text-align:center;top:52px;max-width:min(220px,34%)}
`

const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>'
const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
const ICON_FLAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>'
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'


function fmtPrice(v) {
  if (!Number.isFinite(v)) return '—'
  return `$${v >= 10 ? v.toFixed(2) : v >= 1 ? v.toFixed(3) : v.toFixed(4)}`
}
function fmtPct(v) {
  if (!Number.isFinite(v)) return '—'
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} %`
}
function fmtDate(t, key) {
  if (!Number.isFinite(t)) return '—'
  return simTid(t, key)
}
function periodName(k) {
  return { live: '1D', '5d': '5D', '1mo': '1M', '6mo': '6M', '1y': '1Y', '5y': '5Y', max: 'Max' }[k] ?? k
}

/* ---------- ren logik (testbar utan DOM) ---------- */

/** Totalt resultat i % av positionen: realiserat + ev. orealiserat för öppen position (med hävstång). */
export function pnlPct(state, price) {
  return state.realized + openPct(state, price)
}
/** Orealiserat resultat i % – 0 när man är flat. */
export function openPct(state, price) {
  if (state.entry == null || !Number.isFinite(price) || !(state.entry > 0)) return 0
  return (state.side === 'buy' ? 1 : -1) * (price / state.entry - 1) * state.lev * 100
}
export function isFlat(state) {
  return state.entry == null
}
/** BUY/SELL: öppna eller byt sida. Byte bokför det gamla resultatet och öppnar på samma kurs. */
export function switchSide(state, side, price) {
  if (state.entry != null && side === state.side) return state
  const realized = state.entry != null ? pnlPct(state, price) : state.realized
  return { ...state, side, entry: price, realized }
}
/** FLAT: stäng öppen position och bokför det realiserade resultatet. Redan flat → oförändrat. */
export function closePosition(state, price) {
  if (state.entry == null) return state
  return { ...state, realized: pnlPct(state, price), entry: null }
}
/** Hävstång inom befintliga steg (1–4). Öppen position bokförs och öppnas om på samma kurs, så att den nya hävstången gäller från nu. */
export function setLev(state, lev, price) {
  const l = Math.min(LEV_MAX, Math.max(LEV_MIN, Math.round(lev)))
  if (l === state.lev) return state
  if (state.entry != null) return { ...state, realized: pnlPct(state, price), entry: price, lev: l }
  return { ...state, lev: l }
}
export { LEV_MIN, LEV_MAX }

/**
 * Effektnivåer (0–1) ur det verkliga simulerade läget – inga påhittade tal. Flat → allt 0.
 *  move  = orealiserad kursrörelse för öppen position i % (utan hävstång: effekterna hålls skilda från hävstången)
 *  boost = plus-läge → flam-/fartförstärkning, full vid +FX_FULL %
 *  loss  = minus-läge → asteroider, fler och tätare ju större förlust, full vid −FX_FULL %
 *  glow  = kursen går just nu åt positionens håll (senaste candle-steget) → glöd och ljusspår
 */
export const FX_FULL = 6
export function effectLevels(state, price, prevPrice) {
  if (!state || state.entry == null || !(state.entry > 0) || !Number.isFinite(price)) return { move: 0, boost: 0, loss: 0, glow: 0, asteroids: 0 }
  const sgn = state.side === 'buy' ? 1 : -1
  const move = sgn * (price / state.entry - 1) * 100
  const mom = Number.isFinite(prevPrice) && prevPrice > 0 ? sgn * (price / prevPrice - 1) * 100 : 0
  const boost = Math.max(0, Math.min(1, move / FX_FULL))
  const loss = Math.max(0, Math.min(1, -move / FX_FULL))
  const glow = Math.max(0, Math.min(1, mom / 1.5))
  return { move, boost, loss, glow, asteroids: loss > 0 ? Math.max(1, Math.round(loss * 22)) : 0 }
}

/** Delad skärm: 2P → vänster/höger på bred skärm, över/under på smal. */
export function splitViewports(W, H, mode) {
  if (mode !== '2p') return [{ x: 0, y: 0, w: W, h: H }]
  if (W > 700) {
    const w = Math.floor(W / 2)
    return [{ x: 0, y: 0, w, h: H }, { x: w, y: 0, w: W - w, h: H }]
  }
  const h = Math.floor(H / 2)
  return [{ x: 0, y: 0, w: W, h }, { x: 0, y: h, w: W, h: H - h }]
}

function newPlayerState(lev = 1) {
  return { side: 'buy', entry: null, realized: 0, lev: Math.min(LEV_MAX, Math.max(LEV_MIN, lev)), traded: false }
}
/* ---------- stil- och rörelsehjälpare (rena, testbara) ---------- */

/** Bildfrekvensoberoende utjämning (easing mot mål): samma resultat vid 30, 60 eller 120 fps. */
export function smoothTo(cur, target, dt, rate) {
  if (cur == null || !Number.isFinite(cur)) return target
  return cur + (target - cur) * (1 - Math.exp(-rate * Math.max(0, dt)))
}
/** Lutning (radianer) ur sidled dx mot färd uppåt. Positiv = nosen åt höger. Nosen pekar framåt.
 *  calm dämpar vinkeln men behåller tecken, så riktningen syns även vid reducerad rörelse. */
export function rocketTilt(dx, pxPer, calm = false) {
  const up = Math.max(1, Math.abs(pxPer) || 1)
  let angle = Math.atan2(dx, up)
  if (calm) angle *= 0.65
  const cap = calm ? 0.45 : 0.6
  return Math.max(-cap, Math.min(cap, angle))
}

/** Nosen längs tangenten från första till sista punkten. y växer nedåt på skärmen. */
export function headingFromPath(samples, calm = false) {
  if (!samples || samples.length < 2) return 0
  const a = samples[0]
  const b = samples[samples.length - 1]
  const dx = b.x - a.x
  const dyUp = a.y - b.y
  return rocketTilt(dx, dyUp > 0 ? dyUp : 1, calm)
}
/** Glitch vid förlust ≥ GLITCH_AT % – samma mått som asteroiderna (orealiserad rörelse utan hävstång). Margin call finns inte i Raket. */
export const GLITCH_AT = 5
export function glitchLevel(fx, calm = false) {
  if (calm || !fx || !(fx.move <= -GLITCH_AT)) return 0
  return Math.min(1, 0.5 + (-fx.move - GLITCH_AT) / 6)
}
/** Partiklar per sekund: följer boost; 0 vid reducerad rörelse. */
export function exhaustRate(fx, burning, calm) {
  if (calm) return 0
  const b = fx?.boost ?? 0
  return burning ? 34 + 120 * b : 8
}
/** Parallaxfart (px/s) för stjärnlager/horisont: följer klockans fart och boost; 0 när pausat eller vid reducerad rörelse. */
export function parallaxSpeed(playing, calm, pxPerSec, boost = 0) {
  if (calm || !playing) return 0
  return pxPerSec * (1 + 1.4 * boost)
}
/** Stjärnor i tre lager (fjärran/mellan/nära) ur ett fast frö – normaliserade koordinater 0–1. */
export const STAR_LAYERS = [
  { n: 70, speed: 0.12, size: 1, alpha: 0.45 },
  { n: 40, speed: 0.3, size: 1.6, alpha: 0.6 },
  { n: 16, speed: 0.6, size: 2.2, alpha: 0.8 },
]
/** Rektangel för en HUD-etikett. y är mitten, textWidth är utan utfyllnad. */
export function labelBox(x, y, textWidth, { size = 13, align = 'left', W = Infinity } = {}) {
  const tw = textWidth + 16
  const h = size + 11
  let lx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x
  if (Number.isFinite(W)) lx = Math.max(4, Math.min(W - tw - 4, lx))
  return { x: lx, y: y - h / 2, w: tw, h }
}

export function boxesOverlap(a, b) {
  const iw = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const ih = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return iw > 1 && ih > 1
}

/** Flytta ENTRY tills rutan är fri. Hindren (SKJUTS, pris) lämnas orörda. */
export function dodgeEntryY(boxAt, obstacles, { minY, maxY, startY }) {
  const clear = (y) => y >= minY && y <= maxY && obstacles.every((o) => !boxesOverlap(boxAt(y), o))
  if (clear(startY)) return startY
  const reach = Math.ceil(Math.max(0, maxY - minY)) + 2
  for (let d = 2; d <= reach; d += 2) {
    if (clear(startY - d)) return startY - d
    if (clear(startY + d)) return startY + d
  }
  return null
}

export function makeStars(seed = 7) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return STAR_LAYERS.map((L) => Array.from({ length: L.n }, () => ({ x: rnd(), y: rnd(), tw: rnd() * 6.28, hue: rnd() })))
}

/* ---------- vy ---------- */

let monoLinked = false
function linkMonoFont() {
  if (monoLinked || typeof document === 'undefined') return
  monoLinked = true
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&display=swap' // samma leverantör som sidans övriga typsnitt
  document.head.appendChild(l)
}

export function createRaket({ engine }) {
  linkMonoFont()
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const root = document.createElement('div')
  root.className = 'nlr-raket'
  root.setAttribute('aria-label', t('rk.aria'))
  root.innerHTML = `
    <canvas></canvas>
    <div class="nlr-rk-scan" aria-hidden="true"></div>
    <div class="nlr-rk-div"></div>
    <div class="nlr-rk-card nlr-rk-start"><h3></h3><p data-k="startClaim" data-tr-claim="1"></p><p data-k="startBody"></p><p data-k="keys"></p></div>
    <div class="nlr-rk-card nlr-rk-end"><h3 data-k="endTitle"></h3><p data-k="endTxt"></p><button type="button" data-k="again"></button></div>`
  document.body.appendChild(root)
  const canvas = root.querySelector('canvas')
  const divider = root.querySelector('.nlr-rk-div')
  const startCard = root.querySelector('.nlr-rk-start')
  const endCard = root.querySelector('.nlr-rk-end')
  let entrySnap = null
  function relabel() {
    root.setAttribute('aria-label', t('rk.aria'))
    canvas.setAttribute('aria-label', t('rk.canvas'))
    startCard.querySelector('h3').textContent = t('mode.raket')
    const claim = startCard.querySelector('[data-k="startClaim"]')
    if (claim) claim.textContent = t('sim.claim')
    const body = startCard.querySelector('[data-k="startBody"]')
    if (body) body.textContent = t('rk.startBody')
    const keys = root.querySelector('[data-k="keys"]')
    if (keys) keys.textContent = ''
    endCard.querySelector('[data-k="endTitle"]').textContent = t('rk.endTitle')
    endCard.querySelector('[data-k="again"]').textContent = t('rk.again')
    if (endCard.classList.contains('on')) endCard.querySelector('[data-k="endTxt"]').textContent = t('end.body')
    for (const pl of players) {
      const q = pl.dom.q
      q('buyLbl').textContent = t('btn.buy')
      q('sellLbl').textContent = t('btn.sell')
      q('flatLbl').textContent = t('btn.flat')
      q('levName').textContent = t('btn.leverage')
      q('quoteLbl').textContent = t('sim.price')
      q('note').textContent = t('rk.note')
      q('play').setAttribute('aria-label', t('btn.playPause'))
      q('reset').setAttribute('aria-label', t('btn.reset'))
      q('levDown').setAttribute('aria-label', t('btn.lower', { key: hintSet(players.indexOf(pl)).levDown }))
      q('levUp').setAttribute('aria-label', t('btn.raise', { key: hintSet(players.indexOf(pl)).levUp }))
      q('who').textContent = t('rk.player', { n: players.indexOf(pl) + 1 })
    }
  }

  let mode = '1p'
  let pts = []
  let log = false
  let key = '1y'
  const clock = { p: 0, playing: false, started: false, ended: false }
  let players = []
  let visible = false
  let raf = 0
  let last = 0
  let dpr = 1
  // adaptiv upplösning: sjunker bildfrekvensen under 54 fps sänks canvasens pixeltäthet (2× → 1,5× → 1,25×) för att hålla 60 fps
  const DPR_STEPS = [2, 1.5, 1.25]
  let quality = 0
  let qualityAt = 0
  const stars = makeStars(11)
  const frameTimes = []
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = () => reduceMQ.matches
  const sprites = new Map()

  function hintSet(i) {
    const player = mode === '2p' ? (i === 0 ? 'p1' : 'p2') : '1p'
    return controlHints(MODES.raket.orientation, player)
  }

  function buildPlayerDom(i) {
    const h = hintSet(i)
    const el = document.createElement('div')
    el.className = 'nlr-rk-pl'
    el.innerHTML = `
      <div class="nlr-rk-card nlr-rk-who" data-k="who" style="display:${mode === '2p' ? 'block' : 'none'}"></div>
      <div class="nlr-rk-card nlr-rk-quote"><small data-k="quoteLbl"></small><b data-k="price">—</b><span data-k="when">—</span></div>
      <div class="nlr-rk-card nlr-rk-pnl" data-k="pnlCard"><small data-k="pnlLabel"></small><b data-k="pnl">—</b><span data-k="pnlSub"></span>
        <div class="nlr-rk-boost"><span data-k="boostLbl"></span><i><u data-k="boost"></u></i><span data-k="boostVal">0</span></div></div>
      <div class="nlr-rk-ctl">
        <div class="nlr-rk-row">
          <button type="button" class="nlr-rk-side buy" data-k="buy">${ICON_UP}<span data-k="buyLbl"></span><kbd class="nlr-rk-kbd">${h.buy}</kbd></button>
          <button type="button" class="nlr-rk-side sell" data-k="sell">${ICON_DOWN}<span data-k="sellLbl"></span><kbd class="nlr-rk-kbd">${h.sell}</kbd></button>
          <button type="button" class="nlr-rk-side flat" data-k="flat"><i data-k="flatIcon" style="display:contents">${ICON_FLAT}</i><span data-k="flatLbl"></span><kbd class="nlr-rk-kbd">${h.flat}</kbd></button>
        </div>
        <div class="nlr-rk-card nlr-rk-bar">
          <button type="button" class="play" data-k="play">▶</button>
          <button type="button" data-k="reset">↺</button>
          <div class="nlr-rk-lev"><button type="button" data-k="levDown"><kbd class="nlr-rk-kbd">${h.levDown}</kbd>−</button><span><small data-k="levName"></small><b data-k="lev">1×</b></span><button type="button" data-k="levUp"><kbd class="nlr-rk-kbd">${h.levUp}</kbd>+</button></div>
          <span class="nlr-rk-info" data-k="info">—</span>
        </div>
        <div class="nlr-rk-prog"><i data-k="prog"></i></div>
        <p class="nlr-rk-note" data-k="note" data-tr-claim="1"></p>
      </div>`
    root.appendChild(el)
    const q = (k) => el.querySelector(`[data-k="${k}"]`)
    const bindBtn = (k, fn) => {
      const b = q(k)
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        fn()
      })
      b.addEventListener('click', (e) => {
        if (e.detail === 0) fn() // tangentbordsaktivering via Enter
      })
    }
    bindBtn('buy', () => act(i, 'buy'))
    bindBtn('sell', () => act(i, 'sell'))
    bindBtn('flat', () => act(i, 'flat'))
    bindBtn('levDown', () => act(i, 'levDown'))
    bindBtn('levUp', () => act(i, 'levUp'))
    bindBtn('play', () => act(0, 'pause'))
    bindBtn('reset', () => act(0, 'reset'))
    return { el, q }
  }

  function fresh() {
    pts = engine.track?.points ?? []
    log = !!engine.spec?.log
    key = engine.spec?.key ?? '1y'
    clock.p = 0
    clock.playing = false
    clock.started = false
    clock.ended = false
    resetRaceXHook()
    for (const pl of players) pl.dom.el.remove()
    const n = mode === '2p' ? 2 : 1
    players = []
    for (let i = 0; i < n; i++) {
      players.push({
        st: newPlayerState(n === 1 ? engine.leverage || 1 : 1),
        rocks: [],
        shards: [],
        rings: [],
        puffs: [],
        emit: 0,
        hit: 0,
        scale: null,
        shownX: null,
        tilt: 0,
        scroll: [0, 0, 0],
        grid: 0,
        gl: 0,
        gNext: 0.4,
        gUntil: 0,
        fx: effectLevels(null),
        dom: buildPlayerDom(i),
      })
    }
    root.classList.toggle('nlr-rk-2p', mode === '2p')
    endCard.classList.remove('on')
    startCard.style.display = ''
    if (entrySnap) entrySnap.root.style.display = mode === '2p' ? 'none' : ''
    relabel()
  }

  const priceAt = (p, f = 'price') => {
    if (!pts.length) return NaN
    const i = Math.max(0, Math.min(pts.length - 1, Math.floor(p)))
    const j = Math.min(pts.length - 1, i + 1)
    const t = Math.min(1, Math.max(0, p - i))
    return pts[i][f] + (pts[j][f] - pts[i][f]) * t
  }
  const L = (v) => (log ? Math.log(Math.max(v, 1e-9)) : v)

  /** i = spelarindex (0/1). Paus/omstart är gemensamma. */
  function act(i, kind) {
    if (!pts.length) return
    if (kind === 'reset') {
      fresh()
      render()
      return
    }
    if (kind === 'pause') {
      if (clock.started && !clock.ended) clock.playing = !clock.playing
      render()
      return
    }
    const pl = players[i]
    if (!pl) return
    const price = priceAt(clock.p)
    if (kind === 'buy' || kind === 'sell') {
      if (clock.ended) return
      const next = stepSide(readSide(pl.st), kind === 'buy' ? 1 : -1)
      if (next === readSide(pl.st)) return
      pl.st = next === 'flat' ? closePosition(pl.st, price) : { ...switchSide(pl.st, next, price), traded: true }
      if (next !== 'flat') {
        clock.playing = true
        clock.started = true
        startCard.style.display = 'none'
        if (entrySnap) entrySnap.root.style.display = 'none'
      }
    } else if (kind === 'flat') {
      pl.st = closePosition(pl.st, price)
    } else if (kind === 'levDown' || kind === 'levUp') {
      pl.st = setLev(pl.st, pl.st.lev + (kind === 'levUp' ? 1 : -1), price)
    }
    render()
  }

  function onKey(e) {
    if (!visible) return
    const a = keyAction(e, mode, MODES.raket.orientation)
    if (!a) return
    e.preventDefault()
    e.stopImmediatePropagation() // NVDA Lines egna tangenter ska inte styra det dolda tåget
    act(a.player === 0 ? 0 : a.player - 1, a.action)
  }
  addEventListener('keydown', onKey, true)
  // mellanslag = FLAT: hindra att en fokuserad knapp dessutom "klickas" på keyup
  addEventListener(
    'keyup',
    (e) => {
      if (visible && PREVENT_DEFAULT.has(e.code) && keyAction(e, mode, MODES.raket.orientation)) e.preventDefault()
    },
    true,
  )

  function intersects(a, b) {
    const iw = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const ih = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    return iw > 1 && ih > 1
  }

  function placeStartCard() {
    if (startCard.style.display === 'none') return
    const rootBox = root.getBoundingClientRect()
    startCard.style.maxHeight = ''
    startCard.style.overflow = ''
    startCard.style.width = ''
    const blocks = [...root.querySelectorAll('.nlr-rk-ctl, .nlr-rk-who, .nlr-rk-pnl, .nlr-rk-quote')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 2 && r.height > 2)
    const ctlBoxes = [...root.querySelectorAll('.nlr-rk-ctl')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 2 && r.height > 2)
    if (!ctlBoxes.length) return
    const card = startCard.getBoundingClientRect()
    if (!blocks.some((r) => intersects(card, r))) return
    const ctlTop = Math.min(...ctlBoxes.map((r) => r.top))
    const sides = [...root.querySelectorAll('.nlr-rk-who, .nlr-rk-pnl, .nlr-rk-quote')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 2 && r.height > 2 && r.top < ctlTop)
    const floor = sides.length ? Math.max(...sides.map((r) => r.bottom)) + 8 : rootBox.top + 8
    const gap = ctlTop - 8 - floor
    startCard.style.left = '12px'
    startCard.style.right = 'auto'
    startCard.style.transform = 'none'
    startCard.style.width = `${Math.max(120, Math.round(rootBox.width - 24))}px`
    startCard.style.maxWidth = `${Math.max(120, Math.round(rootBox.width - 24))}px`
    if (gap >= 44) {
      startCard.style.top = `${Math.max(8, Math.round(floor - rootBox.top))}px`
      startCard.style.maxHeight = `${Math.floor(gap)}px`
      startCard.style.overflow = 'hidden'
      return
    }
    startCard.style.top = '8px'
    startCard.style.maxHeight = `${Math.max(36, Math.round(ctlTop - rootBox.top - 16))}px`
    startCard.style.overflow = 'hidden'
  }

  function render(dt = 0) {
    const W = root.clientWidth
    const H = root.clientHeight
    dpr = Math.min(DPR_STEPS[quality], devicePixelRatio || 1)
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }
    const c = canvas.getContext('2d')
    if (!c) return
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    const vps = splitViewports(W, H, mode)
    root.classList.toggle('narrow', mode === '2p' && W <= 700)
    root.classList.toggle('short', H < 520)
    root.classList.toggle('live', clock.started)
    const calm = reduced()
    const now = performance.now() / 1000
    players.forEach((pl, i) => {
      const vp = vps[i]
      Object.assign(pl.dom.el.style, { left: `${vp.x}px`, top: `${vp.y}px`, width: `${vp.w}px`, height: `${vp.h}px` })
      for (const sel of ['.nlr-rk-who', '.nlr-rk-pnl']) {
        const cEl = pl.dom.el.querySelector(sel)
        if (mode !== '2p') {
          cEl.style.top = ''
          cEl.style.bottom = ''
          cEl.style.left = ''
          cEl.style.right = ''
          cEl.style.maxWidth = ''
          continue
        }
        cEl.style.bottom = 'auto'
        cEl.style.top = '12px'
        if (W <= 700 && sel === '.nlr-rk-who') {
          cEl.style.left = '8px'
          cEl.style.right = 'auto'
          cEl.style.maxWidth = '42%'
        } else if (W <= 700) {
          cEl.style.left = 'auto'
          cEl.style.right = '8px'
          cEl.style.maxWidth = '46%'
        } else {
          cEl.style.left = ''
          cEl.style.right = ''
          cEl.style.maxWidth = ''
        }
      }
      c.save()
      c.beginPath()
      c.rect(vp.x, vp.y, vp.w, vp.h)
      c.clip()
      c.translate(vp.x, vp.y)
      renderPlayer(c, pl, i, vp, dt, calm, now)
      c.restore()
    })
    placeStartCard()
    if (mode === '2p') {
      const v = vps[1]
      Object.assign(divider.style, v.x > 0 ? { display: 'block', left: `${v.x}px`, top: '0', width: '1px', height: '100%' } : { display: 'block', left: '0', top: `${v.y}px`, width: '100%', height: '1px' })
    } else divider.style.display = 'none'
  }

  function backdrop(c, pl, W, H, dt, calm, now, speed, compact) {
    const hy = Math.round(H * 0.17)
    const bk = `${W}x${H}@${dpr}`
    if (!pl.bg || pl.bg.k !== bk) {
      // statiskt lager ritas en gång per storlek (billigt per bildruta på mobil)
      const cv = document.createElement('canvas')
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      const g = cv.getContext('2d')
      g.scale(dpr, dpr)
      const bg = g.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, BG_TOP)
      bg.addColorStop(1, BG_BOT)
      g.fillStyle = bg
      g.fillRect(0, 0, W, H)
      const glow = g.createLinearGradient(0, hy - 60, 0, hy + 40)
      glow.addColorStop(0, 'rgba(255,79,192,0)')
      glow.addColorStop(0.6, 'rgba(255,79,192,0.16)')
      glow.addColorStop(1, 'rgba(255,79,192,0)')
      g.fillStyle = glow
      g.fillRect(0, hy - 60, W, 100)
      const M = compact ? 6 : 9
      g.strokeStyle = 'rgba(46,230,255,0.07)'
      g.lineWidth = 1
      g.beginPath()
      for (let j = -M; j <= M; j++) {
        g.moveTo(W / 2 + j * 7, hy)
        g.lineTo(W / 2 + j * (W / M) * 0.9, H)
      }
      g.stroke()
      g.strokeStyle = 'rgba(255,79,192,0.5)'
      g.beginPath()
      g.moveTo(0, hy + 0.5)
      g.lineTo(W, hy + 0.5)
      g.stroke()
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
      vg.addColorStop(0, 'rgba(6,5,24,0)')
      vg.addColorStop(1, 'rgba(6,5,24,0.45)')
      g.fillStyle = vg
      g.fillRect(0, 0, W, H)
      pl.bg = { k: bk, cv }
    }
    c.drawImage(pl.bg.cv, 0, 0, W, H)
    pl.grid = (pl.grid + (speed / Math.max(120, H)) * 0.9 * dt) % 1
    const N = compact ? 9 : 12
    c.lineWidth = 1
    for (let k = 0; k < N; k++) {
      const t = (k + pl.grid) / N
      const y = hy + (H - hy) * t * t
      c.strokeStyle = `rgba(255,79,192,${(0.03 + 0.11 * t).toFixed(3)})`
      c.beginPath()
      c.moveTo(0, y)
      c.lineTo(W, y)
      c.stroke()
    }
    // stjärnor i tre lager med parallax
    STAR_LAYERS.forEach((Ly, li) => {
      pl.scroll[li] = (pl.scroll[li] + speed * Ly.speed * dt) % H
      const off = pl.scroll[li]
      for (const s of stars[li]) {
        const x = s.x * W
        let y = s.y * H + off
        if (y > H) y -= H
        const tw = calm ? 1 : 0.65 + 0.35 * Math.sin(now * 1.7 + s.tw)
        const a = Ly.alpha * tw * (y < hy ? 1 : 0.55)
        c.globalAlpha = a
        c.fillStyle = s.hue < 0.45 ? '#78ebff' : s.hue < 0.78 ? '#eaf6ff' : '#ff82d7'
        const z = Ly.size
        c.fillRect(x - z / 2, y - z / 2, z, z)
        if (li === 2) {
          c.fillRect(x - 3, y - 0.4, 6, 0.8)
          c.fillRect(x - 0.4, y - 3, 0.8, 6)
        }
      }
    })
    c.globalAlpha = 1
  }

  function hudFrame(c, W, H, compact) {
    const m = compact ? 6 : 10
    c.strokeStyle = 'rgba(46,230,255,0.16)'
    c.lineWidth = 1
    c.strokeRect(m + 0.5, m + 0.5, W - 2 * m - 1, H - 2 * m - 1)
    const a = compact ? 12 : 18
    c.strokeStyle = 'rgba(46,230,255,0.85)'
    c.lineWidth = 1.5
    c.beginPath()
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      c.moveTo(x, y + sy * a)
      c.lineTo(x, y)
      c.lineTo(x + sx * a, y)
    }
    c.stroke()
    c.strokeStyle = 'rgba(46,230,255,0.28)'
    c.lineWidth = 1
    c.beginPath()
    for (let y = m + 40; y < H - m - 20; y += 40) {
      c.moveTo(m, y + 0.5)
      c.lineTo(m + (y % 200 === 0 ? 8 : 4), y + 0.5)
      c.moveTo(W - m, y + 0.5)
      c.lineTo(W - m - (y % 200 === 0 ? 8 : 4), y + 0.5)
    }
    c.stroke()
  }

  function hudLabel(c, text, x, y, { color = TEXT, border = 'rgba(46,230,255,0.7)', bg = 'rgba(10,15,46,0.92)', size = 13, align = 'left', W = Infinity } = {}) {
    c.font = `600 ${size}px ${MONO}`
    const box = labelBox(x, y, c.measureText(text).width, { size, align, W })
    c.fillStyle = bg
    c.fillRect(box.x, box.y, box.w, box.h)
    c.strokeStyle = border
    c.lineWidth = 1
    c.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
    c.fillStyle = border
    c.fillRect(box.x, box.y, 5, 1.5)
    c.fillRect(box.x, box.y, 1.5, 5)
    c.fillRect(box.x + box.w - 5, box.y + box.h - 1.5, 5, 1.5)
    c.fillRect(box.x + box.w - 1.5, box.y + box.h - 5, 1.5, 5)
    c.fillStyle = color
    c.textBaseline = 'middle'
    c.textAlign = 'left'
    c.fillText(text, box.x + 8, y + 0.5)
    return box
  }

  function renderPlayer(c, pl, i, vp, dt, calm, now) {
    const W = vp.w
    const H = vp.h
    const st = pl.st
    const q = pl.dom.q
    const twoP = mode === '2p'
    const compact = W <= 640 || twoP
    const pxPer = twoP && H < 500 ? 20 : compact ? 26 : 30
    const fx = effectLevels(st, priceAt(clock.p), priceAt(Math.max(0, clock.p - 1)))
    pl.fx = fx
    const speed = parallaxSpeed(clock.playing && !clock.ended, calm, PTS_PER_SEC * pxPer, fx.boost)
    backdrop(c, pl, W, H, dt, calm, now, speed, compact)
    if (!pts.length) {
      c.fillStyle = TEXT2
      c.font = `500 14px ${MONO}`
      c.fillText(t('rk.missing'), 20, 40)
      return
    }
    const paneTop = pl.dom.el.getBoundingClientRect().top
    let cardBand = 0
    if (twoP) {
      for (const sel of ['.nlr-rk-who', '.nlr-rk-pnl']) {
        const card = pl.dom.el.querySelector(sel)
        if (!card || getComputedStyle(card).display === 'none') continue
        cardBand = Math.max(cardBand, card.getBoundingClientRect().bottom - paneTop)
      }
    }
    let rocketY = Math.round(H * (twoP ? (H < 500 ? 0.42 : 0.5) : W <= 640 ? 0.52 : 0.6))
    if (twoP) rocketY = Math.max(rocketY, Math.round(cardBand + 28))
    const p = clock.p
    const row = (k) => rocketY - (k - p) * pxPer
    const ahead = Math.ceil(rocketY / pxPer) + 2
    const behind = Math.ceil((H - rocketY) / pxPer) + 2
    const i0 = Math.max(0, Math.floor(p) - behind)
    const i1 = Math.min(pts.length - 1, Math.ceil(p) + ahead)
    let lo = Infinity
    let hi = -Infinity
    const w0 = Math.max(0, Math.floor(p) - 14)
    const w1 = Math.min(pts.length - 1, Math.ceil(p) + 14)
    for (let k = w0; k <= w1; k++) {
      lo = Math.min(lo, L(pts[k].lower), L(pts[k].price))
      hi = Math.max(hi, L(pts[k].upper), L(pts[k].price))
    }
    if (!(hi > lo)) hi = lo + 1
    // skalan glider mjukt (tidsbaserad easing)
    pl.scale = pl.scale ? { lo: smoothTo(pl.scale.lo, lo, dt || 0.016, 4.5), hi: smoothTo(pl.scale.hi, hi, dt || 0.016, 4.5) } : { lo, hi }
    const scale = pl.scale
    const padX = compact ? 40 : Math.max(120, W * 0.18)
    const col = (v) => padX + ((L(v) - scale.lo) / (scale.hi - scale.lo || 1)) * (W - padX * 2)
    const path = (f) => {
      c.beginPath()
      for (let k = i0; k <= i1; k++) (k === i0 ? c.moveTo : c.lineTo).call(c, col(pts[k][f]), row(k))
    }

    const band = (fa, fb, color) => {
      c.beginPath()
      for (let k = i0; k <= i1; k++) (k === i0 ? c.moveTo : c.lineTo).call(c, col(pts[k][fa]), row(k))
      for (let k = i1; k >= i0; k--) c.lineTo(col(pts[k][fb]), row(k))
      c.closePath()
      c.fillStyle = color
      c.fill()
    }
    band('mid', 'upper', 'rgba(140,240,60,0.08)')
    band('lower', 'mid', 'rgba(255,90,106,0.08)')

    c.setLineDash([5, 6])
    c.strokeStyle = 'rgba(185,201,234,0.5)'
    c.lineWidth = 1.2
    path('mid')
    c.stroke()
    c.setLineDash([])

    // neonräls: bred låg glöd + skarpa linjer (billigare än shadowBlur på mobil)
    const rail = (f, light, dark, rgb) => {
      c.strokeStyle = 'rgba(147,168,212,0.28)'
      c.lineWidth = 2
      c.beginPath()
      for (let k = i0; k <= i1; k++) {
        const x = col(pts[k][f])
        c.moveTo(x - 9, row(k))
        c.lineTo(x + 9, row(k))
      }
      c.stroke()
      c.strokeStyle = `rgba(${rgb},0.16)`
      c.lineWidth = 16
      c.lineJoin = 'round'
      path(f)
      c.stroke()
      for (const [off, colr] of [[-5, dark], [5, light]]) {
        c.strokeStyle = colr
        c.lineWidth = 2.2
        c.beginPath()
        for (let k = i0; k <= i1; k++) (k === i0 ? c.moveTo : c.lineTo).call(c, col(pts[k][f]) + off, row(k))
        c.stroke()
      }
    }
    rail('upper', BUY, BUY_D, '140,240,60')
    rail('lower', SELL, SELL_D, '255,90,106')
    c.font = `600 12px ${MONO}`
    c.textBaseline = 'middle'
    c.lineWidth = 4
    c.strokeStyle = BG_PANEL
    const labI = Math.min(pts.length - 1, Math.floor(p) + Math.floor(ahead * 0.55))
    c.textAlign = 'left'
    const buyW = t('btn.buy')
    const sellW = t('btn.sell')
    c.strokeText(buyW, col(pts[labI].upper) + 13, row(labI))
    c.fillStyle = BUY
    c.fillText(buyW, col(pts[labI].upper) + 13, row(labI))
    c.textAlign = 'right'
    c.strokeText(sellW, col(pts[labI].lower) - 13, row(labI))
    c.fillStyle = SELL
    c.fillText(sellW, col(pts[labI].lower) - 13, row(labI))
    c.textAlign = 'left'

    c.setLineDash([2, 4])
    c.strokeStyle = 'rgba(234,246,255,0.55)'
    c.lineWidth = 1.2
    path('price')
    c.stroke()
    c.setLineDash([])
    hudFrame(c, W, H, compact)

    // raket: vald sidas räls, eller mittlinjen när flat. Mjuk interpolation i sidled och lutning.
    const flat = isFlat(st)
    const f = flat ? 'mid' : st.side === 'buy' ? 'upper' : 'lower'
    const buyX = col(priceAt(p, 'upper'))
    const sellX = col(priceAt(p, 'lower'))
    const targetX = positionFor(flat ? 'flat' : st.side, buyX, sellX)
    const step = dt || 0.016
    const prevX = pl.shownX
    pl.shownX = smoothTo(pl.shownX, targetX, step, calm ? 14 : 11)
    const x = pl.shownX
    const railHere = col(priceAt(p, f))
    const railAhead = col(priceAt(Math.min(pts.length - 1, p + 1), f))
    const railDx = railAhead - railHere
    const playing = clock.playing && !clock.ended && dt > 0
    const forward = playing ? PTS_PER_SEC * dt * pxPer : pxPer
    const backX = prevX == null ? x - railDx : prevX
    // Framför: vald räls ett steg upp, plus sidsteget mot KÖP, SÄLJ eller FLAT.
    const aheadX = targetX + railDx
    const aim = headingFromPath(
      [
        { x: backX, y: rocketY + forward },
        { x, y: rocketY },
        { x: aheadX, y: rocketY - pxPer },
      ],
      calm,
    )
    pl.tilt = smoothTo(pl.tilt, aim, step, calm ? 11 : 6)
    const tilt = pl.tilt
    const accentRGB = st.side === 'buy' ? '140,240,60' : '255,90,106'
    const tagTxt = fx.boost > 0.01 ? t('rk.boost') : fx.loss > 0.01 ? t('rk.rocks') : flat && st.traded ? t('pos.flat') : ''
    const price = priceAt(p)
    const priceText = fmtPrice(price)
    c.font = `600 13px ${MONO}`
    const priceMeasure = c.measureText(priceText).width
    const priceOuter = priceMeasure + 16
    let priceX = x + (flat || st.side === 'buy' ? -priceOuter - 28 : 28)
    if (priceX < 4) priceX = x + 28
    if (priceX + priceOuter > W - 4) priceX = x - priceOuter - 28
    const fixedLabels = []
    if (tagTxt) {
      c.font = `600 11px ${MONO}`
      fixedLabels.push(labelBox(x, rocketY + 56, c.measureText(tagTxt).width, { size: 11, align: 'center', W }))
    }
    fixedLabels.push(labelBox(priceX, rocketY, priceMeasure, { size: 13, align: 'left', W }))
    const alert = fx.move <= -GLITCH_AT
    const alertY = Math.max(twoP ? 110 : 86, rocketY - (compact ? 120 : 150))
    const alertSize = compact ? 10 : 12
    if (alert) {
      c.font = `600 ${alertSize}px ${MONO}`
      fixedLabels.push(labelBox(W / 2, alertY, c.measureText(t('rk.warn', { pct: fmtPct(fx.move) })).width, { size: alertSize, align: 'center', W }))
    }

    // ingångslinje (befintligt ingångspris – ingen ny logik)
    if (!flat) {
      const ex = col(st.entry)
      if (ex > 8 && ex < W - 8) {
        c.setLineDash([3, 5])
        c.strokeStyle = `rgba(${accentRGB},0.4)`
        c.lineWidth = 1
        c.beginPath()
        c.moveTo(ex + 0.5, 0)
        c.lineTo(ex + 0.5, H)
        c.stroke()
        c.setLineDash([])
        const ctlTop = pl.dom.el.querySelector('.nlr-rk-ctl')?.getBoundingClientRect()
        let entryY = rocketY + (compact ? 78 : 92)
        let maxY = H - 16
        if (ctlTop) {
          const limit = ctlTop.top - paneTop - 16
          if (entryY > limit) entryY = limit
          maxY = Math.min(maxY, limit)
        }
        const entryText = `ENTRY ${fmtPrice(st.entry)}`
        c.font = `600 11px ${MONO}`
        const entryW = c.measureText(entryText).width
        const placed = dodgeEntryY((yy) => labelBox(ex, yy, entryW, { size: 11, align: 'center', W }), fixedLabels, {
          minY: rocketY + 21,
          maxY,
          startY: entryY,
        })
        if (placed != null) hudLabel(c, entryText, ex, placed, { size: 11, align: 'center', color: TEXT, border: `rgba(${accentRGB},0.8)`, W })
      }
    }

    // (1) ljusspår när kursen går åt positionens håll (aldrig när flat)
    if (fx.glow > 0.02) {
      const from = Math.max(0, p - (calm ? 3 : 7))
      c.save()
      c.lineCap = 'round'
      c.globalCompositeOperation = 'lighter'
      const steps = 20
      for (let k = 0; k < steps; k++) {
        const pa = from + ((p - from) * k) / steps
        const pb = from + ((p - from) * (k + 1)) / steps
        c.strokeStyle = `rgba(${accentRGB},${((0.08 + 0.5 * (k / steps)) * fx.glow).toFixed(3)})`
        c.lineWidth = 3 + 9 * fx.glow * (k / steps)
        c.beginPath()
        c.moveTo(col(priceAt(pa, f)), row(pa))
        c.lineTo(k === steps - 1 ? x : col(priceAt(pb, f)), row(pb))
        c.stroke()
      }
      c.restore()
    }

    // (3) boost: fartlinjer i cyan
    if (fx.boost > 0.01 && !calm) {
      const n = Math.round(4 + 12 * fx.boost)
      c.strokeStyle = `rgba(46,230,255,${(0.12 + 0.22 * fx.boost).toFixed(3)})`
      c.lineWidth = 1.2
      c.beginPath()
      const ax = Math.sin(tilt)
      const ay = Math.cos(tilt)
      const px = Math.cos(tilt)
      const py = -Math.sin(tilt)
      for (let k = 0; k < n; k++) {
        const ox = ((k * 53) % 150) - 75
        const len = 18 + 44 * fx.boost
        const along = ((now * (260 + 380 * fx.boost) + k * 97) % 280) - 70
        const sx = x + px * ox + ax * along
        const sy = rocketY + py * ox + ay * along
        c.moveTo(sx, sy)
        c.lineTo(sx + ax * len, sy + ay * len)
      }
      c.stroke()
    }

    // partiklar: partiklar ur munstycket (bak), följer boost; ingen vid reducerad rörelse
    const S = 1.15
    const nozzle = 29 * S
    const nx = x - Math.sin(tilt) * nozzle
    const ny = rocketY + Math.cos(tilt) * nozzle
    const cap = (twoP ? 150 : 240) >> (quality > 0 ? 1 : 0)
    if (dt > 0) {
      pl.emit += exhaustRate(fx, clock.playing, calm) * dt
      const worldV = speed * 0.6
      while (pl.emit >= 1 && pl.puffs.length < cap) {
        pl.emit -= 1
        const back = 110 + 230 * fx.boost + Math.random() * 60
        const side = (Math.random() - 0.5) * (40 + 40 * fx.boost)
        const spark = fx.boost > 0.25 && Math.random() < 0.3
        pl.puffs.push({
          x: nx + (Math.random() - 0.5) * 4,
          y: ny,
          vx: -Math.sin(tilt) * back + Math.cos(tilt) * side,
          vy: Math.cos(tilt) * back + Math.sin(tilt) * side + worldV,
          life: 0,
          max: spark ? 0.3 + Math.random() * 0.2 : 0.45 + Math.random() * 0.45,
          r0: spark ? 1 : 1.4 + Math.random(),
          r1: spark ? 1 : 4 + 4 * fx.boost,
          spark,
        })
      }
      if (pl.emit > 1) pl.emit = 0
      const drag = Math.exp(-1.8 * dt)
      for (const pf of pl.puffs) {
        pf.life += dt
        pf.vx *= drag
        pf.vy = pf.vy * drag + worldV * (1 - drag)
        pf.x += pf.vx * dt
        pf.y += pf.vy * dt
      }
      pl.puffs = pl.puffs.filter((pf) => pf.life < pf.max)
    }
    if (calm) pl.puffs.length = 0
    if (pl.puffs.length) {
      c.save()
      c.globalCompositeOperation = 'lighter'
      for (const pf of pl.puffs) {
        const a = pf.life / pf.max
        const al = Math.pow(1 - a, 1.3)
        if (pf.spark) {
          c.strokeStyle = `rgba(255,236,190,${(0.9 * al).toFixed(3)})`
          c.lineWidth = 1.2
          c.beginPath()
          c.moveTo(pf.x, pf.y)
          c.lineTo(pf.x - pf.vx * 0.03, pf.y - pf.vy * 0.03)
          c.stroke()
          continue
        }
        c.fillStyle = a < 0.22 ? `rgba(255,236,200,${(0.8 * al).toFixed(3)})` : a < 0.55 ? `rgba(255,79,192,${(0.55 * al).toFixed(3)})` : `rgba(46,230,255,${(0.4 * al).toFixed(3)})`
        c.beginPath()
        c.arc(pf.x, pf.y, pf.r0 + (pf.r1 - pf.r0) * a, 0, Math.PI * 2)
        c.fill()
      }
      c.restore()
    }

    // (2) asteroider vid förlust (egna per spelare). Rent visuellt – kursdata och tempo påverkas inte.
    const want = calm ? Math.ceil(fx.asteroids / 3) : fx.asteroids
    if (dt > 0) {
      const spawnGap = calm ? 1.2 : 0.9 - 0.75 * fx.loss
      if (pl.rocks.length < want && (pl.rocks.length === 0 || pl.rocks[pl.rocks.length - 1].age > spawnGap)) {
        const spread = compact ? W * 0.45 : Math.min(W * 0.35, 380)
        const r = 6 + Math.random() * (8 + 10 * fx.loss)
        pl.rocks.push({
          x: x + (Math.random() * 2 - 1) * spread,
          y: -30,
          r,
          vx: (Math.random() * 2 - 1) * (calm ? 6 : 26),
          vy: calm ? 30 : 90 + 170 * fx.loss + Math.random() * 60,
          rot: Math.random() * 6.28,
          vr: calm ? 0 : (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.8), // jämn, mjuk rotation
          sprite: rockSprite(r, Math.floor(Math.random() * 1e6), dpr),
          age: 0,
        })
      }
      for (const r of pl.rocks) {
        r.age += dt
        r.x += r.vx * dt
        if (fx.loss === 0) r.vy += 600 * dt // inget minus (eller flat): kvarvarande stenar lämnar bilden snabbt
        r.y += r.vy * dt
        r.rot += r.vr * dt
        if (!r.hit && fx.loss > 0 && Math.hypot(r.x - x, r.y - rocketY) < r.r + 20) {
          r.hit = true
          pl.hit = calm ? 0.4 : 1
          if (!calm) {
            for (let k = 0; k < 12; k++) {
              const a = Math.random() * Math.PI * 2
              const v = 60 + Math.random() * 140
              pl.shards.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: a, vr: (Math.random() * 2 - 1) * 6, s: 1.5 + Math.random() * r.r * 0.25, life: 0, max: 0.6 + Math.random() * 0.4, c: k % 3 })
            }
            pl.rings.push({ x: r.x, y: r.y, life: 0 })
          }
        }
      }
      pl.rocks = pl.rocks.filter((r) => r.y < H + 40 && !r.hit)
      for (const sh of pl.shards) {
        sh.life += dt
        sh.x += sh.vx * dt
        sh.y += sh.vy * dt
        sh.vx *= Math.exp(-1.2 * dt)
        sh.vy *= Math.exp(-1.2 * dt)
        sh.rot += sh.vr * dt
      }
      pl.shards = pl.shards.filter((sh) => sh.life < sh.max)
      for (const rg of pl.rings) rg.life += dt
      pl.rings = pl.rings.filter((rg) => rg.life < 0.45)
      pl.hit = Math.max(0, pl.hit - dt * 2.2)
    }
    for (const r of pl.rocks) {
      c.save()
      c.translate(r.x, r.y)
      c.rotate(r.rot)
      const z = r.sprite.width / dpr
      c.drawImage(r.sprite, -z / 2, -z / 2, z, z)
      c.restore()
    }
    const SH = ['rgba(46,230,255,', 'rgba(255,79,192,', 'rgba(150,130,200,']
    for (const sh of pl.shards) {
      const al = (1 - sh.life / sh.max).toFixed(3)
      c.save()
      c.translate(sh.x, sh.y)
      c.rotate(sh.rot)
      c.fillStyle = SH[sh.c] + al + ')'
      c.beginPath()
      c.moveTo(0, -sh.s)
      c.lineTo(sh.s * 0.8, sh.s * 0.7)
      c.lineTo(-sh.s * 0.7, sh.s * 0.5)
      c.closePath()
      c.fill()
      c.restore()
    }
    for (const rg of pl.rings) {
      const k = rg.life / 0.45
      c.strokeStyle = `rgba(46,230,255,${(0.7 * (1 - k)).toFixed(3)})`
      c.lineWidth = 1.5
      c.beginPath()
      c.arc(rg.x, rg.y, 6 + 30 * k, 0, Math.PI * 2)
      c.stroke()
    }

    const jolt = pl.hit > 0 && !calm ? Math.sin(now * 90) * 4 * pl.hit : 0
    drawRocket(c, x + jolt, rocketY, tilt + jolt * 0.02, flat ? 'flat' : st.side, clock.playing, fx, calm, now, getSprite(flat ? 'flat' : st.side))
    if (pl.hit > 0) {
      c.fillStyle = `rgba(255,90,106,${(0.12 * pl.hit).toFixed(3)})`
      c.fillRect(0, 0, W, H)
    }

    // etikett under raketen: läge + öppet resultat (riktiga tal). Rutan är redan räknad så ENTRY kan väja.
    if (tagTxt) {
      const plus = fx.boost > 0.01
      const minus = fx.loss > 0.01
      hudLabel(c, tagTxt, x, rocketY + 56, { size: 11, align: 'center', W, color: plus || minus ? ON_DARK : TEXT, bg: plus ? BUY : minus ? SELL : 'rgba(10,15,46,0.92)', border: plus ? BUY : minus ? SELL : CYAN })
    }
    if (alert) hudLabel(c, t('rk.warn', { pct: fmtPct(fx.move) }), W / 2, alertY, { size: alertSize, align: 'center', W, color: TEXT, border: SELL, bg: 'rgba(40,8,28,0.92)' })

    hudLabel(c, priceText, priceX, rocketY, { size: 13, W, color: TEXT, border: 'rgba(46,230,255,0.8)' })

    // glitch vid stor förlust (inte vid reducerad rörelse)
    const gl = glitchLevel(fx, calm)
    pl.gl = gl
    const pnlCard = q('pnlCard')
    pnlCard.classList.toggle('alert', alert)
    if (gl > 0 && dt > 0) {
      pl.gNext -= dt
      if (pl.gNext <= 0) {
        pl.gUntil = now + 0.1 + 0.12 * gl
        pl.gNext = 1.5 - 0.8 * gl + Math.random() * 0.5
        pnlCard.classList.remove('glitch')
        void pnlCard.offsetWidth
        pnlCard.classList.add('glitch')
      }
      if (now < pl.gUntil) glitchSlices(c, vp, gl)
    } else pnlCard.classList.remove('glitch')

    // HUD – bara riktiga tal från simuleringen
    const ts = priceAt(p, 't')
    q('price').textContent = fmtPrice(price)
    q('when').textContent = fmtDate(ts, key)
    const practiceBadge = mode !== '2p' && root.classList.contains('short') && root.classList.contains('live')
    q('pnlLabel').textContent = practiceBadge ? t('hud.practiceBadge') : !st.traded ? t('hud.result') : flat ? t('rk.pnlFlat') : t('rk.pnlOpen', { lev: st.lev })
    const pnlEl = q('pnl')
    pnlEl.textContent = !st.traded ? '—' : t('hud.resultNote')
    pnlEl.style.color = TEXT
    q('pnlSub').textContent = !st.traded ? t('rk.pnlSubNone') : flat ? t('rk.pnlSubFlat') : t('rk.pnlSubOpen', { pct: fmtPct(openPct(st, price)) })
    const lvl = fx.loss > 0.01 ? fx.loss : fx.boost
    q('boostLbl').textContent = fx.loss > 0.01 ? t('rk.rocks') : t('rk.boost')
    const boostKey = `${Math.round(lvl * 100)}|${fx.loss > 0.01}`
    if (pl.boostKey !== boostKey) {
      pl.boostKey = boostKey
      const boostBar = q('boost')
      boostBar.style.width = `${Math.round(lvl * 100)}%`
      boostBar.style.background = fx.loss > 0.01 ? SELL : CYAN
      boostBar.style.boxShadow = `0 0 8px ${fx.loss > 0.01 ? SELL : CYAN}`
      q('boostVal').textContent = String(Math.round(lvl * 100))
    }
    q('lev').textContent = `${st.lev}×`
    q('levDown').disabled = st.lev <= LEV_MIN
    q('levUp').disabled = st.lev >= LEV_MAX
    q('play').textContent = clock.playing ? '❚❚' : '▶'
    const pos = flat ? t('pos.flat') : st.side === 'buy' ? t('pos.long') : t('pos.short')
    q('info').innerHTML = `<b style="color:${flat ? TEXT : st.side === 'buy' ? BUY : SELL}">${pos}</b> · ${fmtPrice(price)} · ${periodName(key)} · ${fmtDate(ts, key)}`
    q('prog').style.width = `${pts.length > 1 ? (p / (pts.length - 1)) * 100 : 0}%`
    q('buy').classList.toggle('on', !flat && st.side === 'buy')
    q('sell').classList.toggle('on', !flat && st.side === 'sell')
    const fb = q('flat')
    fb.classList.toggle('on', flat)
    fb.disabled = flat
    fb.setAttribute('aria-pressed', String(flat))
    fb.title = flat ? t('flat.already') : t('flat.close')
    q('flatIcon').innerHTML = flat ? ICON_CHECK : ICON_FLAT
    q('note').style.display = mode === '2p' && i === 0 ? 'none' : ''
    q('who').style.display = mode === '2p' ? 'block' : 'none'
  }

  /** Glitch: horisontella skivor förskjuts + RGB-delning (canvas kopierar sig själv inom spelarens ruta). */
  function glitchSlices(c, vp, gl) {
    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    const X = Math.round(vp.x * dpr)
    const Y = Math.round(vp.y * dpr)
    const Wd = Math.round(vp.w * dpr)
    const Hd = Math.round(vp.h * dpr)
    const n = 3 + Math.round(4 * gl)
    for (let k = 0; k < n; k++) {
      const sh = Math.round((3 + Math.random() * 22) * dpr)
      const sy = Y + Math.round(Math.random() * (Hd - sh))
      const off = Math.round((Math.random() * 2 - 1) * (8 + 20 * gl) * dpr)
      c.drawImage(canvas, X, sy, Wd, sh, X + off, sy, Wd, sh)
    }
    c.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 2; k++) {
      const sh = Math.round((6 + Math.random() * 30) * dpr)
      const sy = Y + Math.round(Math.random() * (Hd - sh))
      c.fillStyle = k ? 'rgba(46,230,255,0.10)' : 'rgba(255,79,192,0.12)'
      c.fillRect(X, sy, Wd, sh)
    }
    c.restore()
  }

  function getSprite(side) {
    const k = `${side}@${dpr}`
    if (!sprites.has(k)) sprites.set(k, rocketSprite(side, dpr))
    return sprites.get(k)
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    frameTimes.push(now)
    while (frameTimes.length && now - frameTimes[0] > 1000) frameTimes.shift()
    if (quality < DPR_STEPS.length - 1 && now - qualityAt > 1000 && frameTimes.length > 1) {
      const span = now - frameTimes[0]
      const fps = span > 0 ? ((frameTimes.length - 1) * 1000) / span : 60
      if (span > 900 && fps < 54 && (devicePixelRatio || 1) > DPR_STEPS[quality + 1]) {
        quality++
        qualityAt = now
        frameTimes.length = 0
      }
    }
    if (clock.playing && !clock.ended) {
      clock.p = Math.min(pts.length - 1, clock.p + PTS_PER_SEC * dt)
      if (clock.p >= pts.length - 1) {
        clock.ended = true
        clock.playing = false
        root.querySelector('[data-k="endTxt"]').textContent = t('end.body')
        endCard.classList.add('on')
        noteRaceXEnd({
          ended: true,
          players: mode === '2p' ? 2 : 1,
          bars: pts,
          decisions: players.map((pl) => ({
            side: isFlat(pl.st) ? 'flat' : pl.st.side,
            leverage: pl.st.lev,
            entry: pl.st.entry,
          })),
          replay: () => act(0, 'reset'),
        })
      }
    }
    render(dt)
    if (visible) raf = requestAnimationFrame(frame)
  }
  root.querySelector('[data-k="again"]').onclick = () => act(0, 'reset')
  entrySnap = mountEntrySnap(root, {
    getSide: () => (players[0] ? readSide(players[0].st) : 'flat'),
    applyDir: (dir) => act(0, dir > 0 ? 'buy' : 'sell'),
  })
  entrySnap.root.style.display = 'none'
  bindStepGestures(root, {
    enabled: () => visible && mode === '1p',
    getSide: () => (players[0] ? readSide(players[0].st) : 'flat'),
    applyDir: (dir) => act(0, dir > 0 ? 'buy' : 'sell'),
  })
  onLang(() => {
    relabel()
    entrySnap?.paint()
  })

  return {
    show() {
      if (!players.length || engine.track?.points !== pts) fresh()
      visible = true
      root.classList.add('on')
      last = performance.now()
      qualityAt = last
      frameTimes.length = 0
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    },
    hide() {
      visible = false
      clock.playing = false
      root.classList.remove('on')
      cancelAnimationFrame(raf)
    },
    setMode(m) {
      const nm = m === '2p' ? '2p' : '1p'
      if (nm === mode && players.length) return
      mode = nm
      fresh()
      if (visible) render()
    },
    mode: () => mode,
    // för tester/skärmdumpar
    state: (i = 0) => (players[i] ? { ...players[i].st, p: clock.p, playing: clock.playing, flat: isFlat(players[i].st) } : null),
    fx: (i = 0) => players[i]?.fx,
    rocks: (i = 0) => players[i]?.rocks.length ?? 0,
    visuals: (i = 0) => {
      const pl = players[i]
      return pl ? { puffs: pl.puffs.length, shards: pl.shards.length, glitch: pl.gl, tilt: pl.tilt, scroll: [...pl.scroll], grid: pl.grid, reduced: reduced() } : null
    },
    fps: () => frameTimes.length,
    quality: () => ({ level: quality, dpr }),
    /** skärmdumpar: håll en glitch-skur i sec sekunder (bara om glitch är aktiv, dvs. förlust ≥ GLITCH_AT % och inte reducerad rörelse) */
    holdGlitch(i = 0, sec = 1) {
      const pl = players[i]
      if (pl && pl.gl > 0) pl.gUntil = performance.now() / 1000 + sec
      return pl?.gl ?? 0
    },
    step(sec) {
      clock.p = Math.min(pts.length - 1, clock.p + PTS_PER_SEC * sec)
      render()
    },
    act,
  }
}

/* ---------- ritning (egen grafik) ---------- */

const SPR_W = 72
const SPR_H = 96
const SPR_CY = 42 // raketens mitt i spriten
const newCanvas = (w, h) => {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv
}

/** Raketkropp i metall (guldgradient + högdager enligt KS guldknappar). Nosen mot −y, munstycket bak (+y). */
function rocketSprite(side, dpr) {
  const cv = newCanvas(Math.ceil(SPR_W * dpr), Math.ceil(SPR_H * dpr))
  const g = cv.getContext('2d')
  g.scale(dpr, dpr)
  g.translate(SPR_W / 2, SPR_CY)
  g.scale(1.15, 1.15)
  const acc = side === 'buy' ? [BUY, '#3f8a0e'] : side === 'sell' ? [SELL, '#8e1f2e'] : ['#b9c9ea', '#4c5d86'] // flat = stål
  // fenor (bakom kroppen), färgad efter sida
  for (const s of [-1, 1]) {
    const fg = g.createLinearGradient(s * 8, 6, s * 18, 22)
    fg.addColorStop(0, acc[0])
    fg.addColorStop(1, acc[1])
    g.fillStyle = fg
    g.strokeStyle = GOLD_EDGE
    g.lineWidth = 1.1
    g.beginPath()
    g.moveTo(s * 9, 5)
    g.lineTo(s * 18.5, 22)
    g.lineTo(s * 8, 19.5)
    g.closePath()
    g.fill()
    g.stroke()
    g.strokeStyle = 'rgba(255,255,255,0.55)'
    g.lineWidth = 0.8
    g.beginPath()
    g.moveTo(s * 9.6, 7)
    g.lineTo(s * 17.2, 20.6)
    g.stroke()
  }
  // munstycke
  const ng = g.createLinearGradient(-7, 0, 7, 0)
  ng.addColorStop(0, '#1d2440')
  ng.addColorStop(0.45, '#8190b8')
  ng.addColorStop(1, '#1d2440')
  g.fillStyle = ng
  g.strokeStyle = 'rgba(5,8,20,0.9)'
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(-6, 19)
  g.lineTo(6, 19)
  g.lineTo(7.6, 25.5)
  g.lineTo(-7.6, 25.5)
  g.closePath()
  g.fill()
  g.stroke()
  // kropp
  const body = () => {
    g.beginPath()
    g.moveTo(0, -30)
    g.bezierCurveTo(12, -18, 11, 6, 9, 20)
    g.lineTo(-9, 20)
    g.bezierCurveTo(-11, 6, -12, -18, 0, -30)
    g.closePath()
  }
  const bg = g.createLinearGradient(-11, 0, 11, 0)
  bg.addColorStop(0, '#5c4216')
  bg.addColorStop(0.12, GOLD[4])
  bg.addColorStop(0.3, GOLD[2])
  bg.addColorStop(0.44, GOLD[0])
  bg.addColorStop(0.58, GOLD[1])
  bg.addColorStop(0.8, GOLD[3])
  bg.addColorStop(1, '#4e3812')
  body()
  g.fillStyle = bg
  g.fill()
  g.save()
  body()
  g.clip()
  // specular-strimma (--gold-metal-specular) och topphögdager (--gold-metal-highlight)
  const sp = g.createLinearGradient(-9, 0, 3, 0)
  sp.addColorStop(0, 'rgba(255,255,255,0)')
  sp.addColorStop(0.35, 'rgba(255,253,244,0.8)')
  sp.addColorStop(0.55, 'rgba(255,250,232,0.28)')
  sp.addColorStop(1, 'rgba(255,250,232,0)')
  g.fillStyle = sp
  g.fillRect(-9, -30, 12, 50)
  const hl = g.createRadialGradient(0, -26, 0, 0, -26, 18)
  hl.addColorStop(0, 'rgba(255,244,212,0.65)')
  hl.addColorStop(1, 'rgba(255,244,212,0)')
  g.fillStyle = hl
  g.fillRect(-12, -32, 24, 30)
  // ring
  g.strokeStyle = 'rgba(66,44,10,0.7)'
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(-11, 10)
  g.lineTo(11, 10)
  g.stroke()
  g.strokeStyle = 'rgba(255,244,214,0.55)'
  g.beginPath()
  g.moveTo(-11, 11.2)
  g.lineTo(11, 11.2)
  g.stroke()
  g.restore()
  body()
  g.strokeStyle = GOLD_EDGE
  g.lineWidth = 1.3
  g.stroke()
  // nos i mörk metall med cyan kantljus
  const nose = () => {
    g.beginPath()
    g.moveTo(0, -30)
    g.bezierCurveTo(5, -25, 7, -21, 7.6, -18)
    g.lineTo(-7.6, -18)
    g.bezierCurveTo(-7, -21, -5, -25, 0, -30)
    g.closePath()
  }
  const nz = g.createLinearGradient(-8, 0, 8, 0)
  nz.addColorStop(0, '#040a18')
  nz.addColorStop(0.4, '#34487a')
  nz.addColorStop(1, GOLD_INK)
  nose()
  g.fillStyle = nz
  g.fill()
  g.strokeStyle = GOLD_EDGE
  g.lineWidth = 1.1
  g.stroke()
  g.strokeStyle = 'rgba(46,230,255,0.75)'
  g.lineWidth = 0.9
  g.beginPath()
  g.moveTo(-1.2, -28.2)
  g.bezierCurveTo(-4.2, -25, -5.8, -22, -6.2, -19)
  g.stroke()
  // fönster: guldring + cyan glas
  const rg = g.createLinearGradient(-6, -11, 6, 1)
  rg.addColorStop(0, GOLD[0])
  rg.addColorStop(1, GOLD[4])
  g.fillStyle = rg
  g.beginPath()
  g.arc(0, -5, 5.8, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = GOLD_EDGE
  g.lineWidth = 1
  g.stroke()
  const gl = g.createRadialGradient(-1.4, -6.6, 0.4, 0, -5, 4.4)
  gl.addColorStop(0, '#d6fbff')
  gl.addColorStop(0.4, CYAN)
  gl.addColorStop(1, '#0a3550')
  g.fillStyle = gl
  g.beginPath()
  g.arc(0, -5, 4.3, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.beginPath()
  g.arc(-1.6, -6.8, 1, 0, Math.PI * 2)
  g.fill()
  // mittfena
  const mf = g.createLinearGradient(-1.5, 0, 1.5, 0)
  mf.addColorStop(0, acc[1])
  mf.addColorStop(0.5, acc[0])
  mf.addColorStop(1, acc[1])
  g.fillStyle = mf
  g.fillRect(-1.3, 9, 2.6, 13)
  return cv
}

let HALO = null
/** Mjukt ljus runt raketen (cyan kärna, magenta kant) – ritas en gång. */
function haloSprite() {
  if (HALO) return HALO
  HALO = newCanvas(128, 128)
  const g = HALO.getContext('2d')
  const h = g.createRadialGradient(64, 64, 2, 64, 64, 64)
  h.addColorStop(0, 'rgba(46,230,255,0.24)')
  h.addColorStop(0.5, 'rgba(255,79,192,0.10)')
  h.addColorStop(1, 'rgba(46,230,255,0)')
  g.fillStyle = h
  g.fillRect(0, 0, 128, 128)
  return HALO
}

/** Raket med mjukt ljus runt, flamma bak (+y) och metallkropp ur spriten. Lokalt origo = raketens mitt, nosen mot −y. */
function drawRocket(c, x, y, tilt, side, burning, fx, calm, now, sprite) {
  c.save()
  c.translate(x, y)
  // mjukt ljus runt raketen
  c.globalCompositeOperation = 'lighter'
  const rr = 58 + 30 * fx.boost
  c.globalAlpha = Math.min(1, 0.7 + 0.3 * Math.max(fx.glow, fx.boost))
  c.drawImage(haloSprite(), -rr, 4 - rr, rr * 2, rr * 2)
  c.globalAlpha = 1
  c.rotate(tilt)
  // flamma bak (efter munstycket)
  const flick = burning && !calm ? 0.16 * Math.sin(now * 17) + 0.08 * Math.sin(now * 41) : 0
  const fl = (burning ? 1 + flick : 0.5) * (1 + 1.5 * fx.boost)
  c.scale(1.15, 1.15)
  const y0 = 25
  for (const [w, len, col] of [[8, 30, 'rgba(255,79,192,0.55)'], [5.8, 22, 'rgba(255,192,90,0.85)'], [3.2, 12, 'rgba(255,248,230,0.95)']]) {
    c.fillStyle = col
    c.beginPath()
    c.moveTo(-w, y0)
    c.quadraticCurveTo(-w * 0.6, y0 + len * fl * 0.6, 0, y0 + len * fl)
    c.quadraticCurveTo(w * 0.6, y0 + len * fl * 0.6, w, y0)
    c.closePath()
    c.fill()
  }
  c.globalCompositeOperation = 'source-over'
  c.scale(1 / 1.15, 1 / 1.15)
  c.drawImage(sprite, -SPR_W / 2, -SPR_CY, SPR_W, SPR_H)
  c.restore()
}

/** Asteroid-sprite: fast form ur frö, violett sten med cyan kantljus. Ritas en gång och roteras sedan mjukt. */
function rockSprite(r, seed, dpr) {
  const half = r * 1.2 + 3
  const cv = newCanvas(Math.ceil(half * 2 * dpr), Math.ceil(half * 2 * dpr))
  const g = cv.getContext('2d')
  g.scale(dpr, dpr)
  g.translate(half, half)
  let s = seed || 1
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const n = 9
  g.beginPath()
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    const rr = r * (0.75 + 0.35 * rnd())
    ;(k === 0 ? g.moveTo : g.lineTo).call(g, Math.cos(a) * rr, Math.sin(a) * rr)
  }
  g.closePath()
  const fill = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.1)
  fill.addColorStop(0, '#6a5a9c')
  fill.addColorStop(0.55, '#2e2458')
  fill.addColorStop(1, '#150f30')
  g.fillStyle = fill
  g.fill()
  g.strokeStyle = 'rgba(46,230,255,0.6)'
  g.lineWidth = 1.1
  g.stroke()
  g.fillStyle = 'rgba(6,4,18,0.45)'
  g.beginPath()
  g.arc(r * 0.25, -r * 0.2, r * 0.22, 0, Math.PI * 2)
  g.arc(-r * 0.3, r * 0.25, r * 0.15, 0, Math.PI * 2)
  g.fill()
  return cv
}
