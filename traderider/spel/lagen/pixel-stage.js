/**
 * 16-bit picture stage for Rabbit Hole.
 * Internal frame is 256×224, blitted with an integer nearest-neighbour scale.
 * Colour is 5 bits per channel. Sprites keep a 16-colour palette.
 * Backgrounds are 8×8 and 16×16 tiles on three parallax layers.
 * A perspective sampler spins the shaft floor. A short synthesised loop
 * plays per area. Nothing here is copied from a console game.
 */
export const STAGE_W = 256
export const STAGE_H = 224
export const STEP_SEC = 1 / 60
export const COYOTE_FRAMES = 6
export const BUFFER_FRAMES = 8
export const MASTER_VOLUME = 0.14

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export function quantizeChannel(value) {
  const n = Math.max(0, Math.min(255, Math.round(Number(value) || 0)))
  return (n >> 3) << 3
}

export function quantizeRgb(r, g, b) {
  return [quantizeChannel(r), quantizeChannel(g), quantizeChannel(b)]
}

export function bayer(x, y) {
  return BAYER[y & 3][x & 3] / 16
}

export function fitScale(viewW, viewH, dw = STAGE_W, dh = STAGE_H) {
  const w = Math.max(1, Number(viewW) || 1)
  const h = Math.max(1, Number(viewH) || 1)
  return Math.max(1, Math.floor(Math.min(w / dw, h / dh)))
}

export function fixedStep(accumulator, dt, step = STEP_SEC, maxSteps = 5) {
  const quantum = step > 0 ? step : STEP_SEC
  let acc = (Number(accumulator) || 0) + Math.max(0, Number(dt) || 0)
  let steps = 0
  const cap = Math.max(1, maxSteps | 0)
  while (acc >= quantum && steps < cap) {
    acc -= quantum
    steps += 1
  }
  if (steps >= cap) acc = 0
  return { accumulator: acc, steps, step: quantum }
}

export function coyoteLeft(airFrames, limit = COYOTE_FRAMES) {
  const air = Math.max(0, Number(airFrames) || 0)
  const cap = Math.max(0, limit | 0)
  return Math.max(0, cap - air)
}

export function rememberInput(intent, frame, window = BUFFER_FRAMES) {
  if (!intent) return null
  return { intent, until: (frame | 0) + (window | 0) }
}

export function readBuffered(entry, frame) {
  if (!entry || !entry.intent) return null
  if ((frame | 0) > entry.until) return null
  return entry.intent
}

export function animFrame(time, fps, count, reduced = false) {
  const n = Math.max(1, count | 0)
  if (reduced) return 0
  const f = Math.floor(Math.max(0, Number(time) || 0) * (fps > 0 ? fps : 1))
  return ((f % n) + n) % n
}

export function paletteCycle(time, count, reduced = false) {
  return animFrame(time, 6, count, reduced)
}

export function mode7Uv(sx, sy, width, height, angle, scroll, horizon) {
  const dist = sy - horizon
  if (dist <= 0) return null
  const z = 28 / dist
  const x = (sx - width / 2) * z
  const y = (Number(scroll) || 0) + z * 12
  const c = Math.cos(angle || 0)
  const s = Math.sin(angle || 0)
  return {
    u: Math.floor(x * c - y * s),
    v: Math.floor(x * s + y * c),
  }
}

export function channelsAre15bit(buf) {
  const d = buf?.data
  if (!d) return false
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue
    if (d[i] & 7 || d[i + 1] & 7 || d[i + 2] & 7) return false
  }
  return true
}

export function createBuffer(w = STAGE_W, h = STAGE_H) {
  return { w, h, data: new Uint8ClampedArray(w * h * 4), clip: null }
}

function put(buf, x, y, rgb) {
  x |= 0
  y |= 0
  if (x < 0 || y < 0 || x >= buf.w || y >= buf.h || !rgb) return
  const clip = buf.clip
  if (clip && (x < clip.x || y < clip.y || x >= clip.x + clip.w || y >= clip.y + clip.h)) return
  const i = (y * buf.w + x) * 4
  buf.data[i] = rgb[0] & 248
  buf.data[i + 1] = rgb[1] & 248
  buf.data[i + 2] = rgb[2] & 248
  buf.data[i + 3] = 255
}

function fill(buf, rgb) {
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) put(buf, x, y, rgb)
  }
}

export const RABBIT_PALETTE = [
  null,
  [0, 0, 0],
  [248, 248, 248],
  [200, 192, 208],
  [240, 144, 176],
  [232, 72, 120],
  [248, 176, 184],
  [224, 32, 48],
  [32, 24, 40],
  [248, 248, 224],
  [192, 112, 48],
  [248, 232, 200],
  [48, 40, 40],
  [240, 128, 32],
  [48, 160, 64],
  [88, 184, 64],
]

export const MEADOW_PALETTE = [
  null,
  [24, 16, 32],
  [248, 248, 248],
  [192, 208, 224],
  [72, 128, 72],
  [40, 88, 48],
  [88, 184, 64],
  [40, 120, 48],
  [24, 80, 32],
  [160, 96, 48],
  [104, 64, 32],
  [16, 8, 24],
  [240, 64, 144],
  [64, 208, 200],
  [248, 208, 72],
  [48, 160, 72],
]

