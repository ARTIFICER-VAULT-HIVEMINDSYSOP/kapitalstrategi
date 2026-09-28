import { drawFace, type FaceThemeId } from './faceDraw'
import { FaceDriver, type Expr, type FaceInput, type RiskFlags } from './faceLogic'

const IDLE: FaceInput = { pnl: 0, basis: 1, side: 'flat', leverage: 1, maxLeverage: 4, closes: [1], index: 0, price: 1, phase: 'idle' }

type QaState = { key: string; tier: number; alert: string; pct: number; flags: RiskFlags | null }
declare global {
  interface Window {
    __trFaceState?: Partial<Record<FaceThemeId, QaState>>
  }
}

/** Mounts a portrait on a canvas; runs its own rAF loop. Returns an unmount function. */
export function mountFace(canvas: HTMLCanvasElement, theme: FaceThemeId, getInput: () => FaceInput | null, size = 72): () => void {
  const driver = new FaceDriver()
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(size * dpr)
  canvas.height = Math.round(size * dpr)
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  canvas.style.imageRendering = 'pixelated'
  const ctx = canvas.getContext('2d')
  let raf = 0
  let alive = true
  const loop = (now: number) => {
    if (!alive) return
    let input: FaceInput | null = null
    try {
      input = getInput()
    } catch {
      input = null
    }
    const e: Expr = driver.update(input ?? IDLE, now)
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawFace(ctx, theme, e, now, size)
    }
    const qa = (window.__trFaceState ||= {})
    qa[theme] = { key: e.key, tier: e.tier, alert: e.alert, pct: Math.round(e.pct * 100) / 100, flags: driver.flags }
    canvas.dataset.face = e.key
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return () => {
    alive = false
    cancelAnimationFrame(raf)
  }
}
