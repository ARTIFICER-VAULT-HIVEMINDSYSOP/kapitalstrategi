import { signalRaceEnd } from '../hook.js'

let noted = false
let duoNoted = false

export function resetTradeRiderHook() {
  noted = false
  duoNoted = false
}

export function noteTradeRider(ctx = {}) {
  const hud = ctx.hud
  if (!hud || noted) return false
  if (!hud.finished && !hud.crashed) return false
  noted = true
  signalRaceEnd({
    variant: 'trade-rider',
    players: ctx.players || 1,
    history: ctx.candles,
    decisions: [{ side: hud.flat ? 'flat' : hud.side, leverage: hud.leverage, entry: hud.price }],
    onReplay() {
      noted = false
      ctx.replay?.()
    },
    onMenu: ctx.menu,
    poll: ctx.poll !== false,
    fetch: ctx.fetch,
    enabled: ctx.enabled,
    now: ctx.now,
    workerUrl: ctx.workerUrl,
  })
  return true
}

export function noteTradeRiderDuo(ctx = {}) {
  const huds = Array.isArray(ctx.huds) ? ctx.huds.filter(Boolean) : []
  if (duoNoted || huds.length < 2) return false
  const over = (hud) => hud.finished || hud.crashed
  if (!huds.every(over)) return false
  duoNoted = true
  signalRaceEnd({
    variant: 'trade-rider',
    players: 2,
    history: ctx.candles,
    decisions: huds.map((hud) => ({ side: hud.flat ? 'flat' : hud.side, leverage: hud.leverage, entry: hud.price })),
    onReplay() {
      duoNoted = false
      ctx.replay?.()
    },
    onMenu: ctx.menu,
    poll: ctx.poll !== false,
  })
  return true
}