export const TUNNEL_PALETTE = [
  null,
  [16, 8, 24],
  [32, 16, 40],
  [56, 32, 56],
  [88, 48, 72],
  [136, 80, 104],
  [240, 64, 144],
  [64, 208, 200],
  [248, 208, 72],
  [24, 16, 32],
  [48, 24, 48],
  [248, 248, 248],
  [200, 192, 208],
  [104, 64, 80],
  [72, 144, 160],
  [16, 8, 32],
]

const SKY = [
  [88, 152, 216],
  [96, 168, 224],
  [112, 184, 232],
  [136, 200, 232],
  [160, 216, 232],
  [184, 224, 224],
  [200, 232, 216],
  [216, 240, 208],
  [208, 232, 176],
  [176, 216, 128],
  [144, 200, 104],
  [120, 184, 88],
]

const SHAFT = [
  [40, 16, 48],
  [32, 16, 40],
  [24, 8, 32],
  [16, 8, 24],
  [16, 8, 32],
  [8, 8, 24],
  [8, 0, 16],
  [0, 0, 8],
]

const WATER = [
  [32, 96, 160],
  [40, 144, 192],
  [72, 184, 208],
  [144, 216, 224],
]

const GLOW = [
  [240, 64, 144],
  [248, 112, 176],
  [64, 208, 200],
  [136, 232, 224],
]

function emptyGrid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0))
}

function stamp(grid, ox, oy, rows, map) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const id = map[row[x]]
      if (!id) continue
      const px = ox + x
      const py = oy + y
      if (py < 0 || px < 0 || py >= grid.length || px >= grid[0].length) continue
      grid[py][px] = id
    }
  }
}

function gridSprite(grid) {
  const h = grid.length
  const w = grid[0].length
  const cells = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) cells[y * w + x] = grid[y][x]
  }
  return { w, h, cells }
}

export function paletteOf(sprite) {
  const used = new Set()
  for (const id of sprite.cells) if (id) used.add(id)
  return used.size
}

const EAR = [
  '..XX..',
  '.XPPX.',
  '.XPPX.',
  'XPPPPX',
  'XPPPPX',
  'XPPPPX',
  'XPPPPX',
  'XPPPPX',
  'XWWWWX',
  'XWWWWX',
  'XWWWWX',
  'XXXXXX',
]

const MAP = {
  X: 1,
  W: 2,
  S: 3,
  P: 4,
  N: 5,
  C: 6,
  R: 7,
  L: 8,
  H: 9,
  B: 10,
  I: 11,
  T: 12,
  O: 13,
  G: 14,
  '.': 0,
}

function earAt(grid, x, y, lean) {
  stamp(grid, x + lean, y, EAR, MAP)
}

function face(grid, x, y, eating) {
  stamp(grid, x, y, [
    'XXXXXXXXXXXXXX',
    'XWWWWWWWWWWWWX',
    'XWRRRRRRRRRRWX',
    'XWRLLHRLHRLLWX',
    'XWRLLLRLRLLLWX',
    'XWRRRRRRRRRRWX',
    'XWWWWCCWWCCWWX',
    'XWWWWWWNWWWWWX',
    eating ? 'XWWWWOOOOWWWWX' : 'XWWWWWXXWWWWWX',
    'XWWWWWWWWWWWWX',
    'XSSWWWWWWWWSSX',
    'XXXXXXXXXXXXXX',
  ], MAP)
}

function battery(grid, x, y) {
  stamp(grid, x, y, [
    'XXXXXXXX',
    'XIBBBBIX',
    'XIBBBBIX',
    'XIBTBBIX',
    'XIBBBBIX',
    'XXXXXXXX',
    '....XX..',
  ], MAP)
}

export function rabbitSheet(pose = 'stand', frame = 0, eating = false) {
  const grid = emptyGrid(32, 46)
  const f = frame & 3
  const bob = pose === 'fall' ? (f === 1 || f === 3 ? 1 : 0) : f === 1 ? 1 : 0
  const step = f === 2 ? -1 : f === 3 ? 1 : 0
  const tall = pose === 'stretch' ? -2 : 0
  const squat = pose === 'squash' ? 3 : 0
  if (pose === 'fall') {
    stamp(grid, 6, 2, ['XXXX..XXXX', 'XWWX..XWWX', 'XXXX..XXXX'], MAP)
    stamp(grid, 10, 6 + bob, ['XXXXXX', 'XWWWWX', 'XWWWWX', 'XXXXXX'], MAP)
    stamp(grid, 8, 8, ['XX....XX', 'XWX..XWX', 'XWWXXWWX'], MAP)
    earAt(grid, 6, 12 + bob, f === 2 ? -1 : 0)
    earAt(grid, 18, 12 + bob, f === 3 ? 1 : 0)
    face(grid, 8, 24 + bob, eating)
    battery(grid, 22, 30 + bob)
    stamp(grid, 4, 36, ['XXXX', 'XWWX', 'XXXX'], MAP)
    stamp(grid, 22, 34 + (f & 1), ['XXXX', 'XWWX', 'XXXX'], MAP)
  } else {
    earAt(grid, 8, 0 + bob + tall, f === 2 ? -1 : 0)
    earAt(grid, 18, 0 + bob + tall, f === 3 ? 1 : 0)
    face(grid, 9, 12 + bob + tall, eating)
    stamp(grid, 8, 24 + bob + squat, [
      'XXXXXXXXXXXXXX',
      'XWWWWWWWWWWWWX',
      'XWWWWWWWWWWWWX',
      'XWWWSSSSSSWWWX',
      'XWWWWWWWWWWWWX',
      'XXXXXXXXXXXXXX',
    ], MAP)
    stamp(grid, 2, 26 + bob, ['XXXX', 'XWWX', 'XWWX', 'XXXX'], MAP)
    stamp(grid, 24, 26 + bob, ['XXXX', 'XWWX', 'XXXX'], MAP)
    battery(grid, 23, 28 + bob)
    const foot = squat ? 40 : 38 + tall
    stamp(grid, 8 + step, foot, ['XXXXXX', 'XWWWWX', 'XXXXXX'], MAP)
    stamp(grid, 18 - step, foot, ['XXXXXX', 'XWWWWX', 'XXXXXX'], MAP)
    stamp(grid, 20, 22 + bob, ['XXX', 'XWX', 'XXX'], MAP)
  }
  return gridSprite(grid)
}

