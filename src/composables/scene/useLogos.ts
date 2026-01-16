import { type ShallowRef } from 'vue'
import {
  FabricImage,
  Object as FabricObjectClass,
  Control,
  type FabricObject,
  type Canvas
} from 'fabric'
import { useStorage } from './useStorage'
import { useSceneCommon } from './useSceneCommon'
import { FABRIC_CONTROL_VISIBILITY } from './useFabricControls'
import type { CustomLogo } from '@/services/logos/types'

/** Build a full signature for a logo (used for diffing) */
export function getLogoSignature(logo: CustomLogo): string {
  return JSON.stringify({
    url: logo.url,
    side: logo.side,
    x: logo.x_axis,
    y: logo.y_axis,
    rot: logo.rotation,
    sx: logo.scaleX,
    sy: logo.scaleY,
    height: logo.height
  })
}

/** Build a url+side signature (used for fallback matching) */
export function getLogoSignatureUrlSide(logo: CustomLogo): string {
  return `${logo.url}|${logo.side}`
}

/**
 * Options for positioning logo on canvas
 */
export type LogoPositionOptions = {
  /** X position (2D) or calculated 3D position */
  x: number
  /** Y position (2D) or calculated 3D position */
  y: number
}

/**
 * Options for adding logo to canvas
 */
export type AddLogoOptions = {
  /** Logo object from custom_logos array */
  logo: CustomLogo
  /** Explicit logo index (provided by caller) */
  logoIndex?: number
  /** Signature of logo (required for matching) */
  signature: string
  /** Url+side signature (required for matching) */
  signatureUrlSide: string
  /** Whether this is being called during initial load */
  fromLoad?: boolean
  /** Whether this is main preview */
  mainPreview?: boolean
  /** Current product ID */
  productId: number | null
  /** Canvas instance */
  canvas: Canvas | null
  /** Logo objects storage (for tracking added logos) - stored in a map keyed by index */
  logoObjects: ShallowRef<Map<number, FabricImage>>
  /** Function to calculate position (2D or 3D) */
  calculatePosition: (logo: CustomLogo) => Promise<LogoPositionOptions> | LogoPositionOptions
  /** Function to calculate rotation angle */
  calculateRotation: (rotation: number) => number
  /** Function to calculate scale ratios */
  calculateScaleRatios: () => { widthRatio: number; heightRatio: number }
  /** Function to apply clipping (safe zone or clip path) */
  applyClipPath?: (img: FabricImage) => void | Promise<void>
  /** Function to render canvas after adding logo */
  renderCanvas: () => void
  /** Function to update store with logo position/size (optional) */
  updateStore?: (
    logoIndex: number,
    data: {
      x_axis_3d?: number
      y_axis_3d?: number
      originalWidth?: number
      originalHeight?: number
      actualWidth?: number
      actualHeight?: number
    }
  ) => void
  /** Control visibility settings */
  controlVisibility?: typeof FABRIC_CONTROL_VISIBILITY
  /** Whether canvas selection is enabled */
  canvasSelection?: boolean
  /** Whether to flip logo horizontally (for 3D) */
  flipX?: boolean
}

export type SyncLogosOptions = {
  /** New logos array to diff against existing */
  newLogos: CustomLogo[]
  /** Canvas instance */
  canvas: Canvas | null
  /** Logo objects storage map */
  logoObjects: ShallowRef<Map<number, FabricImage>>
  /** Optional clipping application (safe zone / boundary) */
  applyClipPath?: (img: FabricImage) => void | Promise<void>
  /** Function used to add a logo when no match exists */
  addLogo: (logo: CustomLogo, logoIndex: number) => Promise<void>
  /** Position calculator (2D or 3D) */
  calculatePosition: (logo: CustomLogo) => { x: number; y: number }
  /** Rotation calculator */
  calculateRotation: (rotation: number) => number
  /** Scale ratios calculator */
  calculateScaleRatios: () => { widthRatio: number; heightRatio: number }
  /** Signature calculator */
  getSignature: (logo: CustomLogo) => string
  /** Url+side signature calculator */
  getSignatureUrlSide: (logo: CustomLogo) => string
  /** Optional filter to skip logos (e.g., by side) */
  filterLogo?: (logo: CustomLogo) => boolean
  /** Optional callback after sync to trigger renders */
  onAfterSync?: () => void
}

/**
 * Check if logo object is empty or invalid
 */
function isLogoEmpty(logo: CustomLogo | null | undefined): boolean {
  if (!logo) return true
  if (typeof logo !== 'object') return true
  return !logo.url || logo.url.trim() === ''
}

