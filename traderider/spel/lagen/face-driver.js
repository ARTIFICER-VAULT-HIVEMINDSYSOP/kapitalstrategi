/**
 * faceDriver. Marknadsläge, spelarläge och händelser blir uttrycksvikter
 * och en åk-ruta. Vikterna är blendshapes så en senare renderer
 * (till exempel NVIDIA ACE / Audio2Face) kan bytas in utan att tick-källan ändras.
 * v1 ritar själv. Ingen tjänst, ingen nyckel, inget nät.
 *
 * Priset som skickas in ska vara grafens tick. Drivern hittar inte på kurser.
 */

export const RIDE_FPS = 9
export const GREEN_FRAMES = [0, 1, 8, 9]
export const DOWN_FRAMES = [2, 3, 4, 5, 6, 7]

const PRESET = {
  neutral: { smile: 0.08, browUp: 0, browDown: 0, eyeWide: 0, eyeSquint: 0, mouthOpen: 0, focus: 0.1, calm: 0.35, blink: 0, strain: 0 },
  focused: { smile: 0, browUp: 0.05, browDown: 0.35, eyeWide: 0.1, eyeSquint: 0.45, mouthOpen: 0, focus: 0.85, calm: 0.15, blink: 0, strain: 0 },
  happy: { smile: 0.9, browUp: 0.28, browDown: 0, eyeWide: 0, eyeSquint: 0.28, mouthOpen: 0.12, focus: 0.15, calm: 0.25, blink: 0, strain: 0 },
  cheer: { smile: 1, browUp: 0.72, browDown: 0, eyeWide: 0.35, eyeSquint: 0.1, mouthOpen: 0.9, focus: 0.05, calm: 0, blink: 0, strain: 0 },
  worried: { smile: 0, browUp: 0.1, browDown: 0.72, eyeWide: 0.55, eyeSquint: 0, mouthOpen: 0.08, focus: 0.7, calm: 0, blink: 0, strain: 0 },
  calm: { smile: 0.32, browUp: 0, browDown: 0, eyeWide: 0, eyeSquint: 0.42, mouthOpen: 0, focus: 0.2, calm: 1, blink: 0, strain: 0 },
  surprised: { smile: 0.05, browUp: 0.9, browDown: 0, eyeWide: 1, eyeSquint: 0, mouthOpen: 0.72, focus: 0.35, calm: 0, blink: 0, strain: 0 },
}

function mean(xs) {
  if (!xs.length) return 0
  let s = 0
  for (const v of xs) s += v
  return s / xs.length
}

/** Kort lutning på de senast samplade graf-ticksen. */
export function trendOf(prices) {
  if (!prices || prices.length < 4) return { trend: 'flat', vol: 0 }
  const mid = Math.floor(prices.length / 2)
  const early = mean(prices.slice(0, mid))
  const late = mean(prices.slice(mid))
  const slope = early > 0 ? (late - early) / early : 0
  const trend = slope > 0.0012 ? 'up' : slope < -0.0012 ? 'down' : 'flat'
  let vol = 0
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]
    if (prev > 0) vol += Math.abs(prices[i] - prev) / prev
  }
  vol /= Math.max(1, prices.length - 1)
  return { trend, vol }
}

/**
 * Grön bräda: uppåttrend, eller spelaren ligger plus (även på en nedgång).
 * Röd nedåtrörelse: nedgången går emot en lång position.
 * followMarket används när ingen position är öppen och själva linjen ska synas, som i Academy-loppet.
 */
export function rideClip({ trend, side, openPct, followMarket = false }) {
  const positioned = side === 'buy' || side === 'sell'
  const profit = positioned && openPct > 0.05
  const downAgainst = side === 'buy' && openPct < -0.05 && trend !== 'up'
  if (profit || trend === 'up') return 'green'
  if (downAgainst) return 'down'
  if (followMarket && trend === 'down') return 'down'
  return 'green'
}