const CARROT = gridSpriteFrom([
  '....GG....',
  '...G.G.G..',
  '....GG....',
  '...XXXX...',
  '..XOOOOX..',
  '..XOXOOX..',
  '...XOOX...',
  '...XOXOX..',
  '....XOX...',
  '....XXX...',
], { X: 1, O: 2, G: 3, '.': 0 })

const CHILI = gridSpriteFrom([
  '...GG.....',
  '..XXXX....',
  '.XRRRRX...',
  'XRRHRRRX..',
  'XRRRRRRX..',
  '.XRRRRX...',
  '..XRRX....',
  '...XX.....',
], { X: 1, R: 2, H: 3, G: 4, '.': 0 })

function gridSpriteFrom(rows, map) {
  const grid = emptyGrid(rows[0].length, rows.length)
  stamp(grid, 0, 0, rows, map)
  return gridSprite(grid)
}

export const CARROT_PALETTE = [null, [24, 16, 32], [240, 128, 32], [48, 160, 64], [200, 80, 16]]
export const CHILI_PALETTE = [null, [24, 16, 32], [208, 32, 40], [248, 144, 128], [48, 160, 64]]

const GRASS = gridSpriteFrom([
  'GGGGGGGGGGGGGGGG',
  'GDGDGDGDGDGDGDGD',
  'GGGGGGGGGGGGGGGG',
  'DGGDGGDGGDGGDGGG',
  'DDDDDDDDDDDDDDDD',
  'DSDDSDDSDDSDDSDD',
  'DDDDDDDDDDDDDDDD',
  'SDDSDDSDDSDDSDDS',
  'DDDDDDDDDDDDDDDD',
  'DSDDSDDSDDSDDSDD',
  'DDDDDDDDDDDDDDDD',
  'SDDSDDSDDSDDSDDS',
  'DDDDDDDDDDDDDDDD',
  'DSDDSDDSDDSDDSDD',
  'DDDDDDDDDDDDDDDD',
  'SDDSDDSDDSDDSDDS',
], { G: 1, D: 2, S: 3, '.': 0 })

const BRICK = gridSpriteFrom([
  'BBBBBBBBMMMMBBBB',
  'BLLLLBBBMMMMBLLL',
  'BBBBBBBBMMMMBBBB',
  'MMMMMMMMMMMMMMMM',
  'BBMMBBBBBBBBMMBB',
  'BLMMBLLLLLLLMMBL',
  'BBMMBBBBBBBBMMBB',
  'MMMMMMMMMMMMMMMM',
  'BBBBBBBBMMMMBBBB',
  'BLLLLBBBMMMMBLLL',
  'BBBBBBBBMMMMBBBB',
  'MMMMMMMMMMMMMMMM',
  'BBMMBBBBBBBBMMBB',
  'BLMMBLLLLLLLMMBL',
  'BBMMBBBBBBBBMMBB',
  'MMMMMMMMMMMMMMMM',
], { B: 1, L: 2, M: 3, '.': 0 })

const TILE_PAL_GRASS = [null, [88, 184, 64], [40, 120, 48], [24, 80, 32]]
const TILE_PAL_BRICK = [null, [88, 48, 72], [136, 80, 104], [40, 24, 40]]

export function tilePaletteSize() {
  return {
    grass: TILE_PAL_GRASS.filter(Boolean).length,
    brick: TILE_PAL_BRICK.filter(Boolean).length,
    rabbit: RABBIT_PALETTE.filter(Boolean).length,
    carrot: CARROT_PALETTE.filter(Boolean).length,
    chili: CHILI_PALETTE.filter(Boolean).length,
  }
}

const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14],
  1: [4, 12, 4, 4, 4, 4, 14],
  2: [14, 17, 1, 6, 8, 16, 31],
  3: [30, 1, 1, 14, 1, 1, 30],
  4: [2, 6, 10, 18, 31, 2, 2],
  5: [31, 16, 30, 1, 1, 17, 14],
  6: [6, 8, 16, 30, 17, 17, 14],
  7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 0, 4, 8],
  ':': [0, 12, 12, 0, 12, 12, 0],
  '-': [0, 0, 0, 31, 0, 0, 0],
  '+': [0, 4, 4, 31, 4, 4, 0],
  '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 6, 4, 0, 4],
  '%': [19, 19, 2, 4, 8, 25, 25],
  "'": [6, 6, 4, 0, 0, 0, 0],
  '/': [1, 2, 2, 4, 8, 8, 16],
  x: [0, 17, 10, 4, 10, 17, 0],
  '×': [0, 17, 10, 4, 10, 17, 0],
}

