import { signalRaceEnd } from '../hook.js'

let noted = false

export function resetTradeRiderAcademyHook() {
  noted = false
}

export function noteTradeRiderAcademy(ctx = {}) {
  if (!ctx.reachedEnd || noted) return false
  noted = true
  signalRaceEnd({
    variant: 'tra',
    course: 'simulerad',
    players: 1,
    history: ctx.bars,
    decisions: [{ side: 'flat', leverage: 1 }],
    onReplay() {
      noted = false
      ctx.replay?.()
    },
    onMenu: ctx.menu,
    poll: ctx.poll !== false,
  })
  return true
}
