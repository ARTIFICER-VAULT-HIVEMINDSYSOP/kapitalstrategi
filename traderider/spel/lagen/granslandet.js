/**
 * Gränslandet: lobbyn mellan historisk bana och live mot en annan spelare.
 *
 * Tillstånd: HIST -> LOBBY(acc P1, acc P2) -> LIVE.
 *  - Varje spelare accepterar. Accept kan ångras tills alla har accepterat.
 *  - När alla har accepterat går lobbyn till LIVE (onLive).
 *  - Avböj eller timeout går tillbaka till HIST (onBack).
 *
 * Gränslandet är ingen shop och har ingenting med NFT Advisory att göra.
 * Modulen är fristående: inga importer, ingen nätanrop, inga order.
 *
 * Lager:
 *  1. createLobbyMachine: ren tillståndsmaskin utan DOM (körs i node, i webbläsaren
 *     och senare på en server som auktoritet för online 2P).
 *  2. connectTransport: valfri port för online 2P. Lokalt 2P på samma skärm behöver ingen.
 *  3. mountLobby / enterLobby: interstitiell scen ovanpå spelet (helskärm, modal).
 */

export const STATES = Object.freeze({ HIST: 'HIST', LOBBY: 'LOBBY', LIVE: 'LIVE' })
export const DEFAULT_TIMEOUT_MS = 60000

const clampPlayers = (n) => (Number(n) === 1 ? 1 : 2)

/**
 * Ren tillståndsmaskin. Spelare numreras 1..players.
 * now() styr klockan (för tester), tick() kontrollerar timeout.
 */
export function createLobbyMachine(opts = {}) {
  const players = clampPlayers(opts.players)
  const timeoutMs = Number.isFinite(opts.timeoutMs) && opts.timeoutMs > 0 ? opts.timeoutMs : DEFAULT_TIMEOUT_MS
  const now = typeof opts.now === 'function' ? opts.now : () => Date.now()
  let phase = STATES.HIST
  let accepted = new Array(players).fill(false)
  let deadline = null
  let reason = null
  let lastBy = null
  const listeners = new Set()

  const valid = (p) => Number.isInteger(p) && p >= 1 && p <= players

  function snapshot() {
    const left = deadline == null ? null : Math.max(0, deadline - now())
    return {
      phase,
      players,
      accepted: accepted.slice(),
      allAccepted: accepted.every(Boolean),
      deadline,
      remainingMs: left,
      reason,
      lastBy,
    }
  }
  function emit(event) {
    const snap = snapshot()
    for (const fn of listeners) fn(snap, event)
  }
  function toHist(why, by = null) {
    phase = STATES.HIST
    accepted = new Array(players).fill(false)
    deadline = null
    reason = why
    lastBy = by
    emit({ type: why, player: by })
    return true
  }

  return {
    players,
    timeoutMs,
    phase: () => phase,
    snapshot,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    /** HIST -> LOBBY. Nollställer alla accept. */
    enter() {
      if (phase !== STATES.HIST) return false
      phase = STATES.LOBBY
      accepted = new Array(players).fill(false)
      deadline = now() + timeoutMs
      reason = null
      lastBy = null
      emit({ type: 'enter' })
      return true
    },
    accept(p) {
      if (phase !== STATES.LOBBY || !valid(p) || accepted[p - 1]) return false
      accepted[p - 1] = true
      lastBy = p
      if (accepted.every(Boolean)) {
        phase = STATES.LIVE
        deadline = null
        reason = 'accepted'
        emit({ type: 'live', player: p })
      } else emit({ type: 'accept', player: p })
      return true
    },
    /** Ångra. Går bara i LOBBY, alltså innan alla har accepterat. */
    unaccept(p) {
      if (phase !== STATES.LOBBY || !valid(p) || !accepted[p - 1]) return false
      accepted[p - 1] = false
      lastBy = p
      emit({ type: 'unaccept', player: p })
      return true
    },
    toggle(p) {
      if (phase !== STATES.LOBBY || !valid(p)) return false
      return accepted[p - 1] ? this.unaccept(p) : this.accept(p)
    },
    decline(p = null) {
      if (phase !== STATES.LOBBY) return false
      return toHist('decline', valid(p) ? p : null)
    },
    tick() {
      if (phase !== STATES.LOBBY || deadline == null) return false
      if (now() < deadline) return false
      return toHist('timeout')
    },
    /** Tillbaka till HIST från vilket läge som helst (t.ex. nytt lopp). */
    reset() {
      phase = STATES.HIST
      accepted = new Array(players).fill(false)
      deadline = null
      reason = null
      lastBy = null
      emit({ type: 'reset' })
      return true
    },
  }
}

