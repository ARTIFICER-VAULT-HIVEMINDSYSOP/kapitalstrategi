/** IIFE build for the compiled builds (läge 1 NVDA Rider, läge 2 Akademin): window.TRFace. */
import { drawFace, FACE_THEMES } from './faceDraw'
import { applyOverlay, baseExpr, FACE_T, FaceDriver, healthTier } from './faceLogic'
import { mountFace } from './faceMount'

const api = { mountFace, drawFace, FaceDriver, baseExpr, applyOverlay, healthTier, FACE_T, FACE_THEMES }
;(window as unknown as { TRFace: typeof api }).TRFace = api
