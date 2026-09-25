import { useEffect, useRef } from 'react'
import type { FaceThemeId } from './faceDraw'
import type { FaceInput } from './faceLogic'
import { mountFace } from './faceMount'

/** React wrapper (läge 3). The latest input is read from a ref every frame. */
export function FacePortrait({ theme, input, size = 72, className }: { theme: FaceThemeId; input: FaceInput; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef(input)
  inputRef.current = input
  useEffect(() => {
    if (!ref.current) return
    return mountFace(ref.current, theme, () => inputRef.current, size)
  }, [theme, size])
  return <canvas ref={ref} className={className} aria-hidden="true" />
}
