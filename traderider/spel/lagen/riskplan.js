/**
 * Gemensam stop-loss / take-profit för simulerade affärer.
 * Förval är 2 % stopp och 4 % mål (1:2). Valet sparas i localStorage, inget anrop till en server.
 *
 * Jämförelse mellan två spelare (eller en spelare och en referens) sker i realiserat R
 * mot den egna risken, och bara om planen följdes: utgång på egen stopp eller eget mål,
 * och stoppen inte flyttad efter ingången. En vidare stopp ger ett mindre R för samma
 * procentrörelse, så den vinner inte bara för att insatsen var större.
 *
 * Referensloppet och dess slutkort finns i utkastet som lägger till det (inte här).
 * Det kortet kan anropa compareDuel med planOutcome för varje sida, i stället för att
 * utse den som först når ett gemensamt mål.
 */
export const STORE_KEY = 'tr.riskplan'
export const UNLOCK_KEY = 'tr.riskplan.unlock'
export const CHOICE_KEY = 'tr.riskplan.choice'
/** Frågan i första lektionens quiz. Inget veckovillkor. */
export const RATIO_QUIZ_ID = 'bas1-ratio'
export const DEFAULT_SL = 2
export const DEFAULT_TP = 4
export const PCT_SL_MIN = 0.1
export const PCT_SL_MAX = 20
export const PCT_TP_MIN = 0.1
export const PCT_TP_MAX = 80
/** En träffad stop-loss får kosta högst så här många procent av övningsinsatsen, inklusive hävstång. */
export const MAX_LOSS_PCT = 2

export function defaultPlan() {
  return { v: 1, unit: 'pct', sl: DEFAULT_SL, tp: DEFAULT_TP }
}

export function slotKey(slot) {
  return slot === 'p2' ? `${STORE_KEY}.p2` : STORE_KEY
}

/** Andel vunna affärer som krävs för jämnt utfall. 2 betyder 1:2 och ger 1/3. */
export function breakEvenWinRate(rewardOverRisk) {
  const r = Number(rewardOverRisk)
  if (!(r > 0)) return null
  return 1 / (1 + r)
}

export function ratioChoiceUnlocked(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(UNLOCK_KEY) || 'null')
    return parsed?.unlocked === true && parsed?.quizId === RATIO_QUIZ_ID
  } catch {
    return false
  }
}

/** Anropas när första lektionens quiz är godkänt och ratio-frågan är rätt. */
export function markRatioQuizPassed(storage) {
  try {
    storage?.setItem?.(UNLOCK_KEY, JSON.stringify({ unlocked: true, quizId: RATIO_QUIZ_ID }))
  } catch {
    /* storage unavailable */
  }
  return true
}

