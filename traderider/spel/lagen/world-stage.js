/**
 * Lit picture stage for Rabbit Hole.
 * WebGL via the vendored three.js r186 build (MIT, local files, no CDN).
 * A canvas painter is used when WebGL is missing.
 * Trading positions stay in the caller. This file only draws and plays sound.
 */
import * as THREE from './vendor/three.module.js'

export const THREE_REVISION = THREE.REVISION
export const STEP_SEC = 1 / 60
export const COYOTE_FRAMES = 6
export const BUFFER_FRAMES = 8
export const MASTER_VOLUME = 0.16

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

export function defaultQuality(width, coarse = false) {
  if (coarse) return 'low'
  const w = Number(width) || 0
  if (w > 0 && w < 800) return 'low'
  return 'high'
}

export function easeToward(current, target, dt, reduced = false) {
  const c = Number(current) || 0
  const t = Number(target) || 0
  if (reduced) return t
  const k = 1 - Math.exp(-7 * Math.max(0, Number(dt) || 0))
  return c + (t - c) * k
}

/** Map shaft pixels to world X. Lower band is left, upper band is right. */
export function bandSpan(sell, buy, logicW) {
  const w = Math.max(1, Number(logicW) || 1)
  const toWorld = (x) => ((Number(x) || 0) / w - 0.5) * 9
  const left = toWorld(sell ?? w * 0.28)
  const right = toWorld(buy ?? w * 0.72)
  return { left: Math.min(left, right), right: Math.max(left, right) }
}

export function worldX(px, logicW) {
  const w = Math.max(1, Number(logicW) || 1)
  return ((Number(px) || w / 2) / w - 0.5) * 9
}

function readStoredQuality(width) {
  try {
    const v = globalThis.localStorage?.getItem('tr-rh-quality')
    if (v === 'low' || v === 'high') return v
  } catch {
    /* keep the size-based default */
  }
  let coarse = false
  try {
    coarse = !!globalThis.matchMedia?.('(pointer: coarse)')?.matches
  } catch {
    coarse = false
  }
  return defaultQuality(width, coarse)
}

function canvasTexture(draw, w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

function brickTexture() {
  return canvasTexture((g, w, h) => {
    g.fillStyle = '#241628'
    g.fillRect(0, 0, w, h)
    const bw = 32
    const bh = 16
    for (let y = 0; y < h; y += bh) {
      const shift = (y / bh) % 2 ? bw / 2 : 0
      for (let x = -bw; x < w + bw; x += bw) {
        g.fillStyle = (x + y) % 64 === 0 ? '#3a2444' : '#2c1a36'
        g.fillRect(x + shift + 1, y + 1, bw - 2, bh - 2)
        g.fillStyle = 'rgba(255,255,255,0.04)'
        g.fillRect(x + shift + 1, y + 1, bw - 2, 2)
      }
    }
  }, 128, 128)
}

function grassTexture() {
  return canvasTexture((g, w, h) => {
    g.fillStyle = '#2f7a3a'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 700; i++) {
      const x = (i * 47) % w
      const y = (i * 19) % h
      g.fillStyle = i % 3 ? '#3e9450' : '#246332'
      g.fillRect(x, y, 2, 5)
    }
  }, 128, 128)
}

function glowTexture() {
  return canvasTexture((g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grd.addColorStop(0, 'rgba(255,255,255,0.95)')
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
  }, 64, 64)
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.04,
    ...extra,
  })
}

