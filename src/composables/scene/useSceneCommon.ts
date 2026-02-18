import { computed, shallowRef, type Ref } from 'vue'
import {
  Canvas,
  Group,
  loadSVGFromURL,
  util,
  FabricImage,
  type FabricObject,
  type CanvasOptions
} from 'fabric'
import { useProductsStore } from '@/stores/products/products.store'
import { useStorage } from './useStorage'
import { useSvgGroups } from './useSvgGroups'
import type { useColorCustomization } from './useColorCustomization'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

// Polyfill: ensure requestRenderAll exists (fallback to renderAll)
const canvasProto = Canvas.prototype as Canvas & {
  requestRenderAll?: () => void
  renderAll?: () => void
}
if (!canvasProto.requestRenderAll && canvasProto.renderAll) {
  canvasProto.requestRenderAll = canvasProto.renderAll
}

/**
 * Design data type with file URL and extension
 */
export type DesignData = {
  file_url: string
  file_extension: string
  safe_zone_url?: string
  boundary_url?: string
}

/**
 * Options for loading design
 */
export type LoadDesignOptions = {
  /** Scale mode: 'resolution' scales to exact resolution, 'fit' scales to fit with padding */
  scaleMode?: 'resolution' | 'fit'
  /** Canvas resolution (used when scaleMode is 'resolution') */
  canvasResolution?: number
  /** Canvas width (used when scaleMode is 'fit') */
  canvasWidth?: number
  /** Canvas height (used when scaleMode is 'fit') */
  canvasHeight?: number
  /** Padding for fit mode (default: 10) */
  padding?: number
  /** Whether to center the design in viewport (default: false) */
  centerInViewport?: boolean
  /** Whether to flip the design vertically (default: false, true for 3D scenes) */
  flipY?: boolean
  /** Whether to extract SVG groups automatically (default: true for SVG files) */
  extractSvgGroups?: boolean
  /** SVG groups composable instance to update (if provided, will update this instance instead of creating new one) */
  svgGroupsComposable?: ReturnType<typeof useSvgGroups>
  /** Design object ref to store the loaded design (if provided, will automatically store the design) */
  designObjectRef?: Ref<FabricObject | FabricImage | null>
  /** Color customization composable instance (if provided, will automatically apply customization on load) */
  colorCustomization?: ReturnType<typeof useColorCustomization>
  /** Whether this is the main preview (for customization application) */
  mainPreview?: boolean
  /** Callback after design is loaded and SVG groups extracted (if applicable) - called after automatic operations */
  onLoaded?: (designObject: FabricObject | Group) => void | Promise<void>
}

/**
 * Composable for common scene functionality shared between TwoDScene and ThreeDScene
 * Handles:
 * - Product ID resolution (prop vs store)
 * - Storage URL helper
 * - Basic canvas and design loading operations
 * - Design data resolution (prop vs store)
 */
