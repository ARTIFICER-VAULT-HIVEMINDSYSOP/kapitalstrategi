import test from 'node:test'
import assert from 'node:assert/strict'

function points(n = 40) {
  const out = []
  for (let i = 0; i < n; i++) {
    const price = 100 + Math.sin(i / 4) * 4
    out.push({ price, upper: price + 6, lower: price - 6, mid: price, t: i, c: price })
  }
  return out
}

async function dom() {
  const { Window } = await import('happy-dom')
  const w = new Window({ url: 'https://www.kapitalstrategi.com/traderider/spel/#racex' })
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.location = w.location
  globalThis.performance = w.performance
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(w.performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.addEventListener = (...args) => w.addEventListener(...args)
  globalThis.removeEventListener = (...args) => w.removeEventListener(...args)
  globalThis.getComputedStyle = (el) => w.getComputedStyle(el)
  globalThis.devicePixelRatio = 1
  globalThis.matchMedia = (q) => w.matchMedia(q)
  globalThis.innerWidth = 1280
  globalThis.innerHeight = 800
  return w
}

test('RaceX, Akademin och Rabbit Hole monteras och tar några tick utan fel', async () => {
  await dom()
  const engine = { track: { points: points() }, spec: { log: false, key: '1y' }, quote: { candles: [] } }
  const { createRaket } = await import('../../spel/lagen/raket.js')
  const { createRabbit } = await import('../../spel/lagen/rabbit.js')
  const { createAkademin } = await import('../../spel/lagen/akademin.js')
  const raket = createRaket({ engine })
  raket.show()
  raket.step(0.05)
  raket.step(0.05)
  const st = raket.state()
  assert.equal(st.flat, true)
  assert.ok(st.p >= 0)
  raket.hide()

  const rabbit = createRabbit()
  rabbit.show()
  rabbit.step(0.05)
  rabbit.step(0.08)
  const rs = rabbit.state()
  assert.equal(rs.x, (rs.buy + rs.sell) / 2)
  rabbit.hide()

  const storage = { getItem: () => null, setItem() {} }
  const akademin = createAkademin({ engine, storage })
  akademin.show()
  akademin.step(0.05)
  akademin.step(0.05)
  const as = akademin.state()
  assert.equal(typeof as.lesson, 'number')
  assert.match(document.body.innerHTML, /hansan-riskskola/)
  akademin.hide()
})