function glyphRows(ch) {
  const base = ch.normalize ? ch.normalize('NFD') : ch
  const bare = base.replace(/[\u0308\u030a]/g, '')
  const rows = FONT[bare] || FONT[bare.toUpperCase()] || FONT[ch] || null
  return rows
}

export function textFits(text) {
  for (const ch of String(text ?? '')) {
    if (ch === ' ' || ch === '\n') continue
    if (!glyphRows(ch)) return false
  }
  return true
}

export function drawText(buf, text, x, y, rgb, scale = 1, shadow = null) {
  const s = Math.max(1, scale | 0)
  const ink = quantizeRgb(rgb[0], rgb[1], rgb[2])
  const shade = shadow ? quantizeRgb(shadow[0], shadow[1], shadow[2]) : null
  let cx = x | 0
  const src = String(text ?? '')
  if (!textFits(src)) return cx
  for (const ch of src) {
    const marks = ch.normalize ? ch.normalize('NFD') : ch
    const rows = glyphRows(ch)
    if (!rows) {
      cx += 8 * s
      continue
    }
    for (let gy = 0; gy < rows.length; gy++) {
      const bits = rows[gy]
      for (let gx = 0; gx < 5; gx++) {
        if (!(bits & (1 << (4 - gx)))) continue
        for (let sy = 0; sy < s; sy++) {
          for (let sx = 0; sx < s; sx++) {
            const px = cx + gx * s + sx
            const py = y + gy * s + sy
            if (shade) put(buf, px + s, py + s, shade)
            put(buf, px, py, ink)
          }
        }
      }
    }
    if (marks.includes('\u0308')) {
      put(buf, cx + 1 * s, y - s, ink)
      put(buf, cx + 3 * s, y - s, ink)
    }
    if (marks.includes('\u030a')) {
      for (let gx = 1; gx <= 3; gx++) put(buf, cx + gx * s, y - s, ink)
    }
    cx += 8 * s
  }
  return cx
}

function blit(buf, sprite, dx, dy, palette, sx = 1, sy = 1) {
  const px = Math.max(1, sx | 0)
  const py = Math.max(1, sy | 0)
  for (let y = 0; y < sprite.h; y++) {
    for (let x = 0; x < sprite.w; x++) {
      const id = sprite.cells[y * sprite.w + x]
      if (!id) continue
      const col = palette[id]
      if (!col) continue
      for (let oy = 0; oy < py; oy++) {
        for (let ox = 0; ox < px; ox++) put(buf, dx + x * px + ox, dy + y * py + oy, col)
      }
    }
  }
}

function tileFill(buf, sprite, palette, ox, oy, x0, y0, x1, y1) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const sx = ((x - ox) % sprite.w + sprite.w) % sprite.w
      const sy = ((y - oy) % sprite.h + sprite.h) % sprite.h
      const id = sprite.cells[sy * sprite.w + sx]
      const col = palette[id] || palette[1]
      put(buf, x, y, col)
    }
  }
}

function hdmaSky(buf, horizon, reduced, time) {
  const bands = SKY.length
  for (let y = 0; y < horizon; y++) {
    const u = y / Math.max(1, horizon - 1)
    const f = u * (bands - 1)
    const i = Math.min(bands - 1, Math.floor(f))
    const j = Math.min(bands - 1, i + 1)
    for (let x = 0; x < buf.w; x++) {
      const pick = reduced ? i : bayer(x, y + (time * 8 | 0)) > 0.55 ? j : i
      put(buf, x, y, SKY[pick])
    }
  }
}

function hdmaShaft(buf, y0, y1) {
  const bands = SHAFT.length
  const span = Math.max(1, y1 - y0)
  for (let y = y0; y < y1; y++) {
    const i = Math.min(bands - 1, Math.floor(((y - y0) / span) * bands))
    for (let x = 0; x < buf.w; x++) {
      const alt = SHAFT[Math.min(bands - 1, i + (bayer(x, y) > 0.7 ? 1 : 0))]
      put(buf, x, y, bayer(x, y) > 0.82 ? alt : SHAFT[i])
    }
  }
}

function cloud(buf, cx, cy, reduced, time) {
  const bob = reduced ? 0 : (time * 10 | 0) & 1
  const body = [248, 248, 248]
  const shade = [192, 208, 224]
  const edge = [24, 16, 32]
  for (let y = -6; y <= 5; y++) {
    for (let x = -14; x <= 14; x++) {
      const e = (x * x) / 196 + (y * y) / 36
      if (e > 1) continue
      const px = cx + x
      const py = cy + y + bob
      put(buf, px, py, e > 0.72 ? shade : body)
    }
  }
  for (let y = -7; y <= 6; y++) {
    for (let x = -15; x <= 15; x++) {
      const e = (x * x) / 225 + (y * y) / 49
      if (e > 1 || e < 0.86) continue
      put(buf, cx + x, cy + y + bob, edge)
    }
  }
}

function ringTex(u, v) {
  const x = (u & 63) - 32
  const y = (v & 63) - 32
  const d = Math.hypot(x, y)
  const ring = Math.floor(d / 5) & 1
  const spoke = Math.floor(((Math.atan2(y, x) + Math.PI) / (Math.PI / 4))) & 1
  return ring ^ spoke
}