function browserStore(storage) {
  if (storage) return storage
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function floorFor(storage) {
  return ratioChoiceUnlocked(browserStore(storage)) ? 1.5 : 2
}

export function chosenRatio(storage) {
  const box = browserStore(storage)
  if (!ratioChoiceUnlocked(box)) return 2
  const value = Number(box?.getItem?.(CHOICE_KEY))
  return Math.abs(value - 1.5) < 0.05 ? 1.5 : 2
}

export function setChosenRatio(storage, ratio) {
  const box = browserStore(storage)
  const value = ratioChoiceUnlocked(box) && Math.abs(Number(ratio) - 1.5) < 0.05 ? 1.5 : 2
  try {
    box?.setItem?.(CHOICE_KEY, String(value))
  } catch {
    /* storage unavailable */
  }
  return value
}

/** Referensen använder alltid 2 % stopp och mål enligt valt förhållande: 4 % vid 1:2, 3 % vid 1:1,5. */
export function referenceDistances(ratio) {
  const reward = Math.abs(Number(ratio) - 1.5) < 0.05 ? 1.5 : 2
  return { slPct: 2, tpPct: reward === 1.5 ? 3 : 4, ratio: reward }
}

export function assessPlan(plan, opts = {}) {
  const errors = []
  const warnings = []
  const unit = plan?.unit === 'price' ? 'price' : 'pct'
  const sl = plan?.sl === '' || plan?.sl == null ? NaN : Number(plan.sl)
  const tp = plan?.tp === '' || plan?.tp == null ? NaN : Number(plan.tp)
  const minRatio = opts.minRatio == null ? 2 : Number(opts.minRatio)
  const leverage = Number(opts.leverage) > 0 ? Number(opts.leverage) : 1
  const price = Number(opts.price)
  if (!(sl > 0)) errors.push('sl-missing')
  else if (unit === 'pct' && (sl < PCT_SL_MIN || sl > PCT_SL_MAX)) errors.push('sl-bounds')
  else if (unit === 'price' && !(sl < 1e6)) errors.push('sl-bounds')
  if (sl > 0) {
    const lossPct = unit === 'price' && price > 0 ? (sl / price) * 100 * leverage : unit === 'pct' ? sl * leverage : null
    if (lossPct != null && lossPct > MAX_LOSS_PCT + 1e-9) errors.push('loss-cap')
  }
  if (!(tp > 0)) errors.push('tp-missing')
  else if (unit === 'pct' && (tp < PCT_TP_MIN || tp > PCT_TP_MAX)) errors.push('tp-bounds')
  else if (unit === 'price' && !(tp < 1e6)) errors.push('tp-bounds')
  const ratio = sl > 0 && tp > 0 ? tp / sl : null
  if (ratio != null && ratio + 1e-9 < 1) warnings.push('rr-below-1')
  if (ratio != null && ratio + 1e-9 < minRatio) errors.push('rr-min')
  return { ok: errors.length === 0, errors, warnings, ratio, breakEven: breakEvenWinRate(ratio), unit, minRatio, leverage }
}

export function loadPlan(storage, slot = 'shared') {
  const base = defaultPlan()
  try {
    const raw = storage?.getItem?.(slotKey(slot))
    if (!raw) return base
    const p = JSON.parse(raw)
    const sl = Number(p?.sl)
    const tp = Number(p?.tp)
    if (!(sl > 0)) return base
    return { v: 1, unit: p?.unit === 'price' ? 'price' : 'pct', sl, tp: tp > 0 ? tp : base.tp }
  } catch {
    return base
  }
}

export function savePlan(storage, plan, slot = 'shared') {
  try {
    const sl = Number(plan?.sl)
    const tp = Number(plan?.tp)
    if (!(sl > 0)) return false
    storage?.setItem?.(
      slotKey(slot),
      JSON.stringify({ v: 1, unit: plan?.unit === 'price' ? 'price' : 'pct', sl, tp: Number.isFinite(tp) ? tp : 0 }),
    )
    return true
  } catch {
    return false
  }
}

export function levelsFor(plan, entry, side, opts) {
  const price = Number(entry)
  if (!(price > 0) || !assessPlan(plan, opts).ok) return null
  const slDist = plan.unit === 'price' ? Number(plan.sl) : (price * Number(plan.sl)) / 100
  const tpDist = plan.unit === 'price' ? Number(plan.tp) : (price * Number(plan.tp)) / 100
  if (!(slDist > 0) || !(tpDist > 0) || slDist >= price) return null
  const long = side === 'buy' || side === 'long'
  return {
    stop: long ? price - slDist : price + slDist,
    target: long ? price + tpDist : price - tpDist,
    riskDist: slDist,
  }
}

export function hitLevel(side, price, stop, target) {
  if (!Number.isFinite(price) || !Number.isFinite(stop) || !Number.isFinite(target)) return null
  const long = side === 'buy' || side === 'long'
  if (long) {
    if (price <= stop) return 'stop'
    if (price >= target) return 'target'
  } else {
    if (price >= stop) return 'stop'
    if (price <= target) return 'target'
  }
  return null
}

/** R mot den stopp som gällde vid ingången. Disciplin kräver utgång på den stoppen eller det målet. */
export function planOutcome({ entry, stop, exit, side, reason, overridden }) {
  const risk = Math.abs(Number(entry) - Number(stop))
  const px = Number(exit)
  if (!(risk > 0) || !Number.isFinite(px)) return { r: null, disciplined: false, reason: reason || null }
  const long = side === 'buy' || side === 'long'
  const move = long ? px - Number(entry) : Number(entry) - px
  return { r: move / risk, disciplined: (reason === 'stop' || reason === 'target') && !overridden, reason: reason || null }
}

export function tickBook(book, price) {
  if (!book || book.exit) return book
  const why = hitLevel(book.side, price, book.stop, book.target)
  if (!why) return book
  return { ...book, exit: planOutcome({ entry: book.entry, stop: book.stop, exit: price, side: book.side, reason: why, overridden: book.overridden }) }
}

export function closeBook(book, price, reason) {
  if (!book || book.exit) return book
  return { ...book, exit: planOutcome({ entry: book.entry, stop: book.stop, exit: price, side: book.side, reason, overridden: book.overridden }) }
}

/**
 * a och b är planOutcome. Vinnaren är den högre disciplinerade R.
 * Den som lämnat planen kan inte vinna, även om procentrörelsen var större.
 * Bara en sida som följt planen: den vinner. Ingen av dem: ingen vinnare.
 */
/** Referensen går långt från första kursen och stänger på sin egen stopp eller sitt eget mål. */
export function referenceOutcome(prices, ratio) {
  const spec = referenceDistances(ratio)
  const seq = (prices || []).map((p) => Number(p?.price ?? p)).filter((n) => n > 0)
  if (!seq.length) return { ...spec, exit: null }
  const levels = levelsFor({ unit: 'pct', sl: spec.slPct, tp: spec.tpPct }, seq[0], 'buy', { minRatio: spec.ratio })
  if (!levels) return { ...spec, exit: null }
  let book = { entry: seq[0], side: 'buy', stop: levels.stop, target: levels.target, overridden: false, exit: null }
  for (const px of seq) {
    book = tickBook(book, px)
    if (book.exit) break
  }
  if (!book.exit) book = closeBook(book, seq[seq.length - 1], 'period')
  return { ...spec, exit: book.exit }
}

export function compareDuel(a, b) {
  const score = (p) => (p && p.disciplined && Number.isFinite(p.r) ? p.r : null)
  const sa = score(a)
  const sb = score(b)
  if (sa == null && sb == null) return { winner: null, reason: 'none' }
  if (sa != null && sb == null) return { winner: 'a', reason: 'only', r: sa }
  if (sb != null && sa == null) return { winner: 'b', reason: 'only', r: sb }
  if (Math.abs(sa - sb) < 1e-9) return { winner: 'tie', reason: 'tie', r: sa }
  return sa > sb ? { winner: 'a', reason: 'higher', r: sa, other: sb } : { winner: 'b', reason: 'higher', r: sb, other: sa }
}

function dec(n, digits, comma) {
  const s = Number(n).toFixed(digits)
  return comma ? s.replace('.', ',') : s
}

const css = `
.tr-plan{display:flex;flex-wrap:wrap;align-items:center;gap:6px;box-sizing:border-box;margin:0;padding:6px 8px;border-radius:10px;background:color-mix(in srgb, currentColor 8%, transparent);font:500 12px/1.3 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:inherit;pointer-events:auto}
.tr-plan label{display:inline-flex;align-items:center;gap:4px}
.tr-plan input{width:4.8rem;border:1px solid color-mix(in srgb, currentColor 35%, transparent);background:transparent;color:inherit;border-radius:6px;padding:4px 6px;font:600 13px ui-monospace,monospace}
.tr-plan button{border:1px solid color-mix(in srgb, currentColor 35%, transparent);background:transparent;color:inherit;border-radius:999px;padding:3px 8px;cursor:pointer;font:600 11px inherit}
.tr-plan button.on{border-color:currentColor}
.tr-plan button:disabled{opacity:.4;cursor:default}
.tr-plan .tr-plan-live{font-variant-numeric:tabular-nums}
.tr-plan .tr-plan-warn{flex:1 0 100%}
.tr-plan-award{flex:1 0 100%;font-weight:600}
.tr-plan[data-state="locked"] .tr-plan-award{opacity:.9}
.tr-plan[data-state="unlocked"] .tr-plan-award{color:#3f8a0e}
.tr-plan-card{position:fixed;z-index:32;left:12px;top:calc(var(--tr-chrome-b, 88px) + 8px);width:min(440px,calc(100vw - 24px));background:rgba(246,242,234,.96);color:#1c1915;border:1px solid rgba(28,25,21,.14);border-radius:14px;box-shadow:0 8px 24px rgba(28,25,21,.12)}
`
let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const el = document.createElement('style')
  el.textContent = css
  document.head.appendChild(el)
}