/**
 * Port för online 2P (senare). transport = { send(msg), subscribe(fn) -> unsubscribe }.
 * localPlayers anger vilka spelare som styrs på den här skärmen. Lokala handlingar
 * skickas ut; handlingar från andra spelare kommer in via transporten.
 * Ingen server byggs här. I online-läget bör servern köra samma createLobbyMachine
 * och vara auktoritet; klienterna speglar då serverns händelser.
 */
export function connectTransport(machine, transport, opts = {}) {
  const local = new Set(Array.isArray(opts.localPlayers) && opts.localPlayers.length ? opts.localPlayers : [1])
  const ACTIONS = ['accept', 'unaccept', 'decline']
  const off = transport?.subscribe?.((msg) => {
    if (!msg || !ACTIONS.includes(msg.type)) return
    if (msg.type !== 'decline' && local.has(msg.player)) return
    machine[msg.type](msg.player)
  })
  function act(type, player) {
    if (type !== 'decline' && !local.has(player)) return false
    const ok = machine[type](player)
    if (ok) transport?.send?.({ type, player })
    return ok
  }
  return {
    local: () => [...local],
    accept: (p) => act('accept', p),
    unaccept: (p) => act('unaccept', p),
    toggle: (p) => (machine.snapshot().accepted[p - 1] ? act('unaccept', p) : act('accept', p)),
    decline: (p) => act('decline', p),
    disconnect: () => (typeof off === 'function' ? off() : undefined),
  }
}

/** Två sammankopplade transporter i minnet. För tester och för att visa porten. */
export function createLoopbackPair() {
  const a = new Set()
  const b = new Set()
  const make = (mine, theirs) => ({
    send: (msg) => theirs.forEach((fn) => fn({ ...msg })),
    subscribe: (fn) => {
      mine.add(fn)
      return () => mine.delete(fn)
    },
  })
  return [make(a, b), make(b, a)]
}

/* ---------------------------------------------------------------- texter */

export const LABELS = {
  sv: {
    title: 'Gränslandet',
    lead: 'Historiken är slut. Nästa del spelas mot verkliga kurser.',
    rule2: 'Båda spelarna måste acceptera. Det går att ångra tills båda har accepterat.',
    rule1: 'Acceptera för att fortsätta.',
    player: 'Spelare {n}',
    accept: 'Acceptera',
    accepted: 'Accepterat. Tryck igen för att ångra.',
    waiting: 'Väntar',
    ready: 'Redo',
    back: 'Tillbaka till historiken',
    timer: 'Tid kvar: {s} s',
    hist: 'HISTORIK',
    live: 'LIVE',
    source: '{source} · {time}',
    noSource: 'Källa inte ansluten',
    key: 'Tangent {key}',
    going: 'Alla har accepterat. Live startar.',
    timeout: 'Tiden gick ut. Tillbaka till historiken.',
    declined: 'Tillbaka till historiken.',
    note: 'Utbildning med simulerade pengar. Inga order läggs.',
  },
  no: {
    title: 'Grenselandet',
    lead: 'Historikken er slutt. Neste del spilles mot reelle kurser.',
    rule2: 'Begge spillerne må akseptere. Det går an å angre til begge har akseptert.',
    rule1: 'Aksepter for å fortsette.',
    player: 'Spiller {n}',
    accept: 'Aksepter',
    accepted: 'Akseptert. Trykk igjen for å angre.',
    waiting: 'Venter',
    ready: 'Klar',
    back: 'Tilbake til historikken',
    timer: 'Tid igjen: {s} s',
    hist: 'HISTORIKK',
    live: 'LIVE',
    source: '{source} · {time}',
    noSource: 'Kilde ikke tilkoblet',
    key: 'Tast {key}',
    going: 'Alle har akseptert. Live starter.',
    timeout: 'Tiden gikk ut. Tilbake til historikken.',
    declined: 'Tilbake til historikken.',
    note: 'Opplæring med simulerte penger. Ingen ordre legges inn.',
  },
  en: {
    title: 'The Borderland',
    lead: 'The history is over. The next part is played against real prices.',
    rule2: 'Both players must accept. You can undo until both have accepted.',
    rule1: 'Accept to continue.',
    player: 'Player {n}',
    accept: 'Accept',
    accepted: 'Accepted. Press again to undo.',
    waiting: 'Waiting',
    ready: 'Ready',
    back: 'Back to the history',
    timer: 'Time left: {s} s',
    hist: 'HISTORY',
    live: 'LIVE',
    source: '{source} · {time}',
    noSource: 'Source not connected',
    key: 'Key {key}',
    going: 'Everyone has accepted. Live is starting.',
    timeout: 'Time ran out. Back to the history.',
    declined: 'Back to the history.',
    note: 'Education with simulated money. No orders are placed.',
  },
  uk: {
    title: 'Межа',
    lead: 'Історія закінчилася. Наступна частина грається на реальних цінах.',
    rule2: 'Обидва гравці мають погодитися. Скасувати можна, доки не погодилися обидва.',
    rule1: 'Погодьтеся, щоб продовжити.',
    player: 'Гравець {n}',
    accept: 'Погодитися',
    accepted: 'Погоджено. Натисніть ще раз, щоб скасувати.',
    waiting: 'Очікування',
    ready: 'Готово',
    back: 'Назад до історії',
    timer: 'Залишилось: {s} с',
    hist: 'ІСТОРІЯ',
    live: 'LIVE',
    source: '{source} · {time}',
    noSource: 'Джерело не підключено',
    key: 'Клавіша {key}',
    going: 'Усі погодилися. Live починається.',
    timeout: 'Час вийшов. Назад до історії.',
    declined: 'Назад до історії.',
    note: 'Навчання з симульованими грошима. Ордери не розміщуються.',
  },
}

