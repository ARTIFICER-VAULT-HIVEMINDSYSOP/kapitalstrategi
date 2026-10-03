import { WORKER_URL } from './config.js'
import { createPhaseMachine } from './phases.js'
import { asBars } from './bars.js'
import { stitch } from './stitch.js'
import { assessFreshness } from './stale.js'
import { loadInstrument } from './adapters.js'
import { createPoller } from './feed.js'
import { indicatorPack } from './indicators.js'
import { phaseLabel, moneySentence } from './labels.js'
import { attachLiveFeed, resetLiveFeedForTests } from '../lagen/live-port.js'

export const VARIANTS = ['trade-rider', 'racex', 'academy', 'rabbit']

function sideOf(value) {
  if (value === 'sell' || value === 'short') return 'sell'
  if (value === 'buy' || value === 'long') return 'buy'
  return 'flat'
}

function makePlayers(count, decisions, history) {
  const last = history.length ? history[history.length - 1].c : null
  const n = count === 2 ? 2 : 1
  const players = []
  for (let i = 0; i < n; i++) {
    const decision = decisions?.[i] || {}
    const side = sideOf(decision.side)
    players.push({
      id: i + 1,
      side,
      leverage: Number.isFinite(Number(decision.leverage)) ? Number(decision.leverage) : 1,
      entry: Number.isFinite(Number(decision.entry)) ? Number(decision.entry) : side === 'flat' ? null : last,
    })
  }
  return players
}

function rebaseEntries(players, nextPrice) {
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) return
  for (const player of players) {
    if (player.side === 'flat' || player.entry == null || !(player.entry > 0)) continue
    const ratio = Math.max(nextPrice, player.entry) / Math.min(nextPrice, player.entry)
    if (ratio > 3) player.entry = nextPrice
  }
}

function simulatedPct(player, price) {
  if (!player || player.side === 'flat' || player.entry == null || !(player.entry > 0) || !Number.isFinite(price)) return null
  const sign = player.side === 'buy' ? 1 : -1
  return sign * (price / player.entry - 1) * player.leverage * 100
}