function buildRabbit() {
  const g = new THREE.Group()
  g.name = 'rabbit'
  const fur = mat(0xfff7f4, { roughness: 0.48 })
  const pink = mat(0xff8eae, { roughness: 0.4 })
  const ink = mat(0x1a1220, { roughness: 0.35 })
  const glass = mat(0xb9e7ff, { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.72 })
  const red = mat(0xd3122c, { roughness: 0.32, metalness: 0.12 })
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), fur)
  body.scale.set(0.92, 1.2, 0.78)
  body.position.y = 0.52
  body.castShadow = true
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), fur)
  head.position.set(0, 1.08, 0.06)
  head.castShadow = true
  const ears = new THREE.Group()
  ears.name = 'ears'
  ears.position.set(0, 1.22, 0)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 8), fur)
    ear.position.set(side * 0.12, 0.28, 0)
    ear.rotation.z = side * -0.12
    ear.castShadow = true
    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.26, 3, 6), pink)
    inner.position.set(side * 0.12, 0.28, 0.03)
    inner.rotation.z = side * -0.12
    ears.add(ear, inner)
  }
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), ink)
  eyeL.position.set(-0.1, 1.12, 0.24)
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.1
  const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 14), red)
  lensL.position.set(-0.1, 1.12, 0.27)
  const lensR = lensL.clone()
  lensR.position.x = 0.1
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), red)
  bridge.rotation.z = Math.PI / 2
  bridge.position.set(0, 1.13, 0.27)
  const glassL = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), glass)
  glassL.position.set(-0.1, 1.12, 0.28)
  const glassR = glassL.clone()
  glassR.position.x = 0.1
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), pink)
  nose.scale.set(1, 0.8, 0.8)
  nose.position.set(0, 1.0, 0.28)
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), ink)
  mouth.name = 'mouth'
  mouth.position.set(0, 0.93, 0.26)
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), pink)
  cheekL.position.set(-0.16, 0.98, 0.2)
  const cheekR = cheekL.clone()
  cheekR.position.x = 0.16
  const footL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), fur)
  footL.scale.set(1.3, 0.55, 1.6)
  footL.position.set(-0.14, 0.08, 0.08)
  footL.castShadow = true
  const footR = footL.clone()
  footR.position.x = 0.14
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), fur)
  tail.position.set(0, 0.42, -0.28)
  const battery = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.1), mat(0xf2f4f8, { metalness: 0.2, roughness: 0.35 }))
  const nub = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.04), mat(0xc0c6d0, { metalness: 0.5, roughness: 0.3 }))
  nub.position.y = 0.16
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.11), mat(0x2a2430, { roughness: 0.45 }))
  stripe.position.y = 0.04
  battery.add(shell, nub, stripe)
  battery.position.set(0.42, 0.62, 0.12)
  battery.rotation.z = -0.4
  g.add(body, head, ears, eyeL, eyeR, lensL, lensR, bridge, glassL, glassR, nose, mouth, cheekL, cheekR, footL, footR, tail, battery)
  return g
}

function makeCarrot() {
  const g = new THREE.Group()
  const root = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 8), mat(0xff7a1a, { roughness: 0.45 }))
  root.rotation.z = Math.PI
  root.position.y = 0.02
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x3aaa45, { roughness: 0.6 }))
  leaf.scale.set(1, 1.4, 0.6)
  leaf.position.y = 0.16
  g.add(root, leaf)
  return g
}

function makeChili() {
  const g = new THREE.Group()
  const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 3, 6), mat(0xd02030, { roughness: 0.42 }))
  pod.rotation.z = 0.5
  const stem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), mat(0x3aaa45))
  stem.position.y = 0.12
  g.add(pod, stem)
  return g
}

function makeSign() {
  const g = new THREE.Group()
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.28), mat(0x1a1228, { roughness: 0.5, emissive: 0x221018, emissiveIntensity: 0.4 }))
  board.name = 'board'
  g.add(board)
  g.userData.label = ''
  return g
}

function paintSign(mesh, label) {
  if (mesh.userData.label === label) return
  mesh.userData.label = label
  const board = mesh.getObjectByName('board')
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 96
  const g = c.getContext('2d')
  g.fillStyle = '#1a1228'
  g.fillRect(0, 0, 256, 96)
  g.strokeStyle = '#f0c14a'
  g.lineWidth = 8
  g.strokeRect(6, 6, 244, 84)
  g.fillStyle = '#f7f1e4'
  g.font = '600 42px sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(String(label || ''), 128, 50)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  board.material = board.material.clone()
  board.material.map = tex
  board.material.emissiveMap = tex
  board.material.needsUpdate = true
}

const SEGMENTS = 16
const GAP = 2.4

function buildTunnel(brick) {
  const root = new THREE.Group()
  root.name = 'tunnel'
  const wallMat = mat(0x3a2848, { map: brick, roughness: 0.78 })
  const floorMat = mat(0x1a1024, { map: brick, roughness: 0.86 })
  const sellMat = mat(0xff4f9a, { emissive: 0xff4f9a, emissiveIntensity: 0.6, roughness: 0.28 })
  const buyMat = mat(0x2ee6d6, { emissive: 0x2ee6d6, emissiveIntensity: 0.6, roughness: 0.28 })
  const segs = []
  for (let i = 0; i < SEGMENTS; i++) {
    const seg = new THREE.Group()
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, GAP * 0.96), floorMat)
    floor.position.y = -0.1
    floor.receiveShadow = true
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, GAP * 0.96), wallMat)
    left.position.set(-2, 1.3, 0)
    left.castShadow = true
    left.receiveShadow = true
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, GAP * 0.96), wallMat)
    right.position.set(2, 1.3, 0)
    right.castShadow = true
    right.receiveShadow = true
    const sell = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, GAP * 0.5), sellMat)
    sell.position.set(-1.8, 1.35, 0)
    const buy = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, GAP * 0.5), buyMat)
    buy.position.set(1.8, 1.35, 0)
    const rib = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.08), mat(0x120814))
    rib.position.y = 2.7
    seg.add(floor, left, right, sell, buy, rib)
    seg.userData = { floor, left, right, sell, buy, rib }
    seg.position.z = -i * GAP
    root.add(seg)
    segs.push(seg)
  }
  return { root, segs, sellMat, buyMat }
}