export function labelsFor(lang, overrides) {
  const base = LABELS[lang] || LABELS.sv
  return { ...LABELS.sv, ...base, ...(overrides || {}) }
}

function fill(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''))
}

/** hh:mm i Europe/Stockholm. */
export function formatClock(ms, timeZone = 'Europe/Stockholm') {
  if (!Number.isFinite(ms)) return ''
  try {
    return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(new Date(ms))
  } catch {
    const d = new Date(ms)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
}

/** "LIVE"-radens källtext. Utan källa sägs det rakt ut att den inte är ansluten. */
export function sourceLine(source, L, nowMs) {
  const name = typeof source === 'string' ? source : source && source.name
  if (!name) return L.noSource
  const time = source && Number.isFinite(source.time) ? source.time : nowMs
  return fill(L.source, { source: name, time: formatClock(time) })
}

/* ---------------------------------------------------------------- tangenter */

export const DEFAULT_KEYS = Object.freeze({
  1: ['KeyE', 'Digit1'],
  2: ['Enter', 'NumpadEnter', 'Digit2'],
  solo: ['KeyE', 'Enter', 'NumpadEnter', 'Space', 'Digit1'],
  back: ['Escape'],
})

const KEY_NAMES = { KeyE: 'E', Enter: 'Enter', NumpadEnter: 'Enter', Digit1: '1', Digit2: '2', Space: 'Space', Escape: 'Esc' }
const keyName = (code) => KEY_NAMES[code] || String(code).replace(/^Key|^Digit/, '')

/** Vilken handling en tangent ger: { player } eller { back: true } eller null. */
export function keyToAction(code, players, keys = DEFAULT_KEYS) {
  if ((keys.back || []).includes(code)) return { back: true }
  if (clampPlayers(players) === 1) return (keys.solo || keys[1] || []).includes(code) ? { player: 1 } : null
  for (const p of [1, 2]) if ((keys[p] || []).includes(code)) return { player: p }
  return null
}

/* ---------------------------------------------------------------- vy */

const THEMES = ['default', 'rune', 'racex', 'rabbit']
// Runstenar ritas som SVG (alla typsnitt har inte runtecken): ᚱ för spelare 1, ᛉ för spelare 2.
const RUNE_STROKES = {
  1: 'M9 4 V28 M9 4 L18 9 L9 15 L19 28',
  2: 'M16 4 V28 M16 16 L7 6 M16 16 L25 6',
}
function runeSvg(doc, p) {
  const svg = svgEl(doc, 'svg', { viewBox: '0 0 32 32', width: 36, height: 36, class: 'gl-rune', 'aria-hidden': 'true', focusable: 'false' })
  svg.append(svgEl(doc, 'path', { d: 'M6 30 C3 20 5 6 16 2 C27 6 29 20 26 30 Z', class: 'gl-rune-stone' }))
  svg.append(svgEl(doc, 'path', { d: RUNE_STROKES[p] || RUNE_STROKES[1], class: 'gl-rune-mark', transform: p === 1 ? 'translate(3 0)' : '' }))
  return svg
}

function ensureStyles(doc, href) {
  if (!doc || doc.querySelector('link[data-gl-lobby-css]')) return
  const link = doc.createElement('link')
  link.rel = 'stylesheet'
  link.dataset.glLobbyCss = '1'
  link.href = href
  doc.head.appendChild(link)
}

function cssHref(opts) {
  if (opts.cssHref) return opts.cssHref
  try {
    return new URL('./granslandet.css', import.meta.url).href
  } catch {
    return 'granslandet.css'
  }
}

function svgEl(doc, name, attrs) {
  const el = doc.createElementNS('http://www.w3.org/2000/svg', name)
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v))
  return el
}

