import { computed, ref } from 'vue'
import {
  Canvas,
  FabricImage,
  Group,
  loadSVGFromURL,
  util,
  type FabricObject,
  type CanvasOptions,
  Point
} from 'fabric'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { CustomLogo } from '@/services/logos/types'

type SizeOptions = {
  width: number
  height: number
}

type FitOptions = {
  padding?: number
  // When provided, determines which dimension to scale by. Defaults to automatic based on object aspect ratio.
  scaleBy?: 'auto' | 'width' | 'height'
  // Percentage (0..1) of the canvas height to occupy when scaling by height or auto chooses height
  heightPercent?: number
  // Percentage (0..1) of the canvas width to occupy when scaling by width or auto chooses width
  widthPercent?: number
}

export function useFabricPreview(applyActiveCustomizationOverrides = computed(() => true)) {
  // ===== STATE =====
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const canvas = ref<Canvas | null>(null)
  const mainDesignObject = ref<FabricObject | null>(null)
  const canvasOptions = ref<Partial<CanvasOptions>>({})
  const logoLayers = ref<Map<string, FabricObject>>(new Map())
  const originalLogoSizes = new Map<string, { width: number; height: number }>()

  // ===== UTILITIES =====
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''

  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  // ===== CANVAS MANAGEMENT =====
  function initCanvas(options?: Partial<CanvasOptions>) {
    canvasOptions.value = options ?? {}
    if (!canvasEl.value) return
    canvas.value = new Canvas(canvasEl.value, options)
  }

  function setCanvasSize({ width, height }: SizeOptions) {
    if (!canvas.value) return
    canvas.value.setDimensions({ width, height })
  }

  function disposeCanvas() {
    if (canvas.value) {
      void canvas.value.dispose()
      canvas.value = null
    }
  }

  function clearCanvas(options?: { silent?: boolean }) {
    if (!canvas.value) return
    const c = canvas.value
    // Remove all objects synchronously to avoid visual stacking between rapid rerenders
    const objects = c.getObjects().slice()
    for (const obj of objects) {
      c.remove(obj)
    }
    c.discardActiveObject()
    if (!options?.silent) c.requestRenderAll()
    mainDesignObject.value = null
    logoLayers.value.clear()
  }

  function requestRender() {
    if (!canvas.value) return
    // Ignore returned promise-like
    void canvas.value.requestRenderAll()
  }

  async function withCanvasBatch<T>(builder: () => Promise<T> | T) {
    if (!canvas.value) return undefined as unknown as T
    const c = canvas.value
    const prev = c.renderOnAddRemove
    c.renderOnAddRemove = false
    try {
      const result = await builder()
      return result
    } finally {
      c.renderOnAddRemove = prev
      c.requestRenderAll()
    }
  }

  function setZoom(zoom: number, center?: { x: number; y: number } | 'asset' | 'canvas') {
    if (!canvas.value) return
    let point: Point | null = null

    // Default to asset center when available
    if (!center || center === 'asset') {
      const target = mainDesignObject.value
      if (
        target &&
        typeof (
          target as unknown as {
            getCenterPoint?: () => { x: number; y: number }
          }
        ).getCenterPoint === 'function'
      ) {
        const c = (
          target as unknown as {
            getCenterPoint: () => { x: number; y: number }
          }
        ).getCenterPoint()
        point = new Point(c.x, c.y)
      }
    }

    if (!point) {
      if (center && center !== 'asset' && center !== 'canvas') {
        point = new Point(center.x, center.y)
      } else {
        const { left, top } = canvas.value.getCenter()
        point = new Point(left, top)
      }
    }

    canvas.value.zoomToPoint(point, zoom)
  }

  function animateZoom(
    zoom: number,
    options?: {
      center?: { x: number; y: number } | 'asset' | 'canvas'
      duration?: number
      easing?: (
        timeElapsed: number,
        startValue: number,
        byValue: number,
        duration: number
      ) => number
    }
  ) {
    if (!canvas.value) return
    const from = canvas.value.getZoom?.() || 1
    const duration = options?.duration ?? 250

    let point: Point | null = null
    const center = options?.center
    if (!center || center === 'asset') {
      const target = mainDesignObject.value
      if (
        target &&
        typeof (
          target as unknown as {
            getCenterPoint?: () => { x: number; y: number }
          }
        ).getCenterPoint === 'function'
      ) {
        const c = (
          target as unknown as {
            getCenterPoint: () => { x: number; y: number }
          }
        ).getCenterPoint()
        point = new Point(c.x, c.y)
      }
    }
    if (!point) {
      if (center && center !== 'asset' && center !== 'canvas') {
        point = new Point(center.x, center.y)
      } else {
        const { left, top } = canvas.value.getCenter()
        point = new Point(left, top)
      }
    }

    if (Math.abs(from - zoom) < 0.0001) {
      canvas.value.zoomToPoint(point, zoom)
      return
    }

    // Default easing function for Fabric.js 6.7.1
    const defaultEasing = (
      timeElapsed: number,
      startValue: number,
      byValue: number,
      duration: number
    ) => {
      const t = timeElapsed / duration
      return startValue + byValue * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    }

    util.animate({
      startValue: from,
      endValue: zoom,
      duration,
      easing: options?.easing || defaultEasing,
      onChange: (value: number) => {
        if (!canvas.value) return
        canvas.value.zoomToPoint(point, value)
        canvas.value.requestRenderAll()
      }
    })
  }

  type ScalableFabricObject = {
    scaleToWidth: (w: number) => void
    scaleToHeight: (h: number) => void
    width?: number
    height?: number
  }

  function fitObject(obj: ScalableFabricObject, options?: FitOptions) {
    if (!canvas.value) return
    const padding = options?.padding ?? 8
    const targetW = (canvas.value.getWidth?.() || 800) - padding
    const targetH = (canvas.value.getHeight?.() || 800) - padding

    const widthPercent = options?.widthPercent ?? 1
    const heightPercent = options?.heightPercent ?? 1

    const maxW = Math.max(0, targetW * widthPercent)
    const maxH = Math.max(0, targetH * heightPercent)

    const scaleBy = options?.scaleBy ?? 'auto'

    if (scaleBy === 'width') {
      obj.scaleToWidth(maxW)
      return
    }
    if (scaleBy === 'height') {
      obj.scaleToHeight(maxH)
      return
    }
    // auto: proper contain fit - scale by the most constraining dimension
    // Calculate scale ratios for both dimensions
    const widthRatio = maxW / (obj.width || 1)
    const heightRatio = maxH / (obj.height || 1)

    // Use the smaller ratio to ensure the object fits within both constraints
    if (widthRatio < heightRatio) {
      obj.scaleToWidth(maxW)
    } else {
      obj.scaleToHeight(maxH)
    }
  }

  // ===== LAYER MANAGEMENT =====
  async function addModelLayer(
    url: string,
    composition: GlobalCompositeOperation,
    fitOptions?: FitOptions
  ) {
    if (!canvas.value) return
    const img = await FabricImage.fromURL(fromStorage(url), {
      crossOrigin: 'anonymous'
    })
    fitObject(img, fitOptions)
    img.set({
      selectable: canvasOptions.value.selection ?? false,
      evented: canvasOptions.value.enablePointerEvents ?? false,
      originX: 'center',
      originY: 'center',
      globalCompositeOperation: composition
    })
    canvas.value.add(img as FabricObject)
    canvas.value.viewportCenterObject(img as FabricObject)
    img.setCoords()
  }

  type CustomFabricGroup = Group & {
    _objects: FabricObject & { id: string }[]
  }

  async function getSvgGroup(url: string, ext: string) {
    if (ext?.toLowerCase() === 'svg') {
      if (!url.toLowerCase().endsWith('.svg')) {
        url += '.svg'
      }
    }
    const { objects } = (await loadSVGFromURL(fromStorage(url))) as unknown as {
      objects: unknown[]
    }
    const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
    return util.groupSVGElements(safeObjects) as CustomFabricGroup
  }

  async function addDesignLayer(url: string, ext: string, fitOptions?: FitOptions) {
    if (!canvas.value || !url) return
    if (ext?.toLowerCase() === 'svg') {
      if (!canvas.value || !url) return
      const group = await getSvgGroup(url, ext)
      if (!group) return

      // Apply color overrides from effective svg groups if applyActiveCustomizationOverrides is true
      if (applyActiveCustomizationOverrides.value) {
        const effectiveSvgGroups = useEffectiveSelectors().effectiveSvgGroups.value
        if (effectiveSvgGroups) {
          effectiveSvgGroups.forEach(effectiveGroup => {
            const object = group._objects.find(o => {
              const candidate = o as unknown as { id?: string }
              return candidate.id === effectiveGroup.id
            }) as (FabricObject & { fill?: string }) | undefined
            if (object && object.fill !== effectiveGroup.color) {
              object.fill = effectiveGroup.color
            }
          })
        }
      }

      fitObject(group, fitOptions)
      const fabricGroup = group as FabricObject
      fabricGroup.set({
        selectable: canvasOptions.value.selection ?? false,
        evented: canvasOptions.value.enablePointerEvents ?? false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(fabricGroup)
      canvas.value.viewportCenterObject(fabricGroup)
      fabricGroup.setCoords()
      mainDesignObject.value = fabricGroup
    } else {
      const img = await FabricImage.fromURL(fromStorage(url), {
        crossOrigin: 'anonymous'
      })
      fitObject(img, fitOptions)
      img.set({
        selectable: canvasOptions.value.selection ?? false,
        evented: canvasOptions.value.enablePointerEvents ?? false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(img as FabricObject)
      canvas.value.viewportCenterObject(img as FabricObject)
      img.setCoords()
      mainDesignObject.value = img as FabricObject
    }
  }

  /**
   * Adds a logo layer to the canvas honoring placement coordinates, size and rotation
   * Coordinates are expected in the original product coordinate space (default 600x600)
   */
  async function addLogoLayer(
    logo: CustomLogo,
    options?: {
      originalCanvasSize?: number // base coordinate system, defaults to 600
      respectScaleProps?: boolean // apply logo.scaleX/scaleY on top of computed scale
    }
  ) {
    if (!canvas.value || !logo?.url) return

    const baseSize = options?.originalCanvasSize ?? 600

    // Map product coordinates (base 600x600) into the DESIGN bounds, not the whole canvas.
    // This ensures positioning stays aligned even when the design is scaled and centered.
    const main = mainDesignObject.value as FabricObject | null

    // Compute design-space unit scale (UNIFORM) and top-left offset within the canvas
    let unitScale = 1
    let designLeftOffset = 0
    let designTopOffset = 0

    if (main) {
      const withScaled = main as unknown as {
        getScaledWidth?: () => number
        getScaledHeight?: () => number
        width?: number
        height?: number
        scaleX?: number
        scaleY?: number
        left?: number
        top?: number
      }
      const scaledW = withScaled.getScaledWidth
        ? withScaled.getScaledWidth()
        : (withScaled.width || 0) * (withScaled.scaleX || 1)
      const scaledH = withScaled.getScaledHeight
        ? withScaled.getScaledHeight()
        : (withScaled.height || 0) * (withScaled.scaleY || 1)

      // Map product's 600x600 square into the inscribed square within the scaled design
      const squareSide = Math.min(scaledW || 0, scaledH || 0)
      unitScale = (squareSide || 0) / baseSize

      // main's origin is 'center'
      const centerX = withScaled.left || 0
      const centerY = withScaled.top || 0
      designLeftOffset = centerX - (scaledW || 0) / 2
      designTopOffset = centerY - (scaledH || 0) / 2
    } else {
      // Fallback: map into full canvas (less precise if design is scaled/centered)
      const canvasHeight = canvas.value.getHeight?.() || 0
      // Fallback assumes design fills height; inscribed square side equals canvasHeight
      unitScale = canvasHeight / baseSize
      designLeftOffset = 0
      designTopOffset = 0
    }

    const img = await FabricImage.fromURL(fromStorage(logo.url))

    const naturalWidth = img.width || 1
    const naturalHeight = img.height || 1

    // Compute uniform scale to match target height in the current canvas space
    const targetHeightPx = (Number(logo.height) || 0) * unitScale
    const safeImgHeight = img.height || 1
    const baseScale = targetHeightPx > 0 ? targetHeightPx / safeImgHeight : 1
    const scaleX = options?.respectScaleProps && logo.scaleX ? baseScale * logo.scaleX : baseScale
    const scaleY = options?.respectScaleProps && logo.scaleY ? baseScale * logo.scaleY : baseScale

    // Position at (x_axis, y_axis) as the CENTER within the scaled design bounds
    // Use inner offsets to account for inscribed square inside the design's bounding box
    const withScaled2 = main as unknown as {
      getScaledWidth?: () => number
      getScaledHeight?: () => number
      width?: number
      height?: number
      scaleX?: number
      scaleY?: number
    } | null
    const scaledW = withScaled2?.getScaledWidth
      ? withScaled2.getScaledWidth()
      : (withScaled2?.width || 0) * (withScaled2?.scaleX || 1)
    const scaledH = withScaled2?.getScaledHeight
      ? withScaled2.getScaledHeight()
      : (withScaled2?.height || 0) * (withScaled2?.scaleY || 1)
    const squareSide = Math.min(scaledW || 0, scaledH || 0)
    const innerOffsetX = ((scaledW || 0) - squareSide) / 2
    const innerOffsetY = ((scaledH || 0) - squareSide) / 2

    const cx = designLeftOffset + innerOffsetX + (Number(logo.x_axis) || 0) * unitScale
    const cy = designTopOffset + innerOffsetY + (Number(logo.y_axis) || 0) * unitScale

    img.set({
      selectable: canvasOptions.value.selection ?? false,
      evented: canvasOptions.value.enablePointerEvents ?? false,
      originX: 'center',
      originY: 'center',
      left: cx,
      top: cy,
      angle: Number(logo.rotation) || 0,
      scaleX,
      scaleY
    })

    canvas.value.add(img as FabricObject)
    originalLogoSizes.set(String(logo.id), {
      width: naturalWidth,
      height: naturalHeight
    })
    img.setCoords()
    canvas.value.requestRenderAll()
    logoLayers.value.set(String(logo.id), img as FabricObject)
    return img as FabricObject
  }

  function removeLogoLayer(logoId: string) {
    const id = String(logoId)
    const layer = logoLayers.value.get(id)
    if (!layer || !canvas.value) return
    canvas.value.remove(layer as unknown as FabricObject)
    logoLayers.value.delete(id)
    canvas.value.requestRenderAll()
    originalLogoSizes.delete(id)
  }

  function updateLogoLayer(
    logoId: string,
    props: Partial<{
      left: number
      top: number
      angle: number
      scaleX: number
      scaleY: number
      height: number
    }>
  ) {
    const layer = logoLayers.value.get(String(logoId))
    if (!layer) return
    const cloneProps = { ...props }
    if ('height' in cloneProps) {
      const base = originalLogoSizes.get(String(logoId))
      const height = cloneProps.height ?? base?.height ?? layer.height ?? 1
      if (base && base.height) {
        const scale = height / base.height
        cloneProps.scaleY = scale
        cloneProps.scaleX = scale
      }
      delete cloneProps.height
    }
    if ('angle' in cloneProps) {
      layer.set({ angle: cloneProps.angle })
      delete cloneProps.angle
    }
    layer.set(cloneProps)
    layer.setCoords()
    canvas.value?.requestRenderAll()
  }

  async function replaceLogoTexture(logoId: string, url: string) {
    const layer = logoLayers.value.get(String(logoId))
    if (!layer || !canvas.value) return
    const img = await FabricImage.fromURL(fromStorage(url), { crossOrigin: 'anonymous' })
    if (typeof (layer as FabricImage).setSrc === 'function') {
      await (layer as FabricImage).setSrc(fromStorage(url), { crossOrigin: 'anonymous' })
    } else if ('setElement' in layer && typeof (layer as FabricImage).setElement === 'function') {
      ;(layer as FabricImage).setElement(img.getElement())
    }
    layer.set({ width: img.width, height: img.height })
    layer.setCoords()
    canvas.value.requestRenderAll()
    originalLogoSizes.set(String(logoId), {
      width: img.width || 1,
      height: img.height || 1
    })
  }

  function computeLogoPlacement(
    _logo: CustomLogo,
    options?: {
      originalCanvasSize?: number
      respectScaleProps?: boolean
    }
  ) {
    if (!canvas.value) return null

    const baseSize = options?.originalCanvasSize ?? 600
    const main = mainDesignObject.value as FabricObject | null

    let unitScale = 1
    let designLeftOffset = 0
    let designTopOffset = 0

    if (main) {
      const withScaled = main as unknown as {
        getScaledWidth?: () => number
        getScaledHeight?: () => number
        width?: number
        height?: number
        scaleX?: number
        scaleY?: number
        left?: number
        top?: number
      }
      const scaledW = withScaled.getScaledWidth
        ? withScaled.getScaledWidth()
        : (withScaled.width || 0) * (withScaled.scaleX || 1)
      const scaledH = withScaled.getScaledHeight
        ? withScaled.getScaledHeight()
        : (withScaled.height || 0) * (withScaled.scaleY || 1)
      const squareSide = Math.min(scaledW || 0, scaledH || 0)
      unitScale = (squareSide || 0) / baseSize
      const centerX = withScaled.left || 0
      const centerY = withScaled.top || 0
      designLeftOffset = centerX - (scaledW || 0) / 2
      designTopOffset = centerY - (scaledH || 0) / 2
    } else {
      const canvasHeight = canvas.value.getHeight?.() || 0
      unitScale = canvasHeight / baseSize
      designLeftOffset = 0
      designTopOffset = 0
    }

    return {
      unitScale,
      designLeftOffset,
      designTopOffset
    }
  }

  function updateLogoLayerGeometry(logo: CustomLogo, options?: { originalCanvasSize?: number }) {
    const layer = logoLayers.value.get(String(logo.id))
    if (!layer) return
    const placement = computeLogoPlacement(logo, options)
    if (!placement) return
    const { unitScale, designLeftOffset, designTopOffset } = placement

    const dimensions = originalLogoSizes.get(String(logo.id)) || {
      width: layer.width || 1,
      height: layer.height || 1
    }
    const targetHeightPx = (Number(logo.height) || 0) * unitScale
    const heightScale = targetHeightPx > 0 ? targetHeightPx / (dimensions.height || 1) : null
    let scale = heightScale ?? 1
    if (logo.scaleY) scale *= logo.scaleY

    const main = mainDesignObject.value as unknown as {
      getScaledWidth?: () => number
      getScaledHeight?: () => number
      width?: number
      height?: number
      scaleX?: number
      scaleY?: number
    }
    const scaledW = main?.getScaledWidth
      ? main.getScaledWidth()
      : (main?.width || 0) * (main?.scaleX || 1)
    const scaledH = main?.getScaledHeight
      ? main.getScaledHeight()
      : (main?.height || 0) * (main?.scaleY || 1)
    const squareSide = Math.min(scaledW || 0, scaledH || 0)
    const innerOffsetX = ((scaledW || 0) - squareSide) / 2
    const innerOffsetY = ((scaledH || 0) - squareSide) / 2

    const left = designLeftOffset + innerOffsetX + (Number(logo.x_axis) || 0) * unitScale
    const top = designTopOffset + innerOffsetY + (Number(logo.y_axis) || 0) * unitScale

    const angle = Number(logo.rotation ?? 0)

    layer.set({
      left,
      top,
      angle,
      scaleX: scale,
      scaleY: scale
    })
    layer.setCoords()
    canvas.value?.requestRenderAll()
  }

  // ===== ANIMATION =====
  async function fadeOut(durationMs = 150) {
    if (!canvasEl.value) return
    canvasEl.value.style.opacity = '0'
    await new Promise(resolve => setTimeout(resolve, durationMs))
  }

  function fadeIn() {
    if (!canvasEl.value) return
    canvasEl.value.style.opacity = '1'
  }

  // ===== RETURN =====
  return {
    // State
    canvasEl,
    canvas,
    // Canvas Management
    initCanvas,
    setCanvasSize,
    disposeCanvas,
    clearCanvas,
    requestRender,
    withCanvasBatch,
    setZoom,
    animateZoom,
    fitObject,
    // Layer Management
    addModelLayer,
    addDesignLayer,
    addLogoLayer,
    getSvgGroup,
    removeLogoLayer,
    updateLogoLayer,
    replaceLogoTexture,
    logoLayers,
    updateLogoLayerGeometry,
    // Animation
    fadeOut,
    fadeIn
  }
}
