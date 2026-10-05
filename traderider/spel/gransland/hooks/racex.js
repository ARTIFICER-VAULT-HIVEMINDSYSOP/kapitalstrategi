import { signalRaceEnd } from '../hook.js'

let noted = false

export function resetRaceXHook() {
  noted = false
}

export function noteRaceXEnd(ctx = {}) {
  if (!ctx.ended || noted) return false
  noted = true
  signalRaceEnd({
    variant: 'racex',
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
