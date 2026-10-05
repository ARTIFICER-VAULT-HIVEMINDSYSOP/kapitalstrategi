import { createGransland } from './session.js'
import { mountView } from './view.js'

let current = null
const listeners = new Set()

export function onRaceEnd(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function closeGransland() {
  current?.close()
  current = null
}

export function signalRaceEnd(detail = {}) {
  for (const fn of listeners) fn(detail)
  closeGransland()
  const host = detail.host || (typeof document !== 'undefined' ? document.body : null)
  if (!host) return null
  const session = createGransland({
    variant: detail.variant,
    history: detail.history || detail.bars,
    players: detail.players,
    decisions: detail.decisions,
    instrument: detail.instrument,
    enabled: detail.enabled,
    workerUrl: detail.workerUrl,
    fetch: detail.fetch,
    now: detail.now,
    course: detail.course === 'historia' ? 'historia' : 'simulerad',
    poll: detail.poll !== false,
    onReplay: detail.onReplay,
    onMenu: detail.onMenu,
  })
  session.endRace()
  const view = mountView(host, session, { shot: detail.shot, onMenu: detail.onMenu })
  current = view
  return { session, view }
}

export function resetGranslandForTests() {
  closeGransland()
  listeners.clear()
}