/**
 * Add logo to canvas
 */
export async function addLogoToCanvas(options: AddLogoOptions): Promise<void> {
  const {
    logo,
    logoIndex = 0,
    signature,
    signatureUrlSide,
    mainPreview = false,
    canvas,
    logoObjects,
    calculatePosition,
    calculateRotation,
    calculateScaleRatios,
    applyClipPath,
    renderCanvas,
    updateStore,
    controlVisibility = FABRIC_CONTROL_VISIBILITY,
    canvasSelection = true,
    flipX = false
  } = options

  // Validate inputs
  if (!canvas || isLogoEmpty(logo)) {
    return Promise.resolve()
  }

  // Prepare logo URL (relative path for useSceneCommon)
  const logoRelativeUrl = logo.url.trim() + '?nocache=11'

  // Load image using common image load function
  return (async () => {
    // Use common image loading function from useSceneCommon
    // Extract file extension from URL or default to 'png'
    const fileExtension = logo.url.split('.').pop()?.toLowerCase() || 'png'
    const { loadImageFromURL } = useSceneCommon()

    // Load image (loadImageFromURL handles fromStorage internally)
    const img = (await loadImageFromURL(logoRelativeUrl, fileExtension, {})) as FabricImage

    // Calculate scale ratios
    const { widthRatio, heightRatio } = calculateScaleRatios()

    // Scale image based on aspect ratio
    const aspectRatio = img.width && img.height ? img.width / img.height : 1
    if (aspectRatio > 1) {
      img.scaleToWidth(logo.height * widthRatio)
    } else {
      img.scaleToHeight(logo.height * heightRatio)
    }

    // Calculate position
    const position = await Promise.resolve(calculatePosition(logo))

    // Calculate rotation
    const rotation = calculateRotation(logo.rotation)

    // Set image properties
    img.set({
      id: `logo_${logoObjects.value.size}`,
      left: position.x,
      top: position.y,
      angle: rotation,
      selectable: canvasSelection,
      hasControls: logo.haveControls ?? true,
      hasBorders: true, // always show selection box so handles/icons are visible
      evented: true,
      globalCompositeOperation: 'source-atop',
      padding: 15,
      cornerSize: 30,
      flipX: flipX,
      type: 'logo',
      centeredScaling: true,
      originX: 'center',
      originY: 'center',
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      lockScalingFlip: !flipX, // 2D locks scaling flip
      perPixelTargetFind: false,
      targetFindTolerance: 10,
      hoverCursor: 'move',
      // metadata for matching
      signature,
      signatureUrlSide
    })

    // Apply scale if provided
    if (logo.scaleX && logo.scaleY) {
      img.scaleX = logo.scaleX * widthRatio
      img.scaleY = logo.scaleY * heightRatio
    }

    // Ensure controls exist on the instance (clone from prototype for safety)
    const protoControls = (
      FabricObjectClass.prototype as unknown as { controls?: Record<string, Control> }
    ).controls
    if (protoControls) {
      img.controls = { ...(img.controls ?? {}), ...protoControls }
    }

    // Set control visibility (custom icons by default)
    img.setControlsVisibility(controlVisibility)
    img.setCoords()

    // Apply clipping (safe zone or clip path)
    if (applyClipPath) {
      await Promise.resolve(applyClipPath(img))
    }

    // Add to canvas
    canvas.add(img as FabricObject)

    // Update store if main preview
    if (mainPreview && updateStore) {
      const convertedWidth = img.width && img.scaleX ? img.width * img.scaleX : 0
      const convertedHeight = img.height && img.scaleY ? img.height * img.scaleY : 0

      updateStore(logoIndex, {
        x_axis_3d: position.x,
        y_axis_3d: position.y,
        originalWidth: convertedWidth,
        originalHeight: convertedHeight,
        actualWidth: img.width ?? 0,
        actualHeight: img.height ?? 0
      })
    }

    // Store reference in map
    logoObjects.value.set(logoIndex, img)

    // Render canvas
    renderCanvas()
  })()
}

/**
 * Generalized logo sync logic used by 2D and 3D scenes.
 * Matches by full signature first, then by url+side with mutation, removes stale, adds new.
 */
