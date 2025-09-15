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
  const canvasOptions = ref<Partial<CanvasOptions>>({})

  // ===== UTILITIES =====
  const storageBase = import.meta.env.VITE_APP_STORAGE_URL || ''

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

  function registerBackgroundDragHandlers() {
    if (!canvas.value) return
    let draggingAll = false
    let last: { x: number; y: number } | null = null

    // Start background drag only when no target is hit
    canvas.value.on('mouse:down:before', (opt: any) => {
      if (!canvas.value) return
      const target = canvas.value.findTarget?.(opt.e)
      if (target) return
      const p =
        canvas.value.getScenePoint?.(opt.e) || canvas.value.getPointer(opt.e)
      last = { x: p.x, y: p.y }
      draggingAll = true
    })

    canvas.value.on('mouse:move', (opt: any) => {
      if (!canvas.value || !draggingAll || !last) return
      const p =
        canvas.value.getScenePoint?.(opt.e) || canvas.value.getPointer(opt.e)
      const dx = p.x - last.x
      const dy = p.y - last.y
      if (dx === 0 && dy === 0) return
      const objs = canvas.value.getObjects()
      for (const o of objs) {
        o.set({ left: (o.left || 0) + dx, top: (o.top || 0) + dy } as any)
        o.setCoords()
      }
      last = { x: p.x, y: p.y }
      canvas.value.requestRenderAll()
    })

    canvas.value.on('mouse:up', () => {
      draggingAll = false
      last = null
    })
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
        selectable: canvasOptions.value.selection ?? false,
        evented: canvasOptions.value.enablePointerEvents ?? false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(group)
      canvas.value.viewportCenterObject(group)
      group.setCoords()
      mainDesignObject.value = group as FabricObject
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
    registerBackgroundDragHandlers,
    // Layer Management
    addModelLayer,
    addDesignLayer,
    getSvgGroup,
    // Animation
    fadeOut,
    fadeIn
  }
}
