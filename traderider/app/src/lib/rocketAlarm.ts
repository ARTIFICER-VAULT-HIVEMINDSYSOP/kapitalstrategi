/**
 * Margin call-siren för Raket-lägena. WebAudio, tvåton som växlar var 250 ms (= 2 Hz-cykel).
 * Startas först efter en användargest (webbläsarens regel), kan stängas av i gränssnittet.
 */
export type Alarm = { start: () => void; stop: () => void; setEnabled: (on: boolean) => void; running: () => boolean }

export function createAlarm(): Alarm {
  let ctx: AudioContext | null = null
  let osc: OscillatorNode | null = null
  let gain: GainNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let enabled = true
  let high = false

  function ensure(): AudioContext | null {
    if (ctx) return ctx
    const AC = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined
    if (!AC) return null
    try {
      ctx = new AC()
    } catch {
      ctx = null
    }
    return ctx
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
    try {
      osc?.stop()
    } catch {
      /* already stopped */
    }
    osc?.disconnect()
    gain?.disconnect()
    osc = null
    gain = null
  }

  function start() {
    if (!enabled || timer) return
    const ac = ensure()
    if (!ac) return
    void ac.resume?.()
    osc = ac.createOscillator()
    gain = ac.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.value = 0.06
    osc.connect(gain).connect(ac.destination)
    osc.start()
    timer = setInterval(() => {
      high = !high
      if (osc && ctx) osc.frequency.setValueAtTime(high ? 660 : 880, ctx.currentTime)
    }, 250)
  }

  return {
    start,
    stop,
    setEnabled(on: boolean) {
      enabled = on
      if (!on) stop()
    },
    running: () => timer != null,
  }
}
