import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal fabric.js stubs
// These stubs cover the APIs used in src/components/scene/** and
// src/composables/scene/** so that importing those modules in a jsdom
// environment does not throw.
// ---------------------------------------------------------------------------

const fabricObjectBase = {
  set: vi.fn().mockReturnThis(),
  get: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
  canvas: null,
  left: 0,
  top: 0,
  width: 100,
  height: 100,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  opacity: 1,
  visible: true,
  selectable: true,
  evented: true,
  hasControls: true,
  lockMovementX: false,
  lockMovementY: false,
  setCoords: vi.fn(),
  getBoundingRect: vi.fn(() => ({ left: 0, top: 0, width: 100, height: 100 })),
  getCenterPoint: vi.fn(() => ({ x: 0, y: 0 })),
  clone: vi.fn(() => Promise.resolve({ ...fabricObjectBase })),
  toObject: vi.fn(() => ({})),
  toDataURL: vi.fn(() => ''),
  dispose: vi.fn()
}

export const Canvas = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  renderAll: vi.fn(),
  requestRenderAll: vi.fn(),
  getObjects: vi.fn(() => []),
  setActiveObject: vi.fn(),
  discardActiveObject: vi.fn(),
  getActiveObject: vi.fn(() => null),
  getPointer: vi.fn(() => ({ x: 0, y: 0 })),
  setWidth: vi.fn(),
  setHeight: vi.fn(),
  setDimensions: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn(() => 1),
  absolutePan: vi.fn(),
  relativePan: vi.fn(),
  viewportTransform: [1, 0, 0, 1, 0, 0],
  vptCoords: {},
  calcOffset: vi.fn(),
  toDataURL: vi.fn(() => ''),
  toCanvasElement: vi.fn(() => document.createElement('canvas')),
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
  upperCanvasEl: document.createElement('canvas'),
  lowerCanvasEl: document.createElement('canvas'),
  wrapperEl: document.createElement('div'),
  width: 800,
  height: 600,
  selection: false
}))

export const StaticCanvas = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  renderAll: vi.fn(),
  requestRenderAll: vi.fn(),
  getObjects: vi.fn(() => []),
  toDataURL: vi.fn(() => ''),
  toCanvasElement: vi.fn(() => document.createElement('canvas')),
  setWidth: vi.fn(),
  setHeight: vi.fn(),
  setDimensions: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn(() => 1),
  on: vi.fn(),
  off: vi.fn(),
  width: 800,
  height: 600
}))

export const FabricImage = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  setSrc: vi.fn(() => Promise.resolve()),
  getElement: vi.fn(() => document.createElement('img'))
}))

// Static method on FabricImage
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
;(FabricImage as any).fromURL = vi.fn((_url: string) =>
  Promise.resolve(new FabricImage(document.createElement('img'), {}))
)

export const FabricText = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  text: '',
  set: vi.fn().mockReturnThis()
}))

export const IText = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  text: '',
  set: vi.fn().mockReturnThis(),
  enterEditing: vi.fn(),
  exitEditing: vi.fn()
}))

export const Textbox = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  text: '',
  set: vi.fn().mockReturnThis()
}))

export const Group = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase,
  getObjects: vi.fn(() => []),
  add: vi.fn(),
  remove: vi.fn(),
  forEachObject: vi.fn()
}))

export const Rect = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase
}))

export const Line = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase
}))

export const Circle = vi.fn().mockImplementation(() => ({
  ...fabricObjectBase
}))

export const Gradient = vi.fn().mockImplementation(() => ({
  type: 'linear',
  colorStops: []
}))

export const Point = vi.fn().mockImplementation((x: number = 0, y: number = 0) => ({ x, y }))

export const util = {
  transformPoint: vi.fn(
    (point: { x: number; y: number }, _matrix: unknown) => ({ ...point })
  ),
  invertTransform: vi.fn((m: unknown) => m),
  multiplyTransformMatrices: vi.fn(
    (a: unknown, _b: unknown) => a
  ),
  qrDecompose: vi.fn(() => ({
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    skewX: 0,
    skewY: 0,
    translateX: 0,
    translateY: 0
  })),
  composeMatrix: vi.fn(() => [1, 0, 0, 1, 0, 0]),
  makeBoundingBoxFromPoints: vi.fn(() => ({ left: 0, top: 0, width: 0, height: 0 })),
  createCanvasElement: vi.fn(() => document.createElement('canvas')),
  loadImage: vi.fn(() => Promise.resolve(document.createElement('img'))),
  toFixed: vi.fn((v: number, _d: number) => v),
  parseUnit: vi.fn((v: unknown) => v),
  cos: vi.fn(Math.cos),
  sin: vi.fn(Math.sin),
  degreesToRadians: vi.fn((d: number) => (d * Math.PI) / 180),
  radiansToDegrees: vi.fn((r: number) => (r * 180) / Math.PI),
  calcRotateMatrix: vi.fn(() => [1, 0, 0, 1, 0, 0])
}

export const loadSVGFromString = vi.fn(() =>
  Promise.resolve({
    objects: [] as unknown[],
    options: {} as Record<string, unknown>
  })
)
