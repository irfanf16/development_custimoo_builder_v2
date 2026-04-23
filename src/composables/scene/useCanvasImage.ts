import type { Canvas, StaticCanvas } from 'fabric'
import type { WebGLRenderer, OrthographicCamera, PerspectiveCamera } from 'three'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

export interface GetImageFromCanvasOptions {
  image_type?: string
  width?: number
  height?: number
  zoom?: number
}

/**
 * Get image from 2D Fabric.js canvas.
 * Waits two animation frames so the canvas has painted, then captures.
 * Export is always width×height (default 1200×1200); the zoom is derived from the
 * canvas's current bitmap so the secondary/flip preview (small bitmap) exports at
 * the same size as the main preview.
 */
export function getImageFrom2DCanvas(
  canvas: Canvas | StaticCanvas | null,
  options: GetImageFromCanvasOptions = {}
): Promise<string> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!canvas) {
          resolve('')
          return
        }

        const canvasOptions = {
          image_type: 'image/png',
          width: 1200,
          height: 1200,
          ...options
        }

        if ('discardActiveObject' in canvas) {
          canvas.discardActiveObject()
        }
        canvas.requestRenderAll()

        const originalTransform = canvas.viewportTransform
        const originalWidth = canvas.getWidth()
        const originalHeight = canvas.getHeight()

        // Derive zoom from the actual canvas bitmap so content fills the export
        // regardless of current size (main preview ~600px vs flip preview ~156px).
        const zoomX = options.zoom ?? canvasOptions.width / originalWidth
        const zoomY = options.zoom ?? canvasOptions.height / originalHeight

        canvas.setDimensions({
          width: canvasOptions.width,
          height: canvasOptions.height
        })
        canvas.viewportTransform = [zoomX, 0, 0, zoomY, 0, 0]
        canvas.requestRenderAll()

        const base64Image = (canvas.toDataURL as (format?: string) => string)(
          canvasOptions.image_type
        )

        canvas.setDimensions({
          width: originalWidth,
          height: originalHeight
        })
        canvas.viewportTransform = originalTransform
        canvas.requestRenderAll()

        resolve(base64Image)
      })
    })
  })
}

/**
 * Get image from 3D Three.js renderer.
 * Waits two animation frames so the render has completed, then captures.
 * If options.width/height are set, temporarily resizes the renderer for export so the image
 * is that size (avoids small/blank images when the container is small).
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
): Promise<string> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canvasOptions = {
          image_type: 'image/png',
          width: 1200,
          height: 1200,
          ...options
        }

        if (!renderer || !renderer.domElement) {
          resolve('')
          return
        }

        const targetCamera = side === 'back' ? backCamera : frontCamera
        if (!targetCamera) {
          resolve('')
          return
        }

        // Cancel animation
        if (animationId.value !== null) {
          cancelAnimationFrame(animationId.value)
          animationId.value = null
        }

        // Resize renderer for export to requested size so image is never tiny (default 1200x1200)
        const exportWidth = canvasOptions.width || 1200
        const exportHeight = canvasOptions.height || 1200
        const prevPixelRatio = renderer.getPixelRatio()
        const prevBufferWidth = renderer.domElement.width
        const prevBufferHeight = renderer.domElement.height
        const prevLogicalWidth = prevBufferWidth / prevPixelRatio
        const prevLogicalHeight = prevBufferHeight / prevPixelRatio
        renderer.setPixelRatio(1)
        renderer.setSize(exportWidth, exportHeight)

        if (canvas && typeof canvas !== 'boolean') {
          canvas.discardActiveObject()
          canvas.renderAll()
        }

        if (renderPass) {
          renderPass.camera = targetCamera
        }
        addShaderPasses(targetCamera)
        composer.render()

        const base64Image = renderer.domElement.toDataURL(canvasOptions.image_type)

        renderer.setSize(prevLogicalWidth, prevLogicalHeight)
        renderer.setPixelRatio(prevPixelRatio)
        if (renderPass && camera) {
          renderPass.camera = camera
        }
        if (animationId.value === null && isAnimationRunning.value) {
          animate()
        }

        resolve(base64Image)
      })
    })
  })
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