export async function syncLogosOnCanvas(options: SyncLogosOptions): Promise<void> {
  const {
    newLogos,
    canvas,
    logoObjects,
    applyClipPath,
    addLogo,
    calculatePosition,
    calculateRotation,
    calculateScaleRatios,
    getSignature,
    getSignatureUrlSide,
    filterLogo,
    onAfterSync
  } = options

  if (!canvas) return

  // Existing objects with signatures
  const available = Array.from(logoObjects.value.entries()).map(([idx, obj]) => ({
    idx,
    obj: obj as unknown as FabricImage,
    signature: (obj as unknown as { signature?: string }).signature,
    signatureUrlSide: (obj as unknown as { signatureUrlSide?: string }).signatureUrlSide
  }))

  // New logos with signatures
  const newLogosWithSignatures = newLogos.map((newLogo, idx) => ({
    idx,
    logo: newLogo,
    signature: getSignature(newLogo),
    signatureUrlSide: getSignatureUrlSide(newLogo)
  }))

  const nextMap = new Map<number, FabricImage>()
  const matchedIdx = new Set<number>()

  for (const entry of newLogosWithSignatures) {
    const { idx, logo, signature, signatureUrlSide } = entry
    if (!logo || !logo.url) continue
    if (filterLogo && !filterLogo(logo)) continue

    // Exact match
    let matchIndex = available.findIndex(a => a.signature === signature)
    if (matchIndex >= 0) {
      const match = available.splice(matchIndex, 1)[0]
      if (match) {
        nextMap.set(idx, match.obj as unknown as FabricImage)
        matchedIdx.add(idx)
        continue
      }
    }

    // url+side match with mutation
    matchIndex = available.findIndex(a => a.signatureUrlSide === signatureUrlSide)
    if (matchIndex >= 0) {
      const match = available.splice(matchIndex, 1)[0]
      if (match) {
        const { widthRatio, heightRatio } = calculateScaleRatios()
        const position = calculatePosition(logo)
        const angle = calculateRotation(logo.rotation)
        match.obj.set({
          left: position.x,
          top: position.y,
          angle,
          signature: getSignature(logo),
          signatureUrlSide: getSignatureUrlSide(logo)
        })

        // Scale image based on aspect ratio
        const aspectRatio =
          match.obj.width && match.obj.height ? match.obj.width / match.obj.height : 1
        if (aspectRatio > 1) {
          match.obj.scaleToWidth((logo.height ?? 0) * widthRatio)
        } else {
          match.obj.scaleToHeight((logo.height ?? 0) * heightRatio)
        }

        // Apply provided scale if available
        if (logo.scaleX && logo.scaleY) {
          match.obj.scaleX = logo.scaleX * widthRatio
          match.obj.scaleY = logo.scaleY * heightRatio
        }

        if (applyClipPath) {
          await Promise.resolve(applyClipPath(match.obj))
        }

        match.obj.setCoords()
        nextMap.set(idx, match.obj as unknown as FabricImage)
        matchedIdx.add(idx)
      }
    }
  }

  // Remove leftover unmatched objects
  available.forEach(entry => {
    canvas.remove(entry.obj as FabricObject)
  })

  // Apply new map immediately to keep order
  logoObjects.value = nextMap

  // Add new logos that were not matched
  for (const entry of newLogosWithSignatures) {
    if (matchedIdx.has(entry.idx)) continue
    const { idx, logo } = entry
    if (!logo || !logo.url) continue
    if (filterLogo && !filterLogo(logo)) continue
    await addLogo(logo, idx)
  }

  if (onAfterSync) {
    onAfterSync()
  }
}

/**
 * Delete logo from canvas by logo_index
 */
export function deleteLogoFromCanvas(
  logoIndex: number,
  canvas: Canvas | null,
  logoObjects: ShallowRef<Map<number, FabricImage>>
): void {
  if (!canvas) return

  const logo = logoObjects.value.get(logoIndex)
  if (logo) {
    canvas.remove(logo as FabricObject)
    canvas.requestRenderAll()
    logoObjects.value.delete(logoIndex)
  }
}

/**
 * Reset all logos from canvas
 */
export function resetLogosFromCanvas(
  canvas: Canvas | null,
  logoObjects: ShallowRef<Map<number, FabricImage>>
): void {
  if (!canvas) return

  logoObjects.value.forEach(logo => {
    canvas.remove(logo as FabricObject)
  })

  logoObjects.value.clear()

  if (canvas) {
    canvas.requestRenderAll()
  }
}

/**
 * Composable for logo functionality
 * Provides reusable logo management functions
 */
export function useLogos() {
  const { fromStorage } = useStorage()

  return {
    addLogoToCanvas,
    deleteLogoFromCanvas,
    resetLogosFromCanvas,
    isLogoEmpty,
    fromStorage
  }
}
