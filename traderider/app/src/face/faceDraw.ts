/**
 * Pixel-art status-bar portrait (24×24 grid), drawn procedurally — own artwork, no copied assets.
 * Three themes, one per mode:
 *  - rider:    NVDA Rider's cream and ink look; a train driver in a striped engineer cap, NVDA-green scarf.
 *  - akademin: Akademin's navy/gold pixel look; the dark-haired rider from the hero (navy bomber collar, gold chevron),
 *              gold bezel like the ship's orb pod.
 *  - raket:    Raket's teal glass look; a Shiba Inu cosmonaut (Laika homage) in a glass helmet — see faceShiba.ts.
 */
import type { Expr } from './faceLogic'
import { drawShiba } from './faceShiba'

export type FaceThemeId = 'rider' | 'akademin' | 'raket'

type Pal = {
  bg: string; bg2: string; frame: string; frameHi: string; alarm: string
  outline: string; skin: string; skinSh: string; hair: string
  eyeW: string; pupil: string; mouth: string; mouthIn: string; teeth: string
  cloth: string; cloth2: string; accent: string
  bruise: string; sweat: string; plaster: string; flash: string; spark: string
}

export const FACE_THEMES: Record<FaceThemeId, Pal> = {
  rider: {
    bg: '#f3ede2', bg2: '#e6dccb', frame: '#1c1915', frameHi: '#76b900', alarm: '#9a3b2a',
    outline: '#1c1915', skin: '#f0c9a0', skinSh: '#d39c72', hair: '#4a453d',
    eyeW: '#fbf8f1', pupil: '#1c1915', mouth: '#1c1915', mouthIn: '#7a2e22', teeth: '#fbf8f1',
    cloth: '#35506e', cloth2: '#e9e4d6', accent: '#76b900',
    bruise: '#5a534a', sweat: '#6fb6e6', plaster: '#e8d2a8', flash: 'rgba(154,59,42,', spark: '#76b900',
  },
  akademin: {
    bg: '#1b2a45', bg2: '#22345a', frame: '#c9a04a', frameHi: '#e4c36a', alarm: '#f05252',
    outline: '#04060c', skin: '#e2b48c', skinSh: '#b27c58', hair: '#151a26',
    eyeW: '#f4efe3', pupil: '#0b0f18', mouth: '#2a1512', mouthIn: '#7a2f2f', teeth: '#f4efe3',
    cloth: '#1e2f55', cloth2: '#0f1a33', accent: '#c9a04a',
    bruise: '#6a4a8a', sweat: '#7fd0ff', plaster: '#e9d8b0', flash: 'rgba(240,82,82,', spark: '#e4c36a',
  },
  raket: {
    bg: '#062227', bg2: '#0a3a40', frame: '#1fd3e6', frameHi: '#5ff3ff', alarm: '#ff5d73',
    outline: '#03161a', skin: '#e8c2a0', skinSh: '#b98a68', hair: '#23242e',
    eyeW: '#f2fbfc', pupil: '#03161a', mouth: '#2a1512', mouthIn: '#7a2f2f', teeth: '#f2fbfc',
    cloth: '#0f4d55', cloth2: '#0a3a40', accent: '#ff9f43',
    bruise: '#7b5a8e', sweat: '#9ff6ff', plaster: '#e9d8b0', flash: 'rgba(255,93,115,', spark: '#5ff3ff',
  },
}

const HEAD_ROWS: [number, number, number][] = [
  // [row, fromCol, toCol]
  [5, 8, 15], [6, 7, 16], [7, 6, 17], [8, 6, 17], [9, 6, 17], [10, 6, 17], [11, 6, 17], [12, 6, 17],
  [13, 6, 17], [14, 6, 17], [15, 6, 17], [16, 7, 16], [17, 7, 16], [18, 8, 15],
]