function mode7Floor(buf, horizon, angle, scroll, glow) {
  const x0 = buf.clip ? buf.clip.x : 0
  const x1 = buf.clip ? buf.clip.x + buf.clip.w : buf.w
  const span = Math.max(1, x1 - x0)
  for (let y = horizon; y < buf.h; y++) {
    for (let x = x0; x < x1; x++) {
      const uv = mode7Uv(x - x0, y, span, buf.h, angle, scroll, horizon)
      if (!uv) continue
      const on = ringTex(uv.u, uv.v)
      const col = on ? glow : [16, 8, 24]
      if ((x + y) & 1 && bayer(x, y) > 0.6) put(buf, x, y, on ? [248, 208, 72] : [32, 16, 40])
      else put(buf, x, y, col)
    }
  }
}

function pond(buf, x, y, w, h, cycle) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const wave = (xx + cycle * 3 + (yy & 2)) & 3
      const col = WATER[(wave + cycle) & 3]
      const edge = xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1
      put(buf, x + xx, y + yy, edge ? [24, 16, 32] : col)
    }
  }
}

function hole(buf, cx, cy, rx, ry, glow) {
  for (let y = -ry - 2; y <= ry + 2; y++) {
    for (let x = -rx - 2; x <= rx + 2; x++) {
      const e = (x * x) / ((rx + 2) * (rx + 2)) + (y * y) / ((ry + 2) * (ry + 2))
      if (e > 1) continue
      const inner = (x * x) / (rx * rx) + (y * y) / (ry * ry)
      if (inner > 1) put(buf, cx + x, cy + y, glow)
      else if (inner > 0.55) put(buf, cx + x, cy + y, bayer(cx + x, cy + y) > 0.5 ? [24, 8, 32] : [8, 0, 16])
      else put(buf, cx + x, cy + y, [0, 0, 8])
    }
  }
}

function mapX(x, logicW, box) {
  const w = Math.max(1, logicW || 1)
  return (box.x + (x / w) * box.w) | 0
}

function mapY(y, logicH, box) {
  const h = Math.max(1, logicH || 1)
  return (box.y + (y / h) * box.h) | 0
}

function drawRabbitSprite(buf, x, y, pose, frame, eating, juice) {
  const sprite = rabbitSheet(pose, frame, eating)
  const sx = juice === 'wide' ? 1 : 1
  const sy = juice === 'tall' ? 1 : 1
  const ox = juice === 'wide' ? -2 : 0
  const oy = juice === 'tall' ? -6 : juice === 'wide' ? 4 : 0
  blit(buf, sprite, x - (sprite.w >> 1) + ox, y - sprite.h + oy, RABBIT_PALETTE, sx, sy)
}

function drawItems(buf, items, logicW, logicH, box) {
  for (const item of items || []) {
    const x = mapX(item.x, logicW, box)
    const y = mapY(item.y, logicH, box)
    if (item.kind === 'carrot') blit(buf, CARROT, x - 5, y - 8, CARROT_PALETTE)
    else if (item.kind === 'chili') blit(buf, CHILI, x - 5, y - 6, CHILI_PALETTE)
    else if (item.kind === 'sign') {
      for (let yy = -8; yy <= 8; yy++) {
        for (let xx = -16; xx <= 16; xx++) {
          const edge = Math.abs(xx) > 14 || Math.abs(yy) > 6
          put(buf, x + xx, y + yy, edge ? [248, 208, 72] : [24, 16, 32])
        }
      }
      drawText(buf, item.label || '', x - 12, y - 4, [248, 248, 224], 1)
    }
  }
}

function hudBar(buf, scene, box) {
  for (let y = box.y; y < box.y + 12; y++) {
    for (let x = box.x; x < box.x + box.w; x++) put(buf, x, y, y === box.y + 11 ? [248, 208, 72] : [24, 16, 32])
  }
  const ink = [248, 240, 216]
  drawText(buf, scene.hud || '', box.x + 2, box.y + 2, ink, 1)
}

