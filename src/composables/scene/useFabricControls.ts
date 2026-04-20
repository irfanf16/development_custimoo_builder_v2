import {
  Control,
  controlsUtils,
  util,
  Object as FabricObjectClass,
  type FabricObject,
  type Canvas
} from 'fabric'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useStorage } from './useStorage'

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
// Default custom visibility (same as old app) + pin control at bottom-left
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
  deleteControl: true,
  pinControl: true
}

/**
 * Options for setting up custom controls
 */
export type SetupFabricControlsOptions = {
  /** Function to handle logo removal by logo_index */
  onRemoveLogo?: (logoIndex: number, canvas: Canvas) => void
  /** Function to handle custom text removal by custom_text_index */
  onRemoveText?: (customTextIndex: number, customTextItemIndex: number, canvas: Canvas) => void
  /** Fallback to resolve logo index from target when logo_index property is missing */
  getLogoIndexFromTarget?: (target: FabricObject) => number | undefined
  /** Size in pixels for all control icons (rotate, scale, delete, pin). Defaults to 30. */
  controlSize?: number
}

/**
 * Setup custom Fabric.js controls with custom icons
 * This should be called once when the scene is initialized
 * Images are loaded asynchronously and controls are set up once all images are loaded
 *
 * @param options - Options for handling control actions
 */
