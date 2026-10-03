import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VARIANTS, createGransland } from './session.js'
import { createPhaseMachine, PHASES } from './phases.js'
import { stitch } from './stitch.js'
import { indicatorPack, bollinger, rsi, sma, ema, macd, atr } from './indicators.js'
import { rsi as courseRsi } from '../lagen/rsi.js'
import { parseCoinbaseCandles, parseKrakenCandles, parseKrakenPrice } from './adapters.js'
import { WORKER_URL } from './config.js'
import { INSTRUMENTS, PROPOSAL } from './instruments.js'
import { forbiddenHits } from './guard.js'
import { mountView } from './view.js'
import { signalRaceEnd, resetGranslandForTests } from './hook.js'
import { noteTradeRider, noteTradeRiderDuo, resetTradeRiderHook } from './hooks/trade-rider.js'
import { noteRaceXEnd, resetRaceXHook } from './hooks/racex.js'
import { noteAcademySeriesEnd, resetAcademyHook } from './hooks/academy.js'
import { noteRabbitLap, resetRabbitHook } from './hooks/rabbit.js'
import { t, setLang } from '../lagen/i18n.js'
import { isYahooAllowed, isCryptoAllowed, corsOrigin, nextBackoff, normalizeYahooChart, CACHE_TTL_SECONDS } from '../../../worker/gransland-data/src/logic.js'
import { formatHm } from './labels.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const NOW = Date.parse('2026-10-03T17:51:00.000Z')

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function coinbaseFetch(now = NOW, { status = 200, price = '84961.08', extra = [] } = {}) {
  return async (url) => {
    const href = String(url)
    if (status !== 200) return jsonResponse({}, status)
    if (href.includes('/ticker')) return jsonResponse({ price, time: new Date(now).toISOString() })
    const second = Math.floor(now / 1000)
    const rows = [
      [second - 120, 100, 110, 101, 108, 1],
      [second - 60, 108, 112, 107, 110, 1],
      ...extra,
    ]
    return jsonResponse(rows)
  }
}

function historyBars(now = NOW) {
  return [
    { t: now - 180_000, o: 100, h: 106, l: 99, c: 104 },
    { t: now - 120_000, o: 104, h: 109, l: 103, c: 108 },
    { t: now - 60_000, o: 108, h: 112, l: 107, c: 110 },
  ]
}

async function ensureDom() {
  if (typeof document !== 'undefined' && document.body) return
  const require = createRequire(new URL('../../app/package.json', import.meta.url))
  const { Window } = require('happy-dom')
  const w = new Window()
  globalThis.window = w
  globalThis.document = w.document
  globalThis.localStorage = w.localStorage
  globalThis.HTMLElement = w.HTMLElement
  globalThis.Node = w.Node
  globalThis.devicePixelRatio = 1
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}

function resetHooks() {
  resetGranslandForTests()
  resetTradeRiderHook()
  resetRaceXHook()
  resetAcademyHook()
  resetRabbitHook()
}

function priceNodes(root) {
  return [...root.querySelectorAll('[data-gl-price], [data-gl-figures]')]
}

