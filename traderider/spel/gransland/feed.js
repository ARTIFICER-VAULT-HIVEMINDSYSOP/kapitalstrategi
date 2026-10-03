import { POLL_MS, nextDelay } from './config.js'

/**
 * Långsam poll. enabled false gör inget anrop.
 * 429 och fel ökar väntan exponentiellt.
 */
export function createPoller({ enabled, load, intervalMs = POLL_MS, schedule = defaultSchedule, clear = defaultClear }) {
  let stopped = false
  let timer = 0
  let delay = intervalMs
  let calls = 0
  let first
  let resolveFirst

  function armFirst() {
    if (!first) {
      first = new Promise((resolve) => {
        resolveFirst = resolve
      })
    }
    return first
  }

  async function tick() {
    if (stopped || !enabled) {
      resolveFirst?.({ ok: false, reason: 'off', network: false })
      return
    }
    calls += 1
    let result
    try {
      result = await load()
      delay = nextDelay(delay, result?.status === 429 ? 429 : result?.ok ? 'ok' : 'error')
    } catch (error) {
      delay = nextDelay(delay, error?.status === 429 ? 429 : 'error')
      result = { ok: false, reason: 'failed', status: error?.status || 0, error }
    }
    resolveFirst?.(result)
    if (!stopped && enabled) timer = schedule(tick, delay)
    return result
  }

  return {
    start() {
      if (!enabled || stopped) {
        armFirst()
        resolveFirst?.({ ok: false, reason: 'off', network: false })
        return armFirst()
      }
      armFirst()
      tick()
      return first
    },
    stop() {
      stopped = true
      if (timer) clear(timer)
      timer = 0
    },
    calls: () => calls,
  }
}

function defaultSchedule(fn, ms) {
  return setTimeout(fn, ms)
}

function defaultClear(timer) {
  clearTimeout(timer)
}