/**
 * Fält för SL och TP. slot «p2» har egen nyckel, övriga delar «tr.riskplan».
 * onEdit(plan) körs när användaren ändrar. getPrice() används när enheten växlar.
 */
export function mountPlanControl(parent, { slot = 'shared', storage, onEdit, getPrice, getLeverage, t, comma } = {}) {
  ensureStyle()
  const say = typeof t === 'function' ? t : (k) => k
  const root = document.createElement('div')
  root.className = 'tr-plan'
  root.innerHTML = `
    <span data-k="name"></span>
    <button type="button" data-k="unit"></button>
    <label><span data-k="slLbl"></span><input data-k="sl" inputmode="decimal" /></label>
    <label><span data-k="tpLbl"></span><input data-k="tp" inputmode="decimal" /></label>
    <button type="button" data-k="p15"></button>
    <button type="button" data-k="p2"></button>
    <button type="button" data-k="p3"></button>
    <span class="tr-plan-live" data-k="live"></span>
    <span class="tr-plan-award" data-k="award"></span>
    <span class="tr-plan-warn" data-k="status"></span>
    <span class="tr-plan-warn" data-k="warn"></span>`
  parent.appendChild(root)
  const q = (k) => root.querySelector(`[data-k="${k}"]`)
  let plan = loadPlan(storage ?? (typeof localStorage !== 'undefined' ? localStorage : null), slot)
  const store = () => storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  const useComma = () => (typeof comma === 'function' ? comma() : !!comma)

  function options() {
    return { minRatio: floorFor(store()), leverage: Number(getLeverage?.()) || 1, price: Number(getPrice?.()) }
  }
  function paint() {
    const unlocked = ratioChoiceUnlocked(store())
    root.dataset.state = unlocked ? 'unlocked' : 'locked'
    const check = assessPlan(plan, options())
    q('name').textContent = say('plan.name')
    q('unit').textContent = plan.unit === 'price' ? say('plan.unitPrice') : say('plan.unitPct')
    q('slLbl').textContent = say('plan.sl')
    q('tpLbl').textContent = say('plan.tp')
    q('p15').textContent = say('plan.preset', { r: useComma() ? '1,5' : '1.5' })
    q('p15').disabled = !unlocked
    q('p15').title = unlocked ? '' : say('plan.locked')
    q('p2').textContent = say('plan.preset', { r: '2' })
    q('p3').textContent = say('plan.preset', { r: '3' })
    const slEl = q('sl')
    const tpEl = q('tp')
    if (document.activeElement !== slEl) slEl.value = plan.sl === '' || plan.sl == null ? '' : String(plan.sl)
    if (document.activeElement !== tpEl) tpEl.value = plan.tp === '' || plan.tp == null ? '' : String(plan.tp)
    if (check.ratio == null) q('live').textContent = say('plan.liveEmpty')
    else {
      const shown = dec(check.ratio, check.ratio >= 10 ? 0 : 2, useComma())
      const be = dec(check.breakEven * 100, 0, false)
      q('live').textContent = say('plan.live', { rr: `1:${shown}`, be })
    }
    const warn = []
    if (check.errors.includes('sl-missing')) warn.push(say('plan.errSl'))
    else if (check.errors.includes('sl-bounds') || check.errors.includes('tp-bounds')) warn.push(say('plan.errBounds'))
    if (check.errors.includes('tp-missing')) warn.push(say('plan.errTp'))
    if (check.errors.includes('rr-min')) warn.push(say('plan.errMin', { min: say(check.minRatio === 1.5 ? 'plan.rr15' : 'plan.rr2') }))
    else if (check.warnings.includes('rr-below-1')) warn.push(say('plan.warnRr'))
    if (check.errors.includes('loss-cap')) warn.push(say('plan.errLoss'))
    q('award').textContent = say(unlocked ? 'plan.awardOn' : 'plan.awardOff')
    q('status').textContent = unlocked ? say('plan.unlocked') : say('plan.locked')
    q('warn').textContent = warn.join(' ')
  }

  function commit(next) {
    plan = next
    const check = assessPlan(plan, options())
    if (check.ratio != null && check.ok) {
      if (Math.abs(check.ratio - 1.5) < 0.05) setChosenRatio(store(), 1.5)
      else if (Math.abs(check.ratio - 2) < 0.05) setChosenRatio(store(), 2)
    }
    if (Number(plan.sl) > 0) savePlan(store(), plan, slot)
    paint()
    onEdit?.(plan)
  }

  function readInput(el) {
    const raw = String(el.value).trim().replace(',', '.')
    if (raw === '') return ''
    const n = Number(raw)
    return Number.isFinite(n) ? n : ''
  }

  q('sl').addEventListener('input', () => commit({ ...plan, sl: readInput(q('sl')) }))
  q('tp').addEventListener('input', () => commit({ ...plan, tp: readInput(q('tp')) }))
  q('unit').addEventListener('click', () => {
    const price = Number(getPrice?.())
    const nextUnit = plan.unit === 'price' ? 'pct' : 'price'
    let sl = Number(plan.sl)
    let tp = Number(plan.tp)
    if (price > 0 && sl > 0 && tp > 0) {
      if (nextUnit === 'price') {
        sl = (price * sl) / 100
        tp = (price * tp) / 100
      } else {
        sl = (sl / price) * 100
        tp = (tp / price) * 100
      }
      sl = Math.round(sl * 100) / 100
      tp = Math.round(tp * 100) / 100
    }
    commit({ ...plan, unit: nextUnit, sl, tp })
  })
  for (const [key, mult] of [
    ['p15', 1.5],
    ['p2', 2],
    ['p3', 3],
  ]) {
    q(key).addEventListener('click', () => {
      if (mult < 2 && !ratioChoiceUnlocked(store())) return
      const sl = Number(plan.sl) > 0 ? Number(plan.sl) : DEFAULT_SL
      commit({ ...plan, sl, tp: Math.round(sl * mult * 100) / 100 })
    })
  }
  paint()
  return {
    root,
    getPlan: () => plan,
    refresh() {
      plan = loadPlan(store(), slot)
      paint()
    },
    paint,
  }
}
