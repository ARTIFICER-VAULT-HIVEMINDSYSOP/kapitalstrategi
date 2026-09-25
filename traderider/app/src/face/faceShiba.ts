/**
 * Läge 3 · Raket — Shiba Inu cosmonaut portrait (a Laika homage), own pixel art on a 24×24 grid.
 * Fox-like orange/cream face, white cheeks/muzzle, triangular ears inside a round glass helmet with teal rim,
 * retro cosmonaut collar with an orange tab. Same Expr input as the other portraits; expressions are dog-ified.
 * No token logos, no real-dog likeness, no third-party characters.
 */
import type { Expr } from './faceLogic'

const C = {
  bg: '#062227', bg2: '#0a3a40', rim: '#1fd3e6', rimHi: '#5ff3ff', alarm: '#ff5d73',
  fur: '#e58a34', furSh: '#b8641c', furHi: '#f2a656', cream: '#fbead2', creamSh: '#e7cfae',
  earIn: '#f6c7a6', ink: '#1a1210', nose: '#140c0a', eyeGlint: '#ffffff', eyeW: '#f7f3ea',
  tongue: '#f2708a', tongueSh: '#c94b66', teeth: '#fffaf0', plaster: '#efd9ae', plasterSh: '#cdb07e',
  suit: '#d7e1e4', suitSh: '#9fb1b6', tab: '#ff9f43', sweat: '#9ff6ff', crack: '#dffcff', spark: '#5ff3ff', flash: 'rgba(255,93,115,',
}

type Ears = 'up' | 'perk' | 'back' | 'flat' | 'oneDown'

function earsFor(e: Expr): Ears {
  if (e.key === 'rueful') return 'oneDown'
  if (e.celebrate) return 'back'
  if (e.alert === 'band' || e.key.includes('+glance')) return 'perk'
  if (e.tier >= 2) return 'flat'
  if (e.brows === 'worried') return 'back'
  return 'up'
}