export const cases = [
  ['faserna historia, gransland och live i alla fyra varianterna', async (assert) => {
    assert.deepEqual(PHASES, ['historia', 'gransland', 'live'])
    for (const variant of VARIANTS) {
      const session = createGransland({
        variant,
        history: historyBars(),
        enabled: false,
        poll: false,
        now: () => NOW,
        fetch: () => {
          throw new Error('nät')
        },
      })
      assert.equal(session.phase(), 'historia', variant)
      session.endRace()
      assert.equal(session.phase(), 'gransland', variant)
      assert.equal(session.choiceVisible(), true, variant)
      await session.enterReal()
      assert.equal(session.phase(), 'gransland', variant)
      assert.equal(session.networkCalls(), 0, variant)
      session.replay()
      assert.equal(session.phase(), 'historia', variant)
      const machine = createPhaseMachine()
      machine.endRace()
      assert.equal(machine.enterLive(), true)
      assert.equal(machine.phase(), 'live')
      machine.replay()
      assert.equal(machine.enterLive(), false)
    }
  }],

  ['slutet av loppet visar valet i alla fyra varianterna', async (assert) => {
    await ensureDom()
    setLang('sv')
    resetHooks()
    const bars = historyBars()
    const specs = [
      () => noteTradeRider({ hud: { finished: true, flat: false, side: 'buy', leverage: 2, price: 110 }, candles: bars, poll: false, enabled: false }),
      () => noteTradeRiderDuo({
        huds: [
          { finished: true, flat: true, side: 'buy', leverage: 1, price: 110 },
          { finished: true, flat: false, side: 'sell', leverage: 1, price: 110 },
        ],
        candles: bars,
        poll: false,
      }),
      () => noteRaceXEnd({ ended: true, players: 2, bars, decisions: [{ side: 'buy', leverage: 1 }, { side: 'flat', leverage: 1 }], poll: false }),
      () => noteAcademySeriesEnd({ reachedEnd: true, bars, side: 'long', poll: false }),
      () => noteRabbitLap({ atEnd: true, bars, decisions: [{ side: 'sell', leverage: 1 }], poll: false }),
    ]
    for (const fire of specs) {
      resetHooks()
      fire()
      const root = document.querySelector('[data-gl-root]')
      assert.ok(root)
      assert.equal(root.dataset.glPhase, 'gransland')
      const choice = root.querySelector('[data-gl-choice]')
      assert.equal(choice.tagName === 'DETAILS', false)
      assert.equal(choice.hidden, false)
      assert.equal(root.querySelector('[data-gl-enter]').textContent, t('gl.choice'))
      assert.equal(root.querySelector('[data-gl-replay]').textContent, t('grans.replay'))
      assert.equal(root.querySelector('[data-gl-menu]').textContent, t('grans.menu'))
      assert.equal(root.querySelector('[data-gl-frozen]').textContent, t('gl.frozen'))
      root.remove()
    }
  }],

  ['för gammal eller utebliven data blir OKÄND utan siffror', async (assert) => {
    await ensureDom()
    setLang('sv')
    const staleFetch = coinbaseFetch(NOW - 10 * 60 * 1000)
    const stale = createGransland({
      variant: 'trade-rider',
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      fetch: staleFetch,
    })
    stale.endRace()
    const staleView = mountView(document.body, stale)
    await stale.enterReal()
    staleView.paint()
    assert.equal(stale.snapshot().unknown, true)
    assert.equal(stale.snapshot().price, null)
    assert.equal(staleView.root.querySelector('[data-gl-badge]').textContent, t('gl.unknown'))
    assert.equal(/\d/.test(staleView.root.querySelector('[data-gl-badge]').textContent), false)
    for (const node of priceNodes(staleView.root)) assert.equal(/\d/.test(node.textContent), false)
    assert.equal(staleView.root.querySelector('[data-gl-crypto]').hidden, false)
    assert.equal(staleView.root.querySelector('[data-gl-again]').textContent, t('gl.again'))
    staleView.close()

    const failed = createGransland({
      variant: 'racex',
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      fetch: coinbaseFetch(NOW, { status: 500 }),
    })
    failed.endRace()
    const failedView = mountView(document.body, failed)
    await failed.enterReal()
    failedView.paint()
    assert.equal(failed.snapshot().price, null)
    assert.equal(failedView.root.querySelector('[data-gl-badge]').textContent, t('gl.unknown'))
    for (const node of priceNodes(failedView.root)) assert.equal(/\d/.test(node.textContent), false)
    failedView.close()
  }],

  ['avstängd livekälla gör inga nätanrop', async (assert) => {
    let calls = 0
    const session = createGransland({
      variant: 'academy',
      history: historyBars(),
      instrument: 'BTC-USD',
      enabled: false,
      poll: false,
      now: () => NOW,
      fetch: () => {
        calls += 1
        throw new Error('nät')
      },
    })
    session.endRace()
    assert.equal(calls, 0)
    await session.enterReal()
    assert.equal(calls, 0)
    assert.equal(session.networkCalls(), 0)
    assert.equal(session.snapshot().price, null)
    const stock = createGransland({
      variant: 'rabbit',
      history: historyBars(),
      instrument: 'NVDA',
      workerUrl: null,
      poll: false,
      now: () => NOW,
      fetch: () => {
        calls += 1
        throw new Error('nät')
      },
    })
    stock.endRace()
    await stock.enterReal()
    assert.equal(calls, 0)
    assert.equal(stock.snapshot().label, t('gl.unknown'))
  }],

  ['framtida staplar syns inte', async (assert) => {
    const future = Math.floor(NOW / 1000) + 3600
    const session = createGransland({
      variant: 'trade-rider',
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      fetch: coinbaseFetch(NOW, { extra: [[future, 9, 9, 9, 9, 1]] }),
    })
    session.endRace()
    await session.enterReal()
    const bars = session.snapshot().bars
    assert.equal(bars.some((bar) => bar.t > NOW), false)
    assert.equal(bars.some((bar) => bar.c === 9), false)
    assert.ok(bars.length >= 3)
  }],

  ['skarven behåller luckor och dubblerar inte tidsstämpeln', async (assert) => {
    const history = [
      { t: 1_000, o: 1, h: 2, l: 0.5, c: 1.5 },
      { t: 2_000, o: 1.5, h: 2, l: 1, c: 1.8 },
    ]
    const live = [
      { t: 2_000, o: 1.5, h: 2, l: 1, c: 9 },
      { t: 8_000, o: 2, h: 3, l: 1.5, c: 2.4 },
      { t: 9_000, o: 2.4, h: 3, l: 2, c: 2.2 },
      { t: 50_000, o: 4, h: 4, l: 4, c: 4 },
    ]
    const { bars, gaps } = stitch(history, live, { now: 10_000, intervalMs: 1_000 })
    assert.deepEqual(bars.map((bar) => bar.t), [1_000, 2_000, 8_000, 9_000])
    assert.equal(bars.find((bar) => bar.t === 2_000).c, 1.8)
    assert.equal(bars.some((bar) => bar.t > 2_000 && bar.t < 8_000), false)
    assert.equal(gaps.length, 1)
    assert.equal(gaps[0].after, 2_000)
    assert.equal(gaps[0].before, 8_000)
  }],

  ['indikatorerna är samma på historik och live', async (assert) => {
    const bars = []
    for (let i = 0; i < 40; i++) {
      const c = 100 + Math.sin(i / 3) * 4 + i * 0.2
      bars.push({ t: i * 60_000, o: c - 0.4, h: c + 0.8, l: c - 0.9, c })
    }
    const history = indicatorPack(bars)
    const live = indicatorPack(bars.map((bar) => ({ ...bar })))
    assert.deepEqual(history, live)
    const closes = bars.map((bar) => bar.c)
    assert.deepEqual(rsi(closes), courseRsi(closes))
    const ladder = Array.from({ length: 20 }, (_, i) => i + 1)
    const band = bollinger(ladder)[19]
    assert.equal(band.sma, 10.5)
    assert.ok(Math.abs(band.upper - (band.sma + 2 * band.stdev)) < 1e-9)
    assert.deepEqual(sma(ladder, 20)[19], 10.5)
    assert.deepEqual(ema(closes, 20), ema(closes.slice(), 20))
    assert.deepEqual(macd(closes), macd(closes.slice()))
    assert.deepEqual(atr(bars), atr(bars.map((bar) => ({ ...bar }))))
    assert.ok(history.rsi.some((value) => Number.isFinite(value)))
    assert.ok(history.macd.line.some((value) => Number.isFinite(value)))
    assert.ok(history.atr.some((value) => Number.isFinite(value)))
  }],

  ['märkningen följer fasen', async (assert) => {
    await ensureDom()
    setLang('sv')
    let gate
    const wait = new Promise((resolve) => {
      gate = resolve
    })
    let calls = 0
    const session = createGransland({
      variant: 'trade-rider',
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      fetch: async (url) => {
        calls += 1
        if (calls === 1) await wait
        return coinbaseFetch()(url)
      },
    })
    assert.equal(session.snapshot().label, t('hist.badge'))
    session.endRace()
    const view = mountView(document.body, session)
    assert.equal(view.root.querySelector('[data-gl-badge]').textContent, 'VERKLIG · HISTORISK')
    const pending = session.enterReal()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(session.snapshot().label, t('gl.fetching'))
    assert.equal(session.snapshot().price, null)
    gate()
    await pending
    view.paint()
    const expected = t('gl.live', { source: 'Coinbase', time: formatHm(NOW) })
    assert.equal(view.root.querySelector('[data-gl-badge]').textContent, expected)
    assert.match(view.root.querySelector('[data-gl-money]').textContent, /Simulerade pengar/)
    assert.match(view.root.querySelector('[data-gl-money]').textContent, /förlora pengar/)
    view.close()

    const stock = createGransland({
      variant: 'racex',
      history: historyBars(),
      instrument: 'AAPL',
      workerUrl: 'https://worker.example',
      poll: false,
      now: () => NOW,
      fetch: async () => jsonResponse({
        symbol: 'AAPL',
        source: 'Yahoo',
        delayed: true,
        fetchedAt: NOW - 30 * 60 * 1000,
        bars: [{ t: NOW - 30 * 60 * 1000, o: 1, h: 2, l: 1, c: 1.5 }],
      }),
    })
    stock.endRace()
    await stock.enterReal()
    assert.match(stock.snapshot().label, /VERKLIG · Yahoo ·/)
    assert.match(stock.snapshot().label, /fördröjd/)
  }],

  ['två spelare får samma verkliga data', async (assert) => {
    await ensureDom()
    setLang('sv')
    const session = createGransland({
      variant: 'trade-rider',
      players: 2,
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      decisions: [{ side: 'buy', leverage: 2, entry: 100 }, { side: 'sell', leverage: 1, entry: 100 }],
      fetch: coinbaseFetch(),
    })
    session.endRace()
    const view = mountView(document.body, session)
    await session.enterReal()
    view.paint()
    const snap = session.snapshot()
    assert.equal(snap.players.length, 2)
    assert.equal(snap.players[0].price, snap.players[1].price)
    assert.equal(snap.players[0].price, 84961.08)
    assert.ok(Math.abs(snap.players[0].pct) < 0.05)
    assert.ok(Math.abs(snap.players[1].pct) < 0.05)
    const shown = [...view.root.querySelectorAll('[data-gl-price]')].map((node) => node.textContent)
    assert.equal(shown.length, 2)
    assert.equal(shown[0], shown[1])
    assert.match(shown[0], /84/)
    view.close()
  }],

  ['innehållet saknar orderord och förbjudna strängar', async (assert) => {
    await ensureDom()
    setLang('sv')
    const roots = [join(HERE), join(HERE, 'hooks'), join(HERE, '../../../worker/gransland-data')]
    const files = []
    for (const root of roots) {
      for (const name of readdirSync(root)) {
        const path = join(root, name)
        if (statSync(path).isDirectory()) continue
        if (name === 'cases.js') continue
        files.push(path)
      }
    }
    files.push(join(HERE, '../../app/docs/granslandet.md'))
    const hits = []
    for (const path of files) {
      const text = readFileSync(path, 'utf8')
      for (const hit of forbiddenHits(text)) hits.push(`${path}: ${hit}`)
    }
    const session = createGransland({
      variant: 'rabbit',
      history: historyBars(),
      instrument: 'BTC-USD',
      poll: false,
      now: () => NOW,
      fetch: coinbaseFetch(),
    })
    session.endRace()
    const view = mountView(document.body, session)
    for (const hit of forbiddenHits(view.root.textContent)) hits.push(`val: ${hit}`)
    await session.enterReal()
    view.paint()
    for (const hit of forbiddenHits(view.root.textContent)) hits.push(`live: ${hit}`)
    view.close()
    assert.deepEqual(hits, [])
  }],

  ['förslagslistan och Workern är avstängd tills den deployas', async (assert) => {
    assert.equal(WORKER_URL, null)
    assert.equal(PROPOSAL, true)
    assert.equal(INSTRUMENTS.length, 7)
    assert.equal(INSTRUMENTS.filter((item) => item.market === 'Stockholm' && item.kind === 'stock').length, 3)
    assert.equal(INSTRUMENTS.filter((item) => item.kind === 'index').length, 1)
    assert.equal(INSTRUMENTS.filter((item) => item.market === 'USA').length, 2)
    assert.equal(INSTRUMENTS.filter((item) => item.kind === 'crypto').length, 1)
    assert.ok(INSTRUMENTS.every((item) => item.proposal === true))
    assert.equal(isYahooAllowed('AAPL'), true)
    assert.equal(isYahooAllowed('VOLV-B.ST'), true)
    assert.equal(isYahooAllowed('^OMX'), true)
    assert.equal(isYahooAllowed('DOGE'), false)
    assert.equal(isCryptoAllowed('BTC-USD'), true)
    assert.equal(isCryptoAllowed('ETH-USD'), false)
    assert.equal(corsOrigin('https://kapitalstrategi.com'), 'https://kapitalstrategi.com')
    assert.equal(corsOrigin('http://localhost:4173'), 'http://localhost:4173')
    assert.equal(corsOrigin('http://127.0.0.1:8080'), 'http://127.0.0.1:8080')
    assert.equal(corsOrigin('https://example.com'), null)
    assert.equal(nextBackoff(0), 60_000)
    assert.equal(nextBackoff(60_000), 120_000)
    assert.equal(nextBackoff(300_000), 300_000)
    assert.equal(CACHE_TTL_SECONDS >= 60 && CACHE_TTL_SECONDS <= 300, true)
    const bars = normalizeYahooChart({
      chart: {
        result: [{
          timestamp: [100, 160, 220],
          indicators: { quote: [{ open: [1, null, 3], high: [2, 2, 4], low: [1, 1, 2], close: [1.5, 1.2, 3.5] }] },
        }],
      },
    })
    assert.equal(bars.length, 2)
    assert.equal(bars[0].c, 1.5)
    assert.equal(bars[1].t, 220_000)
    const worker = readFileSync(join(HERE, '../../../worker/gransland-data/src/index.js'), 'utf8')
    assert.equal(worker.includes('/' + 'orders'), false)
    assert.match(worker, /\/chart/)
    assert.match(readFileSync(join(HERE, '../../../worker/gransland-data/wrangler.toml'), 'utf8'), /compatibility_date = "2026-10-03"/)
  }],

  ['Coinbase- och Kraken-svar blir OHLC', async (assert) => {
    const bars = parseCoinbaseCandles([
      [1_791_049_620, 10, 14, 11, 13, 1],
      [1_791_049_560, 8, 12, 9, 10, 1],
    ])
    assert.equal(bars[0].t, 1_791_049_560_000)
    assert.equal(bars[0].o, 9)
    assert.equal(bars[1].c, 13)
    const kraken = parseKrakenCandles({ result: { XXBTZUSD: [[1_700_000_000, '1', '3', '0.5', '2', '0', '0', 1]], last: 1 } })
    assert.equal(kraken[0].h, 3)
    assert.equal(kraken[0].l, 0.5)
    assert.equal(parseKrakenPrice({ result: { XXBTZUSD: { c: ['84957.7', '0.1'] } } }), 84957.7)
  }],

  ['varianthookarna sitter i de fyra spelen', async (assert) => {
    const read = (name) => readFileSync(join(HERE, '../lagen', name), 'utf8')
    assert.match(read('panel.js'), /noteTradeRider\(/)
    assert.match(read('duo.js'), /noteTradeRiderDuo\(/)
    assert.match(read('raket.js'), /noteRaceXEnd\(/)
    assert.match(read('akademin.js'), /noteAcademySeriesEnd\(/)
    assert.match(read('rabbit.js'), /noteRabbitLap\(/)
    await ensureDom()
    setLang('sv')
    resetHooks()
    const seen = []
    const { onRaceEnd } = await import('./hook.js')
    const off = onRaceEnd((detail) => seen.push(detail.variant))
    noteRabbitLap({ atEnd: true, bars: historyBars(), poll: false })
    noteAcademySeriesEnd({ reachedEnd: true, bars: historyBars(), side: 'long', poll: false })
    assert.deepEqual(seen, ['rabbit', 'academy'])
    off()
    resetHooks()
  }],
]
