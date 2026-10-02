import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as A from '../../spel/lagen/akademin-logic.js'

function memStorage() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }
}
const pt = (price, mid, sd) => ({ price, mid, upper: mid + 2 * sd, lower: mid - 2 * sd, t: 0 })

test('utmärkelse låses upp för varje klarat delmoment och sparas i localStorage', () => {
  const st = memStorage()
  let prog = A.loadProgress(st)
  assert.equal(prog.earned.size, 0)
  let r = A.earnKeys(st, prog, ['l1_read'], 1000)
  assert.deepEqual(r.fresh, []) // att läsa är inget delmoment
  r = A.earnKeys(st, r.prog, ['l1_risk'], 2000)
  assert.deepEqual(r.fresh, ['m_l1_risk'])
  r = A.earnKeys(st, r.prog, ['l1_size'], 3000)
  assert.deepEqual(r.fresh.sort(), ['m_l1_size', 'medalj_1'].sort()) // sista delmomentet ger även lektionens medalj
  const saved = JSON.parse(st.getItem(A.STORE_KEY))
  assert.deepEqual(saved.earned.sort(), ['l1_read', 'l1_risk', 'l1_size'])
  assert.equal(saved.awards.m_l1_risk, 2000)
  assert.equal(saved.awards.medalj_1, 3000)
  // läses tillbaka efter omladdning
  const again = A.loadProgress(st)
  assert.deepEqual(Object.keys(again.awards).sort(), ['m_l1_risk', 'm_l1_size', 'medalj_1'].sort())
  assert.equal(again.awards.m_l1_size, 3000)
})

test('samma delmoment ger inte utmärkelsen två gånger', () => {
  const st = memStorage()
  let r = A.earnKeys(st, A.loadProgress(st), ['l3_touch'], 1)
  r = A.earnKeys(st, r.prog, ['l3_touch'], 2)
  assert.deepEqual(r.fresh, [])
  assert.equal(r.prog.awards.m_l3_touch, 1)
})

test('alla delmoment → alla 13 utmärkelser', () => {
  const all = new Set(Object.keys(A.XP_TABLE))
  assert.equal(A.awardsFor(all).length, A.AWARDS.length)
  assert.equal(A.AWARDS.filter((a) => a.kind === 'medalj').length, 4)
  const tasks = Object.values(A.LESSON_DONE).flat()
  assert.equal(A.AWARDS.filter((a) => a.kind === 'märke').length, tasks.length)
})

test('trasig eller saknad lagring kraschar inte', () => {
  const bad = { getItem: () => '{inte json', setItem: () => { throw new Error('full') } }
  const prog = A.loadProgress(bad)
  assert.equal(prog.earned.size, 0)
  const r = A.earnKeys(bad, prog, ['l1_risk'])
  assert.deepEqual(r.fresh, ['m_l1_risk'])
  assert.equal(A.loadProgress(null).earned.size, 0)
})

test('okända nycklar i lagringen ignoreras', () => {
  const st = memStorage()
  st.setItem(A.STORE_KEY, JSON.stringify({ earned: ['l1_risk', 'hack'], awards: { m_l1_risk: 5, medalj_4: 9 } }))
  const prog = A.loadProgress(st)
  assert.deepEqual([...prog.earned], ['l1_risk'])
  assert.deepEqual(Object.keys(prog.awards), ['m_l1_risk'])
})

test('utmärkelsernas texter: rätt ordval, inga pengar/vinst/licens-löften', () => {
  const txt = JSON.stringify(A.AWARDS) + A.awardNote()
  for (const bad of [/diplom/i, /intyg/i, /godkänd för signaler/i, /redo att handla/i, /förstått riskerna/i, /\$/, /kronor/i, /vinst/i]) {
    assert.ok(!bad.test(JSON.stringify(A.AWARDS)), String(bad))
  }
  assert.match(A.awardNote(), /ingen licens och inget råd/)
  assert.match(txt, /utmärkelse/i)
})

test('källkoden för Akademin innehåller inget från den spärrade ramen eller förbjudna ord', () => {
  for (const f of ['akademin.js', 'akademin-logic.js']) {
    const src = readFileSync(new URL(`../../spel/lagen/${f}`, import.meta.url), 'utf8')
    for (const bad of ['Övningskapital', 'Platt', 'Hävstång', 'Alla lägen', 'Paus · mellanslag', 'Paus · Space', '100,000', '100 000', 'FacePortrait', 'DemoFrame\'', 'candles/s', 'diplom', 'intyg', 'godkänd för signaler', 'redo att handla', 'vi anser att du förstått riskerna', 'PRACTICE_BALANCE', 'STARTING_CASH']) {
      assert.ok(!src.includes(bad), `${f}: ${bad}`)
    }
  }
})

test('lektioner låses upp i tur och ordning (från KS Akademin)', () => {
  const e = new Set()
  assert.ok(A.lessonUnlocked(1, e))
  assert.ok(!A.lessonUnlocked(2, e))
  A.LESSON_DONE[1].forEach((k) => e.add(k))
  assert.ok(A.lessonDone(1, e) && A.lessonUnlocked(2, e) && !A.lessonUnlocked(3, e))
  assert.equal(A.levelFor(0).level, 1)
  assert.equal(A.levelFor(A.XP_MAX).level, 4)
})

test('positionsandel ur risk och stopp, utan påhittat saldo', () => {
  const s = A.positionShare(1, 100, 95) // 5 % risk per aktie
  assert.ok(Math.abs(s.perSharePct - 5) < 1e-9)
  assert.ok(Math.abs(s.sharePct - 20) < 1e-9)
  assert.equal(A.positionShare(2, 100, 99.5).sharePct, 100) // tak 100 %
  assert.ok(A.positionShare(2, 100, 99.5).capped)
  assert.ok(A.riskAllowed(2) && !A.riskAllowed(5))
})

test('stop/mål och övningsaffär på stängningskurser', () => {
  const stop = A.stopPrice(100, 2, 1.5, 'long')
  assert.equal(stop, 97)
  assert.equal(A.takeProfitPrice(100, stop, 2, 'long'), 106)
  const pts = [pt(100, 100, 2), pt(101, 100, 2), pt(96.5, 100, 2), pt(110, 100, 2)]
  const t = A.openPractice(pts, 0, 'long', 97, 106)
  const done = A.advancePractice(t, pts, 3)
  assert.equal(done.closed.reason, 'stop')
  assert.equal(done.closed.at, 2)
  assert.ok(Math.abs(done.closed.r - -3.5 / 3) < 1e-9)
  assert.ok(A.openPractice(pts, 0, 'long', null, 106).error)
  assert.ok(A.openPractice(pts, 0, 'short', 97, 106).error)
})

test('%B, rälsberöring, squeeze och läsning av läget', () => {
  const p = pt(104, 100, 2) // upper 104
  assert.equal(A.percentB(104, p), 1)
  assert.ok(A.isTouch(104, p) && !A.isTouch(100, p))
  assert.equal(A.correctRead(104, p, 75), 'stretched_up')
  assert.equal(A.correctRead(96, p, 25), 'stretched_down')
  assert.equal(A.correctRead(100, p, 75), 'rsi_only')
  const pts = [pt(1, 100, 1), pt(1, 100, 2), pt(1, 100, 3), pt(1, 100, 4), pt(1, 100, 5)]
  assert.equal(A.squeezeThreshold(pts), A.bandwidthPct(pts[1]))
})