function buildMeadow(grass) {
  const g = new THREE.Group()
  g.name = 'meadow'
  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 28), mat(0x3c9a48, { map: grass, roughness: 0.9 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), mat(0x07040c, { roughness: 1 }))
  hole.name = 'hole'
  hole.rotation.x = -Math.PI / 2
  hole.position.set(0, 0.03, 1.1)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 28), mat(0xff4f9a, { emissive: 0xff4f9a, emissiveIntensity: 0.8, roughness: 0.3 }))
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.06
  rim.name = 'rim'
  for (const [x, z, s] of [[-3.2, -1.5, 1.4], [3.4, -2.2, 1.1], [-2.4, 2.6, 0.8]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat(0x2f8a44, { roughness: 0.92 }))
    hill.scale.set(s, 0.45 * s, s)
    hill.position.set(x, 0.1, z)
    hill.receiveShadow = true
    g.add(hill)
  }
  g.add(ground, hole, rim)
  return g
}

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`
const BLUR = `
  uniform sampler2D tDiffuse;
  uniform vec2 texel;
  uniform vec2 dir;
  varying vec2 vUv;
  void main(){
    vec2 d = texel * dir;
    vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227027;
    c += texture2D(tDiffuse, vUv + d * 1.384615).rgb * 0.316216;
    c += texture2D(tDiffuse, vUv - d * 1.384615).rgb * 0.316216;
    c += texture2D(tDiffuse, vUv + d * 3.230769).rgb * 0.070270;
    c += texture2D(tDiffuse, vUv - d * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(c, 1.0);
  }
`

function postMaterials() {
  const extract = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, threshold: { value: 0.62 } },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float threshold;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float l = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c.rgb * smoothstep(threshold, threshold + 0.28, l), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  })
  const blur = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      texel: { value: new THREE.Vector2() },
      dir: { value: new THREE.Vector2(1, 0) },
    },
    vertexShader: VERT,
    fragmentShader: BLUR,
    depthTest: false,
    depthWrite: false,
  })
  const composite = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null },
      tBloom: { value: null },
      tSoft: { value: null },
      bloomStrength: { value: 0.85 },
      dof: { value: 0.45 },
    },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tColor;
      uniform sampler2D tBloom;
      uniform sampler2D tSoft;
      uniform float bloomStrength;
      uniform float dof;
      varying vec2 vUv;
      void main(){
        vec3 sharp = texture2D(tColor, vUv).rgb;
        vec3 soft = texture2D(tSoft, vUv).rgb;
        float r = length(vUv - 0.5);
        vec3 color = mix(sharp, soft, smoothstep(0.18, 0.82, r) * dof);
        color += texture2D(tBloom, vUv).rgb * bloomStrength;
        color *= mix(0.78, 1.0, smoothstep(0.95, 0.4, r));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  })
  return { extract, blur, composite }
}

function mountWebGL(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0x071018, 1)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x120814, 0.045)
  const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 80)
  scene.add(camera)

  const hemi = new THREE.HemisphereLight(0xc5e4ff, 0x2a1830, 0.55)
  const sun = new THREE.DirectionalLight(0xfff4e4, 2.15)
  sun.position.set(4.5, 8, 3)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 28
  sun.shadow.camera.left = -8
  sun.shadow.camera.right = 8
  sun.shadow.camera.top = 8
  sun.shadow.camera.bottom = -8
  const fill = new THREE.PointLight(0x88b7ff, 6, 18)
  fill.position.set(-2, 3, 4)
  scene.add(hemi, sun, fill)

  const brick = brickTexture()
  const grass = grassTexture()
  const glow = glowTexture()
  const tunnel = buildTunnel(brick)
  const meadow = buildMeadow(grass)
  scene.add(tunnel.root, meadow)

  const rabbit = buildRabbit()
  scene.add(rabbit)
  const sellLight = new THREE.PointLight(0xff4f9a, 2, 8)
  const buyLight = new THREE.PointLight(0x2ee6d6, 2, 8)
  scene.add(sellLight, buyLight)

  const dustGeo = new THREE.BufferGeometry()
  const dustCount = 140
  const dustPos = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 6
    dustPos[i * 3 + 1] = Math.random() * 2.6
    dustPos[i * 3 + 2] = -Math.random() * SEGMENTS * GAP
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffe7c2,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  }))
  scene.add(dust)

  const props = []
  for (let i = 0; i < 16; i++) {
    const carrot = makeCarrot()
    const chili = makeChili()
    const sign = makeSign()
    carrot.visible = chili.visible = sign.visible = false
    scene.add(carrot, chili, sign)
    props.push({ carrot, chili, sign })
  }

  const sellGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff4f9a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  const buyGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x2ee6d6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  sellGlow.scale.set(1.6, 3.2, 1)
  buyGlow.scale.set(1.6, 3.2, 1)
  scene.add(sellGlow, buyGlow)

  const hp = new THREE.Group()
  const hpMatOn = mat(0xff8a2a, { emissive: 0xff8a2a, emissiveIntensity: 0.7, roughness: 0.4 })
  const hpMatOff = mat(0x2a2030, { roughness: 0.8 })
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 6), hpMatOff)
    m.position.set(0.15 * i, 0, 0)
    hp.add(m)
  }
  hp.position.set(0.85, 0.62, -2)
  camera.add(hp)

  const { extract, blur, composite } = postMaterials()
  const quadScene = new THREE.Scene()
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), extract)
  quadScene.add(quad)
  const targets = {
    color: new THREE.WebGLRenderTarget(2, 2),
    a: new THREE.WebGLRenderTarget(2, 2),
    b: new THREE.WebGLRenderTarget(2, 2),
    soft: new THREE.WebGLRenderTarget(2, 2),
  }
  targets.color.depthBuffer = true

  const cams = [
    { x: 0, y: 2.6, z: 6.4, lx: 0, ly: 0.8, lz: 0 },
    { x: 0, y: 2.6, z: 6.4, lx: 0, ly: 0.8, lz: 0 },
  ]
  let lastTime = 0
  let sized = ''

  function resize(viewW, viewH, high) {
    const w = Math.max(2, viewW | 0)
    const h = Math.max(2, viewH | 0)
    const pr = high ? Math.min(1.5, globalThis.devicePixelRatio || 1) : 1
    const key = `${w}x${h}x${pr}`
    if (key === sized) return { w, h, pr }
    sized = key
    renderer.setPixelRatio(pr)
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(1, h)
    camera.updateProjectionMatrix()
    targets.color.setSize(Math.floor(w * pr), Math.floor(h * pr))
    const bw = Math.max(2, Math.floor(w * pr * 0.5))
    const bh = Math.max(2, Math.floor(h * pr * 0.5))
    targets.a.setSize(bw, bh)
    targets.b.setSize(bw, bh)
    targets.soft.setSize(bw, bh)
    return { w, h, pr }
  }

  function blurPass(src, dstW, dstH, dirX) {
    blur.uniforms.tDiffuse.value = src.texture
    blur.uniforms.texel.value.set(1 / dstW, 1 / dstH)
    blur.uniforms.dir.value.set(dirX, 1 - dirX)
    quad.material = blur
    renderer.render(quadScene, quadCam)
  }

  function present(high, bloomStrength, dof, reduced) {
    if (!high) {
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
      return
    }
    renderer.setRenderTarget(targets.color)
    renderer.render(scene, camera)
    const bw = targets.a.width
    const bh = targets.a.height
    renderer.setRenderTarget(targets.a)
    extract.uniforms.tDiffuse.value = targets.color.texture
    quad.material = extract
    renderer.render(quadScene, quadCam)
    renderer.setRenderTarget(targets.b)
    blurPass(targets.a, bw, bh, 1)
    renderer.setRenderTarget(targets.a)
    blurPass(targets.b, bw, bh, 0)
    renderer.setRenderTarget(targets.b)
    blur.uniforms.tDiffuse.value = targets.color.texture
    blur.uniforms.dir.value.set(1, 0)
    quad.material = blur
    renderer.render(quadScene, quadCam)
    renderer.setRenderTarget(targets.soft)
    blurPass(targets.b, bw, bh, 0)
    renderer.setRenderTarget(null)
    composite.uniforms.tColor.value = targets.color.texture
    composite.uniforms.tBloom.value = targets.a.texture
    composite.uniforms.tSoft.value = targets.soft.texture
    composite.uniforms.bloomStrength.value = bloomStrength
    composite.uniforms.dof.value = reduced ? 0 : dof
    quad.material = composite
    renderer.render(quadScene, quadCam)
  }

  function layoutSegment(seg, span) {
    const mid = (span.left + span.right) / 2
    const width = Math.max(1.1, span.right - span.left)
    const u = seg.userData
    u.floor.position.x = mid
    u.floor.scale.x = width / 4
    u.left.position.x = span.left - 0.2
    u.right.position.x = span.right + 0.2
    u.sell.position.x = span.left + 0.05
    u.buy.position.x = span.right - 0.05
    u.rib.position.x = mid
    u.rib.scale.x = (width + 0.7) / 4.2
  }

  function applyPose(pose, time, eating, reduced) {
    const bob = reduced ? 0 : Math.sin(time * 5.5) * 0.045
    rabbit.scale.set(1, 1, 1)
    rabbit.rotation.set(0, 0, 0)
    if (pose === 'fall') {
      rabbit.rotation.x = 0.9
      rabbit.rotation.z = reduced ? 0 : Math.sin(time * 2.4) * 0.07
    } else if (pose === 'stretch') {
      rabbit.rotation.x = 0.4
      rabbit.scale.set(0.84, 1.2, 0.9)
    } else if (pose === 'squash') {
      rabbit.scale.set(1.18, 0.74, 1.08)
    } else {
      rabbit.rotation.y = reduced ? 0 : Math.sin(time * 1.6) * 0.08
    }
    rabbit.position.y = (pose === 'fall' ? 1.15 : 0) + bob
    const ears = rabbit.getObjectByName('ears')
    if (ears) ears.rotation.x = reduced ? -0.05 : Math.sin(time * 3.2) * 0.12
    const mouth = rabbit.getObjectByName('mouth')
    if (mouth) mouth.scale.setScalar(eating ? 1.45 : 0.75)
  }

  function placeItems(rider, logicW, logicH) {
    const items = rider.items || []
    for (const prop of props) {
      prop.carrot.visible = false
      prop.chili.visible = false
      prop.sign.visible = false
    }
    items.forEach((item, i) => {
      const prop = props[i % props.length]
      const mesh = item.kind === 'carrot' ? prop.carrot : item.kind === 'chili' ? prop.chili : prop.sign
      mesh.visible = true
      mesh.position.set(worldX(item.x, logicW), 0.7, -((1 - (item.y || 0) / Math.max(1, logicH)) * 22) + 1.5)
      if (item.kind === 'sign') paintSign(mesh, item.label || '')
    })
  }

  function frameRider(rider, sceneState, reduced, high) {
    const logicW = rider.logicW || sceneState.logicW || 800
    const logicH = rider.logicH || sceneState.logicH || 600
    const span = bandSpan(rider.walls?.sell, rider.walls?.buy, logicW)
    const scroll = reduced ? 0 : (Number(rider.scroll) || 0) * 0.02
    const shift = ((scroll % GAP) + GAP) % GAP
    tunnel.segs.forEach((seg, i) => {
      seg.position.z = -i * GAP + shift
      layoutSegment(seg, span)
    })
    const side = sceneState.side || 'flat'
    const onEdge = rider.region === 'border'
    const sellI = side === 'sell' ? (onEdge ? 2.6 : 1.15) : 0.28
    const buyI = side === 'buy' ? (onEdge ? 2.6 : 1.15) : 0.28
    tunnel.sellMat.emissiveIntensity = sellI
    tunnel.buyMat.emissiveIntensity = buyI
    sellLight.intensity = high ? sellI * 6 : sellI * 2
    buyLight.intensity = high ? buyI * 6 : buyI * 2
    sellLight.position.set(span.left, 1.4, 1)
    buyLight.position.set(span.right, 1.4, 1)
    sellGlow.position.set(span.left, 1.4, 0.4)
    buyGlow.position.set(span.right, 1.4, 0.4)
    sellGlow.material.opacity = Math.min(1, sellI / 2)
    buyGlow.material.opacity = Math.min(1, buyI / 2)
    const rx = worldX(rider.x, logicW)
    rabbit.position.x = rx
    rabbit.position.z = 0
    applyPose('fall', sceneState.time || 0, !!rider.eating, reduced)
    if (Number.isFinite(rider.priceX)) {
      buyGlow.userData.price = worldX(rider.priceX, logicW)
    }
    placeItems(rider, logicW, logicH)
    const hpCount = rider.hp | 0
    hp.children.forEach((mesh, i) => {
      mesh.material = i < hpCount ? hpMatOn : hpMatOff
    })
    return { span, rx, sellI, buyI }
  }

  let pricePip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0xfff6d8, { emissive: 0xfff1b0, emissiveIntensity: 1.2 }))
  scene.add(pricePip)

  function render(sceneState, viewW, viewH, quality) {
    const reduced = !!sceneState.reduced
    const high = quality === 'high'
    const { w, h } = resize(viewW, viewH, high)
    renderer.shadowMap.enabled = high && sceneState.players !== 2
    const time = Number(sceneState.time) || 0
    const dt = Math.min(0.05, Math.max(0, time - lastTime)) || (reduced ? 0 : STEP_SEC)
    lastTime = time
    const phase = sceneState.phase
    const meadowOn = phase !== 'race'
    meadow.visible = meadowOn
    tunnel.root.visible = !meadowOn
    dust.visible = !meadowOn
    sellGlow.visible = !meadowOn
    buyGlow.visible = !meadowOn
    pricePip.visible = !meadowOn
    hp.visible = !meadowOn
    scene.fog.density = meadowOn ? 0.012 : 0.04
    scene.fog.color.set(meadowOn ? 0xb7d7f4 : 0x120814)
    renderer.setClearColor(meadowOn ? 0x9ec9ef : 0x120814, 1)
    const rim = meadow.getObjectByName('rim')
    if (rim) {
      const pulse = reduced ? 0.7 : 0.55 + Math.sin(time * 3) * 0.25
      rim.material.emissiveIntensity = pulse
    }
    if (!reduced) {
      const pos = dust.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        let z = pos.getZ(i) + dt * 3.2
        if (z > 2) z -= SEGMENTS * GAP
        pos.setZ(i, z)
      }
      pos.needsUpdate = true
    }

    const players = sceneState.players === 2 && phase === 'race' ? 2 : 1
    const riders = sceneState.riders || []
    const drawOne = (index, vx, vw) => {
      renderer.setViewport(vx, 0, vw, h)
      renderer.setScissor(vx, 0, vw, h)
      camera.aspect = vw / Math.max(1, h)
      camera.updateProjectionMatrix()
      let lookX = 0
      let lookZ = -4
      let pos = { x: 0, y: 2.7, z: 6.2 }
      let bloom = 0.35
      if (phase === 'race') {
        const rider = riders[index] || {}
        const laid = frameRider(rider, sceneState, reduced, high)
        if (Number.isFinite(rider.priceX)) pricePip.position.set(worldX(rider.priceX, rider.logicW || sceneState.logicW), 1.35, -0.4)
        pos = { x: laid.rx * 0.28, y: 1.85, z: 4.6 }
        lookX = laid.rx * 0.12
        lookZ = -7
        bloom = 0.45 + Math.max(laid.sellI, laid.buyI) * 0.55
        const shake = reduced ? 0 : (sceneState.shake | 0) * 0.03
        pos.x += shake
        pos.y += shake * 0.4
      } else {
        const logicW = sceneState.logicW || 800
        const stand = sceneState.stand || { x: logicW / 2, y: 0 }
        const sx = worldX(stand.x, logicW)
        rabbit.position.set(sx, 0, 0.2)
        applyPose(sceneState.rabbitPose || 'stand', time, !!sceneState.eating, reduced)
        const holeZ = phase === 'jump' ? -0.2 - (sceneState.jump || 0) * 2 : 1.1
        const hole = meadow.getObjectByName('hole')
        if (hole) hole.position.set(0, 0.03, holeZ)
        meadow.getObjectByName('rim').position.set(0, 0.06, holeZ)
        const dive = phase === 'jump' ? sceneState.jump || 0 : 0
        pos = { x: sx * 0.2, y: 2.5 - dive * 0.8, z: 6.4 - dive * 3.2 }
        lookX = sx * 0.1
        lookZ = holeZ
        bloom = 0.25
      }
      const cam = cams[index] || cams[0]
      cam.x = easeToward(cam.x, pos.x, dt, reduced)
      cam.y = easeToward(cam.y, pos.y, dt, reduced)
      cam.z = easeToward(cam.z, pos.z, dt, reduced)
      cam.lx = easeToward(cam.lx, lookX, dt, reduced)
      cam.ly = easeToward(cam.ly, 0.9, dt, reduced)
      cam.lz = easeToward(cam.lz, lookZ, dt, reduced)
      camera.position.set(cam.x, cam.y, cam.z)
      camera.lookAt(cam.lx, cam.ly, cam.lz)
      camera.rotateZ(reduced ? 0 : (sceneState.riders?.[index]?.roll || 0) * 0.35)
      const usePost = high && players === 1
      if (!usePost) {
        renderer.setRenderTarget(null)
        renderer.render(scene, camera)
      } else {
        present(true, reduced ? Math.min(bloom, 0.4) : bloom, phase === 'race' ? 0.55 : 0.2, reduced)
      }
    }

    renderer.setScissorTest(players === 2)
    if (players === 2) {
      drawOne(0, 0, w / 2)
      drawOne(1, w / 2, w - w / 2)
      renderer.setScissorTest(false)
    } else {
      renderer.setViewport(0, 0, w, h)
      drawOne(0, 0, w)
    }
  }

  return { render }
}

export function paintFallback(canvas, viewW, viewH, scene = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return
  const w = Math.max(2, viewW | 0)
  const h = Math.max(2, viewH | 0)
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const phase = scene.phase
  const grd = ctx.createLinearGradient(0, 0, 0, h)
  if (phase === 'race') {
    grd.addColorStop(0, '#1a1024')
    grd.addColorStop(1, '#07040c')
  } else {
    grd.addColorStop(0, '#8ec8f0')
    grd.addColorStop(0.55, '#d7ecfb')
    grd.addColorStop(1, '#3f9a4a')
  }
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)
  const riders = phase === 'race' ? (scene.riders || [{}]) : [null]
  const cols = riders.length
  riders.forEach((rider, index) => {
    const x0 = (w / cols) * index
    const vw = w / cols
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, 0, vw, h)
    ctx.clip()
    if (phase === 'race') {
      const span = bandSpan(rider?.walls?.sell, rider?.walls?.buy, rider?.logicW || scene.logicW || vw)
      const left = x0 + vw / 2 + span.left / 9 * vw
      const right = x0 + vw / 2 + span.right / 9 * vw
      ctx.fillStyle = '#ff4f9a'
      ctx.fillRect(left - 6, 0, 8, h)
      ctx.fillStyle = '#2ee6d6'
      ctx.fillRect(right - 2, 0, 8, h)
      const side = scene.side
      ctx.globalAlpha = side === 'sell' ? 0.35 : 0.08
      ctx.fillStyle = '#ff4f9a'
      ctx.fillRect(x0, 0, left - x0, h)
      ctx.globalAlpha = side === 'buy' ? 0.35 : 0.08
      ctx.fillStyle = '#2ee6d6'
      ctx.fillRect(right, 0, x0 + vw - right, h)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#07040c'
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.72, 70, 28, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ff4f9a'
      ctx.lineWidth = 6
      ctx.stroke()
    }
    const px = phase === 'race'
      ? x0 + vw / 2 + worldX(rider?.x, rider?.logicW || scene.logicW || vw) / 9 * vw
      : worldX(scene.stand?.x, scene.logicW || w) / 9 * w + w / 2
    const py = phase === 'race' ? h * 0.42 : h * 0.62
    ctx.fillStyle = '#fff7f4'
    ctx.beginPath()
    ctx.ellipse(px, py, 18, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(px, py - 34, 14, 14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff8eae'
    ctx.beginPath()
    ctx.ellipse(px - 8, py - 58, 6, 16, -0.2, 0, Math.PI * 2)
    ctx.ellipse(px + 8, py - 58, 6, 16, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#d3122c'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(px - 5, py - 36, 5, 0, Math.PI * 2)
    ctx.arc(px + 5, py - 36, 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  })
}

export function createWorld(canvas) {
  let quality = readStoredQuality(canvas?.clientWidth || 1280)
  let mode = 'canvas'
  let draw = (scene, viewW, viewH) => paintFallback(canvas, viewW, viewH, scene)
  if (canvas && typeof document !== 'undefined') {
    try {
      const probe = document.createElement('canvas')
      const gl = probe.getContext('webgl2') || probe.getContext('webgl')
      if (!gl) throw new Error('no-webgl')
      const mounted = mountWebGL(canvas)
      mode = 'webgl'
      draw = (scene, viewW, viewH) => mounted.render(scene, viewW, viewH, quality)
    } catch {
      mode = 'canvas'
    }
  }
  return {
    mode() {
      return mode
    },
    quality() {
      return quality
    },
    setQuality(next) {
      quality = next === 'low' ? 'low' : 'high'
      try {
        globalThis.localStorage?.setItem('tr-rh-quality', quality)
      } catch {
        /* the choice still applies this visit */
      }
    },
    render(scene, viewW, viewH) {
      try {
        draw(scene || {}, viewW || 800, viewH || 600)
      } catch {
        /* a missing drawing context must not stop the steering */
      }
    },
  }
}

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

const SONGS = {
  meadow: {
    bpm: 84,
    lead: [72, 0, 76, 79, 76, 74, 72, 0, 67, 0, 71, 74, 72, 69, 67, 0],
    bass: [48, 0, 48, 0, 43, 0, 45, 0, 41, 0, 41, 0, 43, 0, 48, 0],
  },
  fall: {
    bpm: 102,
    lead: [60, 63, 67, 0, 70, 67, 63, 60, 58, 0, 62, 65, 62, 58, 55, 0],
    bass: [36, 0, 36, 0, 43, 0, 41, 0, 36, 0, 39, 0, 41, 0, 34, 0],
  },
}

export function createScore() {
  let ctx = null
  let master = null
  let filter = null
  let muted = false
  let area = 'meadow'
  let step = 0
  let nextAt = 0

  function ac() {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext
    if (typeof AC !== 'function') return null
    try {
      if (!ctx) {
        ctx = new AC()
        master = ctx.createGain()
        master.gain.value = muted ? 0 : MASTER_VOLUME
        const comp = ctx.createDynamicsCompressor()
        comp.threshold.value = -18
        comp.knee.value = 12
        comp.ratio.value = 2.2
        filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1800
        filter.Q.value = 0.7
        filter.connect(comp)
        comp.connect(master)
        master.connect(ctx.destination)
      }
      return ctx
    } catch {
      return null
    }
  }

  function tone(freq, when, dur, type, vol, cutoff) {
    const a = ac()
    if (!a || muted || !freq || !filter) return
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, when)
    if (type === 'sawtooth') o.detune.setValueAtTime(8, when)
    g.gain.setValueAtTime(vol, when)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    const lp = a.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(cutoff || 1600, when)
    o.connect(lp)
    lp.connect(g)
    g.connect(filter)
    o.start(when)
    o.stop(when + dur + 0.03)
  }

  return {
    volume: MASTER_VOLUME,
    setMuted(value) {
      muted = !!value
      if (master) master.gain.value = muted ? 0 : MASTER_VOLUME
    },
    toggleMuted() {
      muted = !muted
      if (master) master.gain.value = muted ? 0 : MASTER_VOLUME
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
      if (filter) filter.frequency.value = area === 'fall' ? 1400 : 1900
    },
    tick() {
      const a = ac()
      if (!a || muted || !filter) return
      const song = SONGS[area]
      const stepDur = 60 / song.bpm / 2
      if (!nextAt) nextAt = a.currentTime + 0.05
      let guard = 0
      while (nextAt < a.currentTime + 0.2 && guard++ < 6) {
        const i = step % song.lead.length
        if (song.lead[i]) tone(midi(song.lead[i]), nextAt, stepDur * 0.9, 'sine', 0.05, 2200)
        if (song.bass[i]) tone(midi(song.bass[i]), nextAt, stepDur * 0.95, 'sawtooth', 0.03, 420)
        step += 1
        nextAt += stepDur
      }
    },
    sfx(kind) {
      const a = ac()
      if (!a || muted) return
      const now = a.currentTime
      if (kind === 'jump') {
        tone(midi(62), now, 0.09, 'sine', 0.07, 2400)
        tone(midi(69), now + 0.08, 0.12, 'sine', 0.06, 2400)
      } else if (kind === 'pickup') {
        tone(midi(79), now, 0.06, 'sine', 0.06, 2800)
        tone(midi(86), now + 0.06, 0.1, 'sine', 0.05, 2800)
      } else if (kind === 'tp') {
        tone(midi(74), now, 0.08, 'sine', 0.07, 2600)
        tone(midi(81), now + 0.07, 0.14, 'sine', 0.06, 2600)
      } else if (kind === 'sl') {
        tone(midi(66), now, 0.1, 'sine', 0.06, 900)
        tone(midi(58), now + 0.09, 0.16, 'triangle', 0.06, 700)
      } else if (kind === 'menu') {
        tone(midi(80), now, 0.04, 'sine', 0.04, 2000)
      }
    },
  }
}
