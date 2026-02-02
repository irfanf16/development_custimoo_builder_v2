import {
  Control,
  controlsUtils,
  util,
  Object as FabricObjectClass,
  type FabricObject,
  type Canvas
} from 'fabric'
import { useCustomizationStore } from '@/stores/customization/customization.store'

/**
 * Common control visibility settings for Fabric.js objects
 * Same for both 2D and 3D scenes
 * Matches old codebase: { tl: false, bl: false, tr: true, br: true, ml: false, mb: false, mr: false, mt: false, mtr: false }
 *
 * Three controls are enabled:
 * - tr: true (top right - rotation control with custom icon)
 * - br: true (bottom right - scale control with custom icon)
 * - deleteControl: custom control (always enabled when added via setupFabricControls, not part of standard visibility)
 */
// Default custom visibility (same as old app)
export const FABRIC_CONTROL_VISIBILITY = {
  tl: false,
  bl: false,
  tr: true,
  br: true,
  ml: false,
  mb: false,
  mr: false,
  mt: false,
  mtr: false,
  deleteControl: true
}

/**
 * Options for setting up custom controls
 */
export type SetupFabricControlsOptions = {
  /** Function to handle logo removal by logo_index */
  onRemoveLogo?: (logoIndex: number, canvas: Canvas) => void
  /** Function to handle custom text removal by custom_text_index */
  onRemoveText?: (customTextIndex: number, customTextItemIndex: number, canvas: Canvas) => void
}

/**
 * Setup custom Fabric.js controls with custom icons
 * This should be called once when the scene is initialized
 * Images are loaded asynchronously and controls are set up once all images are loaded
 *
 * @param options - Options for handling control actions
 */
export function setupFabricControls(options: SetupFabricControlsOptions = {}): void {
  const { onRemoveLogo, onRemoveText } = options

  const scaleImg = new Image()
  scaleImg.crossOrigin = 'anonymous'
  scaleImg.src = '/scale.png'

  const rotationImg = new Image()
  rotationImg.crossOrigin = 'anonymous'
  rotationImg.src = '/rotation.png'

  const deleteImg = new Image()
  deleteImg.crossOrigin = 'anonymous'
  deleteImg.src = '/delete.png'

  let imagesLoaded = 0
  const totalImages = 3

  const setupControls = () => {
    const prototype = FabricObjectClass.prototype as unknown as {
      controls?: Record<string, Control>
    }
    if (!prototype.controls) {
      prototype.controls = {}
    }

    const renderIcon =
      (img: HTMLImageElement) =>
      (
        ctx: CanvasRenderingContext2D,
        left: number,
        top: number,
        _styleOverride: unknown,
        fabricObject: unknown
      ) => {
        const obj = fabricObject as { angle?: number }
        const size = 30
        ctx.save()
        ctx.translate(left, top)
        const angle = typeof obj.angle === 'number' ? obj.angle : 0
        ctx.rotate(util.degreesToRadians(angle))
        ctx.drawImage(img, -size / 2, -size / 2, size, size)
        ctx.restore()
      }

    prototype.controls.br = new Control({
      x: 0.5,
      y: 0.5,
      cursorStyle: 'nw-resize',
      actionHandler: controlsUtils.scalingEqually,
      actionName: 'scale',
      render: renderIcon(scaleImg),
      withConnection: true
    })

    prototype.controls.tr = new Control({
      x: 0.5,
      y: -0.5,
      cursorStyle: 'crosshair',
      actionHandler: controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: renderIcon(rotationImg),
      withConnection: true
    })

    // Delete handler
    const deleteObject = (
      _eventData: unknown,
      transform: {
        target?: FabricObject & {
          logo_index?: number
          custom_text_index?: number
          custom_text_item_index?: number
          canvas?: Canvas
        }
      }
    ) => {
      const target = transform?.target
      if (!target) return
      const canvas = target.canvas
      if (!canvas) return

      if ('custom_text_index' in target && target.custom_text_index !== undefined) {
        const ci = target.custom_text_index
        const ii = target.custom_text_item_index
        if (onRemoveText && ci !== undefined && ii !== undefined) {
          onRemoveText(ci, ii, canvas)
        }
      } else if ('logo_index' in target && target.logo_index !== undefined) {
        const customizationStore = useCustomizationStore() as {
          customization: { product_id?: number } | null
          removeCustomLogo(productKey: string, logoIndex: number): void
        }
        const productId = customizationStore.customization?.product_id
        if (productId != null) {
          customizationStore.removeCustomLogo(String(productId), target.logo_index)
        }
        if (onRemoveLogo) onRemoveLogo(target.logo_index, canvas)
      }

      canvas.remove(target as FabricObject)
      canvas.requestRenderAll()
    }

    prototype.controls.deleteControl = new Control({
      x: -0.5,
      y: -0.5,
      cursorStyle: 'pointer',
      mouseUpHandler: deleteObject,
      actionName: 'remove',
      render: renderIcon(deleteImg),
      withConnection: true
    })
  }

  const checkImagesLoaded = () => {
    imagesLoaded++
    if (imagesLoaded === totalImages) {
      setupControls()
    }
  }

  scaleImg.onload = checkImagesLoaded
  scaleImg.onerror = checkImagesLoaded
  rotationImg.onload = checkImagesLoaded
  rotationImg.onerror = checkImagesLoaded
  deleteImg.onload = checkImagesLoaded
  deleteImg.onerror = checkImagesLoaded

  if (scaleImg.complete && rotationImg.complete && deleteImg.complete) {
    setupControls()
  }
}

/**
 * Composable for Fabric.js custom controls
 * Provides setup function and control visibility constant
 */
export function useFabricControls() {
  return {
    setupFabricControls,
    FABRIC_CONTROL_VISIBILITY
  }
}