export function drawFace(ctx: CanvasRenderingContext2D, theme: FaceThemeId, e: Expr, t: number, size: number) {
  if (theme === 'raket') {
    drawShiba(ctx, e, t, size)
    return
  }
  const P = FACE_THEMES[theme]
  const s = size / 24
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.ceil(w * s), Math.ceil(h * s))
  }
  ctx.save()
  ctx.imageSmoothingEnabled = false
  // background + frame
  px(0, 0, P.bg, 24, 24)
  for (let y = 1; y < 23; y += 2) px(1, y, P.bg2, 22, 1)
  if ((theme as FaceThemeId) === 'raket') {
    // glass rim + inner glow
    px(1, 1, P.bg2, 22, 22)
  }
  // shoulders / clothing
  if (theme === 'rider') {
    px(3, 20, P.cloth, 18, 4)
    for (let x = 4; x < 20; x += 2) px(x, 20, P.cloth2, 1, 4) // hickory stripes (overalls)
    px(8, 19, P.accent, 8, 2) // NVDA-green scarf
    px(10, 21, P.accent, 3, 1)
  } else if (theme === 'akademin') {
    px(2, 20, P.cloth, 20, 4)
    px(9, 19, P.cloth2, 6, 2) // collar
    px(4, 21, P.accent, 2, 1); px(5, 22, P.accent, 2, 1); px(3, 22, P.accent, 1, 1) // gold chevron
    px(18, 21, P.accent, 1, 1)
  } else {
    px(2, 20, P.cloth, 20, 4)
    px(3, 21, P.accent, 3, 2) // orange suit tab
    px(18, 21, P.frameHi, 2, 1)
  }
  // neck
  px(10, 18, P.skinSh, 4, 2)
  // head outline + skin
  for (const [r, a, b] of HEAD_ROWS) {
    px(a - 1, r, P.outline)
    px(b + 1, r, P.outline)
    px(a, r, P.skin, b - a + 1, 1)
  }
  px(8, 4, P.outline, 8, 1)
  px(8, 19, P.outline, 8, 1)
  // ears
  px(5, 11, P.skinSh, 1, 3); px(18, 11, P.skinSh, 1, 3)
  // jaw shade
  px(7, 17, P.skinSh, 1, 1); px(16, 17, P.skinSh, 1, 1)

  // headgear
  const askew = e.tier >= 3 ? 1 : 0
  if (theme === 'rider') {
    // striped engineer cap
    px(6 + askew, 3, P.cloth, 12, 5)
    for (let x = 6 + askew; x < 18 + askew; x += 2) px(x, 3, P.cloth2, 1, 5)
    px(5 + askew, 8, P.outline, 11, 1) // brim
    px(6 + askew, 2, P.outline, 12, 1)
    if (e.tier >= 4) px(15, 4, P.bg, 2, 2) // torn patch
    px(6, 9, P.hair, 1, 2); px(17, 9, P.hair, 1, 2)
  } else if (theme === 'akademin') {
    // dark swept hair (like the hero): volume on top, fringe to the right
    px(6, 3, P.hair, 12, 5)
    px(5, 5, P.hair, 1, 5); px(18, 5, P.hair, 1, 4)
    px(7, 8, P.hair, 7, 1); px(13, 9, P.hair, 4, 1); px(15, 10, P.hair, 2, 1)
    px(9, 2, P.hair, 6, 1)
    px(10, 4, '#2a3246', 4, 1) // sheen
    if (e.tier >= 3) { px(4, 4, P.hair, 1, 1); px(19, 3, P.hair, 1, 1); px(12, 1, P.hair, 1, 1) } // messy
  } else {
    // legacy (unused: raket now drawn by faceShiba.ts)
    px(7, 4, P.hair, 10, 3)
    px(6, 7, P.hair, 1, 2); px(17, 7, P.hair, 1, 2)
  }

  // brows
  const brow = (y0: number) => {
    const L = [8, 9, 10]
    const R = [15, 14, 13]
    let off: [number, number, number] = [0, 0, 0] // outer → inner
    if (e.brows === 'worried') off = [0, 0, -1]
    else if (e.brows === 'angry') off = [-1, 0, 1]
    else if (e.brows === 'raised') off = [-1, -1, -1]
    else if (e.brows === 'low') off = [1, 1, 1]
    for (let k = 0; k < 3; k++) {
      px(L[k], y0 + off[k], P.hair)
      px(R[k], y0 + off[k], P.hair)
    }
  }
  brow(9)

  // eyes
  const eye = (cx: number) => {
    const look = e.look
    if (e.eyes === 'blink') { px(cx - 1, 12, P.outline, 3, 1); return }
    if (e.eyes === 'happy') { px(cx - 1, 12, P.outline); px(cx, 11, P.outline); px(cx + 1, 12, P.outline); return }
    if (e.eyes === 'squeeze') {
      if (cx < 12) { px(cx - 1, 11, P.outline); px(cx, 12, P.outline); px(cx - 1, 13, P.outline) }
      else { px(cx + 1, 11, P.outline); px(cx, 12, P.outline); px(cx + 1, 13, P.outline) }
      return
    }
    if (e.eyes === 'wide') {
      px(cx - 1, 10, P.eyeW, 3, 3)
      px(cx + look, 11, P.pupil, 1, 1)
      return
    }
    px(cx - 1, 11, P.eyeW, 3, 2)
    px(cx + look, 11, P.pupil, 1, 2)
    if (e.eyes === 'droop') px(cx - 1, 11, P.skinSh, 3, 1) // heavy lids
  }
  eye(9)
  eye(14)

  // nose
  px(11, 14, P.skinSh, 2, 1)
  px(12, 13, P.skinSh, 1, 1)

  // mouth
  const M = P.mouth
  switch (e.mouth) {
    case 'neutral': px(10, 16, M, 4, 1); break
    case 'tight': px(10, 16, M, 4, 1); px(9, 16, P.skinSh); px(14, 16, P.skinSh); break
    case 'smile': px(10, 16, M, 4, 1); px(9, 15, M); px(14, 15, M); break
    case 'grin': px(9, 15, M, 6, 1); px(9, 16, M); px(14, 16, M); px(10, 16, P.teeth, 4, 1); px(10, 17, M, 4, 1); break
    case 'frown': px(10, 16, M, 4, 1); px(9, 17, M); px(14, 17, M); break
    case 'grimace':
      px(9, 15, M, 6, 1); px(9, 17, M, 6, 1); px(9, 16, P.teeth, 6, 1); px(11, 16, M); px(13, 16, M); break
    case 'open': px(10, 15, M, 4, 3); px(11, 16, P.mouthIn, 2, 1); break
    case 'rueful': px(10, 16, M, 3, 1); px(13, 15, M); px(9, 17, M); break
    case 'wobbly': px(9, 17, M); px(10, 16, M); px(11, 17, M); px(12, 16, M); px(13, 17, M); px(14, 16, M); break
    case 'celebrate':
      px(9, 15, M, 6, 1); px(9, 16, M, 1, 2); px(14, 16, M, 1, 2); px(10, 16, P.teeth, 4, 1); px(10, 17, P.mouthIn, 4, 1); px(10, 18, M, 4, 1); break
  }

  // damage by health tier (theme-specific: soot for the driver, bruises for the rider, raket uses faceShiba.ts)
  const tier = e.tier
  if (tier >= 1) px(7, 14, P.bruise, 1, 1)
  if (tier >= 2) { px(15, 14, P.bruise, 2, 1); px(7, 15, P.bruise, 1, 1) }
  if (tier >= 3) {
    px(13, 6, P.plaster, 3, 1); px(14, 5, P.plaster, 1, 3) // plaster cross on forehead
    px(8, 15, P.bruise, 1, 1)
  }
  if (tier >= 4) {
    // black eye (right) + second plaster
    px(13, 10, P.bruise, 1, 4); px(16, 10, P.bruise, 1, 4); px(13, 13, P.bruise, 4, 1)
    px(7, 16, P.plaster, 2, 1)
  }

  // sweat drops (animated)
  if (e.sweat > 0) {
    const drops: [number, number][] = [[5, 8], [18, 7], [17, 13]]
    for (let k = 0; k < e.sweat; k++) {
      const [x, y0] = drops[k]
      const y = y0 + (Math.floor(t / 180 + k * 2) % 4)
      px(x, y, P.sweat, 1, 2)
      px(x, y + 2, P.sweat, 1, 0.5)
    }
  }

  // glass helmet on top (raket) + cracks by tier
  if ((theme as FaceThemeId) === 'raket') {
    ctx.strokeStyle = P.frame
    ctx.lineWidth = Math.max(1, s)
    ctx.beginPath()
    ctx.arc(12 * s, 11.5 * s, 10.2 * s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(95,243,255,0.10)'
    ctx.beginPath(); ctx.arc(12 * s, 11.5 * s, 9.6 * s, 0, Math.PI * 2); ctx.fill()
    px(6, 4, 'rgba(230,255,255,0.55)', 2, 1); px(5, 5, 'rgba(230,255,255,0.55)', 1, 2) // glare
    if (tier >= 2) { px(17, 5, '#bff9ff'); px(18, 6, '#bff9ff'); px(18, 7, '#bff9ff') }
    if (tier >= 3) { px(16, 7, '#bff9ff'); px(19, 8, '#bff9ff'); px(15, 8, '#bff9ff') }
    if (tier >= 4) { px(5, 14, '#bff9ff'); px(6, 15, '#bff9ff'); px(5, 16, '#bff9ff'); px(7, 16, '#bff9ff') }
  }

  // celebration sparkles
  if (e.celebrate) {
    const on = Math.floor(t / 220) % 2 === 0
    const sp: [number, number][] = on ? [[2, 3], [20, 2], [21, 9], [2, 12]] : [[3, 6], [19, 4], [20, 12], [3, 16]]
    for (const [x, y] of sp) { px(x, y, P.spark); px(x - 1, y, P.spark, 0.6, 1); px(x + 1, y, P.spark, 0.6, 1); px(x, y - 1, P.spark, 1, 0.6); px(x, y + 1, P.spark, 1, 0.6) }
  }

  // flash on a big candle against the position
  if (e.flash > 0) {
    ctx.fillStyle = `${P.flash}${(0.45 * e.flash).toFixed(3)})`
    ctx.fillRect(0, 0, size, size)
  }

  // frame (pulses in the alarm colour for indicator warnings)
  const pulse = e.alert !== 'none' && Math.floor(t / 300) % 2 === 0
  const fc = pulse ? (e.alert === 'band' ? P.alarm : P.frameHi) : P.frame
  ctx.strokeStyle = fc
  ctx.lineWidth = Math.max(2, 1.4 * s)
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth)
  if (theme !== 'rider') {
    ctx.strokeStyle = theme === 'akademin' ? 'rgba(228,195,106,0.35)' : 'rgba(95,243,255,0.35)'
    ctx.lineWidth = 1
    ctx.strokeRect(ctx.lineWidth * 3.5, ctx.lineWidth * 3.5, size - 7, size - 7)
  }
  ctx.restore()
}