export function setupFabricControls(options: SetupFabricControlsOptions = {}): void {
  const { onRemoveLogo, onRemoveText, getLogoIndexFromTarget, controlSize = 30 } = options
  const { fromStorage } = useStorage()

  const scaleImg = new Image()
  scaleImg.crossOrigin = 'anonymous'
  scaleImg.src = fromStorage('scale.png')

  const rotationImg = new Image()
  rotationImg.crossOrigin = 'anonymous'
  rotationImg.src = fromStorage('rotation.png')

  const deleteImg = new Image()
  deleteImg.crossOrigin = 'anonymous'
  deleteImg.src = fromStorage('delete.png')

  const pinImg = new Image()
  pinImg.crossOrigin = 'anonymous'
  pinImg.src = fromStorage('pin.svg')
  const pinOffImg = new Image()
  pinOffImg.crossOrigin = 'anonymous'
  pinOffImg.src = fromStorage('unpin.svg')

  let criticalImagesLoaded = 0
  const criticalImagesTotal = 3

  const setupControls = () => {
    // Register custom properties so Fabric preserves logo_index, product_id, etc. on objects
    const FObj = FabricObjectClass as unknown as { customProperties?: string[] }
    const customProps = [
      'logo_index',
      'product_id',
      'pinned',
      'custom_text_index',
      'custom_text_item_index'
    ]
    if (FObj.customProperties) {
      customProps.forEach(p => {
        if (!FObj.customProperties!.includes(p)) FObj.customProperties!.push(p)
      })
    } else {
      FObj.customProperties = [...customProps]
    }

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
        const size = controlSize
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

      if (
        'custom_text_index' in target &&
        target.custom_text_index !== undefined &&
        'custom_text_item_index' in target &&
        target.custom_text_item_index !== undefined
      ) {
        const customTextIndex = target.custom_text_index
        const customTextItemIndex = target.custom_text_item_index
        const customizationStore = useCustomizationStore() as {
          customization: { product_id?: number } | null
          setProductTextItemSelected(
            productId: number,
            entryIndex: number,
            itemIndex: number,
            selected: boolean
          ): void
        }
        const productId = customizationStore.customization?.product_id
        if (productId != null) {
          customizationStore.setProductTextItemSelected(
            productId,
            customTextIndex,
            customTextItemIndex,
            false
          )
        }
        if (onRemoveText) {
          onRemoveText(customTextIndex, customTextItemIndex, canvas)
        }
      } else if ('logo_index' in target && target.logo_index !== undefined) {
        const logoIndex = target.logo_index
        if (onRemoveLogo) {
          onRemoveLogo(logoIndex, canvas)
        } else {
          canvas.remove(target as FabricObject)
        }
        const customizationStore = useCustomizationStore() as {
          customization: { product_id?: number } | null
          removeCustomLogo(productKey: string, logoIndex: number): void
        }
        const productId = customizationStore.customization?.product_id
        if (productId != null) {
          customizationStore.removeCustomLogo(String(productId), logoIndex)
        }
        canvas.requestRenderAll()
        return
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

    // Pin/unpin: show Pin when unpinned (click to pin), PinOff when pinned (click to unpin). Position: bottom-left.
    const renderPinIcon = (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      _styleOverride: unknown,
      fabricObject: unknown
    ) => {
      const obj = fabricObject as { angle?: number; pinned?: boolean }
      const pinned = !!obj.pinned
      const img = pinned ? pinOffImg : pinImg
      const size = controlSize
      ctx.save()
      ctx.translate(left, top)
      const angle = typeof obj.angle === 'number' ? obj.angle : 0
      ctx.rotate(util.degreesToRadians(angle))
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size)
      }
      ctx.restore()
    }

    type TargetWithMeta = FabricObject & {
      logo_index?: number
      custom_text_index?: number
      custom_text_item_index?: number
      pinned?: boolean
      canvas?: Canvas
    }

    const togglePin = (_eventData: unknown, transform: { target?: TargetWithMeta }) => {
      const target = transform?.target
      if (!target) return
      const canvas = target.canvas
      if (!canvas) return
      const customizationStore = useCustomizationStore() as {
        customization: { product_id?: number } | null
        updateCustomLogo(params: {
          custom_logo_index: number
          data: Partial<{ pinned: boolean }>
          productId?: number | null
        }): void
        updateProductTextItem(
          productId: number,
          entryIndex: number,
          itemIndex: number,
          payload: Partial<{ pinned: boolean }>
        ): void
        pushHistoryState(actionTitle: string): void
      }
      const productId = customizationStore.customization?.product_id
      if (productId == null) return

      const currentPinned = !!target.pinned
      const newPinned = !currentPinned

      if (
        'custom_text_index' in target &&
        target.custom_text_index !== undefined &&
        'custom_text_item_index' in target &&
        target.custom_text_item_index !== undefined
      ) {
        customizationStore.updateProductTextItem(
          productId,
          target.custom_text_index,
          target.custom_text_item_index,
          { pinned: newPinned }
        )
      } else {
        const logoIndex =
          'logo_index' in target && target.logo_index !== undefined
            ? target.logo_index
            : getLogoIndexFromTarget?.(target as FabricObject)
        if (logoIndex !== undefined) {
          customizationStore.updateCustomLogo({
            custom_logo_index: logoIndex,
            productId,
            data: { pinned: newPinned }
          })
        } else {
          return
        }
      }

      target.set({
        pinned: newPinned,
        lockMovementX: newPinned,
        lockMovementY: newPinned
      })
      customizationStore.pushHistoryState(newPinned ? 'Pinned' : 'Unpinned')
      canvas.requestRenderAll()
    }

    prototype.controls.pinControl = new Control({
      x: -0.5,
      y: 0.5,
      cursorStyle: 'pointer',
      mouseUpHandler: togglePin,
      actionName: 'pin',
      render: renderPinIcon,
      withConnection: true
    })
  }

  const checkCriticalLoaded = () => {
    criticalImagesLoaded++
    if (criticalImagesLoaded === criticalImagesTotal) setupControls()
  }

  scaleImg.onload = checkCriticalLoaded
  scaleImg.onerror = checkCriticalLoaded
  rotationImg.onload = checkCriticalLoaded
  rotationImg.onerror = checkCriticalLoaded
  deleteImg.onload = checkCriticalLoaded
  deleteImg.onerror = checkCriticalLoaded
  pinImg.onload = () => {}
  pinImg.onerror = () => {}
  pinOffImg.onload = () => {}
  pinOffImg.onerror = () => {}

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