export function drawShiba(ctx: CanvasRenderingContext2D, e: Expr, t: number, size: number) {
  const s = size / 24
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.ceil(w * s), Math.ceil(h * s))
  }
  ctx.save()
  ctx.imageSmoothingEnabled = false
  px(0, 0, C.bg, 24, 24)
  for (let y = 1; y < 23; y += 2) px(1, y, C.bg2, 22, 1)

  // head tilt: rueful = shift 1 px right; howl = muzzle up (features 1 px higher)
  const tx = e.key === 'rueful' ? 1 : 0
  const ty = e.celebrate ? -1 : 0
  const P = (x: number, y: number, c: string, w = 1, h = 1) => px(x + tx, y + ty, c, w, h)

  // cosmonaut collar + suit
  px(2, 20, C.suit, 20, 4)
  px(2, 20, C.suitSh, 20, 1)
  px(7, 19, C.suitSh, 10, 1) // neck ring
  px(8, 18, C.suit, 8, 1)
  px(4, 21, C.tab, 3, 2) // orange tab
  px(17, 21, C.rim, 3, 1)
  px(11, 21, C.suitSh, 2, 2)

  // ears
  const ears = earsFor(e)
  const earUp = (x0: number, dir: 1 | -1, tall: number) => {
    // triangular ear, base 5 wide at row 7, apex `tall` rows up
    for (let k = 0; k < tall; k++) {
      const y = 7 - k
      const half = Math.max(0, Math.round(2.5 * (1 - k / tall)))
      const cx = x0 + dir * Math.round(k * 0.35)
      P(cx - half, y, C.fur, half * 2 + 1, 1)
      if (half >= 2) P(cx - half + 1, y, C.earIn, half * 2 - 1, 1)
      P(cx - half - 1, y, C.ink, 1, 1)
      P(cx + half + 1, y, C.ink, 1, 1)
    }
    P(x0 + dir * Math.round(tall * 0.35), 7 - tall, C.ink)
  }
  const earSide = (x0: number, dir: 1 | -1) => {
    // flattened ear pointing sideways/back
    P(x0, 6, C.fur, 1, 3)
    P(x0 + dir, 6, C.fur, 1, 2)
    P(x0 + 2 * dir, 6, C.fur, 1, 1)
    P(x0 + dir, 7, C.earIn, 1, 1)
    P(x0 + 3 * dir, 5, C.ink); P(x0 + 2 * dir, 7, C.ink); P(x0 + dir, 8, C.ink)
  }
  if (ears === 'up') { earUp(7, -1, 4); earUp(16, 1, 4) }
  else if (ears === 'perk') { earUp(7, -1, 5); earUp(16, 1, 5) }
  else if (ears === 'back') { earUp(6, -1, 3); earUp(17, 1, 3) }
  else if (ears === 'flat') { earSide(5, -1); earSide(18, 1) }
  else { earUp(7, -1, 4); earSide(18, 1) } // oneDown

  // head (fox-like: wide cheeks, tapering to muzzle)
  const rows: [number, number, number][] = [
    [7, 6, 17], [8, 5, 18], [9, 5, 18], [10, 5, 18], [11, 5, 18], [12, 5, 18], [13, 6, 17], [14, 6, 17], [15, 7, 16], [16, 8, 15], [17, 9, 14],
  ]
  for (const [r, a, b] of rows) {
    P(a - 1, r, C.ink)
    P(b + 1, r, C.ink)
    P(a, r, C.fur, b - a + 1, 1)
  }
  P(6, 6, C.ink, 12, 1)
  P(9, 18, C.ink, 6, 1)
  P(7, 7, C.furHi, 3, 1); P(14, 7, C.furHi, 3, 1)
  // white cheeks + muzzle ("urajiro")
  P(5, 12, C.cream, 3, 1); P(16, 12, C.cream, 3, 1)
  P(6, 13, C.cream, 3, 1); P(15, 13, C.cream, 3, 1)
  P(9, 12, C.cream, 6, 1)
  P(8, 13, C.cream, 8, 3)
  P(7, 14, C.cream, 10, 1)
  P(8, 15, C.cream, 8, 1)
  P(9, 16, C.cream, 6, 1)
  P(10, 17, C.cream, 4, 1)
  P(10, 11, C.creamSh, 4, 1) // bridge highlight

  // brow markings (cream dots above the eyes)
  const bOff = e.brows === 'worried' || e.brows === 'raised' ? -1 : e.brows === 'angry' || e.brows === 'low' ? 1 : 0
  P(8, 8 + (e.brows === 'angry' ? 0 : bOff), C.cream, 1, 1)
  P(9, 8 + bOff, C.cream, 1, 1)
  P(14, 8 + bOff, C.cream, 1, 1)
  P(15, 8 + (e.brows === 'angry' ? 0 : bOff), C.cream, 1, 1)

  // eyes (almond, dark, glint)
  const eye = (x: number, left: boolean) => {
    const lk = e.look
    if (e.eyes === 'blink') { P(x - 1, 10, C.ink, 3, 1); return }
    if (e.eyes === 'happy') { P(x - 1, 10, C.ink); P(x, 9, C.ink); P(x + 1, 10, C.ink); return }
    if (e.eyes === 'squeeze') {
      if (left) { P(x - 1, 9, C.ink); P(x, 10, C.ink); P(x - 1, 11, C.ink) } else { P(x + 1, 9, C.ink); P(x, 10, C.ink); P(x + 1, 11, C.ink) }
      return
    }
    if (e.eyes === 'wide') {
      P(x - 1, 9, C.eyeW, 3, 3)
      P(x + lk, 10, C.ink, 1, 1)
      P(x + lk, 9, C.ink, 1, 1)
      return
    }
    P(x - 1 + (lk > 0 ? 1 : 0), 10, C.ink, 2, 1)
    P(x - 1 + (lk > 0 ? 1 : 0), 9, C.ink, 2, 1)
    P(x - 1 + (lk > 0 ? 1 : 0) + (lk < 0 ? 0 : 1), 9, C.eyeGlint, 1, 1)
    if (lk < 0) P(x + 1, 10, C.furSh)
    if (e.eyes === 'droop') P(x - 1, 9, C.furSh, 3, 1)
  }
  eye(9, true)
  eye(14, false)

  // nose
  P(11, 12, C.nose, 2, 1)
  P(10, 12, C.ink); P(13, 12, C.ink)
  P(11, 13, C.nose, 2, 1)
  P(11, 12, '#3a2a26', 1, 1)

  // mouth
  const I = C.ink
  switch (e.mouth) {
    case 'neutral': P(11, 14, I); P(12, 14, I); P(10, 15, I); P(13, 15, I); break
    case 'tight': P(10, 15, I, 4, 1); break
    case 'smile': P(11, 14, I, 2, 1); P(10, 15, I); P(13, 15, I); P(9, 14, I); P(14, 14, I); break
    case 'grin':
      P(11, 14, I, 2, 1); P(9, 14, I); P(14, 14, I); P(10, 15, I, 4, 1)
      P(11, 16, C.tongue, 2, 2); P(11, 17, C.tongueSh, 1, 1); break // tongue out
    case 'frown': P(11, 14, I, 2, 1); P(10, 15, I); P(13, 15, I); P(9, 16, I); P(14, 16, I); break
    case 'grimace':
      P(9, 14, I, 6, 1); P(9, 15, C.teeth, 6, 1); P(9, 16, I, 6, 1)
      P(9, 16, C.teeth); P(14, 16, C.teeth); P(11, 15, I); P(12, 15, I); break // bared teeth + fangs
    case 'open': P(10, 14, I, 4, 3); P(11, 15, C.tongue, 2, 1); break
    case 'rueful': P(11, 14, I, 2, 1); P(10, 15, I); P(13, 14, I); P(14, 13, I); break
    case 'wobbly': P(9, 15, I); P(10, 14, I); P(11, 15, I); P(12, 14, I); P(13, 15, I); P(14, 14, I); break
    case 'celebrate': P(10, 14, I, 3, 3); P(11, 15, C.tongueSh); P(13, 15, I); break // howl 'O'
  }

  // damage tiers
  const tier = e.tier
  if (tier >= 1) P(6, 11, C.furSh)
  if (tier >= 2) { P(10, 11, C.plaster, 4, 1); P(11, 10, C.plasterSh, 2, 1); P(11, 11, C.plasterSh, 1, 1) } // plaster on snout
  if (tier >= 3) { P(16, 9, C.furSh); P(7, 13, C.creamSh) }
  if (tier >= 4) { P(15, 10, C.furSh, 2, 1); P(5, 9, C.furSh) }

  // sweat drops
  if (e.sweat > 0) {
    const drops: [number, number][] = [[4, 9], [19, 8], [18, 13]]
    for (let k = 0; k < e.sweat; k++) {
      const [x, y0] = drops[k]
      const y = y0 + (Math.floor(t / 180 + k * 2) % 4)
      px(x, y, C.sweat, 1, 2)
    }
  }

  // glass helmet: rim, tint, glare, cracks (tier 3-4), fog (tier 4)
  ctx.strokeStyle = C.rim
  ctx.lineWidth = Math.max(1, s)
  ctx.beginPath(); ctx.arc(12 * s, 11.5 * s, 10.4 * s, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = 'rgba(95,243,255,0.09)'
  ctx.beginPath(); ctx.arc(12 * s, 11.5 * s, 9.8 * s, 0, Math.PI * 2); ctx.fill()
  px(5, 5, 'rgba(230,255,255,0.6)', 2, 1); px(4, 6, 'rgba(230,255,255,0.6)', 1, 2)
  if (tier >= 3) { px(17, 4, C.crack); px(18, 5, C.crack); px(18, 6, C.crack); px(19, 7, C.crack); px(17, 6, C.crack) }
  if (tier >= 4) {
    px(4, 14, C.crack); px(5, 15, C.crack); px(4, 16, C.crack); px(6, 16, C.crack)
    ctx.fillStyle = 'rgba(225,248,252,0.28)' // visor fog
    for (const [x, y, w, h] of [[4, 16, 5, 3], [15, 15, 5, 4], [7, 18, 10, 1], [16, 12, 3, 2]] as const) ctx.fillRect(x * s, y * s, w * s, h * s)
  }

  // howl sparkles
  if (e.celebrate) {
    const on = Math.floor(t / 220) % 2 === 0
    const sp: [number, number][] = on ? [[2, 3], [20, 2], [21, 9], [2, 12]] : [[3, 6], [19, 4], [20, 12], [3, 16]]
    for (const [x, y] of sp) { px(x, y, C.spark); px(x - 1, y, C.spark, 0.6, 1); px(x + 1, y, C.spark, 0.6, 1); px(x, y - 1, C.spark, 1, 0.6); px(x, y + 1, C.spark, 1, 0.6) }
  }
  if (e.flash > 0) {
    ctx.fillStyle = `${C.flash}${(0.45 * e.flash).toFixed(3)})`
    ctx.fillRect(0, 0, size, size)
  }
  const pulse = e.alert !== 'none' && Math.floor(t / 300) % 2 === 0
  ctx.strokeStyle = pulse ? (e.alert === 'band' ? C.alarm : C.rimHi) : C.rim
  ctx.lineWidth = Math.max(2, 1.4 * s)
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth)
  ctx.strokeStyle = 'rgba(95,243,255,0.35)'
  ctx.lineWidth = 1
  ctx.strokeRect(3.5, 3.5, size - 7, size - 7)
  ctx.restore()
}
