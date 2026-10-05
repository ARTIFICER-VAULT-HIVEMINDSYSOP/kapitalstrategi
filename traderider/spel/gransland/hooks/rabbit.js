import { signalRaceEnd } from '../hook.js'

let noted = false

export function resetRabbitHook() {
  noted = false
}

export function noteRabbitLap(ctx = {}) {
  if (!ctx.atEnd || noted) return false
  noted = true
  ctx.freeze?.()
  signalRaceEnd({
    variant: 'rabbit',
    course: 'simulerad',
    players: ctx.players === 2 ? 2 : 1,
    history: ctx.bars,
    decisions: ctx.decisions,
    onReplay() {
      noted = false
      ctx.replay?.()
    },
    onMenu: ctx.menu,
    poll: ctx.poll !== false,
  })
  return true
}
