<script setup lang="ts">
  import { onMounted, onBeforeUnmount, computed, ref, watch } from 'vue'
  import {
    Canvas,
    FabricImage,
    Group,
    loadSVGFromURL,
    util,
    type FabricObject,
    type CanvasOptions
  } from 'fabric'
  import { useProductsStore } from '@/stores/products/products.store'
  import {
    filterFields,
    getSelectedProductPantones,
    getClosestColor,
    getColorType
  } from '@/lib/utils'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'
  import type { OutputSvgGroupColor } from '@/services/products/types'

  const productsStore = useProductsStore()

  // Canvas refs
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const canvas = ref<Canvas | null>(null)
  const designObject = ref<FabricObject | FabricImage | null>(null)
  const modelObjects = ref<(FabricObject | FabricImage)[]>([])

  // SVG Groups state
  const svgGroups = ref<OutputSvgGroupColor[]>([])
  const initialSvgGroups = ref<OutputSvgGroupColor[]>([])

  // Storage URL helper
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  // Default Fabric.js object options used throughout the component
  const defaultFabricObjectOptions = {
    hasControls: false,
    selectable: false,
    evented: false,
    originX: 'center' as const,
    originY: 'center' as const
  }

  // Model type based on style preview structure
  type ModelData = {
    composition: 'multiply' | 'screen'
    file_url: string
    thumb_sm_url: string
  }

  type DesignData = {
    file_url: string
    file_extension: string
  }

  interface Props {
    models?: ModelData[]
    design?: DesignData
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
  }

  const props = withDefaults(defineProps<Props>(), {
    models: undefined,
    design: undefined,
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
    canvasClass: 'rounded-[32px] transition-opacity duration-300 z-10'
  })

  // Computed product ID: use prop if provided, otherwise use active product from store
  const effectiveProductId = computed(() => {
    return props.productId ?? productsStore.activeProductDetails?.id ?? null
  })

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

  const effectiveDesign = computed<DesignData | undefined>(() => {
    if (props.design) {
      // Filter props.design to only include DesignData fields
      return filterFields(props.design, ['file_url', 'file_extension']) as DesignData
    }

    const designDetails = productsStore.activeDesignDetails
    if (!designDetails) return undefined

    const side = props.side
    const storeDesign =
      side === 'back' && designDetails.back_design
        ? designDetails.back_design
        : designDetails.front_design

    // Filter to only include DesignData properties
    return filterFields(storeDesign, ['file_url', 'file_extension']) as DesignData
  })

  // Watch for changes in effectiveDesign and reload design
  watch(
    effectiveDesign,
    async (newDesign, oldDesign) => {
      if (!canvas.value) return

      // Only reload if design actually changed
      if (newDesign && (!oldDesign || newDesign.file_url !== oldDesign.file_url)) {
        await addDesign(newDesign)

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
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
        // Remove all existing models
        removeModels()

        // Add new models
        if (newModels.length > 0) {
          await Promise.all(newModels.map(model => addModel(model)))
          bringModelToFront()
        }

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
  )

  onMounted(() => {
    initCanvas()
    loadScene()
  })

  onBeforeUnmount(() => {
    if (canvas.value) {
      canvas.value.dispose()
      canvas.value = null
    }
  })

  function initCanvas() {
    // Dispose existing canvas if any
    if (canvas.value) {
      canvas.value.dispose()
      canvas.value = null
    }

    if (!canvasEl.value) return

    // Initialize Fabric.js canvas
    const canvasOptions: Partial<CanvasOptions> = {
      selection: false,
      enableRetinaScaling: true,
      enablePointerEvents: false,
      allowTouchScrolling: true
    }

    canvas.value = new Canvas(canvasEl.value, canvasOptions)

    // Set canvas dimensions
    canvas.value.setDimensions({
      width: props.canvasWidth,
      height: props.canvasHeight
    })
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
    optionsOverride?: Partial<typeof defaultFabricObjectOptions & Record<string, unknown>>
  ): Promise<FabricObject | FabricImage> {
    const fullUrl = fromStorage(url)
    const mergedOptions = { ...defaultFabricObjectOptions, ...optionsOverride }

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
   * Remove design object from canvas
   */
  function removeDesign(): void {
    if (!canvas.value || !designObject.value) return
    const designObj = designObject.value as unknown as FabricObject
    canvas.value.remove(designObj)
    designObject.value = null
  }

  /**
   * Add design (texture) to the canvas
   */
  async function addDesign(designData: DesignData): Promise<void> {
    if (!canvas.value || !designData) return

    const designUrl = designData.file_url + '.' + designData.file_extension
    const designObj = await loadImageFromURL(designUrl, designData.file_extension)

    // Scale to fit canvas with padding
    const padding = 10
    if (designObj.width && designObj.height) {
      if (designObj.width > designObj.height) {
        designObj.scaleToWidth(props.canvasWidth - padding)
      } else {
        designObj.scaleToHeight(props.canvasHeight - padding)
      }
    }

    designObj.setCoords()

    // Remove existing design first
    removeDesign()

    // Add to canvas - cast to FabricObject for type compatibility
    const designAsObject = designObj as FabricObject
    canvas.value.add(designAsObject)
    canvas.value.viewportCenterObject(designAsObject)
    canvas.value.sendObjectToBack(designAsObject)
    designObject.value = designAsObject

    // Extract SVG groups if it's an SVG design and mainPreview is enabled
    if (designData.file_extension.toLowerCase() === 'svg') {
      await getSvgGroups()
    }
  }

  /**
   * Remove all model objects from canvas
   */
  function removeModels(): void {
    if (!canvas.value || !modelObjects.value.length) return

    const c = canvas.value
    modelObjects.value.forEach(model => {
      const modelObj = model as unknown as FabricObject
      c.remove(modelObj)
    })
    modelObjects.value = []
  }

  /**
   * Add model image to the canvas
   */
  async function addModel(modelData: ModelData): Promise<void> {
    if (!canvas.value || !modelData) return

    // Use file_url for main preview, thumb_sm_url for thumbnails
    const modelUrl = modelData.file_url || modelData.thumb_sm_url

    // Load image with default options, override with composition mode
    const img = (await loadImageFromURL(modelUrl + '?nocache=2', '', {
      globalCompositeOperation: modelData.composition || 'multiply'
      // Options already set by default, but we can add additional ones here if needed
    })) as FabricImage

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

    // Add to canvas
    canvas.value.add(img as FabricObject)
    canvas.value.viewportCenterObject(img as FabricObject)
    modelObjects.value.push(img as FabricObject)
  }

  function bringModelToFront(): void {
    if (!canvas.value || !modelObjects.value.length) return

    modelObjects.value.forEach(model => {
      canvas.value?.bringObjectToFront(model as FabricObject)
    })
  }

  /**
   * Load the complete scene with design and models
   */
  async function loadScene(): Promise<void> {
    if (!canvas.value) return

    const promises: Promise<void>[] = []

    // Load design
    if (effectiveDesign.value) {
      await addDesign(effectiveDesign.value)
    }

    // Load models
    if (effectiveModels.value.length > 0) {
      effectiveModels.value.forEach(model => {
        promises.push(addModel(model))
      })
    }

    await Promise.all(promises)

    // Ensure models are on top of design
    bringModelToFront()

    canvas.value.requestRenderAll()
  }

  /**
   * Convert RGB color string to hex
   * @param rgb - RGB color string (e.g., "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)")
   */
  function rgbToHex(rgb: string | undefined): string {
    if (!rgb) return '#000000'
    // Extract RGB values using regex
    const match = rgb.match(/\d+/g)
    if (!match || match.length < 3) return rgb

    const r = parseInt(match[0] || '0', 10)
    const g = parseInt(match[1] || '0', 10)
    const b = parseInt(match[2] || '0', 10)

    // Convert to hex
    const hex =
      '#' +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        })
        .join('')

    return hex
  }

  /**
   * Check if an object with the given id already exists in svgGroups
   */
  function containsObject(obj: { id: string }): boolean {
    return svgGroups.value.some(group => group.id === obj.id)
  }

  /**
   * Extract SVG groups from the design object
   * Similar to Scene.vue getSvgGroups method
   */
  async function getSvgGroups(): Promise<void> {
    if (!designObject.value) return

    svgGroups.value = []
    initialSvgGroups.value = []

    // Get design objects - handle both Group and single object
    const design = (designObject.value as Group & { _objects?: FabricObject[] })._objects
      ? (designObject.value as Group)._objects || []
      : [designObject.value]

    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }
      const idValue = itemWithId.id
      if (!idValue) return

      // Process id: split by underscore and take first part, convert to lowercase
      const itemId = idValue.split('_')[0]?.toLowerCase() || idValue.toLowerCase()
      itemWithId.set('id', itemId)

      // Skip non-customizable parts
      if (
        itemId.includes('noncustomizable') ||
        itemId.includes('inside') ||
        itemId.includes('anchor') ||
        containsObject({ id: itemId })
      ) {
        return
      }

      let count = 1
      if (itemId === 'base') {
        count = 100000 // Make base always at first color position
      }

      // Handle gradient fills
      if (
        itemWithId.fill &&
        typeof itemWithId.fill === 'object' &&
        'gradientUnits' in itemWithId.fill &&
        itemWithId.fill.gradientUnits
      ) {
        const gradient_colors: Array<{ color: string; pantone: string; name: string }> = []

        if (itemWithId.fill.colorStops) {
          itemWithId.fill.colorStops.forEach((color_stop: { color: string }) => {
            let color = color_stop.color

            // Convert RGB to hex if needed
            if (color.includes('rgb')) {
              color = rgbToHex(color)
              if (!color.startsWith('#')) {
                color = '#' + color
              }
            }

            // Get pantone color match
            const selectProductPantonesList = getSelectedProductPantones(
              effectiveProductId.value,
              itemId
            )
            const pantoneColor = getClosestColor(
              color,
              selectProductPantonesList,
              getColorType(itemId, effectiveProductId.value)
            )

            gradient_colors.push({
              color,
              pantone: pantoneColor.pantone,
              name: pantoneColor.name
            })
          })
        }

        svgGroups.value.push({
          id: itemId,
          color: gradient_colors[0]?.color || '#000000',
          count,
          gradient_colors,
          pantone: '',
          name: ''
        })
      }
      // Handle solid fills
      else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
        let fillColor = itemWithId.fill

        // Convert RGB to hex if needed
        if (fillColor.includes('rgb')) {
          fillColor = rgbToHex(fillColor)
          if (!fillColor.startsWith('#')) {
            fillColor = '#' + fillColor
          }
        }

        // Get pantone color match
        const selectProductPantonesList = getSelectedProductPantones(
          effectiveProductId.value,
          itemId
        )
        const pantoneColor = getClosestColor(
          fillColor,
          selectProductPantonesList,
          getColorType(itemId, effectiveProductId.value)
        )

        svgGroups.value.push({
          id: itemId,
          color: fillColor,
          count,
          pantone: pantoneColor.pantone,
          name: pantoneColor.name
        })
      }
    })

    // Sort by count (descending)
    svgGroups.value = svgGroups.value.sort((a, b) => (a.count < b.count ? 1 : -1))

    // Store initial state
    initialSvgGroups.value = JSON.parse(JSON.stringify(svgGroups.value))

    // Dispatch to store if mainPreview is enabled
    if (props.mainPreview) {
      productsStore.setSvgGroups(svgGroups.value, props.side)
    }
  }
</script>

<template>
  <div class="relative">
    <canvas ref="canvasEl" :width="canvasWidth" :height="canvasHeight" :class="canvasClass" />
  </div>
</template>
