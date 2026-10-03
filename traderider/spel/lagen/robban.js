/**
 * Robban Robotsson som guide i Trade Rider Academy.
 * Knappen sitter alltid nere till höger när det läget är öppet.
 * Öppet läge visar hela kroppen ovanför talbubblan, och en enda stängknapp.
 */
import { getLang, onLang, t } from './i18n.js'
import { robbanSvg } from './robban-art.js'
import { createGuideState, preRaceQuestions, speechView } from './robban-script.js'

const css = `
.rb-root{position:fixed;inset:0;z-index:90;pointer-events:none}
.rb-root[hidden]{display:none !important}
.rb-hud{pointer-events:auto;position:fixed;right:16px;bottom:16px;width:64px;height:64px;padding:0;border:2px solid #e09a1a;border-radius:50%;background:#0f1a2e;box-shadow:0 8px 20px rgba(15,23,42,.35);cursor:pointer;overflow:hidden;display:grid;place-items:center}
.rb-hud:focus-visible{outline:3px solid #22d3ee;outline-offset:3px}
.rb-peek{width:64px;height:64px;overflow:hidden;display:block}
.rb-peek svg{width:64px;height:134px;display:block;margin-top:-2px}
.rb-pop{pointer-events:none;position:fixed;right:12px;bottom:92px;z-index:91;display:flex;flex-direction:column;align-items:flex-end;gap:12px;width:min(360px,calc(100vw - 16px));max-height:min(70vh,520px);animation:rbRise .42s cubic-bezier(.2,1.2,.36,1)}
.rb-pop[hidden]{display:none !important}
.rb-figure{pointer-events:none;flex:none;width:104px;height:196px;overflow:hidden;position:relative}
.rb-figure svg{width:104px;height:196px;display:block}
.rb-speech{pointer-events:auto;width:100%;box-sizing:border-box;background:#0f1a2e;color:#f4f7fb;border:1px solid rgba(245,185,66,.7);border-radius:18px;padding:12px 12px 10px;box-shadow:0 12px 28px rgba(15,23,42,.35);max-height:min(42vh,280px);overflow:auto}
.rb-speech h2{margin:0 0 6px;font:700 15px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#f5b942}
.rb-say{margin:0 0 10px;font:500 14px/1.45 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif}
.rb-choices{display:flex;flex-wrap:wrap;gap:6px}
.rb-choices button,.rb-close{border:0;border-radius:999px;background:#f5b942;color:#0f172a;font:700 13px/1.2 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;padding:8px 12px;cursor:pointer}
.rb-close{margin-top:8px;background:transparent;color:#f4f7fb;border:1px solid rgba(244,247,251,.4)}
.rb-choices button:focus-visible,.rb-close:focus-visible,.rb-chip:focus-visible{outline:3px solid #22d3ee;outline-offset:2px}
.rb-card{margin:0;padding:0;border:0;background:transparent;color:inherit}
.rb-card h3{margin:8px 0 4px;font:600 18px/1.2 "IBM Plex Sans",sans-serif}
.rb-prerace{display:flex;flex-direction:column;gap:8px}
.rb-q{margin:0;padding:8px 0 0;border:0;border-top:1px solid rgba(244,247,251,.16)}
.rb-q legend{font:600 14px/1.4 "IBM Plex Sans",sans-serif;padding:0}
.rb-q .rb-opts{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.rb-chip{border:0;border-radius:999px;background:#f5b942;color:#0f172a;font:700 13px/1.2 "IBM Plex Sans",sans-serif;padding:8px 12px;cursor:pointer}
.rb-chip.on{outline:2px solid #22d3ee}
.rb-reply{margin:6px 0 0;font:500 14px/1.4 "IBM Plex Sans",sans-serif}
@keyframes rbRise{0%{transform:translateY(36px)}100%{transform:translateY(0)}}
@media (max-width:520px){
  .rb-pop{bottom:88px;width:min(360px,calc(100vw - 12px))}
  .rb-figure,.rb-figure svg{width:88px;height:168px}
}
@media (prefers-reduced-motion:reduce){.rb-pop{animation:none}}
`

let styled = false
function ensureStyle() {
  if (styled || typeof document === 'undefined') return
  styled = true
  const style = document.createElement('style')
  style.dataset.robbanStyle = '1'
  style.textContent = css
  document.head.appendChild(style)
}

function el(tag, cls) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  return node
}

export function preRaceMarkup(guide) {
  const lang = getLang()
  const picked = guide.answers()
  const blocks = preRaceQuestions(lang).map((q) => {
    const choice = q.choices.find((c) => c.id === picked[q.id])
    const opts = q.choices
      .map((c) => `<button type="button" class="rb-chip ${picked[q.id] === c.id ? 'on' : ''}" data-rb-choice="${c.id}" data-rb-q="${q.id}" aria-pressed="${picked[q.id] === c.id ? 'true' : 'false'}">${c.label}</button>`)
      .join('')
    const reply = choice ? `<p class="rb-reply" data-rb-reply>${choice.reply}</p>` : ''
    return `<fieldset class="rb-q" data-rb-q="${q.id}"><legend data-rb-prompt>${q.prompt}</legend><div class="rb-opts">${opts}</div>${reply}</fieldset>`
  }).join('')
  return `<section class="rb-card" data-robban-prerace><span class="kick">${t('rb.name')}</span><h3>${t('rb.preraceTitle')}</h3><p>${t('rb.preraceNote')}</p><div class="rb-prerace">${blocks}</div></section>`
}

