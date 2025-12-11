import type { Canvas, StaticCanvas } from 'fabric'
import type { WebGLRenderer, OrthographicCamera, PerspectiveCamera } from 'three'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

export interface GetImageFromCanvasOptions {
  original_width?: number
  original_height?: number
  image_type?: string
  width?: number
  height?: number
  zoom?: number
}

/**
 * Get image from 2D Fabric.js canvas
 */
export function getImageFrom2DCanvas(
  canvas: Canvas | StaticCanvas | null,
  options: GetImageFromCanvasOptions = {}
): string {
  if (!canvas) return ''

  const canvasOptions = {
    original_width: 600,
    original_height: 600,
    image_type: 'image/png',
    width: 1200,
    height: 1200,
    zoom: 2,
    ...options
  }

  // Only call discardActiveObject if it's a Canvas (not StaticCanvas)
  if ('discardActiveObject' in canvas) {
    canvas.discardActiveObject()
  }
  canvas.requestRenderAll()

  // Store original transform and dimensions
  const originalTransform = canvas.viewportTransform
  const originalWidth = canvas.getWidth()
  const originalHeight = canvas.getHeight()

  // Temporarily resize canvas
  canvas.setDimensions({
    width: canvasOptions.width,
    height: canvasOptions.height
  })
  canvas.viewportTransform = [canvasOptions.zoom, 0, 0, canvasOptions.zoom, 0, 0]
  canvas.requestRenderAll()

  // Get image data
  // Fabric.js toDataURL accepts format string directly (e.g., 'image/png')
  // Using type assertion to match Fabric.js API
  const base64Image = (canvas.toDataURL as (format?: string) => string)(canvasOptions.image_type)

  // Restore original dimensions and transform
  canvas.setDimensions({
    width: originalWidth,
    height: originalHeight
  })
  canvas.viewportTransform = originalTransform
  canvas.requestRenderAll()

  return base64Image
}

/**
 * Get image from 3D Three.js renderer
 * Simplified version matching old codebase
 */
export function getImageFrom3DCanvas(
  renderer: WebGLRenderer,
  side: CanvasSide,
  frontCamera: OrthographicCamera | null,
  backCamera: OrthographicCamera | null,
  camera: PerspectiveCamera | null,
  composer: EffectComposer,
  renderPass: RenderPass | null,
  addShaderPasses: (camera: OrthographicCamera | PerspectiveCamera) => void,
  animate: () => void,
  animationId: { value: number | null },
  isAnimationRunning: { value: boolean },
  canvas: Canvas | null,
  options: GetImageFromCanvasOptions = {}
): string {
  const canvasOptions = {
    image_type: 'image/png',
    ...options
  }

  if (!renderer || !renderer.domElement) return ''

  const targetCamera = side === 'back' ? backCamera : frontCamera
  if (!targetCamera) return ''

  // Cancel animation
  if (animationId.value !== null) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }

  // Update canvas
  if (canvas && typeof canvas !== 'boolean') {
    canvas.discardActiveObject()
    canvas.renderAll()
  }

  // Render with target camera
  if (renderPass) {
    renderPass.camera = targetCamera
  }
  addShaderPasses(targetCamera)
  composer.render()

  // Get image
  const base64Image = renderer.domElement.toDataURL(canvasOptions.image_type)

  // Restore and resume
  if (renderPass && camera) {
    renderPass.camera = camera
  }
  if (animationId.value === null && isAnimationRunning.value) {
    animate()
  }

  return base64Image
}

/**
 * Composable for getting canvas images
 * Works with both 2D and 3D scenes
 */
export function useCanvasImage() {
  /**
   * Get image from canvas (2D or 3D)
   */
  function getImageFromCanvas(
    _side: CanvasSide = 'front',
    _options: GetImageFromCanvasOptions = {}
  ): string {
    // This will be implemented in the components that use this composable
    // Components should provide their own implementation based on their canvas type
    return ''
  }

  return {
    getImageFromCanvas,
    getImageFrom2DCanvas,
    getImageFrom3DCanvas
  }
}