/** Hävstång 1–2 är den vanliga rutan. 3–4 (och högre, om tåget tillåter det) är fartvarianten. */
export function rideSheet(lev) {
  const n = Number(lev)
  return n >= 3 ? 'high' : 'ride'
}

export function framesFor(clip) {
  return clip === 'down' ? DOWN_FRAMES : GREEN_FRAMES
}

export function frameAt(frames, now, reduced) {
  if (!frames || !frames.length) return 0
  if (reduced) return frames[0]
  const step = Math.floor(Math.max(0, now) / (1000 / RIDE_FPS))
  return frames[step % frames.length]
}

function strainOf(weights) {
  return {
    ...weights,
    browDown: Math.min(1, weights.browDown + 0.35),
    browUp: 0,
    eyeWide: 0,
    eyeSquint: Math.max(weights.eyeSquint, 0.82),
    smile: Math.min(weights.smile, 0.04),
    mouthOpen: 0,
    focus: 1,
    calm: 0,
    strain: 1,
  }
}

function baseExpression({ openPct, side, vol, phase }) {
  if (phase === 'cheer') return 'cheer'
  if (phase === 'calm') return 'calm'
  if (phase === 'surprised') return 'surprised'
  if (phase === 'focus') return 'focused'
  if (side !== 'flat' && openPct >= 0.4) return 'happy'
  if (side !== 'flat' && openPct <= -0.4) return 'worried'
  if (vol >= 0.004) return 'focused'
  return 'neutral'
}

export function createFaceDriver() {
  let prices = []
  let lastIdx = null
  let lastSide = null
  let blinkUntil = 0
  let surpriseUntil = 0
  let last = null

  return {
    update(input) {
      const now = Number(input.now) || 0
      const price = input.price
      const idx = Math.floor(Number(input.index) || 0)
      if (Number.isFinite(price) && idx !== lastIdx) {
        if (prices.length && prices[prices.length - 1] > 0) {
          const jump = Math.abs(price - prices[prices.length - 1]) / prices[prices.length - 1]
          if (jump >= 0.012) surpriseUntil = now + 420
        }
        prices.push(price)
        if (prices.length > 16) prices.shift()
        lastIdx = idx
      }
      const side = input.side === 'buy' || input.side === 'sell' ? input.side : 'flat'
      if (lastSide && side !== lastSide) blinkUntil = now + 220
      lastSide = side
      const openPct = Number(input.openPct) || 0
      const lev = Number(input.lev) > 0 ? Number(input.lev) : 1
      const reduced = !!input.reduced
      const market = trendOf(prices)
      const clip = rideClip({ trend: market.trend, side, openPct, followMarket: !!input.followMarket })
      const sheet = rideSheet(lev)
      const frames = framesFor(clip)
      const frame = frameAt(frames, now, reduced)
      const hit = input.hit === 'sl' || input.hit === 'tp' ? input.hit : null
      let phase = null
      if (hit === 'sl') phase = 'calm'
      else if (hit === 'tp') phase = 'cheer'
      else if (now < blinkUntil) phase = 'focus'
      else if (now < surpriseUntil && Math.abs(openPct) < 1.5) phase = 'surprised'
      let expression = baseExpression({ openPct, side, vol: market.vol, phase })
      let weights = { ...PRESET[expression] }
      if (now < blinkUntil && hit == null) weights = { ...weights, blink: 1, focus: 1 }
      const tense = clip === 'down' && lev >= 3 && expression !== 'calm' && expression !== 'cheer'
      if (tense) {
        expression = 'worried'
        weights = strainOf(PRESET.worried)
      }
      last = {
        expression,
        weights,
        price,
        openPct,
        side,
        lev,
        tense,
        market,
        ride: { clip, sheet, frame, frames },
      }
      return last
    },
    snap() {
      return last
    },
    prices() {
      return prices.slice()
    },
  }
}
