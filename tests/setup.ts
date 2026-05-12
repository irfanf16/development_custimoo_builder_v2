import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// ResizeObserver stub
// ---------------------------------------------------------------------------
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

// ---------------------------------------------------------------------------
// IntersectionObserver stub
// ---------------------------------------------------------------------------
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

// ---------------------------------------------------------------------------
// window.matchMedia stub
// ---------------------------------------------------------------------------
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
)

// ---------------------------------------------------------------------------
// window.scrollTo stub
// ---------------------------------------------------------------------------
vi.stubGlobal('scrollTo', vi.fn())

// ---------------------------------------------------------------------------
// Element.prototype.scrollIntoView stub
// ---------------------------------------------------------------------------
Element.prototype.scrollIntoView = vi.fn()

// ---------------------------------------------------------------------------
// HTMLCanvasElement.prototype.getContext stub
// Returns a minimal 2D context stub so fabric / canvas-heavy code doesn't throw.
// ---------------------------------------------------------------------------
const canvas2DContextStub = {
  canvas: null as unknown as HTMLCanvasElement,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  isPointInStroke: vi.fn(() => false),
  drawImage: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  putImageData: vi.fn(),
  getLineDash: vi.fn(() => []),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  getTransform: vi.fn(() => new DOMMatrix()),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createPattern: vi.fn(() => null),
  measureText: vi.fn(() => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  drawFocusIfNeeded: vi.fn(),
  createConicGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  // common properties
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt' as CanvasLineCap,
  lineJoin: 'miter' as CanvasLineJoin,
  miterLimit: 10,
  font: '10px sans-serif',
  textAlign: 'start' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  shadowBlur: 0,
  shadowColor: '',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  lineDashOffset: 0,
  direction: 'ltr' as CanvasDirection,
  filter: 'none'
}

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') return canvas2DContextStub
  return null
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ---------------------------------------------------------------------------
// URL.createObjectURL / revokeObjectURL stubs
// Only stub the missing methods — do NOT replace the URL constructor itself
// because axios and other libraries rely on `new URL(...)`.
// ---------------------------------------------------------------------------
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
} else {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}

if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn()
} else {
  URL.revokeObjectURL = vi.fn()
}