function drawMeadow(buf, scene, box) {
  const logicH = scene.logicH || 600
  const logicW = scene.logicW || 800
  const ground = mapY(scene.groundY || logicH * 0.7, logicH, box)
  const time = scene.time || 0
  const reduced = !!scene.reduced
  hdmaSky(buf, Math.max(box.y + 8, ground), reduced, time)
  const drift = reduced ? 0 : Math.floor(time * 6)
  cloud(buf, box.x + ((40 - drift) % (box.w + 40) + box.w + 40) % (box.w + 40) - 10, box.y + 28, reduced, time)
  cloud(buf, box.x + ((150 - Math.floor(drift * 0.6)) % (box.w + 30) + box.w + 30) % (box.w + 30), box.y + 46, reduced, time)
  const hill = [72, 128, 72]
  const hillDark = [40, 88, 48]
  for (let x = box.x; x < box.x + box.w; x++) {
    const shift = reduced ? 0 : Math.floor(time * 10)
    const n = 18 + (((x + shift) & 31) < 16 ? ((x + shift) & 15) : 16 - ((x + shift) & 15))
    for (let y = ground - n; y < ground; y++) put(buf, x, y, y > ground - 4 ? hillDark : hill)
  }
  tileFill(buf, GRASS, TILE_PAL_GRASS, reduced ? 0 : -Math.floor(time * 18), ground, box.x, ground, box.x + box.w, box.y + box.h)
  const cycle = paletteCycle(time, 4, reduced)
  pond(buf, box.x + 8, ground + 8, 36, 14, cycle)
  const holeBox = scene.hole || { x: logicW / 2, y: (scene.groundY || logicH * 0.7) + 16, rx: 70, ry: 22 }
  const hx = mapX(holeBox.x, logicW, box)
  const hy = mapY(holeBox.y, logicH, box)
  const glow = GLOW[cycle]
  hole(buf, hx, hy, Math.max(10, (holeBox.rx / logicW) * box.w * 0.5), Math.max(4, (holeBox.ry / logicH) * box.h * 0.9), glow)
  if (!reduced && scene.phase === 'jump') {
    const spin = (scene.jump || 0) * 2.4
    const prev = buf.clip
    buf.clip = { x: hx - 28, y: hy - 10, w: 56, h: 28 }
    mode7Floor(buf, hy - 8, spin, (scene.time || 0) * 40, glow)
    buf.clip = prev
  }
  const labels = scene.labels || {}
  const lanes = scene.lanes || {}
  for (const [key, color] of [['sell', [240, 64, 144]], ['flat', [248, 208, 72]], ['buy', [64, 208, 200]]]) {
    const lx = mapX(lanes[key] ?? (key === 'sell' ? logicW * 0.25 : key === 'buy' ? logicW * 0.75 : logicW * 0.5), logicW, box)
    for (let y = ground + 2; y < box.y + box.h; y += 3) put(buf, lx, y, color)
    const word = labels[key] || key
    drawText(buf, word, lx - word.length * 4, Math.min(box.y + box.h - 10, ground + 16), color, 1, [24, 16, 32])
  }
  if (scene.showRabbit !== false) {
    const stand = scene.stand || { x: logicW / 2, y: scene.groundY || logicH * 0.7 }
    const rx = mapX(stand.x, logicW, box)
    const ry = mapY(stand.y, logicH, box)
    const pose = scene.rabbitPose || 'stand'
    drawRabbitSprite(buf, rx, ry, pose === 'fall' ? 'stand' : pose, scene.frame | 0, !!scene.eating, scene.juice)
  }
  if (scene.phase === 'home') {
    const title = labels.title || 'RABBIT HOLE'
    drawText(buf, title, box.x + Math.max(4, (box.w - title.length * 16) >> 1), box.y + 4, [248, 248, 248], 2, [24, 16, 32])
    const blink = reduced || Math.floor(time * 2) % 2 === 0
    if (blink) {
      const press = labels.press || 'PRESS START'
      drawText(buf, press, box.x + Math.max(4, (box.w - press.length * 8) >> 1), box.y + box.h - 16, [248, 208, 72], 1, [24, 16, 32])
    }
  }
}

function drawShaft(buf, scene, rider, box) {
  const logicW = rider.logicW || scene.logicW || 800
  const logicH = rider.logicH || scene.logicH || 600
  const time = scene.time || 0
  const reduced = !!scene.reduced
  hdmaShaft(buf, box.y, box.y + box.h)
  const scroll = reduced ? 0 : Math.floor(rider.scroll || 0)
  const far = reduced ? 0 : Math.floor(scroll * 0.18)
  for (let i = 0; i < 10; i++) {
    const x = box.x + ((i * 28 - far) % box.w + box.w) % box.w
    const y = box.y + 16 + (i % 4) * 8
    for (let yy = 0; yy < 3; yy++) {
      for (let xx = 0; xx < 6; xx++) put(buf, x + xx, y + yy, xx === 0 || yy === 0 ? [8, 0, 16] : [40, 16, 48])
    }
  }
  tileFill(buf, BRICK, TILE_PAL_BRICK, 0, box.y + Math.floor(scroll * 0.55), box.x, box.y + 12, box.x + box.w, box.y + box.h)
  const walls = rider.walls || {}
  const sell = mapX(walls.sell ?? logicW * 0.28, logicW, box)
  const buy = mapX(walls.buy ?? logicW * 0.72, logicW, box)
  for (let y = box.y + 12; y < box.y + box.h; y++) {
    const depth = (y - (box.y + 40)) / Math.max(1, box.h)
    const pinch = Math.max(0, 1 - depth) 
    const l = (sell + (box.x + box.w / 2 - sell) * pinch * 0.35) | 0
    const r = (buy + (box.x + box.w / 2 - buy) * pinch * 0.35) | 0
    for (let x = box.x; x < l; x++) put(buf, x, y, bayer(x, y) > 0.5 ? [8, 0, 16] : [16, 8, 24])
    for (let x = r; x < box.x + box.w; x++) put(buf, x, y, bayer(x, y) > 0.5 ? [8, 0, 16] : [16, 8, 24])
    put(buf, l, y, [240, 64, 144])
    put(buf, l + 1, y, [248, 144, 176])
    put(buf, r, y, [64, 208, 200])
    put(buf, r - 1, y, [144, 232, 224])
  }
  const glow = GLOW[paletteCycle(time, 4, reduced)]
  const angle = reduced ? 0 : (rider.spin || 0) * 0.65 + (rider.roll || 0)
  const prev = buf.clip
  buf.clip = box
  mode7Floor(buf, box.y + Math.round(box.h * 0.42), angle, reduced ? 0 : (rider.scroll || 0) * 0.5, glow)
  buf.clip = prev
  const back = []
  const front = []
  for (const item of rider.items || []) (item.front ? front : back).push(item)
  drawItems(buf, back, logicW, logicH, box)
  const rx = mapX(rider.x, logicW, box) + (reduced ? 0 : Math.round((rider.pan || 0) / logicW * box.w))
  const ry = mapY(rider.rabbitY, logicH, box)
  drawRabbitSprite(buf, rx, ry, 'fall', scene.frame | 0, !!rider.eating, rider.juice)
  if (Number.isFinite(rider.priceX)) {
    const px = mapX(rider.priceX, logicW, box)
    const py = ry - 16
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        if (Math.abs(x) + Math.abs(y) > 3) continue
        put(buf, px + x, py + y, Math.abs(x) + Math.abs(y) > 2 ? [24, 16, 32] : rider.region === 'hole' ? [248, 208, 72] : [248, 248, 248])
      }
    }
  }
  drawItems(buf, front, logicW, logicH, box)
  const labels = scene.labels || {}
  drawText(buf, labels.sell || '', sell - 16, box.y + 16, [240, 64, 144], 1, [24, 16, 32])
  drawText(buf, labels.buy || '', buy - 12, box.y + 16, [64, 208, 200], 1, [24, 16, 32])
  drawText(buf, labels.tunnel || '', (sell + buy) / 2 - 20, box.y + 28, [248, 240, 216], 1, [24, 16, 32])
  if (rider.floater && rider.floater.life > 0) {
    const fx = mapX(rider.floater.x, logicW, box)
    const fy = mapY(rider.floater.y, logicH, box)
    drawText(buf, labels.hp || '+HP', fx, fy, [248, 208, 72], 1, [24, 16, 32])
  }
  const hp = rider.hp | 0
  for (let i = 0; i < 8; i++) blit(buf, CARROT, box.x + box.w - 12 - (8 - i) * 8, box.y + 16, i < hp ? CARROT_PALETTE : [null, [40, 32, 40], [40, 32, 40], [40, 32, 40]])
  for (const bit of rider.bits || []) {
    const bx = mapX(bit.x, logicW, box)
    const by = mapY(bit.y, logicH, box)
    put(buf, bx, by, bit.color || [248, 208, 72])
    put(buf, bx + 1, by, [248, 248, 248])
  }
  if (rider.flash) {
    for (let y = box.y; y < box.y + box.h; y += 2) {
      for (let x = box.x; x < box.x + box.w; x += 2) put(buf, x, y, [248, 248, 248])
    }
  }
}

