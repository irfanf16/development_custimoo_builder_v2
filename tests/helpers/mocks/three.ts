import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal three.js stubs
// Covers the APIs used in src/components/scene/ThreeDScene.vue,
// src/components/product-preview/ThreePreview.vue, and
// src/composables/scene/useCanvasImage.ts so that importing those modules
// in a jsdom environment does not throw.
// ---------------------------------------------------------------------------

export const WebGLRenderer = vi.fn().mockImplementation(() => ({
  domElement: document.createElement('canvas'),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
  setClearColor: vi.fn(),
  setRenderTarget: vi.fn(),
  clear: vi.fn(),
  getSize: vi.fn(() => ({ width: 800, height: 600 })),
  shadowMap: { enabled: false, type: 0 },
  toneMapping: 0,
  toneMappingExposure: 1,
  outputColorSpace: 'srgb',
  capabilities: { isWebGL2: true },
  info: { reset: vi.fn() }
}))

export const Scene = vi.fn().mockImplementation(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  children: [],
  background: null,
  traverse: vi.fn(),
  getObjectByName: vi.fn(() => null),
  clear: vi.fn()
}))

export const PerspectiveCamera = vi.fn().mockImplementation(() => ({
  position: { set: vi.fn(), x: 0, y: 0, z: 5 },
  rotation: { set: vi.fn(), x: 0, y: 0, z: 0 },
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn(),
  aspect: 1,
  fov: 75,
  near: 0.1,
  far: 1000
}))

export const OrthographicCamera = vi.fn().mockImplementation(() => ({
  position: { set: vi.fn(), x: 0, y: 0, z: 5 },
  rotation: { set: vi.fn() },
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn(),
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
  near: 0.1,
  far: 1000
}))

export const Group = vi.fn().mockImplementation(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  children: [],
  position: { set: vi.fn(), x: 0, y: 0, z: 0 },
  rotation: { set: vi.fn() },
  scale: { set: vi.fn(), x: 1, y: 1, z: 1 },
  traverse: vi.fn()
}))

export const Mesh = vi.fn().mockImplementation(() => ({
  position: { set: vi.fn(), x: 0, y: 0, z: 0 },
  rotation: { set: vi.fn() },
  scale: { set: vi.fn() },
  material: null,
  geometry: null,
  traverse: vi.fn(),
  name: ''
}))

export const MeshStandardMaterial = vi.fn().mockImplementation(() => ({
  map: null,
  color: { set: vi.fn() },
  dispose: vi.fn(),
  needsUpdate: false
}))

export const MeshBasicMaterial = vi.fn().mockImplementation(() => ({
  map: null,
  color: { set: vi.fn() },
  dispose: vi.fn(),
  needsUpdate: false
}))

export const TextureLoader = vi.fn().mockImplementation(() => ({
  load: vi.fn(
    (
      _url: string,
      onLoad?: (tex: unknown) => void
    ) => {
      const tex = { dispose: vi.fn(), needsUpdate: false }
      onLoad?.(tex)
      return tex
    }
  )
}))

export const CanvasTexture = vi.fn().mockImplementation(() => ({
  needsUpdate: false,
  dispose: vi.fn()
}))

export const AmbientLight = vi.fn().mockImplementation(() => ({
  color: { set: vi.fn() },
  intensity: 1
}))

export const DirectionalLight = vi.fn().mockImplementation(() => ({
  position: { set: vi.fn() },
  color: { set: vi.fn() },
  intensity: 1
}))

export const Color = vi.fn().mockImplementation(() => ({
  set: vi.fn().mockReturnThis(),
  r: 1,
  g: 1,
  b: 1
}))

export const Vector2 = vi.fn().mockImplementation((x: number = 0, y: number = 0) => ({ x, y, set: vi.fn() }))
export const Vector3 = vi.fn().mockImplementation((x: number = 0, y: number = 0, z: number = 0) => ({
  x,
  y,
  z,
  set: vi.fn().mockReturnThis(),
  normalize: vi.fn().mockReturnThis(),
  clone: vi.fn().mockReturnThis()
}))

export const Matrix4 = vi.fn().mockImplementation(() => ({
  set: vi.fn(),
  identity: vi.fn(),
  multiply: vi.fn()
}))

export const Quaternion = vi.fn().mockImplementation(() => ({
  set: vi.fn(),
  setFromEuler: vi.fn()
}))

export const BoxGeometry = vi.fn().mockImplementation(() => ({
  dispose: vi.fn()
}))

export const PlaneGeometry = vi.fn().mockImplementation(() => ({
  dispose: vi.fn()
}))

export const SphereGeometry = vi.fn().mockImplementation(() => ({
  dispose: vi.fn()
}))

export const WebGLRenderTarget = vi.fn().mockImplementation(() => ({
  dispose: vi.fn(),
  texture: { dispose: vi.fn() }
}))

export const SRGBColorSpace = 'srgb'
export const LinearSRGBColorSpace = 'srgb-linear'
export const PCFSoftShadowMap = 2
export const ACESFilmicToneMapping = 4
export const NoToneMapping = 0
