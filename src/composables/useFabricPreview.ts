import { computed, ref } from 'vue'
import {
  Canvas,
  FabricImage,
  Group,
  loadSVGFromURL,
  util,
  type FabricObject,
  Point
} from 'fabric'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'

type InitOptions = {
  selection?: boolean
  enableRetinaScaling?: boolean
  hoverCursor?: string
  defaultCursor?: string
}

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

export function useFabricPreview(
  applyActiveCustomizationOverrides = computed(() => true)
) {
  // ===== STATE =====
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const canvas = ref<Canvas | null>(null)
  const mainDesignObject = ref<FabricObject | null>(null)

  // ===== UTILITIES =====
  const storageBase = import.meta.env.VITE_APP_STORAGE_URL || ''

  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  // ===== CANVAS MANAGEMENT =====
  function initCanvas(options?: InitOptions) {
    if (!canvasEl.value) return
    canvas.value = new Canvas(canvasEl.value, {
      selection: options?.selection ?? false,
      enableRetinaScaling: options?.enableRetinaScaling ?? true,
      hoverCursor: options?.hoverCursor,
      defaultCursor: options?.defaultCursor
    })
  }

  function setCanvasSize({ width, height }: SizeOptions) {
    if (!canvas.value) return
    canvas.value.setWidth(width)
    canvas.value.setHeight(height)
  }

  function disposeCanvas() {
    if (canvas.value) {
      canvas.value.dispose()
      canvas.value = null
    }
  }

  function clearCanvas() {
    if (!canvas.value) return
    canvas.value.clear()
    mainDesignObject.value = null
  }

  function requestRender() {
    if (!canvas.value) return
    canvas.value.requestRenderAll()
  }

  function setZoom(
    zoom: number,
    center?: { x: number; y: number } | 'asset' | 'canvas'
  ) {
    if (!canvas.value) return
    let point: Point | null = null

    // Default to asset center when available
    if (!center || center === 'asset') {
      const target = mainDesignObject.value as any
      if (target && typeof target.getCenterPoint === 'function') {
        const c = target.getCenterPoint()
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
      easing?: (t: number) => number
    }
  ) {
    if (!canvas.value) return
    const from = canvas.value.getZoom?.() || 1
    const duration = options?.duration ?? 250

    let point: Point | null = null
    const center = options?.center
    if (!center || center === 'asset') {
      const target = mainDesignObject.value as any
      if (target && typeof target.getCenterPoint === 'function') {
        const c = target.getCenterPoint()
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

    const easingFn =
      (util as any)?.ease?.easeInOutCubic ||
      ((t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    util.animate({
      startValue: from,
      endValue: zoom,
      duration,
      easing: options?.easing || easingFn,
      onChange: (value: number) => {
        if (!canvas.value) return
        canvas.value.zoomToPoint(point as Point, value)
        canvas.value.requestRenderAll()
      }
    })
  }

  function fitObject(obj: any, options?: FitOptions) {
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
    // auto: choose the dominant dimension
    if ((obj.width || 0) > (obj.height || 0)) obj.scaleToWidth(maxW)
    else obj.scaleToHeight(maxH)
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
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      globalCompositeOperation: composition
    })
    canvas.value.add(img as unknown as FabricObject)
    canvas.value.viewportCenterObject(img as unknown as FabricObject)
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
    const { objects } = await loadSVGFromURL(fromStorage(url))
    const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
    return util.groupSVGElements(safeObjects) as CustomFabricGroup
  }

  async function addDesignLayer(
    url: string,
    ext: string,
    fitOptions?: FitOptions
  ) {
    if (!canvas.value || !url) return
    if (ext?.toLowerCase() === 'svg') {
      if (!canvas.value || !url) return
      const group = await getSvgGroup(url, ext)
      if (!group) return

      // Apply color overrides from effective svg groups if applyActiveCustomizationOverrides is true
      if (applyActiveCustomizationOverrides.value) {
        const effectiveSvgGroups =
          useEffectiveSelectors().effectiveSvgGroups.value
        if (effectiveSvgGroups) {
          effectiveSvgGroups?.forEach(effectiveGroup => {
            const object = group._objects.find(
              (o: any) => o.id === effectiveGroup.id
            )
            if (object && object.fill !== effectiveGroup.color) {
              object.fill = effectiveGroup.color
            }
          })
        }
      }

      fitObject(group, fitOptions)
      group.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(group)
      canvas.value.viewportCenterObject(group)
      group.setCoords()
      mainDesignObject.value = group as unknown as FabricObject
    } else {
      const img = await FabricImage.fromURL(fromStorage(url), {
        crossOrigin: 'anonymous'
      })
      fitObject(img, fitOptions)
      img.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(img as unknown as FabricObject)
      canvas.value.viewportCenterObject(img as unknown as FabricObject)
      img.setCoords()
      mainDesignObject.value = img as unknown as FabricObject
    }
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
    setZoom,
    animateZoom,
    fitObject,
    // Layer Management
    addModelLayer,
    addDesignLayer,
    getSvgGroup,
    // Animation
    fadeOut,
    fadeIn
  }
}