function drawPause(buf, scene) {
  const w = 148
  const h = 64
  const x = (buf.w - w) >> 1
  const y = (buf.h - h) >> 1
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const edge = xx < 3 || yy < 3 || xx >= w - 3 || yy >= h - 3
      put(buf, x + xx, y + yy, edge ? [248, 208, 72] : [24, 16, 32])
    }
  }
  const labels = scene.labels || {}
  drawText(buf, labels.pause || 'PAUSE', x + 46, y + 10, [248, 240, 216], 1)
  drawText(buf, labels.resume || 'OK', x + 16, y + 28, [248, 208, 72], 1)
  drawText(buf, labels.sound || '', x + 16, y + 42, [64, 208, 200], 1)
}

export function renderScene(buf, scene = {}) {
  const players = scene.players === 2 ? 2 : 1
  const boxes = players === 2
    ? [{ x: 0, y: 0, w: (buf.w / 2) | 0, h: buf.h }, { x: (buf.w / 2) | 0, y: 0, w: buf.w - ((buf.w / 2) | 0), h: buf.h }]
    : [{ x: 0, y: 0, w: buf.w, h: buf.h }]
  fill(buf, [8, 0, 16])
  if (scene.phase === 'race') {
    boxes.forEach((box, i) => {
      buf.clip = box
      drawShaft(buf, scene, (scene.riders || [])[i] || {}, box)
      buf.clip = null
    })
    if (players === 2) {
      const mid = (buf.w / 2) | 0
      for (let y = 0; y < buf.h; y++) {
        put(buf, mid, y, [248, 240, 216])
        put(buf, mid - 1, y, [24, 16, 32])
      }
    }
    hudBar(buf, scene, { x: 0, y: 0, w: buf.w, h: buf.h })
  } else {
    buf.clip = boxes[0]
    drawMeadow(buf, scene, boxes[0])
    buf.clip = null
  }
  if (scene.paused) drawPause(buf, scene)
  const mag = scene.reduced ? 0 : scene.shake | 0
  if (mag) {
    const ox = ((scene.time * 60) | 0) & 1 ? mag : -mag
    const copy = buf.data.slice(0)
    buf.data.fill(0)
    for (let y = 0; y < buf.h; y++) {
      const sy = y + ((ox > 0) ? 0 : 0)
      for (let x = 0; x < buf.w; x++) {
        const src = x - ox
        if (src < 0 || src >= buf.w || sy < 0 || sy >= buf.h) continue
        const s = (sy * buf.w + src) * 4
        const d = (y * buf.w + x) * 4
        buf.data[d] = copy[s]
        buf.data[d + 1] = copy[s + 1]
        buf.data[d + 2] = copy[s + 2]
        buf.data[d + 3] = copy[s + 3]
      }
    }
  }
  return buf
}

