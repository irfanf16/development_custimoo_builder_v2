import { computed, ref } from 'vue'
import {
  Canvas,
  FabricImage,
  Group,
  loadSVGFromURL,
  util,
  type FabricObject
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
}

export function useFabricPreview(
  applyActiveCustomizationOverrides = computed(() => true)
) {
  // ===== STATE =====
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const canvas = ref<Canvas | null>(null)

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
  }

  function requestRender() {
    if (!canvas.value) return
    canvas.value.requestRenderAll()
  }

  function setZoom(zoom: number) {
    if (!canvas.value) return
    canvas.value.setZoom(zoom)
  }

  function fitObject(obj: any, options?: FitOptions) {
    if (!canvas.value) return
    const padding = options?.padding ?? 8
    const targetW = (canvas.value.getWidth?.() || 800) - padding
    const targetH = (canvas.value.getHeight?.() || 800) - padding
    if ((obj.width || 0) > (obj.height || 0)) obj.scaleToWidth(targetW)
    else obj.scaleToHeight(targetH)
  }

  // ===== LAYER MANAGEMENT =====
  async function addModelLayer(
    url: string,
    composition: GlobalCompositeOperation
  ) {
    if (!canvas.value) return
    const img = await FabricImage.fromURL(fromStorage(url), {
      crossOrigin: 'anonymous'
    })
    fitObject(img)
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

  async function addDesignLayer(url: string, ext: string) {
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

      fitObject(group)
      group.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(group)
      canvas.value.viewportCenterObject(group)
      group.setCoords()
    } else {
      const img = await FabricImage.fromURL(fromStorage(url), {
        crossOrigin: 'anonymous'
      })
      fitObject(img)
      img.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(img as unknown as FabricObject)
      canvas.value.viewportCenterObject(img as unknown as FabricObject)
      img.setCoords()
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