export function createGransland(opts = {}) {
  const variant = VARIANTS.includes(opts.variant) ? opts.variant : 'trade-rider'
  const enabled = opts.enabled !== false
  const workerUrl = opts.workerUrl === undefined ? WORKER_URL : opts.workerUrl
  const fetchImpl = opts.fetch || globalThis.fetch
  const now = () => (typeof opts.now === 'function' ? opts.now() : Date.now())
  const machine = createPhaseMachine()
  let history = asBars(opts.history || opts.bars || [])
  let live = []
  let gaps = []
  let shown = history.slice()
  let instrument = opts.instrument || 'NVDA'
  let fetching = false
  let unknown = false
  let reason = ''
  let price = null
  let source = ''
  let delayed = false
  let quoteTime = null
  let players = makePlayers(opts.players, opts.decisions, history)
  let poller = null
  let networkCalls = 0
  const listeners = new Set()

  function emit() {
    for (const fn of listeners) fn(snapshot())
  }

  function recompute() {
    const stitched = stitch(history, live, { now: now() })
    shown = stitched.bars
    gaps = stitched.gaps
  }

  function markUnknown(nextReason) {
    unknown = true
    reason = nextReason || 'failed'
    price = null
    live = []
    source = ''
    quoteTime = null
    machine.hold()
    recompute()
    resetLiveFeedForTests()
    emit()
  }

  function applyResult(result) {
    fetching = false
    if (!result || result.network === false && !result.ok) {
      markUnknown(result?.reason || 'off')
      return
    }
    const fresh = assessFreshness({
      ok: !!result.ok,
      time: result.time,
      delayed: !!result.delayed,
      now: now(),
    })
    if (!fresh.fresh) {
      markUnknown(fresh.reason)
      return
    }
    live = asBars(result.bars)
    recompute()
    if (!Number.isFinite(result.price)) {
      markUnknown('failed')
      return
    }
    unknown = false
    reason = ''
    price = result.price
    source = result.source || ''
    delayed = !!result.delayed
    quoteTime = result.time
    rebaseEntries(players, price)
    if (machine.phase() === 'gransland') machine.enterLive()
    attachLiveFeed({
      status: () => (unknown ? 'fel' : 'live'),
      subscribe(_symbol, onTick) {
        if (Number.isFinite(price)) onTick({ symbol: instrument, t: quoteTime, price })
        return () => {}
      },
    })
    emit()
  }

  async function load() {
    if (!enabled) return { ok: false, reason: 'off', network: false }
    const result = await loadInstrument(fetchImpl, { id: instrument, workerUrl })
    if (result?.network !== false) networkCalls += 1
    return result
  }

  function snapshot() {
    const figures = unknown || fetching || !Number.isFinite(price) ? null : indicatorPack(shown)
    const playerViews = players.map((player) => {
      const pct = unknown || !Number.isFinite(price) ? null : simulatedPct(player, price)
      return {
        id: player.id,
        side: player.side,
        leverage: player.leverage,
        price: unknown || fetching ? null : price,
        priceText: unknown || fetching || !Number.isFinite(price) ? '' : String(price),
        pct,
        money: machine.phase() === 'historia' ? '' : moneySentence(machine.phase() === 'live' && !unknown ? pct : null),
      }
    })
    return {
      variant,
      phase: machine.phase(),
      instrument,
      fetching,
      unknown,
      reason,
      label: phaseLabel({
        phase: machine.phase(),
        fetching,
        unknown,
        source,
        time: quoteTime,
        delayed,
      }),
      delayed: !unknown && delayed,
      price: unknown || fetching ? null : price,
      source: unknown ? '' : source,
      bars: shown.map((bar) => ({ ...bar })),
      gaps: gaps.map((gap) => ({ ...gap })),
      players: playerViews,
      choice: machine.phase() === 'gransland',
      figures,
      networkCalls,
    }
  }

  recompute()

  return {
    variant: () => variant,
    phase: () => machine.phase(),
    choiceVisible: () => machine.phase() === 'gransland',
    networkCalls: () => networkCalls,
    snapshot,
    onChange(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    endRace() {
      machine.endRace()
      emit()
      return machine.phase()
    },
    async enterReal() {
      if (machine.phase() === 'historia') return snapshot()
      if (poller) return snapshot()
      fetching = true
      unknown = false
      emit()
      if (opts.poll === false) {
        applyResult(await load())
        return snapshot()
      }
      poller = createPoller({
        enabled,
        load,
        schedule: opts.schedule,
        clear: opts.clear,
      })
      applyResult(await poller.start())
      return snapshot()
    },
    async switchCrypto() {
      instrument = 'BTC-USD'
      if (poller) {
        poller.stop()
        poller = null
      }
      if (machine.phase() === 'historia') machine.endRace()
      return this.enterReal()
    },
    steer(playerId, side) {
      const player = players.find((item) => item.id === playerId) || players[0]
      if (!player || machine.phase() !== 'live' || unknown) return snapshot()
      const next = sideOf(side)
      if (next === 'flat') player.entry = null
      else if (player.side !== next || player.entry == null) player.entry = price
      player.side = next
      emit()
      return snapshot()
    },
    leverage(playerId, delta) {
      const player = players.find((item) => item.id === playerId) || players[0]
      if (!player || machine.phase() !== 'live' || unknown) return snapshot()
      player.leverage = Math.min(4, Math.max(1, player.leverage + delta))
      emit()
      return snapshot()
    },
    replay() {
      poller?.stop()
      poller = null
      machine.replay()
      live = []
      price = null
      unknown = false
      fetching = false
      reason = ''
      source = ''
      quoteTime = null
      instrument = opts.instrument || 'NVDA'
      history = asBars(opts.history || opts.bars || [])
      players = makePlayers(opts.players, opts.decisions, history)
      recompute()
      resetLiveFeedForTests()
      emit()
      opts.onReplay?.()
      return snapshot()
    },
    stop() {
      poller?.stop()
      poller = null
      resetLiveFeedForTests()
    },
  }
}