export function createStage() {
  let internal = null
  return {
    buffer: createBuffer(),
    flush(display, viewW, viewH, reduced = false) {
      if (typeof document === 'undefined' || !display) return { scale: 1, w: STAGE_W, h: STAGE_H }
      if (!internal) {
        internal = document.createElement('canvas')
        internal.width = STAGE_W
        internal.height = STAGE_H
      }
      const ictx = internal.getContext('2d')
      if (ictx && typeof ictx.createImageData === 'function') {
        const img = ictx.createImageData(STAGE_W, STAGE_H)
        img.data.set(this.buffer.data)
        ictx.putImageData(img, 0, 0)
      }
      const scale = fitScale(viewW || display.parentElement?.clientWidth || 800, viewH || display.parentElement?.clientHeight || 600)
      const dw = STAGE_W * scale
      const dh = STAGE_H * scale
      if (display.width !== dw) display.width = dw
      if (display.height !== dh) display.height = dh
      display.style.width = `${dw}px`
      display.style.height = `${dh}px`
      const ctx = display.getContext('2d')
      if (!ctx) return { scale, w: dw, h: dh }
      ctx.imageSmoothingEnabled = false
      if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'low'
      ctx.fillStyle = '#100810'
      ctx.fillRect(0, 0, dw, dh)
      if (internal) ctx.drawImage(internal, 0, 0, dw, dh)
      return { scale, w: dw, h: dh, reduced: !!reduced }
    },
  }
}

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

const SONGS = {
  meadow: {
    bpm: 112,
    lead: [72, 0, 76, 79, 76, 74, 72, 0, 79, 81, 79, 76, 74, 72, 67, 0],
    bass: [48, 0, 0, 48, 43, 0, 0, 43, 41, 0, 0, 41, 43, 0, 48, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  },
  fall: {
    bpm: 132,
    lead: [69, 0, 72, 76, 72, 69, 67, 65, 64, 0, 67, 72, 76, 72, 69, 0],
    bass: [45, 0, 45, 0, 41, 0, 43, 0, 45, 0, 40, 0, 41, 0, 45, 0],
    hat: [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
  },
}

export function createChiptune() {
  let ctx = null
  let master = null
  let muted = false
  let area = 'meadow'
  let step = 0
  let nextAt = 0
  let noise = null

  function ac() {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext
    if (typeof AC !== 'function') return null
    try {
      if (!ctx) {
        ctx = new AC()
        master = ctx.createGain()
        master.gain.value = muted ? 0 : MASTER_VOLUME
        master.connect(ctx.destination)
      }
      return ctx
    } catch {
      return null
    }
  }

  function tone(freq, when, dur, type, vol) {
    const a = ac()
    if (!a || muted || !freq || !master) return
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, when)
    g.gain.setValueAtTime(vol, when)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    o.connect(g)
    g.connect(master)
    o.start(when)
    o.stop(when + dur + 0.02)
  }

  function hat(when) {
    const a = ac()
    if (!a || muted || !master) return
    if (!noise) {
      const len = Math.floor(a.sampleRate * 0.04)
      noise = a.createBuffer(1, len, a.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    }
    const src = a.createBufferSource()
    src.buffer = noise
    const g = a.createGain()
    g.gain.setValueAtTime(0.05, when)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04)
    src.connect(g)
    g.connect(master)
    src.start(when)
  }

  function applyMute() {
    if (master) master.gain.value = muted ? 0 : MASTER_VOLUME
  }

  return {
    volume: MASTER_VOLUME,
    setMuted(value) {
      muted = !!value
      applyMute()
    },
    toggleMuted() {
      muted = !muted
      applyMute()
      return muted
    },
    muted() {
      return muted
    },
    resume() {
      const a = ac()
      if (a && a.state === 'suspended') a.resume().catch(() => {})
    },
    setArea(name) {
      area = name === 'fall' ? 'fall' : 'meadow'
    },
    tick() {
      const a = ac()
      if (!a || muted || !master) return
      const song = SONGS[area]
      const stepDur = 60 / song.bpm / 4
      if (!nextAt) nextAt = a.currentTime + 0.05
      let guard = 0
      while (nextAt < a.currentTime + 0.12 && guard++ < 8) {
        const i = step % song.lead.length
        if (song.lead[i]) tone(midi(song.lead[i]), nextAt, stepDur * 0.85, 'square', 0.08)
        if (song.bass[i]) tone(midi(song.bass[i]), nextAt, stepDur * 0.9, 'triangle', 0.1)
        if (song.hat[i]) hat(nextAt)
        step += 1
        nextAt += stepDur
      }
    },
    sfx(kind) {
      const a = ac()
      if (!a || muted) return
      const now = a.currentTime
      if (kind === 'jump') {
        tone(midi(60), now, 0.08, 'square', 0.1)
        tone(midi(67), now + 0.07, 0.1, 'square', 0.08)
        tone(midi(72), now + 0.14, 0.12, 'square', 0.06)
      } else if (kind === 'pickup') {
        tone(midi(76), now, 0.06, 'square', 0.08)
        tone(midi(79), now + 0.06, 0.06, 'square', 0.08)
        tone(midi(84), now + 0.12, 0.1, 'square', 0.07)
      } else if (kind === 'tp') {
        tone(midi(72), now, 0.07, 'square', 0.08)
        tone(midi(79), now + 0.08, 0.12, 'square', 0.08)
      } else if (kind === 'sl') {
        tone(midi(70), now, 0.08, 'square', 0.08)
        tone(midi(63), now + 0.08, 0.14, 'triangle', 0.09)
      } else if (kind === 'menu') {
        tone(midi(80), now, 0.05, 'square', 0.06)
      }
    },
  }
}
