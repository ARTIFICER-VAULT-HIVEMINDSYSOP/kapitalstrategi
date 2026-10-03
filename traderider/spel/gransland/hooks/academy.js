import { signalRaceEnd } from '../hook.js'

let noted = false

export function resetAcademyHook() {
  noted = false
}

export function noteAcademySeriesEnd(ctx = {}) {
  if (!ctx.reachedEnd || noted || ctx.alreadyNoted) return false
  noted = true
  const side = ctx.side === 'short' ? 'sell' : ctx.side === 'long' ? 'buy' : 'flat'
  signalRaceEnd({
    variant: 'academy',
    course: 'simulerad',
    players: 1,
    history: ctx.bars,
    decisions: [{ side, leverage: 1 }],
    onReplay() {
      noted = false
      ctx.replay?.()
    },
    onMenu: ctx.menu,
    poll: ctx.poll !== false,
  })
  return true
}
