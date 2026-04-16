<script setup lang="ts">
  import {
    onMounted,
    onBeforeUnmount,
    computed,
    watch,
    nextTick,
    getCurrentInstance,
    ref,
    type Ref,
    type ComponentPublicInstance,
    shallowRef
  } from 'vue'
  import {
    FabricImage,
    Canvas,
    Group,
    Rect,
    FabricText,
    Point,
    type FabricObject,
    type TMat2D
  } from 'fabric'
  import * as fabric from 'fabric'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import { filterFields } from '@/lib/utils'
  import { toRef } from 'vue'
  import {
    useSceneCommon,
    useSvgGroups,
    useColorCustomization,
    useColorGrouping,
    addLogoToCanvas,
    addTextToCanvas,
    getTextObjectKey,
    useDimensionDisplayComputed,
    setupFabricControls,
    deleteLogoFromCanvas,
    syncLogosOnCanvas,
    syncTextsOnCanvas,
    FABRIC_CONTROL_VISIBILITY,
    useFixedLogos,
    create2DFixedLogoGeometry,
    computeFixedLogosList
  } from '@/composables/scene'
  import type { CustomLogo } from '@/services/logos/types'
  import {
    getImageFrom2DCanvas,
    type GetImageFromCanvasOptions
  } from '@/composables/scene/useCanvasImage'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useProductsFontsStore } from '@/stores/products-fonts/products-fonts.store'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'
  import type {
    OutputProductLogosSetting,
    OutputProductText,
    OutputProductTextItem
  } from '@/services/products/types'
  import type { StyleLogoAsset, StyleLogoEntry } from '@/services/types/styles'

  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()
  const sceneStore = useSceneStore()
  const workflowStore = useWorkflowStore()
  const companyStore = useCompanyStore()
  const { effectiveSvgGroupsInteractive } = useEffectiveSelectors()

  // Canvas refs
  const canvasEl = shallowRef<HTMLCanvasElement | null>(null)
  const designObject = shallowRef<FabricObject | FabricImage | null>(null)
  const modelObjects = shallowRef<(FabricObject | FabricImage)[]>([])
  const customLogoObjects = shallowRef<Map<number, FabricImage>>(new Map())
  const customTextObjects = shallowRef<Map<string, FabricObject>>(new Map())
  const otherSideLogoObjects = shallowRef<Map<number, FabricImage>>(new Map())
  const otherSideTextObjects = shallowRef<Map<string, FabricObject>>(new Map())
  const dimText = shallowRef<fabric.IText | null>(null)
  const dimensionTargetRef = shallowRef<FabricObject | FabricImage | null>(null)
  const suppressCustomLogosWatch = ref(false)
  const suppressCustomTextsWatch = ref(false)
  const safeZone = shallowRef<Group | null>(null)
  const boundary = shallowRef<Group | null>(null)
  const placementRect = shallowRef<FabricObject | null>(null)
  const mounted = ref(false)
  const colorDblclickElRef = shallowRef<HTMLCanvasElement | null>(null)

  // Guide lines (center crosshair + object snap lines)
  const drawLines = ref(false)
  const verticalLines = ref<{ x: number; y1: number; y2: number }[]>([])
  const horizontalLines = ref<{ y: number; x1: number; x2: number }[]>([])
  const guideLineVerticalRef = shallowRef<fabric.Line | null>(null)
  const guideLineHorizontalRef = shallowRef<fabric.Line | null>(null)

  const ALIGNING_LINE_OFFSET = 5
  const ALIGNING_LINE_MARGIN = 4
  const ALIGNING_LINE_WIDTH = 3
  const ALIGNING_LINE_COLOR = 'rgb(110, 243, 204)'

  /** Fabric viewport baseline (Scene.vue `default_view_port`) — reset before every `zoomToPoint`. */
  const defaultViewportTransform = shallowRef<number[] | null>(null)
  /** Anchor for zoom/pan (Scene.vue `front_zoom_point` / `back_zoom_point`). */
  const zoomPoint = ref<{ x: number; y: number }>({ x: 300, y: 300 })
  const isDraggingPan = ref(false)
  const lastCanvasPointer = ref<{ x: number; y: number } | null>(null)

  // Model type based on style preview structure
  type ModelData = {
    composition: 'multiply' | 'screen'
    file_url: string
    thumb_sm_url: string
  }

  type BoundKey = 'left' | 'right' | 'top' | 'bottom'

  type DesignData = {
    file_url: string
    file_extension: string
    safe_zone_url?: string
    boundary_url?: string
  }

  interface Props {
    models?: ModelData[]
    design?: DesignData
    /** Fixed style logos override (if provided). Falls back to active style logo[] list. */
    logos?: StyleLogoEntry[]
    // Product ID - defaults to active product from store
    productId?: number | null
    // Canvas dimensions
    canvasWidth?: number
    canvasHeight?: number
    mainCanvasWidth?: number
    mainCanvasHeight?: number
    mainPreview?: boolean
    // Canvas side
    side?: CanvasSide
    // Canvas class
    canvasClass?: string
    // SVG parts array for color permutation (can be string JSON or array)
    svgParts?: string[] | string
    // Color grouping - can be string (JSON) or object
    colorGrouping?: Record<string, string[]> | string | null
    // Optional placement overlay (used for logo placement preview)
    placementSetting?: OutputProductLogosSetting
    // Optional text placement overlay (used for text placement preview)
    textPlacement?: {
      x_axis: number
      y_axis: number
      width?: number | null
      height: number
      side: string
    }
    /** When true, Fabric zoom/pan and workflow toolbar zoom apply to this canvas. */
    enableZoom?: boolean
    /**
     * When true, apply customization colors even when not main preview and "apply to all canvases" is off.
     * OR'd with global overrides and mainPreview in useColorCustomization.
     */
    applyCustomizationColors?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    models: undefined,
    design: undefined,
    logos: undefined,
    // Product ID - will default to active product from store via computed
    productId: undefined,
    // Canvas dimensions
    canvasWidth: 600,
    canvasHeight: 600,
    mainCanvasWidth: 600,
    mainCanvasHeight: 600,
    mainPreview: false,
    // Canvas side
    side: 'front',
    // Canvas class
    canvasClass: 'rounded-[32px] transition-opacity duration-300 z-10',
    // SVG parts - defaults to undefined (will be initialized from svgGroups if not provided)
    svgParts: undefined,
    // Color grouping - defaults to undefined (will be extracted from design if not provided)
    colorGrouping: undefined,
    placementSetting: undefined,
    textPlacement: undefined,
    enableZoom: false,
    applyCustomizationColors: false
  })

  const isPlacementMode = computed(() => !!props.placementSetting || !!props.textPlacement)

  /** Matches useColorCustomization: apply default/group colors when global overrides, main preview, or this prop is on. */
  const shouldApplyCustomizationColors = computed(
    () => applyCustomizationOverrides.value || props.mainPreview || props.applyCustomizationColors
  )

  /** True when this instance should handle zoom (wheel, pan, store sync). */
  const zoomInteractionEnabled = computed(() => props.enableZoom)

  // get current instance at mounted
  const instance = getCurrentInstance()

  // ===== SHARED COMPOSABLE =====
  const {
    canvas,
    design: _sharedDesign,
    effectiveProductId,
    effectiveDesign,
    productsStore,
    initCanvas,
    addDesign,
    loadImageFromURL: loadImageFromURLCommon,
    disposeCanvas
  } = useSceneCommon(toRef(props, 'productId'), toRef(props, 'side'), toRef(props, 'design'))

  // ===== SVG GROUPS COMPOSABLE =====
  const svgGroupsComposable = useSvgGroups(
    effectiveProductId,
    props.side,
    props.mainPreview,
    toRef(props, 'svgParts')
  )
  const { svgGroups, initialSvgGroups, parts } = svgGroupsComposable

  // ===== COLOR GROUPING =====
  const colorGrouping = useColorGrouping(toRef(props, 'colorGrouping'))

  // ===== CUSTOM LOGOS =====
  // Map: key = index in custom_logos array, value = logo (only logos for current side)
  const customLogos = computed<Map<number, CustomLogo>>(() => {
    const productId = effectiveProductId.value
    if (!productId || !customizationStore.customization) return new Map()
    const key = String(productId)
    const all = customizationStore.customization.custom_logos?.[key] || []
    const map = new Map<number, CustomLogo>()
    const fields = [
      'id',
      'url',
      'side',
      'x_axis',
      'y_axis',
      'height',
      'rotation',
      'scaleX',
      'scaleY',
      'pinned',
      'is_locked'
    ] as const
    all.forEach((logo: CustomLogo, index: number) => {
      if (logo.side === props.side) {
        map.set(index, filterFields(logo, [...fields]) as CustomLogo)
      }
    })
    return map
  })

  // ===== FIXED LOGOS (STEP 1) — source + canvas helpers from useFixedLogos (same pattern as useLogos)
  const fixedLogos = computed<StyleLogoAsset[]>(() =>
    computeFixedLogosList({
      logosProp: props.logos,
      styleLogoGroups: productsStore.activeStyleDetails?.logo ?? null,
      fixedLogoIndex: customizationStore.customization?.fixed_logo_index ?? null,
      isFixedLogosAll: productsStore.activeStyleDetails?.is_fixed_logos_all ?? null,
      side: props.side,
      mode: '2d'
    })
  )

  // ===== CUSTOM TEXTS =====
  // Map: key = index in product_custom_texts, value = entry + items for this side only
  const customTexts = computed<
    Map<
      number,
      {
        entry: OutputProductText
        itemsForSide: { itemIndex: number; item: OutputProductTextItem }[]
      }
    >
  >(() => {
    const productId = effectiveProductId.value
    if (!productId || !customizationStore.customization) return new Map()
    const key = String(productId)
    const all = customizationStore.customization.product_custom_texts?.[key] || []
    const map = new Map<
      number,
      {
        entry: OutputProductText
        itemsForSide: { itemIndex: number; item: OutputProductTextItem }[]
      }
    >()
    const sideLower = props.side?.toLowerCase()
    all.forEach((text: OutputProductText, index: number) => {
      const itemsForSide = (text.items ?? [])
        .map((item, itemIndex) => ({ itemIndex, item }))
        .filter(({ item }) => item.placement?.toLowerCase() === sideLower)
      if (itemsForSide.length > 0) {
        map.set(index, { entry: text, itemsForSide })
      }
    })
    return map
  })

  // ===== COLOR CUSTOMIZATION COMPOSABLE =====
  const colorCustomization = useColorCustomization(
    canvas as Ref<Canvas | null>,
    designObject as Ref<FabricObject | null>,
    svgGroups,
    initialSvgGroups,
    parts,
    effectiveProductId,
    productsStore,
    props.mainPreview,
    props.side,
    colorGrouping as Ref<Record<string, string[]> | null>,
    props.applyCustomizationColors
  )

  // Extract customization functions from composable
  const { applyCustomization, changeDefaultColors, changeGroupColors, resetToInitialColors } =
    colorCustomization

  // Computed properties that react to store changes
  // Use prop if provided, otherwise fall back to store value
  const effectiveModels = computed<ModelData[]>(() => {
    if (props.models) {
      // Filter props.models to only include ModelData fields
      const filtered = filterFields(props.models, ['composition', 'file_url', 'thumb_sm_url'])
      if (Array.isArray(filtered)) {
        return filtered
      }
    }

    const styleDetails = productsStore.activeStyleDetails
    if (!styleDetails) return []

    const side = props.side
    const storeModels =
      side === 'back' && styleDetails.back_models
        ? styleDetails.back_models
        : styleDetails.front_models || []

    // Map to only include ModelData properties, excluding any extra attributes
    const filtered = filterFields(storeModels, ['composition', 'file_url', 'thumb_sm_url'])
    return Array.isArray(filtered) ? filtered : []
  })

  // Watch for changes in effectiveDesign and reload design
  watch(
    effectiveDesign,
    async (newDesign, oldDesign) => {
      if (!canvas.value) return

      // Only reload if design actually changed
      if (newDesign && (!oldDesign || newDesign.file_url !== oldDesign.file_url)) {
        // Zoom must be 1 before centering the new design on the canvas
        if (zoomInteractionEnabled.value) {
          resetCanvasZoomAfterDesignOrStyleChange()
        }

        await addDesign(newDesign, {
          scaleMode: 'fit',
          canvasWidth: props.canvasWidth,
          canvasHeight: props.canvasHeight,
          padding: 10,
          centerInViewport: true,
          svgGroupsComposable,
          designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
          colorCustomization,
          mainPreview: props.mainPreview
        })
        if (!canvas.value) return

        await addBoundary(newDesign.safe_zone_url, newDesign.boundary_url)
        if (!canvas.value) return

        // Design reload re-extracts svgGroups; re-attach fixed-logo custom groups afterward.
        await resetAndAddFixedLogos()
        if (!canvas.value) return

        if (zoomInteractionEnabled.value) {
          refreshDefaultViewportFromCanvas()
          resetCanvasZoomAfterDesignOrStyleChange()
        }

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
  )

  // Reset zoom when the active style changes (new product/style selection)
  watch(
    () => productsStore.activeStyleDetails?.id,
    (newId, oldId) => {
      if (oldId === undefined || newId === undefined || newId === oldId) return
      if (!canvas.value || !zoomInteractionEnabled.value) return
      resetCanvasZoomAfterDesignOrStyleChange()
      refreshDefaultViewportFromCanvas()
    }
  )

  // Watch for changes in effectiveModels and reload models
  watch(
    effectiveModels,
    async (newModels, oldModels) => {
      if (!canvas.value) return

      // Check if models actually changed by comparing file URLs
      const newModelUrls = newModels
        .map(m => m.file_url || m.thumb_sm_url)
        .sort()
        .join(',')
      const oldModelUrls =
        oldModels
          ?.map(m => m.file_url || m.thumb_sm_url)
          .sort()
          .join(',') || ''

      if (newModelUrls !== oldModelUrls) {
        // Load all model images first (no canvas changes yet)
        const modelImages = await Promise.all(newModels.map(model => addModel(model)))
        if (!canvas.value) return

        // Remove previous models, then add the new ones
        removeModels()
        addModelObjectsToCanvas(modelImages)
        bringModelToFront()

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
  )

  onMounted(async () => {
    try {
      if (props.mainPreview && productsStore.activeProductDetails) {
        const productsFontsStore = useProductsFontsStore()
        const storageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''
        await productsFontsStore.initFromProducts([productsStore.activeProductDetails], storageUrl)
      }

      // Parts are now initialized in useSvgGroups composable from props
      // If not provided as props, they will be set from active design (svgGroups) after extraction

      // Wait for next tick to ensure canvas element is available
      await nextTick()

      if (!canvasEl.value) {
        console.warn('Canvas element not available')
        return
      }

      initCanvas(canvasEl.value, props.canvasWidth, props.canvasHeight)
      ensureDimText()

      const c = canvas.value
      if (c && zoomInteractionEnabled.value) {
        defaultViewportTransform.value = JSON.parse(JSON.stringify(c.viewportTransform)) as number[]
        zoomPoint.value = { x: props.canvasWidth / 2, y: props.canvasHeight / 2 }

        c.on('mouse:wheel', opt => {
          const e = opt.e as WheelEvent
          const pointer = c.getPointer(e) as fabric.Point
          zoomPoint.value = { x: pointer.x, y: pointer.y }
          let zoom = c.getZoom() * 0.999 ** e.deltaY
          if (zoom > 4) zoom = 4
          if (zoom < 1) zoom = 1
          workflowStore.setCanvasZoom(zoom)
          e.preventDefault()
          e.stopPropagation()
        })

        c.on('mouse:down', opt => {
          if (opt.target != null) return
          const p = c.getPointer(opt.e, false) as fabric.Point
          lastCanvasPointer.value = { x: p.x, y: p.y }
          zoomPoint.value = { x: p.x, y: p.y }
          isDraggingPan.value = true
        })

        c.on('mouse:move', opt => {
          if (!isDraggingPan.value || !lastCanvasPointer.value) return
          const e = opt.e as MouseEvent
          const pointer = c.getPointer(opt.e, false) as fabric.Point
          const last = lastCanvasPointer.value
          const movement = new fabric.Point(
            Math.trunc((last.x - pointer.x) / -2),
            Math.trunc((last.y - pointer.y) / -2)
          )
          lastCanvasPointer.value = { x: pointer.x, y: pointer.y }
          const zp = zoomPoint.value
          const scaleBy = -5 / c.getZoom()
          zp.x += (movement.x * scaleBy) / c.getZoom()
          zp.y += (movement.y * scaleBy) / c.getZoom()
          applyZoomCanvas(workflowStore.canvasZoom)
          e.preventDefault()
          e.stopPropagation()
        })

        let zInit = workflowStore.canvasZoom
        if (zInit > 4) zInit = 4
        if (zInit < 1) zInit = 1
        if (zInit !== workflowStore.canvasZoom) workflowStore.setCanvasZoom(zInit)
        applyZoomCanvas(zInit)
      }

      canvas.value?.on('selection:cleared', hideDimensions)

      // Double-click on design part → open color editor
      const canvasForDblclick =
        (canvas.value as unknown as { upperCanvasEl?: HTMLCanvasElement })?.upperCanvasEl ??
        canvasEl.value
      if (canvasForDblclick) {
        canvasForDblclick.addEventListener('dblclick', handleDesignPartDblclick)
        colorDblclickElRef.value = canvasForDblclick
      }

      // Setup custom Fabric controls with icons (scale/rotate/delete)
      setupFabricControls({
        onRemoveLogo: (logoIndex: number, canvasInstance: Canvas) => {
          deleteLogoFromCanvas(logoIndex, canvasInstance, customLogoObjects)
        },
        getLogoIndexFromTarget: target => {
          for (const [idx, obj] of customLogoObjects.value) {
            if (obj === target) return idx
          }
          return undefined
        }
        // Text removal can be added here if needed
      })

      // Guide lines: center crosshair + object snap lines
      if (canvas.value) {
        const c = canvas.value
        const verticalLine = new fabric.Line(
          [props.canvasWidth / 2, 0, props.canvasWidth / 2, props.canvasHeight],
          {
            stroke: '#6EF3CC',
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          }
        )
        const horizontalLine = new fabric.Line(
          [0, props.canvasHeight / 2, props.canvasWidth, props.canvasHeight / 2],
          {
            stroke: '#6EF3CC',
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          }
        )
        guideLineVerticalRef.value = verticalLine
        guideLineHorizontalRef.value = horizontalLine

        const ctx =
          (
            c as unknown as { getSelectionContext?: () => CanvasRenderingContext2D }
          ).getSelectionContext?.() ??
          (c as unknown as { contextTop?: CanvasRenderingContext2D }).contextTop

        c.on('object:moving', (e: { target?: FabricObject }) => {
          const target = e.target
          if (!target || !designObject.value) return
          if (!('logo_index' in target) && !('custom_text_index' in target)) return
          const center = designObject.value.getCenterPoint()
          const relativeWidth = center.x
          const relativeHeight = center.y
          const customObj = getCustomObjectsLength(c)
          if (
            customObj.logoLength + customObj.textLength >= 1 &&
            guideLineVerticalRef.value &&
            guideLineHorizontalRef.value
          ) {
            addGuideLine(
              e as { target: FabricObject },
              c,
              guideLineVerticalRef.value,
              guideLineHorizontalRef.value,
              relativeWidth,
              relativeHeight
            )
            addGuideForMultipleObjects(c, target)
          }
        })

        c.on('object:modified', () => {
          const lineObjects = c
            .getObjects()
            .filter(o => (o as FabricObject).type === 'Line' || (o as FabricObject).type === 'line')
          lineObjects.forEach(obj => c.remove(obj))
          drawLines.value = false
        })

        c.on('mouse:up', () => {
          isDraggingPan.value = false
          verticalLines.value = []
          horizontalLines.value = []
        })

        c.on('before:render', () => {
          const topCtx = (c as unknown as { contextTop?: CanvasRenderingContext2D }).contextTop
          if (topCtx)
            (
              c as unknown as { clearContext?: (ctx: CanvasRenderingContext2D) => void }
            ).clearContext?.(topCtx)
        })

        c.on('after:render', () => {
          const vpt = c.viewportTransform
          if (ctx && vpt) {
            verticalLines.value.forEach(coords => drawVerticalLine(coords, ctx, vpt))
            horizontalLines.value.forEach(coords => drawHorizontalLine(coords, ctx, vpt))
          }
          verticalLines.value = []
          horizontalLines.value = []
        })
      }

      // Ensure canvas is initialized before loading scene
      if (canvas.value) {
        await loadScene()
        mounted.value = true
      }
    } catch (err) {
      console.error('[TwoDScene] mounted hook error:', err)
    }
  })

  onBeforeUnmount(() => {
    const el = colorDblclickElRef.value
    if (el) {
      el.removeEventListener('dblclick', handleDesignPartDblclick)
      colorDblclickElRef.value = null
    }
    disposeCanvas()
  })

  /**
   * Remove all model objects from canvas
   */
  function removeModels(): void {
    if (!canvas.value || !modelObjects.value.length) return

    modelObjects.value.forEach(model => {
      const modelObj = model as unknown as FabricObject
      canvas.value?.remove(modelObj)
    })
    modelObjects.value = []
  }

  /**
   * Load model image and return it. Does not add to canvas or modelObjects.
   * Caller must remove previous models, then add returned images to canvas and modelObjects.
   */
  async function addModel(modelData: ModelData): Promise<FabricObject | FabricImage | null> {
    if (!canvas.value || !modelData) return null

    // Use file_url for main preview, thumb_sm_url for thumbnails
    const modelUrl = modelData.file_url || modelData.thumb_sm_url

    // Load image with default options, override with composition mode
    const img = (await loadImageFromURLCommon(modelUrl + '?nocache=2', '', {
      globalCompositeOperation: modelData.composition || 'multiply'
      // Options already set by default, but we can add additional ones here if needed
    })) as FabricImage

    // Check canvas again after async operation (it might have been disposed)
    if (!canvas.value) return null

    // Scale to fit canvas with padding
    const padding = 10
    if (img.width && img.height) {
      if (img.width > img.height) {
        img.scaleToWidth(props.canvasWidth - padding)
      } else {
        img.scaleToHeight(props.canvasHeight - padding)
      }
    }

    img.setCoords()
    return img as FabricObject
  }

  function addModelObjectsToCanvas(images: (FabricObject | FabricImage | null)[]): void {
    if (!canvas.value) return
    const valid = images.filter((img): img is FabricObject => img != null)
    valid.forEach((img, index) => {
      canvas.value!.add(img)
      canvas.value!.viewportCenterObject(img)
      if (modelObjects.value[index]) {
        canvas.value!.remove(modelObjects.value[index] as FabricObject)
        modelObjects.value.splice(index, 1)
      }
      modelObjects.value.push(img)
    })
  }

  function bringModelToFront(): void {
    if (!canvas.value || !modelObjects.value.length) return

    modelObjects.value.forEach(model => {
      canvas.value?.bringObjectToFront(model as FabricObject)
    })
  }

  /**
   * Count custom objects (logos + texts) on canvas for guide line logic.
   */
  function getCustomObjectsLength(canvasInstance: Canvas): {
    logoLength: number
    textLength: number
  } {
    let logoLength = 0
    let textLength = 0
    canvasInstance.getObjects().forEach((obj: FabricObject) => {
      if ('logo_index' in obj) logoLength++
      if ('custom_text_index' in obj) textLength++
    })
    return { logoLength, textLength }
  }

  /**
   * Show center crosshair and update dash based on whether object is aligned to center.
   */
  function addGuideLine(
    e: { target: FabricObject },
    canvasInstance: Canvas,
    verticalLine: fabric.Line,
    horizontalLine: fabric.Line,
    relativeWidth: number,
    relativeHeight: number
  ): void {
    if (!drawLines.value) {
      canvasInstance.add(verticalLine)
      canvasInstance.add(horizontalLine)
      drawLines.value = true
    }

    const coords = e.target.getCenterPoint()
    const left = coords.x
    const top = coords.y

    if (
      parseInt(String(left)) >= relativeWidth - 2 &&
      parseInt(String(left)) <= relativeWidth + 2
    ) {
      verticalLine.set({
        stroke: '#6EF3CC',
        strokeWidth: 4,
        strokeDashArray: []
      })
    } else {
      verticalLine.set({
        stroke: '#6EF3CC',
        strokeWidth: 4,
        strokeDashArray: [5, 5]
      })
    }

    if (
      parseInt(String(top)) >= relativeHeight - 2 &&
      parseInt(String(top)) <= relativeHeight + 2
    ) {
      horizontalLine.set({
        stroke: '#6EF3CC',
        strokeWidth: 4,
        strokeDashArray: []
      })
    } else {
      horizontalLine.set({
        stroke: '#6EF3CC',
        strokeWidth: 4,
        strokeDashArray: [5, 5]
      })
    }
  }

  function isInRange(value1: number, value2: number): boolean {
    const v1 = Math.round(value1)
    const v2 = Math.round(value2)
    for (let i = v1 - ALIGNING_LINE_MARGIN, len = v1 + ALIGNING_LINE_MARGIN; i <= len; i++) {
      if (i === v2) return true
    }
    return false
  }

  /**
   * Snap selected object to other custom objects and collect snap lines for drawing.
   */
  function addGuideForMultipleObjects(canvasInstance: Canvas, selectedObject: FabricObject): void {
    const vpt = canvasInstance.viewportTransform
    if (!vpt) return

    const canvasObjects = canvasInstance.getObjects()
    const activeCenter = selectedObject.getCenterPoint()
    const activeLeft = activeCenter.x
    const activeTop = activeCenter.y
    const activeRect = selectedObject.getBoundingRect()
    const activeHeight = activeRect.height / vpt[3]
    const activeWidth = activeRect.width / vpt[0]

    let horizontalInTheRange = false
    let verticalInTheRange = false

    const newVerticalLines: { x: number; y1: number; y2: number }[] = []
    const newHorizontalLines: { y: number; x1: number; x2: number }[] = []

    for (let i = canvasObjects.length; i--; ) {
      if (canvasObjects[i] === selectedObject) continue

      const obj = canvasObjects[i] as FabricObject
      if (!('logo_index' in obj) && !('custom_text_index' in obj)) continue

      const objectCenter = obj.getCenterPoint()
      const objectLeft = objectCenter.x
      const objectTop = objectCenter.y
      const objectRect = obj.getBoundingRect()
      const objectHeight = objectRect.height / vpt[3]
      const objectWidth = objectRect.width / vpt[0]

      if (isInRange(objectLeft, activeLeft)) {
        verticalInTheRange = true
        newVerticalLines.push({
          x: objectLeft,
          y1:
            objectTop < activeTop
              ? objectTop - objectHeight / 2 - ALIGNING_LINE_OFFSET
              : objectTop + objectHeight / 2 + ALIGNING_LINE_OFFSET,
          y2:
            activeTop > objectTop
              ? activeTop + activeHeight / 2 + ALIGNING_LINE_OFFSET
              : activeTop - activeHeight / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(objectLeft, activeTop),
          'center',
          'center'
        )
      }

      if (isInRange(objectLeft - objectWidth / 2, activeLeft - activeWidth / 2)) {
        verticalInTheRange = true
        newVerticalLines.push({
          x: objectLeft - objectWidth / 2 + 10,
          y1:
            objectTop < activeTop
              ? objectTop - objectHeight / 2 - ALIGNING_LINE_OFFSET
              : objectTop + objectHeight / 2 + ALIGNING_LINE_OFFSET,
          y2:
            activeTop > objectTop
              ? activeTop + activeHeight / 2 + ALIGNING_LINE_OFFSET
              : activeTop - activeHeight / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(objectLeft - objectWidth / 2 + activeWidth / 2, activeTop),
          'center',
          'center'
        )
      }

      if (isInRange(objectLeft + objectWidth / 2, activeLeft + activeWidth / 2)) {
        verticalInTheRange = true
        newVerticalLines.push({
          x: objectLeft + objectWidth / 2 - 11,
          y1:
            objectTop < activeTop
              ? objectTop - objectHeight / 2 - ALIGNING_LINE_OFFSET
              : objectTop + objectHeight / 2 + ALIGNING_LINE_OFFSET,
          y2:
            activeTop > objectTop
              ? activeTop + activeHeight / 2 + ALIGNING_LINE_OFFSET
              : activeTop - activeHeight / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(objectLeft + objectWidth / 2 - activeWidth / 2, activeTop),
          'center',
          'center'
        )
      }

      if (isInRange(objectTop, activeTop)) {
        horizontalInTheRange = true
        newHorizontalLines.push({
          y: objectTop,
          x1:
            objectLeft < activeLeft
              ? objectLeft - objectWidth / 2 - ALIGNING_LINE_OFFSET
              : objectLeft + objectWidth / 2 + ALIGNING_LINE_OFFSET,
          x2:
            activeLeft > objectLeft
              ? activeLeft + activeWidth / 2 + ALIGNING_LINE_OFFSET
              : activeLeft - activeWidth / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(activeLeft, objectTop),
          'center',
          'center'
        )
      }

      if (isInRange(objectTop - objectHeight / 2, activeTop - activeHeight / 2)) {
        horizontalInTheRange = true
        newHorizontalLines.push({
          y: objectTop - objectHeight / 2 + 10,
          x1:
            objectLeft < activeLeft
              ? objectLeft - objectWidth / 2 - ALIGNING_LINE_OFFSET
              : objectLeft + objectWidth / 2 + ALIGNING_LINE_OFFSET,
          x2:
            activeLeft > objectLeft
              ? activeLeft + activeWidth / 2 + ALIGNING_LINE_OFFSET
              : activeLeft - activeWidth / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(activeLeft, objectTop - objectHeight / 2 + activeHeight / 2),
          'center',
          'center'
        )
      }

      if (isInRange(objectTop + objectHeight / 2, activeTop + activeHeight / 2)) {
        horizontalInTheRange = true
        newHorizontalLines.push({
          y: objectTop + objectHeight / 2 - 11,
          x1:
            objectLeft < activeLeft
              ? objectLeft - objectWidth / 2 - ALIGNING_LINE_OFFSET
              : objectLeft + objectWidth / 2 + ALIGNING_LINE_OFFSET,
          x2:
            activeLeft > objectLeft
              ? activeLeft + activeWidth / 2 + ALIGNING_LINE_OFFSET
              : activeLeft - activeWidth / 2 - ALIGNING_LINE_OFFSET
        })
        selectedObject.setPositionByOrigin(
          new fabric.Point(activeLeft, objectTop + objectHeight / 2 - activeHeight / 2),
          'center',
          'center'
        )
      }
    }

    verticalLines.value = verticalInTheRange ? newVerticalLines : []
    horizontalLines.value = horizontalInTheRange ? newHorizontalLines : []
  }

  function drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    ctx: CanvasRenderingContext2D,
    vpt: number[]
  ): void {
    const vptMat = vpt as [number, number, number, number, number, number]
    const originXY = fabric.util.transformPoint(new fabric.Point(x1, y1), vptMat)
    const dimensions = fabric.util.transformPoint(new fabric.Point(x2, y2), vptMat)
    ctx.save()
    ctx.lineWidth = ALIGNING_LINE_WIDTH
    ctx.strokeStyle = ALIGNING_LINE_COLOR
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(originXY.x, originXY.y)
    ctx.lineTo(dimensions.x, dimensions.y)
    ctx.stroke()
    ctx.restore()
  }

  function drawVerticalLine(
    coords: { x: number; y1: number; y2: number },
    ctx: CanvasRenderingContext2D,
    vpt: number[]
  ): void {
    drawLine(
      coords.x + 0.5,
      coords.y1 > coords.y2 ? coords.y2 : coords.y1,
      coords.x + 0.5,
      coords.y2 > coords.y1 ? coords.y2 : coords.y1,
      ctx,
      vpt
    )
  }

  function drawHorizontalLine(
    coords: { y: number; x1: number; x2: number },
    ctx: CanvasRenderingContext2D,
    vpt: number[]
  ): void {
    drawLine(
      coords.x1 > coords.x2 ? coords.x2 : coords.x1,
      coords.y + 0.5,
      coords.x2 > coords.x1 ? coords.x2 : coords.x1,
      coords.y + 0.5,
      ctx,
      vpt
    )
  }

  /**
   * Load the complete scene with design and models.
   * Bails out after each await if canvas was disposed (e.g. component unmounted or design changed).
   */
  async function loadScene(): Promise<void> {
    if (!canvas.value) return

    productsStore.setSceneLoadComplete(false)

    // Load design
    if (effectiveDesign.value) {
      await addDesign(effectiveDesign.value, {
        scaleMode: 'fit',
        canvasWidth: props.canvasWidth,
        canvasHeight: props.canvasHeight,
        padding: 10,
        centerInViewport: true,
        svgGroupsComposable,
        designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
        colorCustomization,
        mainPreview: props.mainPreview
      })
      if (!canvas.value) return
    }

    // Load model images first (no canvas changes yet), then remove previous and add new
    if (effectiveModels.value.length > 0) {
      const modelImages = await Promise.all(effectiveModels.value.map(model => addModel(model)))
      if (!canvas.value) return
      removeModels()
      addModelObjectsToCanvas(modelImages)
    }
    if (!canvas.value) return

    // Ensure models are on top of design
    bringModelToFront()

    // in here call the add rect if placement overlay is set (logo or text)
    if (isPlacementMode.value) {
      await addRect()
      return
    }

    if (effectiveDesign.value?.safe_zone_url || effectiveDesign.value?.boundary_url) {
      await addBoundary(effectiveDesign.value?.safe_zone_url, effectiveDesign.value?.boundary_url)
    }
    if (!canvas.value) return

    canvas.value.requestRenderAll()

    await Promise.resolve(setTimeout(() => {}, 500))
    await resetAndAddFixedLogos()
    if (!canvas.value) return
    // Load logos and texts after scene is loaded
    await resetAndAddLogos()
    if (!canvas.value) return
    await resetAndAddTexts()
    if (!canvas.value) return

    // Render mirrored logos and texts coming from the opposite side (stored in sceneStore)
    await renderOtherSideLogosFromStore()
    if (!canvas.value) return
    setTimeout(async () => {
      await renderOtherSideTextsFromStore()
    }, 500)

    if (zoomInteractionEnabled.value) {
      refreshDefaultViewportFromCanvas()
      resetCanvasZoomAfterDesignOrStyleChange()
    }

    productsStore.setSceneLoadComplete(true)
  }

  // All customization functions are now provided by useColorCustomization composable
  // Functions removed: getGroupColorBySvgGroup, getSvgGroupColors, getDefaultColorBySvgGroup,
  // findClosestColorIndex, changeDefaultColors, changeGroupColors, resetToInitialColors, applyCustomization

  /**
   * Get image from canvas. Waits for canvas to paint before capturing (two rAF).
   * TwoDScene only handles single side, so no side parameter needed.
   */
  async function getImageFromCanvas(options: GetImageFromCanvasOptions = {}): Promise<string> {
    if (!canvas.value) return ''
    return getImageFrom2DCanvas(canvas.value as unknown as Canvas, options)
  }

  // Store component reference in global store if mainPreview
  function updateSceneRef() {
    if (!props.mainPreview || !props.side) return
    const componentInstance = instance?.proxy as ComponentPublicInstance | null
    if (componentInstance) {
      sceneStore.setTwoDSceneRef({ getImageFromCanvas }, props.side as 'front' | 'back')
    }
  }

  onMounted(() => {
    if (props.mainPreview && props.side) {
      nextTick(() => {
        try {
          updateSceneRef()
        } catch (err) {
          console.error('[TwoDScene] updateSceneRef error:', err)
        }
      })
    }
  })

  // Watch for side prop changes and update reference
  watch(
    () => props.side,
    (newSide, oldSide) => {
      if (!props.mainPreview) return
      sceneStore.clearOtherSideLogos(oldSide as 'front' | 'back')
      sceneStore.clearOtherSideTexts(oldSide as 'front' | 'back')
      if (canvas.value) {
        otherSideLogoObjects.value.forEach(obj => {
          canvas.value?.remove(obj as FabricObject)
        })
        otherSideTextObjects.value.forEach(obj => {
          canvas.value?.remove(obj)
        })
      }
      otherSideLogoObjects.value = new Map()
      otherSideTextObjects.value = new Map()
      // Clear old reference if side changed
      if (oldSide && oldSide !== newSide) {
        sceneStore.setTwoDSceneRef(null, oldSide as 'front' | 'back')
      }

      // Set new reference
      if (newSide) {
        nextTick(() => {
          updateSceneRef()
        })
      }
    }
  )

  onBeforeUnmount(() => {
    // Clear reference when component unmounts
    if (props.mainPreview && props.side) {
      sceneStore.setTwoDSceneRef(null, props.side as 'front' | 'back')
    }
  })

  // ===== LOGO UTILITIES =====
  function calculatePosition2D(logoData: CustomLogo | OutputProductTextItem): {
    x: number
    y: number
  } {
    const { widthRatio, heightRatio } = calculateScaleRatios2D()
    return {
      x: widthRatio * Number(logoData.x_axis),
      y: heightRatio * Number(logoData.y_axis)
    }
  }

  function calculateRotation2D(rotation: number): number {
    if (rotation < 0) {
      return Math.round(360 - rotation)
    }
    return Math.round(rotation)
  }

  function calculateScaleRatios2D() {
    return {
      widthRatio: props.canvasWidth / (props.mainCanvasWidth || 600),
      heightRatio: props.canvasHeight / (props.mainCanvasHeight || 600)
    }
  }

  const { resetAndAddFixedLogos: resetFixedLogos } = useFixedLogos({
    canvas,
    loadImageFromURL: loadImageFromURLCommon,
    applyClipPath,
    geometry: create2DFixedLogoGeometry(calculateScaleRatios2D),
    svgGroups,
    initialSvgGroups,
    parts,
    onSvgGroupsChanged: groups => {
      if (props.mainPreview && (props.side === 'front' || props.side === 'back')) {
        productsStore.setSvgGroups(groups, props.side, false)
      }
    }
  })

  /**
   * Measurement helpers and dimension overlay for 2D canvas.
   */
  function getMeasurementConfig() {
    const ratio = productsStore.activeProductDetails?.measurement_ratio ?? 1
    const unit = companyStore.settings?.settings?.measurement_unit
    return { ratio, unit }
  }

  function convertSizeToMeasurement(value: number): number {
    const { ratio, unit } = getMeasurementConfig()
    const base = value * ratio
    let converted = base
    if (unit?.conversion_operator === 'multiply') {
      converted = base * Number(unit.conversion_value ?? 1)
    } else if (unit?.conversion_operator === 'divide') {
      const divisor = Number(unit.conversion_value ?? 1) || 1
      converted = base / divisor
    }
    return Number(converted.toFixed(1))
  }

  function ensureDimText() {
    if (!canvas.value || dimText.value) return
    dimText.value = new fabric.IText('', {
      fontSize: 14,
      backgroundColor: '#fff',
      hasControls: false,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      lockMovementX: true,
      lockMovementY: true,
      visible: false,
      fontFamily: 'Ubuntu'
    })
    canvas.value.add(dimText.value as unknown as FabricObject)
  }

  const dimensionDisplayComputed = useDimensionDisplayComputed(dimensionTargetRef, {
    getProductId: () => effectiveProductId.value ?? null,
    getCustomization: () => customizationStore.customization,
    getUnit: () => getMeasurementConfig().unit?.unit ?? 'px',
    convertSizeToMeasurement
  })

  watch(dimensionDisplayComputed, val => {
    if (val && dimText.value?.visible) {
      dimText.value.set({
        text: `Size (W)${val.displayW}${val.unit} x (H)${val.displayH}${val.unit}`
      })
      canvas.value?.requestRenderAll()
    }
  })

  function hideDimensions() {
    dimensionTargetRef.value = null
    if (!dimText.value || !canvas.value) return
    dimText.value.set({ visible: false })
    canvas.value.requestRenderAll()
  }

  function showDimensions(target: FabricObject | FabricImage) {
    if (!canvas.value) return
    ensureDimText()
    if (!dimText.value) return

    dimensionTargetRef.value = target
    const dim = dimensionDisplayComputed.value
    const text =
      dim != null ? `Size (W)${dim.displayW}${dim.unit} x (H)${dim.displayH}${dim.unit}` : ''

    dimText.value.set({
      left: target.left,
      top:
        (target.top ?? 0) +
        ((target.height ?? 0) * (target.scaleY ?? 1)) / 2 +
        (dimText.value.height ?? 0) * (dimText.value.scaleY ?? 1) +
        20,
      text,
      visible: true
    })
    canvas.value.bringObjectToFront(dimText.value as unknown as FabricObject)
    canvas.value.requestRenderAll()
  }

  /**
   * Double-click on design part: open color editor with that part's group selected.
   * Design is not evented (no move/scale), so we hit-test by pointer: find which design child contains the click.
   */
  function handleDesignPartDblclick(evt: MouseEvent) {
    const fabricCanvas = canvas.value
    if (!fabricCanvas || !designObject.value) return
    const pointer = fabricCanvas.getPointer(evt as unknown as fabric.TPointerEvent)
    if (!pointer) return
    const design = designObject.value
    const objects: FabricObject[] = (design as Group & { _objects?: FabricObject[] })._objects
      ? ((design as Group)._objects ?? [])
      : [design as FabricObject]
    // Iterate reverse so topmost (last drawn) wins
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i] as FabricObject & { id?: string }
      if (!obj?.id) continue
      if (obj.containsPoint(pointer)) {
        const groupId = obj.id.split('_')[0] || obj.id
        const groups = effectiveSvgGroupsInteractive.value ?? []
        const accordionIndex = groups.findIndex(g => g.id === groupId.toLowerCase())
        workflowStore.openColorEditorFromCustomizer(groupId, accordionIndex)
        return
      }
    }
  }

  /**
   * Apply zoom/pan like Scene.vue `zoomCanvas`: reset to default viewport, then `zoomToPoint`.
   * Clamps zoom to [1, 4] to match the legacy builder.
   */
  function applyZoomCanvas(zoom: number): void {
    if (!zoomInteractionEnabled.value) return
    const c = canvas.value
    if (!c || !defaultViewportTransform.value) return

    let z = zoom
    if (z > 4) z = 4
    if (z < 1) z = 1

    const pointer = zoomPoint.value
    c.setViewportTransform(JSON.parse(JSON.stringify(defaultViewportTransform.value)) as TMat2D)
    c.zoomToPoint(new Point(pointer.x, pointer.y), z)
    c.requestRenderAll()

    if (dimText.value) {
      dimText.value.set({ scaleX: 1 / z, scaleY: 1 / z })
    }
  }

  /** Re-capture baseline viewport after design centering (zoom applies from this matrix). */
  function refreshDefaultViewportFromCanvas(): void {
    const c = canvas.value
    if (!c) return
    defaultViewportTransform.value = JSON.parse(JSON.stringify(c.viewportTransform)) as TMat2D
  }

  /** Reset zoom/pan to defaults and sync workflow store (enableZoom canvases only). */
  function resetCanvasZoomAfterDesignOrStyleChange(): void {
    if (!zoomInteractionEnabled.value) return
    if (!canvas.value || !defaultViewportTransform.value) return
    zoomPoint.value = { x: props.canvasWidth / 2, y: props.canvasHeight / 2 }
    workflowStore.setCanvasZoom(1)
    applyZoomCanvas(1)
  }

  /**
   * `isTargetTransparent` / clip sampling must run at zoom 1 like Scene.vue (applyClipPath, addToOtherSide, objectScaling).
   */
  function withZoomResetForHitTest<T>(fn: () => T): T {
    const c = canvas.value
    if (!c) return fn()
    const zp = zoomPoint.value
    const currentZoom = c.getZoom()
    if (Math.abs(currentZoom - 1) > 1e-6 && zp?.x != null && zp?.y != null) {
      c.zoomToPoint(new Point(zp.x, zp.y), 1)
    }
    try {
      return fn()
    } finally {
      if (Math.abs(currentZoom - 1) > 1e-6 && zp?.x != null && zp?.y != null) {
        c.zoomToPoint(new Point(zp.x, zp.y), currentZoom)
      }
    }
  }

  async function withZoomResetAsync<T>(fn: () => Promise<T>): Promise<T> {
    const c = canvas.value
    if (!c) return fn()
    const zp = zoomPoint.value
    const currentZoom = c.getZoom()
    if (Math.abs(currentZoom - 1) > 1e-6 && zp?.x != null && zp?.y != null) {
      c.zoomToPoint(new Point(zp.x, zp.y), 1)
    }
    try {
      return await fn()
    } finally {
      if (Math.abs(currentZoom - 1) > 1e-6 && zp?.x != null && zp?.y != null) {
        c.zoomToPoint(new Point(zp.x, zp.y), currentZoom)
      }
    }
  }

  watch(
    () => workflowStore.canvasZoom,
    z => {
      if (!zoomInteractionEnabled.value) return
      if (!canvas.value || !defaultViewportTransform.value) return
      let clamped = z
      if (clamped > 4) clamped = 4
      if (clamped < 1) clamped = 1
      if (clamped !== z) workflowStore.setCanvasZoom(clamped)
      applyZoomCanvas(clamped)
    }
  )

  /**
   * Legacy-like clamp to keep logo inside design bounds and non-transparent area.
   * Adapted from custimoo_builder/src/components/Scene.vue objectScaling/targetNonTransparent*.
   */
  function constrainLogoWithinDesign(target: FabricObject) {
    withZoomResetForHitTest(() => {
      if (!canvas.value || !designObject.value) return
      const design = designObject.value
      const modelRect = design.getBoundingRect()
      const boundingRect = {
        left: modelRect.left,
        right: modelRect.left + modelRect.width,
        top: modelRect.top,
        bottom: modelRect.top + modelRect.height
      }

      const width = target.width ?? 0
      const height = target.height ?? 0
      const scaleX = target.scaleX ?? 1
      const scaleY = target.scaleY ?? 1

      if (target.left === undefined || target.top === undefined) return

      // basic bounds
      if (target.left >= boundingRect.right + (width * scaleX) / 4) {
        target.left = boundingRect.right + (width * scaleX) / 4
      } else if (target.left < boundingRect.left - (width * scaleX) / 4) {
        target.left = boundingRect.left - (width * scaleX) / 4
      }
      if (target.top < boundingRect.top + (height * scaleY) / 3) {
        target.top = boundingRect.top + (height * scaleY) / 3
      } else if (target.top >= boundingRect.bottom - (height * scaleY) / 3) {
        target.top = boundingRect.bottom - (height * scaleY) / 3
      }

      const centerPoint = target.getCenterPoint()
      if (
        canvas.value.isTargetTransparent(
          design as unknown as FabricObject,
          centerPoint.x,
          centerPoint.y
        )
      ) {
        const boundingDistance = {
          left: Math.abs(boundingRect.left - centerPoint.x),
          top: Math.abs(boundingRect.top - centerPoint.y),
          right: Math.abs(boundingRect.right - centerPoint.x),
          bottom: Math.abs(boundingRect.bottom - centerPoint.y)
        } as Record<'left' | 'top' | 'right' | 'bottom', number>

        let otherMoveTo: 'left' | 'right' | 'top' | 'bottom' = 'left'
        Object.keys(boundingDistance).forEach(key => {
          const k = key as 'left' | 'right' | 'top' | 'bottom'
          if (boundingDistance[k] > boundingDistance[otherMoveTo]) {
            otherMoveTo = k
          }
        })
        let moveTo: 'left' | 'right' = 'left'
        if (boundingDistance.right > boundingDistance.left) {
          moveTo = 'right'
        }

        const direction = targetNonTransparentVH(
          canvas.value,
          design as unknown as FabricObject,
          target.left,
          target.top,
          width,
          scaleX,
          moveTo,
          otherMoveTo
        )
        target.left = direction.left
        target.top = direction.top
      }

      target.setCoords()
    })
  }

  function targetNonTransparentVH(
    canvasInstance: Canvas,
    model: FabricObject,
    pointX: number,
    pointY: number,
    width: number,
    scaleX: number,
    moveTo: 'left' | 'right',
    otherMoveTo: 'left' | 'right' | 'top' | 'bottom',
    maxCall = 600
  ): { left: number; top: number; max_call: number } {
    let direction = targetNonTransparent(
      canvasInstance,
      model,
      pointX,
      pointY,
      width,
      scaleX,
      moveTo,
      maxCall
    )
    if (direction.max_call <= 0 && moveTo !== otherMoveTo) {
      if (otherMoveTo === 'bottom') {
        pointY++
      } else if (otherMoveTo === 'top') {
        pointY--
      }
      direction = targetNonTransparentVH(
        canvasInstance,
        model,
        pointX,
        pointY,
        width,
        scaleX,
        moveTo,
        otherMoveTo,
        maxCall - 1
      )
    }
    return direction
  }

  function targetNonTransparent(
    canvasInstance: Canvas,
    model: FabricObject,
    pointX: number,
    pointY: number,
    width: number,
    scaleX: number,
    moveTo: 'left' | 'right' | 'top' | 'bottom',
    maxCall = 600
  ): { left: number; top: number; max_call: number } {
    let pointXCompare = pointX + (width * scaleX) / 4
    if (moveTo === 'left') {
      pointXCompare = pointX - (width * scaleX) / 4
    }
    maxCall--
    if (canvasInstance.isTargetTransparent(model, pointXCompare, pointY) && maxCall > 0) {
      if (moveTo === 'left') {
        pointX -= 1
      } else if (moveTo === 'right') {
        pointX += 1
      } else if (moveTo === 'top') {
        pointY -= 1
      } else {
        pointY += 1
      }
      return targetNonTransparent(
        canvasInstance,
        model,
        pointX,
        pointY,
        width,
        scaleX,
        moveTo,
        maxCall
      )
    } else {
      const viewportMatrix = canvasInstance.viewportTransform as number[]
      const left = pointX + (viewportMatrix?.[4] ?? 0)
      const top = pointY + (viewportMatrix?.[5] ?? 0)
      return { left, top, max_call: maxCall }
    }
  }

  /**
   * Mirror logo to the opposite side and store its data (legacy addToOtherSide).
   */
  function addToOtherSide(target: FabricImage) {
    if (!canvas.value || !designObject.value) return

    withZoomResetForHitTest(() => {
      const cv = canvas.value!
      const design = designObject.value!
      const modelRect = design.getBoundingRect()
      const boundingRect = {
        left: modelRect.left,
        right: modelRect.left + modelRect.width,
        top: modelRect.top,
        bottom: modelRect.top + modelRect.height
      }

      const width = (target.width ?? 0) * (target.scaleX ?? 1)
      const height = (target.height ?? 0) * (target.scaleY ?? 1)
      const centerPoint = target.getCenterPoint()

      let boundingDistance: Record<BoundKey, number> = {
        left: Math.abs(boundingRect.left - centerPoint.x),
        top: Math.abs(boundingRect.top - centerPoint.y),
        right: Math.abs(boundingRect.right - centerPoint.x),
        bottom: Math.abs(boundingRect.bottom - centerPoint.y)
      }

      let actualNearTo: BoundKey = 'left'
      Object.keys(boundingDistance).forEach(key => {
        const k = key as BoundKey
        if (boundingDistance[k] < boundingDistance[actualNearTo]) {
          actualNearTo = k
        }
      })

      // Bias vertical to be less likely chosen unless nearer (legacy adds +100 to top/bottom)
      boundingDistance = {
        left: Math.abs(boundingRect.left - centerPoint.x),
        top: Math.abs(boundingRect.top - centerPoint.y) + 100,
        right: Math.abs(boundingRect.right - centerPoint.x),
        bottom: Math.abs(boundingRect.bottom - centerPoint.y) + 100
      }

      let nearTo: BoundKey = 'left'
      Object.keys(boundingDistance).forEach(key => {
        const k = key as BoundKey
        if (boundingDistance[k] < boundingDistance[nearTo]) {
          nearTo = k
        }
      })
      let moreTowards: 'left' | 'right' = 'left'
      if (boundingDistance.right < boundingDistance.left) {
        moreTowards = 'right'
      }
      const isActualTop = actualNearTo === ('top' as BoundKey)

      let checkPointX = (target.left ?? 0) + width / 2
      if (nearTo === 'left') {
        checkPointX = (target.left ?? 0) - width / 2
      }

      let checkPointY = centerPoint.y
      if (isActualTop) {
        checkPointY = (target.top ?? 0) - height / 3
      }

      let addLeft = target.left ?? 0
      let addTop = target.top ?? 0
      // Match old Scene.vue: model_start = left edge - 1, model_end = right edge + 1 (getBoundingRect gives top-left so left edge = left, right edge = left + width)
      const modelStart = modelRect.left - 1
      const modelEnd = modelRect.left + modelRect.width + 1

      if (cv.isTargetTransparent(design as unknown as FabricObject, checkPointX, checkPointY)) {
        if (isActualTop) {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            centerPoint.x,
            centerPoint.y - height,
            0,
            1,
            'bottom'
          )
          addTop = direction.top - checkPointY
          addLeft = props.canvasWidth - (target.left ?? 0)
        } else if (moreTowards === 'left') {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            checkPointX,
            centerPoint.y,
            0,
            1,
            'right'
          )
          const directionFromRight = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            modelEnd,
            checkPointY,
            0,
            1,
            'left'
          )
          const outside = direction.left - checkPointX
          const modelSpaceLeft = directionFromRight.left + width / 2 - 3
          addLeft = modelSpaceLeft - outside
          addTop = target.top ?? 0
        } else {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            (target.left ?? 0) + width,
            target.top ?? 0,
            0,
            1,
            'left'
          )
          const directionFromRight = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            modelStart,
            centerPoint.y,
            0,
            1,
            'right'
          )
          const outside = checkPointX - direction.left
          const modelSpaceRight = directionFromRight.left - width / 2 - 3
          addLeft = modelSpaceRight + outside
          addTop = target.top ?? 0
        }
        // store mirrored logo on the opposite side
        const destSide = (
          (target as unknown as { side?: string }).side === 'back' ? 'front' : 'back'
        ) as 'front' | 'back'
        const logoIndex = (target as unknown as { logo_index?: number }).logo_index ?? 0
        const sourceLogo = customLogos.value.get(logoIndex)
        sceneStore.addOtherSideLogo({
          logo_index: (target as unknown as { logo_index?: number }).logo_index ?? 0,
          url: sourceLogo?.url ? sourceLogo?.url + '?nocache=11' : '',
          side: destSide,
          left: addLeft,
          top: addTop,
          flipX: isActualTop,
          flipY: isActualTop,
          rotation: -(target.angle ?? 0),
          scaleX: target.scaleX ?? 1,
          scaleY: target.scaleY ?? 1
        })
      } else {
        // remove mirrored logo if it falls outside valid region
        const destSide = (
          (target as unknown as { side?: string }).side === 'back' ? 'front' : 'back'
        ) as 'front' | 'back'
        const idx = (target as unknown as { logo_index?: number }).logo_index ?? 0
        sceneStore.removeOtherSideLogo(destSide, idx)
      }
    })
  }

  /**
   * Mirror text to the opposite side and store its data (same pattern as addToOtherSide for logos).
   */
  function addTextToOtherSide(target: FabricObject) {
    if (!canvas.value || !designObject.value) return

    const customTextIndex = (target as unknown as { custom_text_index?: number }).custom_text_index
    const itemIndex = (target as unknown as { custom_text_item_index?: number })
      .custom_text_item_index
    if (customTextIndex == null || itemIndex == null) return

    withZoomResetForHitTest(() => {
      const cv = canvas.value!
      const design = designObject.value!
      const modelRect = design.getBoundingRect()
      const boundingRect = {
        left: modelRect.left,
        right: modelRect.left + modelRect.width,
        top: modelRect.top,
        bottom: modelRect.top + modelRect.height
      }

      const width = (target.width ?? 0) * (target.scaleX ?? 1)
      const height = (target.height ?? 0) * (target.scaleY ?? 1)
      const centerPoint = target.getCenterPoint()

      let boundingDistance: Record<BoundKey, number> = {
        left: Math.abs(boundingRect.left - centerPoint.x),
        top: Math.abs(boundingRect.top - centerPoint.y),
        right: Math.abs(boundingRect.right - centerPoint.x),
        bottom: Math.abs(boundingRect.bottom - centerPoint.y)
      }

      let actualNearTo: BoundKey = 'left'
      Object.keys(boundingDistance).forEach(key => {
        const k = key as BoundKey
        if (boundingDistance[k] < boundingDistance[actualNearTo]) {
          actualNearTo = k
        }
      })

      boundingDistance = {
        left: Math.abs(boundingRect.left - centerPoint.x),
        top: Math.abs(boundingRect.top - centerPoint.y) + 100,
        right: Math.abs(boundingRect.right - centerPoint.x),
        bottom: Math.abs(boundingRect.bottom - centerPoint.y) + 100
      }

      let nearTo: BoundKey = 'left'
      Object.keys(boundingDistance).forEach(key => {
        const k = key as BoundKey
        if (boundingDistance[k] < boundingDistance[nearTo]) {
          nearTo = k
        }
      })
      const moreTowards: 'left' | 'right' =
        boundingDistance.right < boundingDistance.left ? 'right' : 'left'
      const isActualTop = actualNearTo === ('top' as BoundKey)

      let checkPointX = (target.left ?? 0) + width / 2
      if (nearTo === 'left') {
        checkPointX = (target.left ?? 0) - width / 2
      }

      let checkPointY = centerPoint.y
      if (isActualTop) {
        checkPointY = (target.top ?? 0) - height / 3
      }

      let addLeft = target.left ?? 0
      let addTop = target.top ?? 0
      // Match old Scene.vue: model_start = left edge - 1, model_end = right edge + 1
      const modelStart = modelRect.left - 1
      const modelEnd = modelRect.left + modelRect.width + 1

      const destSide = props.side === 'back' ? 'front' : 'back'

      if (cv.isTargetTransparent(design as unknown as FabricObject, checkPointX, checkPointY)) {
        if (isActualTop) {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            centerPoint.x,
            centerPoint.y - height,
            0,
            1,
            'bottom'
          )
          addTop = direction.top - checkPointY
          addLeft = props.canvasWidth - (target.left ?? 0)
        } else if (moreTowards === 'left') {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            checkPointX,
            centerPoint.y,
            0,
            1,
            'right'
          )
          const directionFromRight = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            modelEnd,
            checkPointY,
            0,
            1,
            'left'
          )
          const outside = direction.left - checkPointX
          const modelSpaceLeft = directionFromRight.left + width / 2 - 3
          addLeft = modelSpaceLeft - outside
          addTop = target.top ?? 0
        } else {
          const direction = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            (target.left ?? 0) + width,
            target.top ?? 0,
            0,
            1,
            'left'
          )
          const directionFromRight = targetNonTransparent(
            cv,
            design as unknown as FabricObject,
            modelStart,
            centerPoint.y,
            0,
            1,
            'right'
          )
          const outside = checkPointX - direction.left
          const modelSpaceRight = directionFromRight.left - width / 2 - 3
          addLeft = modelSpaceRight + outside
          addTop = target.top ?? 0
        }
        sceneStore.addOtherSideText({
          customTextIndex,
          itemIndex,
          side: destSide,
          left: addLeft,
          top: addTop,
          rotation: -(target.angle ?? 0),
          scaleX: target.scaleX ?? 1,
          scaleY: target.scaleY ?? 1
        })
      } else {
        sceneStore.removeOtherSideText(destSide, customTextIndex, itemIndex)
      }
    })
  }

  const placementOverlay = computed(() => {
    const text = props.textPlacement
    if (text && text.side === props.side) {
      const { widthRatio, heightRatio } = calculateScaleRatios2D()
      const sizeW = (text.width ?? text.height ?? 300) * widthRatio
      const sizeH = text.height * heightRatio
      if (!sizeW || !sizeH) return null
      const { x, y } = calculatePosition2D({
        x_axis: text.x_axis,
        y_axis: text.y_axis
      } as CustomLogo)
      return { left: x, top: y, width: sizeW, height: sizeH }
    }

    const setting = props.placementSetting
    if (!setting) return null
    if (setting.side && setting.side !== props.side) return null

    const { widthRatio, heightRatio } = calculateScaleRatios2D()

    const sizeW = (setting.height ?? 0) * widthRatio
    const sizeH = (setting.height ?? 0) * heightRatio
    if (!sizeW || !sizeH) return null

    const { x, y } = calculatePosition2D({
      x_axis: setting.x_axis,
      y_axis: setting.y_axis
    } as CustomLogo)
    return {
      left: x,
      top: y,
      width: sizeW,
      height: sizeH
    }
  })

  async function addRect(): Promise<void> {
    if (!canvas.value) return

    if (placementRect.value) {
      canvas.value.remove(placementRect.value)
      placementRect.value = null
    }

    const overlay = placementOverlay.value

    if (!overlay) return

    const rect = new Rect({
      left: overlay.left,
      top: overlay.top,
      width: overlay.width,
      height: overlay.height,
      originX: 'center',
      originY: 'center',
      fill: 'rgba(55,65,81,0.45)',
      stroke: 'rgba(255,255,255,0.8)',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      hasControls: false,
      objectCaching: false,
      hoverCursor: 'default'
    })

    canvas.value.add(rect)
    canvas.value.bringObjectToFront(rect)
    canvas.value.requestRenderAll()
    placementRect.value = rect
  }

  async function cloneFabricObject(obj: FabricObject): Promise<FabricObject> {
    // Fabric 6 clone: clone(propertiesToInclude?) returns object; clone(cb, props?) also supported
    const anyObj = obj as unknown as { clone: (...args: unknown[]) => unknown }
    try {
      const direct = anyObj.clone()
      if (direct) return direct as FabricObject
    } catch {
      // fallback to callback form below
    }
    return await new Promise(resolve => {
      anyObj.clone((cloned: FabricObject) => resolve(cloned))
    })
  }

  async function findClippedParts(
    logoOrText: FabricImage,
    boundaries: FabricObject[],
    canvasInstance: Canvas,
    checkPointX: number,
    checkPointY: number,
    maxCall = 60
  ): Promise<FabricObject[]> {
    const applyBoundary: FabricObject[] = []
    let foundExcluded = false
    const objects = boundaries ?? []

    for (const boundary of objects) {
      // fabric.Canvas#isTargetTransparent exists on Canvas
      const isTransparent = canvasInstance.isTargetTransparent(
        boundary as unknown as FabricObject,
        checkPointX,
        checkPointY
      )
      if (foundExcluded || isTransparent) {
        applyBoundary.push(await cloneFabricObject(boundary))
      } else {
        const id = (boundary as unknown as { id?: string }).id || ''
        const boundaryId = id.includes('_') ? id.substring(0, id.indexOf('_')) : id
        ;(logoOrText as unknown as { excluded_clip_id?: string }).excluded_clip_id = boundaryId
        foundExcluded = true
      }
    }

    if (!foundExcluded && maxCall) {
      // ensure at least one excluded piece; shift point and retry
      const nextX = checkPointX < props.canvasWidth / 2 ? checkPointX + 1 : checkPointX - 1
      return await findClippedParts(
        logoOrText,
        boundaries,
        canvasInstance,
        nextX,
        checkPointY,
        maxCall - 1
      )
    }

    return applyBoundary
  }

  async function buildClipGroup(target: FabricImage): Promise<Group | null> {
    if (!canvas.value) return null

    return await withZoomResetAsync(async () => {
      // start with safe zone objects
      const safeObjects = (safeZone.value?._objects as FabricObject[] | undefined) ?? []
      const parts: FabricObject[] = []
      for (const o of safeObjects) {
        parts.push(await cloneFabricObject(o))
      }

      // handle boundaries with exclusion logic
      const boundaryObjects = (boundary.value?._objects as FabricObject[] | undefined) ?? []
      if (boundaryObjects.length) {
        const checkPointX = target.left ?? 0
        const checkPointY = target.top ?? 0
        const clippedParts = await findClippedParts(
          target,
          boundaryObjects,
          canvas.value!,
          checkPointX,
          checkPointY
        )
        parts.push(...clippedParts)
      }

      if (!parts.length) return null

      const clip = new Group(parts, {
        hasControls: false,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
        lockMovementX: true,
        lockMovementY: true,
        absolutePositioned: true,
        inverted: true,
        scaleX: designObject.value?.scaleX ?? 1,
        scaleY: designObject.value?.scaleY ?? 1,
        left: props.canvasWidth / 2,
        top: props.canvasHeight / 2
      })

      canvas.value!.viewportCenterObject(clip)
      return clip
    })
  }

  async function applyClipPath(target: FabricImage | FabricObject): Promise<void> {
    if (!canvas.value) return
    const clip = await buildClipGroup(target as FabricImage)
    if (clip) {
      // @ts-expect-error clipPath accepts any fabric object; Group works at runtime
      target.clipPath = clip
    }
  }

  async function loadClipGroup(url: string, target: 'safe' | 'boundary'): Promise<Group | null> {
    if (!url) return null
    const clip = (await loadImageFromURLCommon(url, 'svg', {
      hasControls: false,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      lockMovementX: true,
      lockMovementY: true,
      absolutePositioned: true,
      inverted: true
    })) as Group

    // Scale to canvas and center
    clip.scaleToHeight(props.canvasHeight)
    clip.set({
      left: props.canvasWidth / 2,
      top: props.canvasHeight / 2
    })
    clip.setCoords()
    if (canvas.value) {
      canvas.value.viewportCenterObject(clip)
    }

    if (target === 'safe') {
      safeZone.value = clip
    } else {
      boundary.value = clip
    }

    return clip
  }

  async function addBoundary(safeZoneUrl?: string, boundaryUrl?: string): Promise<void> {
    if (!canvas.value) return
    if (safeZoneUrl) {
      await loadClipGroup(safeZoneUrl, 'safe')
    }
    if (boundaryUrl) {
      await loadClipGroup(boundaryUrl, 'boundary')
    }

    // Re-apply clipping to existing logos
    for (const logo of customLogoObjects.value.values()) {
      await applyClipPath(logo)
    }
  }

  /**
   * Add logo to canvas (2D scene)
   * Uses the shared composable with 2D-specific configuration
   */
  async function addLogo(logo: CustomLogo, logoIndex: number): Promise<void> {
    if (isPlacementMode.value) return
    if (!canvas.value) return

    if (!logo || !logo.url) return

    // Check if logo side matches current side
    if (logo.side !== props.side) return

    // Render canvas
    const renderCanvas = () => {
      if (canvas.value) {
        canvas.value.requestRenderAll()
      }
    }

    try {
      await addLogoToCanvas({
        logo,
        logoIndex: logoIndex,
        mainPreview: props.mainPreview,
        productId: effectiveProductId.value,
        canvas: canvas.value as Canvas,
        logoObjects: customLogoObjects,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        calculateScaleRatios: calculateScaleRatios2D,
        applyClipPath,
        renderCanvas,
        canvasSelection: logo?.is_locked !== 1,
        flipX: false,
        suppressWatchRef: suppressCustomLogosWatch,
        convertSize: convertSizeToMeasurement
      })

      // Re-apply clip and clamp when user moves/scales/rotates
      const reclipAndClamp = async () => {
        const added = customLogoObjects.value.get(logoIndex)
        if (added) {
          constrainLogoWithinDesign(added as FabricObject)
          await applyClipPath(added)
          showDimensions(added)
          if (canvas.value) canvas.value.requestRenderAll()
        }
      }
      const added = customLogoObjects.value.get(logoIndex)
      added?.on('selected', () => {
        showDimensions(added)
        const logoIndex = (added as unknown as { logo_index?: number }).logo_index
        const logoId = customLogos.value.get(logoIndex!)?.id
        workflowStore.openLogoEditorFromCustomizer(logoIndex, logoId)
      })
      added?.on('moving', reclipAndClamp)
      added?.on('scaling', reclipAndClamp)
      added?.on('rotating', reclipAndClamp)
      added?.on('modified', () => {
        addToOtherSide(added)
        showDimensions(added)
        customizationStore.pushHistoryState('Moved logo')
      })
      if (added) {
        addToOtherSide(added)
        bringModelToFront()
      }
    } catch (error) {
      console.error('Failed to add logo:', error)
    }
  }

  /**
   * Reset and add all logos
   * Clears existing logos and adds all logos from custom_logos
   */
  async function resetAndAddLogos(): Promise<void> {
    if (isPlacementMode.value) return
    if (!canvas.value) return

    // Reset existing logos
    customLogoObjects.value.forEach(logo => {
      if (canvas.value) {
        canvas.value.remove(logo as unknown as FabricObject)
      }
    })
    customLogoObjects.value.clear()

    // Add logos from custom_logos (map already filtered by side, key = index)
    if (customLogos.value.size > 0) {
      for (const [logoIndex, logo] of customLogos.value) {
        if (logo && logo.url) {
          await addLogo(logo, logoIndex)
        }
      }
    }

    if (canvas.value) {
      canvas.value.requestRenderAll()
    }
  }

  async function resetAndAddFixedLogos(): Promise<void> {
    if (isPlacementMode.value) return
    await resetFixedLogos(fixedLogos.value)
    const defaultColors = customizationStore.customization?.default_colors || []
    const hasDefaultColors =
      defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0
    if ((hasDefaultColors || hasGroupColors) && shouldApplyCustomizationColors.value) {
      await applyCustomization(0)
    }
    bringModelToFront()
    canvas.value?.requestRenderAll()
  }

  // ===== TEXT UTILITIES (sync from customTexts watch) =====
  const heightScaleForText = computed(() => props.canvasHeight / (props.mainCanvasHeight || 600))

  async function addText(
    entry: OutputProductText,
    customTextIndex: number,
    itemIndex: number
  ): Promise<void> {
    if (isPlacementMode.value || !canvas.value) return
    const item = entry.items?.[itemIndex]
    if (!item) return
    if (item.placement?.toLowerCase() !== props.side?.toLowerCase()) return

    const renderCanvas = () => canvas.value?.requestRenderAll()
    await addTextToCanvas({
      entry,
      customTextIndex,
      itemIndex,
      canvas: canvas.value,
      textObjects: customTextObjects,
      calculatePosition: calculatePosition2D,
      calculateRotation: calculateRotation2D,
      heightScale: heightScaleForText.value,
      renderCanvas,
      applyClipPath,
      controlVisibility: FABRIC_CONTROL_VISIBILITY,
      canvasSelection: true,
      mainPreview: props.mainPreview,
      productId: effectiveProductId.value as number,
      suppressWatchRef: suppressCustomTextsWatch,
      getScaleRatios: calculateScaleRatios2D,
      is_3d: false,
      convertSize: convertSizeToMeasurement
    })
    const key = getTextObjectKey(customTextIndex, itemIndex)
    const textObj = customTextObjects.value.get(key)
    if (textObj) {
      const reclipAndClampText = async () => {
        await applyClipPath(textObj)
        showDimensions(textObj)
        if (canvas.value) canvas.value.requestRenderAll()
      }
      textObj.on('selected', () => {
        showDimensions(textObj)
        const customTextIndex = (textObj as unknown as { custom_text_index?: number })
          .custom_text_index
        const itemIdx = (textObj as unknown as { custom_text_item_index?: number })
          .custom_text_item_index
        if (customTextIndex === undefined || itemIdx === undefined) return
        const data = customTexts.value.get(customTextIndex)
        const textId = data?.entry?.id
        if (textId == null || !data) return
        workflowStore.openTextEditorFromCustomizer(textId, itemIdx)
      })
      textObj.on('moving', reclipAndClampText)
      textObj.on('scaling', reclipAndClampText)
      textObj.on('rotating', reclipAndClampText)
      textObj.on('modified', () => {
        addTextToOtherSide(textObj)
        showDimensions(textObj)
        customizationStore.pushHistoryState('Moved text')
      })
      addTextToOtherSide(textObj)
    }
  }

  /**
   * Reset and add all texts
   * Clears existing text objects and adds all texts from customTexts (filtered by side and selected)
   */
  async function resetAndAddTexts(): Promise<void> {
    if (isPlacementMode.value) return
    if (!canvas.value) return

    customTextObjects.value.forEach(obj => {
      canvas.value?.remove(obj)
    })
    customTextObjects.value.clear()

    for (const [customTextIndex, { entry, itemsForSide }] of customTexts.value) {
      for (const { itemIndex, item } of itemsForSide) {
        if (!item?.selected) continue
        await addText(entry, customTextIndex, itemIndex)
      }
    }

    if (canvas.value) {
      canvas.value.requestRenderAll()
    }
  }

  // Expose functions for external use
  defineExpose({
    getImageFromCanvas,
    addLogo,
    resetAndAddLogos,
    resetAndAddTexts,
    customTexts
  })

  /**
   * Render logos stored for the opposite side onto this side's canvas.
   * If a logo already exists locally, update its placement instead of reloading.
   */
  async function renderOtherSideLogosFromStore(): Promise<void> {
    if (!canvas.value) return
    const entries = sceneStore.getOtherSideLogos(props.side as 'front' | 'back')
    const seen = new Set<number>()

    for (const entry of entries) {
      const logoIndex = entry.logo_index ?? 0
      seen.add(logoIndex)
      const existing = otherSideLogoObjects.value.get(logoIndex)
      if (existing) {
        existing.set({
          left: entry.left,
          top: entry.top,
          angle: entry.rotation ?? 0,
          flipX: entry.flipX ?? false,
          flipY: entry.flipY ?? false,
          scaleX: entry.scaleX ?? existing.scaleX,
          scaleY: entry.scaleY ?? existing.scaleY
        })
        existing.setCoords()
        continue
      }

      const url = entry.url
      if (!url) continue
      const img = (await loadImageFromURLCommon(url, '', {
        crossOrigin: 'Anonymous'
      })) as FabricImage
      img.set({
        left: entry.left,
        top: entry.top,
        angle: entry.rotation ?? 0,
        flipX: entry.flipX ?? false,
        flipY: entry.flipY ?? false,
        scaleX: entry.scaleX ?? img.scaleX,
        scaleY: entry.scaleY ?? img.scaleY,
        globalCompositeOperation: 'source-atop',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      })
      otherSideLogoObjects.value.set(logoIndex, img as FabricImage)
      canvas.value?.add(img as FabricObject)
      await applyClipPath(img as FabricImage)
      canvas.value?.requestRenderAll()
    }

    // Remove any mirrored logos that are no longer present in store
    for (const [idx, obj] of otherSideLogoObjects.value.entries()) {
      if (!seen.has(idx)) {
        canvas.value.remove(obj as unknown as FabricObject)
        otherSideLogoObjects.value.delete(idx)
      }
    }

    canvas.value.requestRenderAll()
  }

  /**
   * Render texts stored for the opposite side onto this side's canvas (mirror of text from other side).
   */
  async function renderOtherSideTextsFromStore(): Promise<void> {
    if (!canvas.value) return
    const entries = sceneStore.getOtherSideTexts(props.side as 'front' | 'back')
    const productId = effectiveProductId.value
    const raw =
      productId && customizationStore.customization?.product_custom_texts?.[String(productId)]
    const allTexts: OutputProductText[] = Array.isArray(raw) ? raw : []
    const seen = new Set<string>()
    const heightScale = heightScaleForText.value

    for (const stored of entries) {
      const key = getTextObjectKey(stored.customTextIndex, stored.itemIndex)
      seen.add(key)
      const entry = allTexts[stored.customTextIndex]
      const item = entry?.items?.[stored.itemIndex]
      if (!entry || !item) continue

      const fontSize = heightScale * Number(item.height) || 16
      const fontFamily = entry.font_family?.trim() || 'Ubuntu'
      const textObj = new FabricText(entry.value, {
        left: stored.left,
        top: stored.top,
        angle: stored.rotation ?? 0,
        scaleX: stored.scaleX ?? 1,
        scaleY: stored.scaleY ?? 1,
        originX: 'center',
        originY: 'center',
        fontFamily,
        fontSize,
        fill: item.color || '#000000',
        stroke: item.outline_enabled ? item.outline_color : undefined,
        strokeWidth: item.outline_enabled ? (item.outline_width ?? 0) : 0,
        paintFirst: 'stroke',
        selectable: false,
        evented: false,
        globalCompositeOperation: 'source-atop'
      })

      const existing = otherSideTextObjects.value.get(key)
      if (existing) {
        existing.set({
          text: entry.value,
          fontFamily,
          fontSize,
          fill: item.color || '#000000',
          stroke: item.outline_enabled ? item.outline_color : undefined,
          strokeWidth: item.outline_enabled ? (item.outline_width ?? 0) : 0,
          left: stored.left,
          top: stored.top,
          angle: stored.rotation ?? 0,
          scaleX: stored.scaleX ?? existing.scaleX,
          scaleY: stored.scaleY ?? existing.scaleY
        })
        existing.setCoords()
        continue
      }

      otherSideTextObjects.value.set(key, textObj as FabricObject)
      canvas.value.add(textObj as FabricObject)
      await applyClipPath(textObj as unknown as FabricImage)
    }

    for (const [key, obj] of otherSideTextObjects.value.entries()) {
      if (!seen.has(key)) {
        canvas.value.remove(obj)
        otherSideTextObjects.value.delete(key)
      }
    }

    canvas.value.requestRenderAll()
  }

  // Watch for changes in default colors from customization store
  watch(
    () => customizationStore.customization?.default_colors,
    () => {
      if (isPlacementMode.value) return
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        if (shouldApplyCustomizationColors.value) {
          changeDefaultColors(0)
        }
      } else if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        if (shouldApplyCustomizationColors.value) {
          resetToInitialColors(0)
        }
      }
    },
    { deep: true }
  )

  // Watch other-side mirrored entries and render/update them
  watch(
    () => sceneStore.getOtherSideLogos(props.side as 'front' | 'back'),
    async () => {
      if (isPlacementMode.value || !mounted.value) return
      await renderOtherSideLogosFromStore()
    },
    { deep: true }
  )

  watch(
    () => sceneStore.getOtherSideTexts(props.side as 'front' | 'back'),
    async () => {
      if (isPlacementMode.value) return
      setTimeout(async () => {
        await renderOtherSideTextsFromStore()
      }, 500)
    },
    { deep: true }
  )

  // Re-render fixed logos when style logos source changes.
  watch(
    fixedLogos,
    async () => {
      if (!mounted.value) return
      await resetAndAddFixedLogos()
    },
    { deep: true }
  )

  // Watch for changes in shuffle_color_number
  // When it changes, reapply default colors with new permutation
  watch(
    () => customizationStore.customization?.shuffle_color_number,
    async () => {
      if (isPlacementMode.value) return
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        if (shouldApplyCustomizationColors.value) {
          await changeDefaultColors(0)
        }
      }
    }
  )

  // Watch for changes in customLogos from customization store
  // Compare by checking what's in the Map vs what's in the array
  watch(
    customLogos,
    async (newLogos = new Map<number, CustomLogo>()) => {
      if (suppressCustomLogosWatch.value) {
        suppressCustomLogosWatch.value = false
        return
      }
      if (isPlacementMode.value) return
      if (!mounted.value) return
      await syncLogosOnCanvas({
        productId: effectiveProductId.value as number,
        newLogos,
        canvas: canvas.value,
        logoObjects: customLogoObjects,
        applyClipPath,
        addLogo,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        calculateScaleRatios: calculateScaleRatios2D,
        filterLogo: (logo: CustomLogo) => logo.side === props.side,
        suppressWatchRef: suppressCustomLogosWatch,
        mainPreview: props.mainPreview,
        convertSize: convertSizeToMeasurement,
        side: props.side as 'front' | 'back',
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
        }
      })
    },
    { deep: true }
  )

  // to-do I need to discuss it with Ali tomorrow.
  // Re-sync logos when undo/redo restores state so canvas reflects restored rotation/position
  watch(
    () => customizationStore.historyIndex,
    async () => {
      if (isPlacementMode.value) return
      if (!mounted.value) return
      await syncLogosOnCanvas({
        productId: effectiveProductId.value as number,
        newLogos: customLogos.value,
        canvas: canvas.value,
        logoObjects: customLogoObjects,
        applyClipPath,
        addLogo,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        calculateScaleRatios: calculateScaleRatios2D,
        filterLogo: (logo: CustomLogo) => logo.side === props.side,
        suppressWatchRef: suppressCustomLogosWatch,
        mainPreview: props.mainPreview,
        convertSize: convertSizeToMeasurement,
        side: props.side as 'front' | 'back',
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
        }
      })
    }
  )

  // Watch for changes in customTexts from customization store
  watch(
    customTexts,
    async newTexts => {
      if (suppressCustomTextsWatch.value) {
        suppressCustomTextsWatch.value = false
        return
      }
      if (isPlacementMode.value) return
      if (!mounted.value) return
      await syncTextsOnCanvas({
        productId: effectiveProductId.value ?? 0,
        newTexts: newTexts ?? new Map(),
        canvas: canvas.value,
        textObjects: customTextObjects,
        addText,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        heightScale: heightScaleForText.value,
        getScaleRatios: calculateScaleRatios2D,
        side: props.side as 'front' | 'back',
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
        }
      })
    },
    { deep: true }
  )

  // Watch for changes in group colors from customization store
  watch(
    () => customizationStore.customization?.group_colors,
    () => {
      if (isPlacementMode.value) return
      // Only apply if there are group colors set
      if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        if (shouldApplyCustomizationColors.value) {
          changeGroupColors(0)
        }
      } else {
        const defaultColors = customizationStore.customization?.default_colors || []
        const hasDefaultColors =
          defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
        if (!hasDefaultColors) {
          if (shouldApplyCustomizationColors.value) {
            resetToInitialColors(0)
          }
        }
      }
    },
    { deep: true }
  )

  // Watch for changes in applyCustomizationOverrides checkbox
  // When enabled, apply customization to all canvases
  watch(
    () => applyCustomizationOverrides.value,
    async () => {
      if (isPlacementMode.value) return
      if (
        !applyCustomizationOverrides.value &&
        !props.mainPreview &&
        !props.applyCustomizationColors
      ) {
        await resetToInitialColors(0)
      } else {
        if (!props.mainPreview) {
          // only apply to other canvases as main canvas is already applied
          const defaultColors = customizationStore.customization?.default_colors || []
          const hasDefaultColors =
            defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
          const groupColors = customizationStore.customization?.group_colors || {}
          const hasGroupColors = Object.keys(groupColors).length > 0

          // Only apply if there are customizations set
          if (hasDefaultColors || hasGroupColors) {
            await applyCustomization(0)
          }
        }
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="relative">
    <canvas
      ref="canvasEl"
      class="w-full! aspect-square! h-auto!"
      :class="canvasClass"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ maxHeight: `${canvasHeight}px !important` }"
    />
  </div>
</template>