export function useSceneCommon(
  productId?: Ref<number | null | undefined>,
  side?: Ref<CanvasSide>,
  designProp?: Ref<DesignData | undefined>
) {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const { fromStorage } = useStorage()

  // ===== STATE =====
  const canvas = shallowRef<Canvas | null>(null)
  const design = shallowRef<FabricObject | Group | null>(null)

  // ===== COMPUTED =====
  /**
   * Resolve effective product ID: use prop if provided, otherwise use active product from store
   */
  const effectiveProductId = computed(() => {
    return productId?.value ?? productsStore.activeProductDetails?.id ?? null
  })

  /**
   * Resolve effective design: use prop if provided, otherwise use active design from store
   */
  const effectiveDesign = computed<DesignData | undefined>(() => {
    // Get side value
    const sideValue = side?.value ?? 'front'

    // Use prop if provided
    if (designProp?.value) {
      const { file_url, file_extension, safe_zone_url, boundary_url } = designProp.value
      return { file_url, file_extension, safe_zone_url, boundary_url } as DesignData
    }

    // Fallback to store
    const designDetails = productsStore.activeDesignDetails
    if (!designDetails) return undefined

    // Get design based on side - handle different types (OutputDesignAsset vs production_design)
    let storeDesign: { file_url: string; file_extension?: string }
    let safeZoneDesign: { file_url?: string } | undefined
    let boundaryDesign: { file_url?: string } | undefined

    if (sideValue === 'front') {
      storeDesign = designDetails.front_design
      safeZoneDesign = (designDetails as Record<string, unknown>).frontsafezone_design as
        | { file_url?: string }
        | undefined
      boundaryDesign = (designDetails as Record<string, unknown>).frontboundary_design as
        | { file_url?: string }
        | undefined
    } else if (sideValue === 'back') {
      storeDesign = designDetails.back_design
      safeZoneDesign = (designDetails as Record<string, unknown>).backsafezone_design as
        | { file_url?: string }
        | undefined
      boundaryDesign = (designDetails as Record<string, unknown>).backboundary_design as
        | { file_url?: string }
        | undefined
    } else {
      storeDesign = designDetails.production_design
    }

    const file_url = storeDesign.file_url
    const file_extension = storeDesign.file_extension
    const safe_zone_url = safeZoneDesign?.file_url
    const boundary_url = boundaryDesign?.file_url

    return { file_url, file_extension, safe_zone_url, boundary_url } as DesignData
  })

  // ===== UTILITIES =====
  /**
   * Initialize Fabric.js canvas
   * @param canvasEl - Canvas element to initialize
   * @param width - Canvas width
   * @param height - Canvas height
   * @param options - Optional canvas options (defaults to { selection: false })
   */
  function initCanvas(canvasEl: HTMLCanvasElement | null, width: number, height: number): void {
    // Dispose existing canvas if any
    if (canvas.value) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      canvas.value.dispose()
      canvas.value = null
    }

    if (!canvasEl) return

    // Merge default options with provided options
    const canvasOptions: Partial<CanvasOptions> = {
      selection: false,
      enableRetinaScaling: true,
      enablePointerEvents: true,
      allowTouchScrolling: true
    }

    // markRaw prevents Vue reactivity from interfering with Fabric (fixes missing controls)
    canvas.value = new Canvas(canvasEl, canvasOptions)

    canvas.value.setDimensions({
      width,
      height
    })
  }

  /**
   * Default Fabric.js object options used for design objects
   */
  const defaultDesignObjectOptions = {
    hasControls: false,
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true
  }

  /**
   * Generic function to load SVG or PNG/JPEG images
   * Returns a Fabric.js object (Group for SVG, FabricImage for raster images)
   * @param url - Image URL (relative to storage base)
   * @param fileExtension - File extension (svg, png, jpeg, etc.)
   * @param optionsOverride - Optional object to merge with default options (can override any Fabric.js object property)
   */
  async function loadImageFromURL(
    url: string,
    fileExtension: string = 'png',
    optionsOverride?: Partial<typeof defaultDesignObjectOptions & Record<string, unknown>>
  ): Promise<FabricObject | FabricImage> {
    const fullUrl = fromStorage(url)
    const mergedOptions = { ...defaultDesignObjectOptions, ...optionsOverride }

    if (fileExtension.toLowerCase() === 'svg') {
      // Load SVG
      const { objects } = (await loadSVGFromURL(fullUrl)) as unknown as {
        objects: unknown[]
      }
      const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
      const group = util.groupSVGElements(safeObjects) as Group
      group.set(mergedOptions)
      return group as FabricObject
    } else {
      // Load raster image (PNG, JPEG, etc.)
      const img = await FabricImage.fromURL(fullUrl, {
        crossOrigin: 'anonymous'
      })
      img.set(mergedOptions)
      return img
    }
  }

  /**
   * Load design (SVG or raster image) and add to canvas
   * Generalized function that supports both TwoDScene and ThreeDScene requirements
   */
  async function addDesign(
    designData: DesignData,
    options: LoadDesignOptions = {}
  ): Promise<FabricObject | Group | null> {
    if (!canvas.value || !designData) {
      throw new Error('Canvas not initialized or design data missing')
    }

    const {
      scaleMode = 'fit',
      canvasResolution,
      canvasWidth,
      canvasHeight,
      padding = 10,
      centerInViewport = false,
      flipY = false,
      extractSvgGroups: shouldExtractSvgGroups = true,
      svgGroupsComposable,
      designObjectRef,
      colorCustomization,
      onLoaded
    } = options

    // Build design URL
    const designUrl = designData.file_url + '.' + designData.file_extension

    // Load image (SVG or raster) with flipY option if specified
    const designObj = await loadImageFromURL(
      designUrl,
      designData.file_extension,
      flipY ? { flipY: true } : undefined
    )

    // Canvas may have been disposed during the async load (e.g. user navigated away)
    if (!canvas.value) return null

    // Apply scaling based on mode
    if (scaleMode === 'resolution' && canvasResolution !== undefined) {
      // Scale to exact resolution (for 3D scene)
      designObj.scaleToHeight(canvasResolution)
      designObj.set({
        left: 0,
        top: 0
      })
    } else if (scaleMode === 'fit' && canvasWidth !== undefined && canvasHeight !== undefined) {
      // Scale to fit with padding (for 2D scene)
      if (designObj.width && designObj.height) {
        if (designObj.width > designObj.height) {
          designObj.scaleToWidth(canvasWidth - padding)
        } else {
          designObj.scaleToHeight(canvasHeight - padding)
        }
      }
    }

    designObj.setCoords()
    // Remove existing design first
    if (design.value) {
      const existingDesign = design.value as unknown as FabricObject
      canvas.value.remove(existingDesign)
    }

    // Add to canvas
    const designAsObject = designObj as FabricObject
    canvas.value.add(designAsObject)
    // Center in viewport if requested
    if (centerInViewport) {
      canvas.value.viewportCenterObject(designAsObject)
    }

    canvas.value.sendObjectToBack(designAsObject)
    // Update design ref
    design.value = designAsObject as Group

    // Extract SVG groups if it's an SVG design and extraction is enabled
    // This is done automatically for both components
    const isSvg = designData.file_extension.toLowerCase() === 'svg'
    if (isSvg && shouldExtractSvgGroups && svgGroupsComposable) {
      // Update the provided SVG groups composable instance
      svgGroupsComposable.extractSvgGroups(designAsObject)
    }

    // Store design object in provided ref if available
    if (designObjectRef) {
      designObjectRef.value = designAsObject
    }

    // Apply customization on load if color customization composable is provided
    // The composable handles checking applyCustomizationOverrides internally
    if (colorCustomization) {
      // The composable's applyCustomization function checks applyCustomizationOverrides and mainPreview internally
      colorCustomization.applyCustomization(0)
    }

    // Call onLoaded callback if provided (for component-specific operations)
    // This callback receives the loaded design object and is called after automatic operations
    if (onLoaded) {
      await onLoaded(designAsObject)
      if (!canvas.value) return null
    }

    void canvas.value.requestRenderAll()

    return designAsObject
  }

  /**
   * Dispose canvas
   */
  function disposeCanvas(): void {
    if (canvas.value) {
      void canvas.value.dispose()
      canvas.value = null
    }
    design.value = null
  }

  // ===== RETURN =====
  return {
    // State
    canvas,
    design,
    // Computed
    effectiveProductId,
    effectiveDesign,
    // Actions
    initCanvas,
    addDesign,
    loadImageFromURL,
    disposeCanvas,
    // Utilities
    fromStorage,
    // Stores
    productsStore
  }
}
