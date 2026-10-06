// Ett läge: Trade Rider Academy. Äldre hash öppnar samma vy och kanoniseras till #tra.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { modeFromHash, hashForView } from '../../spel/lagen/orientation.js'
import { ACADEMY_LESSONS, duplicateLessonIds, quizComplete } from '../../spel/lagen/academy-quiz.js'
import { ACADEMY_HERO_SRC, ACADEMY_HERO_SPRITE, ACADEMY_HERO_FRAMES } from '../../spel/lagen/academy-hero.js'
import { STRINGS } from '../../spel/lagen/i18n.js'

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8')

test('äldre academy-adresser är samma läge och kanonisk hash är #tra', () => {
  for (const alias of ['#tra', '#academy', '#akademin', '#trade-rider-academy', '#3']) {
    assert.equal(modeFromHash(alias), 'akademin', alias)
    assert.equal(hashForView(modeFromHash(alias)), 'tra', alias)
  }
  assert.equal(hashForView('akademin'), 'tra')
  assert.equal(hashForView('tra'), 'tra')
  const panel = read('../../spel/lagen/panel.js')
  assert.match(panel, /apply\(location\.hash !== `#\$\{slug\}`\)/)
  assert.match(panel, /history\.replaceState/)
})

test('ingången har ett academy-kort och ingen andra länk till #academy', () => {
  const html = read('../../index.html')
  const hrefs = [...html.matchAll(/class="mode" href="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(hrefs, [
    '/traderider/spel/#trade-rider',
    '/traderider/spel/#racex',
    '/traderider/spel/#tra',
    '/traderider/spel/#rabbit-hole',
  ])
  assert.equal(html.includes('/traderider/spel/#academy'), false)
})

test('varje lektion har 3–5 egna frågor och unika id', () => {
  assert.equal(ACADEMY_LESSONS.length, 4)
  const qids = []
  for (const lesson of ACADEMY_LESSONS) {
    assert.equal(lesson.quiz.length >= 3 && lesson.quiz.length <= 5, true, lesson.id)
    qids.push(...lesson.quiz.map((q) => q.id))
  }
  assert.deepEqual(duplicateLessonIds(), [])
  assert.equal(new Set(qids).size, qids.length)
  assert.equal(quizComplete({}, 1), false)
  const picks = Object.fromEntries(ACADEMY_LESSONS[0].quiz.map((q) => [q.id, q.answer]))
  assert.equal(quizComplete(picks, 1), true)
})

test('kontrollfrågor och figurens alt finns på sv, en och uk', () => {
  const keys = new Set(['hero.alt', 'ak.quizTitle', 'ak.quizOk', 'ak.quizNo'])
  for (const lesson of ACADEMY_LESSONS) {
    for (const q of lesson.quiz) {
      keys.add(q.prompt)
      for (const choice of q.choices) keys.add(choice.label)
    }
  }
  for (const lang of ['sv', 'en', 'uk']) {
    for (const key of keys) assert.equal(typeof STRINGS[lang][key], 'string', `${lang} ${key}`)
  }
  assert.equal(STRINGS.sv['hero.alt'], 'Trade Rider Academy-robot')
  assert.equal(STRINGS.en['hero.alt'], 'Trade Rider Academy-robot')
  assert.match(STRINGS.uk['hero.alt'], /Робот/)
})

test('stillbild och sprite är de angivna filerna, och cykeln är steps(8)', () => {
  assert.equal(ACADEMY_HERO_SRC, '/traderider/spel/assets/academy-robot.webp')
  assert.equal(ACADEMY_HERO_SPRITE, '/traderider/spel/assets/academy-robot-sprite.webp')
  assert.equal(ACADEMY_HERO_FRAMES, 8)
  const css = read('../../spel/lagen/akademin.js')
  assert.match(css, /object-fit:contain/)
  assert.match(css, /rgba\(155,107,255,\.55\)/)
  assert.match(css, /backdrop-filter:blur\(4px\)/)
  assert.match(css, /background:transparent/)
  assert.doesNotMatch(css, /background:#000/)
  assert.match(css, /steps\(8\)/)
  assert.match(css, /academy-robot-attack \.9s steps\(8\) 1/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})

test('cykeln spelas vid öppning och rätt quiz, och vilar vid reduced motion', async () => {
  const { Window } = await import('happy-dom')
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/#tra' })
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.location = w.location
  globalThis.performance = w.performance
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(w.performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  globalThis.getComputedStyle = (el) => w.getComputedStyle(el)
  globalThis.devicePixelRatio = 1
  globalThis.innerWidth = 1280
  globalThis.innerHeight = 800
  let reduce = true
  globalThis.matchMedia = (query) => ({
    matches: reduce && String(query).includes('reduce'),
    media: String(query),
    addEventListener() {},
    removeEventListener() {},
  })

  const engine = {
    track: { points: Array.from({ length: 24 }, (_, i) => ({ price: 100 + i, upper: 106, lower: 94, mid: 100, t: i, c: 100 })) },
    spec: { log: false, key: '1y' },
    quote: { candles: [] },
  }
  const storage = { getItem: () => null, setItem() {} }
  const { createAkademin } = await import('../../spel/lagen/akademin.js')
  const view = createAkademin({ engine, storage })
  view.show()
  const sprite = document.querySelector('[data-hero-sprite]')
  const hero = document.querySelector('[data-academy-hero]')
  assert.ok(hero)
  assert.equal(hero.classList.contains('is-attack'), false)
  assert.equal(sprite.style.backgroundImage, '')
  assert.equal(document.querySelector('[data-robban-root]'), null)
  assert.equal(document.querySelector('img[data-hero-src]').getAttribute('src'), ACADEMY_HERO_SRC)
  assert.equal(document.querySelectorAll('[data-academy-quiz]').length, 1)
  assert.equal(document.querySelector('[data-academy-quiz]').dataset.lessonId, 'risk-size')

  reduce = false
  hero.click()
  assert.equal(hero.classList.contains('is-attack'), true)
  assert.match(sprite.style.backgroundImage, /academy-robot-sprite\.webp/)

  hero.classList.remove('is-attack')
  const lesson = ACADEMY_LESSONS[0]
  for (const q of lesson.quiz) {
    document.querySelector(`[data-act="quiz"][data-q="${q.id}"][data-v="${q.answer}"]`).click()
  }
  assert.equal(document.querySelector('[data-academy-hero]').classList.contains('is-attack'), true)
  view.hide()
})
