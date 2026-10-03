/** historia → gransland → live. Live nås bara efter ett medvetet val och verklig data. */
export const PHASES = ['historia', 'gransland', 'live']

export function createPhaseMachine() {
  let phase = 'historia'
  return {
    phases: PHASES,
    phase: () => phase,
    endRace() {
      if (phase === 'historia') phase = 'gransland'
      return phase
    },
    enterLive() {
      if (phase !== 'gransland') return false
      phase = 'live'
      return true
    },
    hold() {
      if (phase === 'live') phase = 'gransland'
      return phase
    },
    replay() {
      phase = 'historia'
      return phase
    },
  }
}