export function mountRobban({ onAnswer } = {}) {
  ensureStyle()
  const guide = createGuideState()
  const root = el('div', 'rb-root')
  root.dataset.robbanRoot = '1'
  root.hidden = true
  const hud = el('button', 'rb-hud')
  hud.type = 'button'
  hud.dataset.robbanHud = '1'
  hud.style.position = 'fixed'
  hud.style.right = '16px'
  hud.style.bottom = '16px'
  hud.style.width = '64px'
  hud.style.height = '64px'
  const peek = el('span', 'rb-peek')
  peek.setAttribute('aria-hidden', 'true')
  peek.style.overflow = 'hidden'
  peek.style.display = 'block'
  peek.style.width = '64px'
  peek.style.height = '64px'
  peek.innerHTML = robbanSvg()
  hud.appendChild(peek)
  const pop = el('div', 'rb-pop')
  pop.id = 'robban-pop'
  pop.dataset.robbanPop = '1'
  pop.dataset.robbanState = 'open'
  pop.setAttribute('role', 'dialog')
  pop.setAttribute('aria-modal', 'false')
  pop.hidden = true
  hud.setAttribute('aria-controls', pop.id)
  root.append(hud, pop)
  document.body.appendChild(root)

  function paint() {
    const open = guide.isOpen()
    hud.setAttribute('aria-expanded', open ? 'true' : 'false')
    hud.setAttribute('aria-label', t('rb.hud'))
    pop.hidden = !open
    root.dataset.robbanState = open ? 'open' : 'docked'
    if (!open) return
    const view = speechView(guide, getLang())
    pop.replaceChildren()
    const short = (window.innerHeight || 800) < 640
    const figureW = short ? 64 : 104
    const figureH = short ? 112 : 196
    const figure = el('div', 'rb-figure')
    figure.dataset.robbanFigure = 'full'
    figure.style.overflow = 'hidden'
    figure.style.position = 'relative'
    figure.style.flex = 'none'
    figure.style.width = `${figureW}px`
    figure.style.height = `${figureH}px`
    figure.innerHTML = robbanSvg()
    const svg = figure.querySelector('svg')
    if (svg) svg.setAttribute('aria-label', t('rb.figure'))
    const speech = el('div', 'rb-speech')
    const name = el('h2')
    name.id = 'robban-name'
    name.textContent = t('rb.name')
    pop.setAttribute('aria-labelledby', name.id)
    const say = el('p', 'rb-say')
    say.dataset.robbanSay = '1'
    say.textContent = view.say
    const choices = el('div', 'rb-choices')
    for (const choice of view.choices) {
      const button = el('button')
      button.type = 'button'
      button.textContent = choice.label
      button.dataset.rbAct = choice.act
      if (choice.qid) button.dataset.rbQ = choice.qid
      if (choice.act === 'answer') button.dataset.rbChoice = choice.id
      button.addEventListener('click', () => act(choice))
      choices.appendChild(button)
    }
    const close = el('button', 'rb-close')
    close.type = 'button'
    close.dataset.robbanClose = '1'
    close.textContent = t('rb.close')
    close.addEventListener('click', () => {
      guide.close()
      paint()
      hud.focus()
    })
    speech.append(name, say, choices, close)
    pop.style.display = 'flex'
    pop.style.flexDirection = 'column'
    pop.style.alignItems = 'flex-end'
    pop.style.gap = '12px'
    pop.style.maxHeight = 'calc(100vh - 108px)'
    pop.style.overflow = 'auto'
    speech.style.width = '100%'
    speech.style.boxSizing = 'border-box'
    speech.style.position = 'relative'
    speech.style.maxHeight = short ? 'none' : ''
    const drawn = figure.querySelector('svg')
    if (drawn) {
      drawn.style.width = `${figureW}px`
      drawn.style.height = `${figureH}px`
    }
    pop.append(figure, speech)
  }

  function act(choice) {
    if (choice.act === 'close') {
      guide.close()
      paint()
      hud.focus()
      return
    }
    if (choice.act === 'prerace') guide.ask('prerace')
    else if (choice.act === 'stopp') guide.ask('stopp')
    else if (choice.act === 'answer') {
      guide.answer(choice.qid, choice.id)
      if (onAnswer) onAnswer()
    }
    paint()
  }

  hud.addEventListener('click', () => {
    guide.toggle()
    paint()
    if (guide.isOpen()) {
      const first = pop.querySelector('button')
      if (first) first.focus()
    }
  })

  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-rb-choice][data-rb-q]')
    if (!button || !root.isConnected) return
    if (button.closest('[data-robban-pop]')) return
    const ok = guide.answer(button.dataset.rbQ, button.dataset.rbChoice)
    if (!ok) return
    paint()
    if (onAnswer) onAnswer()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !guide.isOpen() || root.hidden) return
    guide.close()
    paint()
    hud.focus()
  })

  onLang(() => {
    if (!root.hidden) paint()
  })
  addEventListener('resize', () => {
    if (!root.hidden && guide.isOpen()) paint()
  })

  return {
    show() {
      root.hidden = false
      paint()
    },
    hide() {
      guide.close()
      root.hidden = true
      paint()
    },
    markup() {
      return preRaceMarkup(guide)
    },
    answers: () => guide.answers(),
    isOpen: () => guide.isOpen(),
  }
}