/** Normaliserar en serie till polylinjepunkter i rutan w×h. Tom serie ger en neutral linje. */
export function linePoints(values, w = 320, h = 90, pad = 8) {
  const vals = (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite)
  if (vals.length < 2) return `${pad},${h / 2} ${w - pad},${h / 2}`
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  if (hi === lo) {
    hi += 1
    lo -= 1
  }
  const step = (w - pad * 2) / (vals.length - 1)
  return vals.map((v, i) => `${(pad + i * step).toFixed(1)},${(pad + ((hi - v) / (hi - lo)) * (h - pad * 2)).toFixed(1)}`).join(' ')
}

/**
 * Monterar lobbyn i host (normalt document.body) som en helskärmsscen.
 * opts: players (1|2 eller [{name,color}]), onLive, onBack, source ({name,time}|string),
 *       history (tal för den grå linjen), theme, lang, labels, timeoutMs, keys, now,
 *       transport + localPlayers (online senare), cssHref.
 */
export function mountLobby(host, opts = {}) {
  const doc = host.ownerDocument || host
  const win = doc.defaultView || globalThis
  const playerInfo = Array.isArray(opts.players) ? opts.players : null
  const players = clampPlayers(playerInfo ? playerInfo.length : opts.players)
  const now = typeof opts.now === 'function' ? opts.now : () => Date.now()
  const lang = opts.lang || (doc.documentElement && doc.documentElement.lang ? doc.documentElement.lang.slice(0, 2).replace('nb', 'no') : 'sv')
  const L = labelsFor(lang, opts.labels)
  const theme = THEMES.includes(opts.theme) ? opts.theme : 'default'
  const keys = opts.keys || DEFAULT_KEYS
  const machine = opts.machine || createLobbyMachine({ players, timeoutMs: opts.timeoutMs, now })
  const ctl = opts.transport ? connectTransport(machine, opts.transport, { localPlayers: opts.localPlayers }) : null
  const local = new Set(ctl ? ctl.local() : Array.from({ length: players }, (_, i) => i + 1))
  const act = {
    toggle: (p) => (ctl ? ctl.toggle(p) : machine.toggle(p)),
    accept: (p) => (ctl ? ctl.accept(p) : machine.accept(p)),
    unaccept: (p) => (ctl ? ctl.unaccept(p) : machine.unaccept(p)),
    decline: (p) => (ctl ? ctl.decline(p) : machine.decline(p)),
  }

  ensureStyles(doc, cssHref(opts))
  const previousFocus = doc.activeElement

  const root = doc.createElement('div')
  root.className = `gl-lobby gl-theme-${theme}`
  root.dataset.glLobby = '1'
  root.dataset.players = String(players)
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  const titleId = `gl-lobby-title-${Math.random().toString(36).slice(2, 8)}`
  root.setAttribute('aria-labelledby', titleId)

  const panel = doc.createElement('div')
  panel.className = 'gl-lobby-panel'
  const title = doc.createElement('h2')
  title.id = titleId
  title.className = 'gl-lobby-title'
  title.textContent = L.title
  const lead = doc.createElement('p')
  lead.className = 'gl-lobby-lead'
  lead.textContent = L.lead
  const rule = doc.createElement('p')
  rule.className = 'gl-lobby-rule'
  rule.textContent = players === 2 ? L.rule2 : L.rule1

  // Övergångsbilden: grå historik som färgas till livefärg, LIVE-etikett med källa och tid.
  const fig = doc.createElement('figure')
  fig.className = 'gl-lobby-line'
  const svg = svgEl(doc, 'svg', { viewBox: '0 0 320 90', role: 'img', 'aria-hidden': 'true', focusable: 'false' })
  const pts = linePoints(opts.history)
  const histLine = svgEl(doc, 'polyline', { points: pts, class: 'gl-line-hist', fill: 'none' })
  const liveLine = svgEl(doc, 'polyline', { points: pts, class: 'gl-line-live', fill: 'none', pathLength: '100' })
  const lastPt = pts.split(' ').pop().split(',')
  const dot = svgEl(doc, 'circle', { cx: lastPt[0], cy: lastPt[1], r: 4, class: 'gl-line-dot' })
  svg.append(histLine, liveLine, dot)
  const cap = doc.createElement('figcaption')
  cap.className = 'gl-lobby-caption'
  const histTag = doc.createElement('span')
  histTag.className = 'gl-tag gl-tag-hist'
  histTag.textContent = L.hist
  const arrow = doc.createElement('span')
  arrow.className = 'gl-arrow'
  arrow.setAttribute('aria-hidden', 'true')
  arrow.textContent = '→'
  const liveTag = doc.createElement('span')
  liveTag.className = 'gl-tag gl-tag-live'
  liveTag.textContent = L.live
  const src = doc.createElement('span')
  src.className = 'gl-source'
  src.dataset.glSource = '1'
  cap.append(histTag, arrow, liveTag, src)
  fig.append(svg, cap)

  const seats = doc.createElement('div')
  seats.className = 'gl-lobby-seats'
  const buttons = []
  const states = []
  for (let p = 1; p <= players; p++) {
    const info = (playerInfo && playerInfo[p - 1]) || {}
    const seat = doc.createElement('section')
    seat.className = 'gl-seat'
    seat.dataset.player = String(p)
    if (info.color) seat.style.setProperty('--gl-seat', info.color)
    const name = doc.createElement('h3')
    name.className = 'gl-seat-name'
    name.textContent = info.name || fill(L.player, { n: p })
    const btn = doc.createElement('button')
    btn.type = 'button'
    btn.className = 'gl-accept'
    btn.dataset.glAccept = String(p)
    btn.setAttribute('aria-pressed', 'false')
    if (!local.has(p)) btn.disabled = true
    const glyph = doc.createElement('span')
    glyph.className = 'gl-accept-glyph'
    glyph.setAttribute('aria-hidden', 'true')
    if (theme === 'rune') glyph.append(runeSvg(doc, p))
    else glyph.textContent = '✓'
    const text = doc.createElement('span')
    text.className = 'gl-accept-text'
    btn.append(glyph, text)
    btn.addEventListener('click', () => act.toggle(p))
    const state = doc.createElement('p')
    state.className = 'gl-seat-state'
    const keyHint = doc.createElement('p')
    keyHint.className = 'gl-seat-key'
    const codes = players === 1 ? [keys.solo?.[0] || 'KeyE', keys.solo?.[1] || 'Enter'] : [(keys[p] || [])[0]]
    keyHint.textContent = fill(L.key, { key: [...new Set(codes.filter(Boolean).map(keyName))].join(' / ') })
    seat.append(name, btn, state, keyHint)
    seats.append(seat)
    buttons.push(btn)
    states.push({ state, text, seat })
  }

  const foot = doc.createElement('div')
  foot.className = 'gl-lobby-foot'
  const timer = doc.createElement('p')
  timer.className = 'gl-lobby-timer'
  timer.dataset.glTimer = '1'
  const back = doc.createElement('button')
  back.type = 'button'
  back.className = 'gl-back'
  back.dataset.glBack = '1'
  back.textContent = L.back
  back.addEventListener('click', () => act.decline(null))
  foot.append(timer, back)

  const status = doc.createElement('p')
  status.className = 'gl-lobby-status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  const note = doc.createElement('p')
  note.className = 'gl-lobby-note'
  note.textContent = L.note

  panel.append(title, lead, fig, rule, seats, foot, status, note)
  root.append(panel)
  host.appendChild(root)

  let closed = false
  let interval = 0

  function paint(snap) {
    src.textContent = sourceLine(opts.source, L, now())
    for (let i = 0; i < players; i++) {
      const on = !!snap.accepted[i]
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false')
      states[i].seat.classList.toggle('is-accepted', on)
      states[i].text.textContent = on ? L.accepted : L.accept
      states[i].state.textContent = on ? L.ready : L.waiting
    }
    const lit = snap.accepted.filter(Boolean).length / players
    root.style.setProperty('--gl-lit', String(lit))
    root.dataset.phase = snap.phase
    if (snap.phase === STATES.LOBBY && snap.remainingMs != null) timer.textContent = fill(L.timer, { s: Math.ceil(snap.remainingMs / 1000) })
  }

  function onKey(e) {
    if (closed || machine.phase() !== STATES.LOBBY) return
    const action = keyToAction(e.code, players, keys)
    if (!action) return
    const tag = e.target && e.target.tagName
    // 1P: Enter/Space på en fokuserad knapp sköts av knappens eget klick.
    // 2P: Enter tillhör alltid Spelare 2, oavsett fokus. Space (omappad) klickar fokuserad knapp.
    if (players === 1 && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && tag === 'BUTTON' && root.contains(e.target)) return
    e.preventDefault()
    e.stopPropagation()
    if (action.back) act.decline(null)
    else if (local.has(action.player)) act.toggle(action.player)
  }
  // Fokusfälla: Tab stannar i lobbyn.
  function onTab(e) {
    if (e.key !== 'Tab' || closed) return
    const items = [...root.querySelectorAll('button:not([disabled])')]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  win.addEventListener('keydown', onKey, true)
  root.addEventListener('keydown', onTab)

  function close() {
    if (closed) return
    closed = true
    if (interval) win.clearInterval(interval)
    win.removeEventListener('keydown', onKey, true)
    off()
    ctl?.disconnect()
    root.remove()
    try {
      previousFocus?.focus?.()
    } catch {
      /* ignore */
    }
  }

  const off = machine.subscribe((snap, event) => {
    paint(snap)
    if (event.type === 'live') {
      status.textContent = L.going
      close()
      opts.onLive?.(snap)
    } else if (event.type === 'timeout' || event.type === 'decline') {
      status.textContent = event.type === 'timeout' ? L.timeout : L.declined
      close()
      opts.onBack?.({ reason: event.type, player: event.player ?? null })
    }
  })

  if (machine.phase() !== STATES.LOBBY) machine.enter()
  paint(machine.snapshot())
  if (opts.autoTick !== false) interval = win.setInterval(() => {
    if (!machine.tick()) paint(machine.snapshot())
  }, 250)
  try {
    buttons.find((b) => !b.disabled)?.focus()
  } catch {
    /* ignore */
  }

  return {
    root,
    machine,
    accept: (p) => act.accept(p),
    unaccept: (p) => act.unaccept(p),
    toggle: (p) => act.toggle(p),
    decline: (p) => act.decline(p ?? null),
    tick: () => machine.tick(),
    close,
    isOpen: () => !closed,
    state: () => machine.snapshot(),
  }
}

/* ---------------------------------------------------------------- enkel API */

let current = null

/**
 * enterLobby({ players, onLive, onBack, source, ... }) öppnar Gränslandet ovanpå spelet.
 * Bara en lobby i taget; en ny stänger den gamla.
 */
export function enterLobby(opts = {}) {
  closeLobby()
  const host = opts.host || (typeof document !== 'undefined' ? document.body : null)
  if (!host) return null
  const view = mountLobby(host, {
    ...opts,
    onLive: (snap) => {
      current = null
      opts.onLive?.(snap)
    },
    onBack: (info) => {
      current = null
      opts.onBack?.(info)
    },
  })
  current = view
  return view
}
export const accept = (player) => (current ? current.accept(player) : false)
export const unaccept = (player) => (current ? current.unaccept(player) : false)
export const decline = (player) => (current ? current.decline(player) : false)
export function closeLobby() {
  current?.close()
  current = null
}
export const currentLobby = () => current
