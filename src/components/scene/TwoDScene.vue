<script setup lang="ts">
  import { onMounted, onBeforeUnmount, computed, ref, watch } from 'vue'
  import {
    Canvas,
    FabricImage,
    Group,
    loadSVGFromURL,
    util,
    Gradient,
    type FabricObject,
    type CanvasOptions
  } from 'fabric'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import {
    filterFields,
    getSelectedProductPantones,
    getClosestColor,
    getColorType,
    hexToRgbObject,
    getPermutation
  } from '@/lib/utils'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'
  import type { OutputSvgGroupColor } from '@/services/products/types'

  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()

  // Canvas refs
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const canvas = ref<Canvas | null>(null)
  const designObject = ref<FabricObject | FabricImage | null>(null)
  const modelObjects = ref<(FabricObject | FabricImage)[]>([])

  // SVG Groups state (using store)
  const svgGroups = ref<OutputSvgGroupColor[]>([])
  const initialSvgGroups = ref<OutputSvgGroupColor[]>([])
  // Parts array for color permutation (initialized from prop, similar to Scene.vue)
  const parts = ref<string[]>([])

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
    // SVG parts array for color permutation (can be string JSON or array)
    svgParts?: string[] | string
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
    canvasClass: 'rounded-[32px] transition-opacity duration-300 z-10',
    // SVG parts - defaults to undefined (will be initialized from svgGroups if not provided)
    svgParts: undefined
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
    // Initialize parts from prop if provided (similar to Scene.vue)
    if (props.svgParts) {
      if (typeof props.svgParts === 'string') {
        try {
          parts.value = JSON.parse(props.svgParts) || []
        } catch {
          parts.value = []
        }
      } else if (Array.isArray(props.svgParts)) {
        parts.value = [...props.svgParts]
      }
    }

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

    // Store initial state locally (for this component instance)
    initialSvgGroups.value = JSON.parse(JSON.stringify(svgGroups.value))

    // Dispatch to store if mainPreview is enabled
    // Pass setInitial=true to also store the initial state in the store
    if (props.mainPreview) {
      productsStore.setSvgGroups(svgGroups.value, props.side, true)
    }

    // Initialize parts array if not already set
    if (parts.value.length === 0) {
      // If mainPreview is enabled, try to get parts from store first
      if (props.mainPreview && productsStore.svgGroups.length > 0) {
        parts.value = productsStore.svgGroups.map(group => group.id)
      } else {
        // Fallback to local svgGroups
        parts.value = svgGroups.value.map(group => group.id)
      }
    }

    // Apply customization on load if active and checkbox is enabled
    const defaultColors = customizationStore.customization?.default_colors || []
    const hasDefaultColors =
      defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0

    if (hasDefaultColors || hasGroupColors) {
      if (applyCustomizationOverrides.value || props.mainPreview) {
        await applyCustomization(0)
      }
    }
  }

  /**
   * Get group color by SVG group name, similar to Scene.vue getGroupColorBySvgGroup
   * @param svgGroup - SVG group ID
   * @param gradientColorIndex - Optional gradient color index
   * @returns Color object with color, pantone, and name
   */
  function getGroupColorBySvgGroup(
    svgGroup: string,
    gradientColorIndex: number | null = null
  ): { color: string; pantone: string; name: string } {
    const groupColors = customizationStore.customization?.group_colors || {}
    const groupColor = groupColors[svgGroup]

    if (!groupColor) {
      return { color: '', pantone: '', name: '' }
    }

    let finalColor: { color: string; pantone: string; name: string }

    if (gradientColorIndex !== null && groupColor.gradient_colors) {
      finalColor = groupColor.gradient_colors[gradientColorIndex] || {
        color: '',
        pantone: '',
        name: ''
      }
    } else {
      finalColor = {
        color: groupColor.color || '',
        pantone: '',
        name: groupColor.name || ''
      }
    }

    // Check if color exists in product's SVG group colors
    const product = effectiveProductId.value
      ? productsStore.getProductById(effectiveProductId.value)
      : productsStore.activeProductDetails

    if (product?.svg_group_color_container?.[svgGroup]) {
      const productColors = product.svg_group_color_container[svgGroup].json_data || []
      const colorExists = productColors.some(
        (color: { value?: string }) => color.value === finalColor.color
      )

      if (!colorExists && finalColor.color) {
        // Find closest color match
        const selectProductPantonesList = getSelectedProductPantones(
          effectiveProductId.value,
          svgGroup
        )
        const closestColor = getClosestColor(
          finalColor.color,
          selectProductPantonesList,
          getColorType(svgGroup, effectiveProductId.value)
        )
        return {
          color: closestColor.hex,
          pantone: closestColor.pantone,
          name: closestColor.name
        }
      }
    }

    return finalColor
  }

  /**
   * Get SVG group colors for a specific group (helper for checking available colors)
   */
  function getSvgGroupColors(svgGroup: string) {
    const product = effectiveProductId.value
      ? productsStore.getProductById(effectiveProductId.value)
      : productsStore.activeProductDetails

    if (product?.svg_group_color_container?.[svgGroup]) {
      return product.svg_group_color_container[svgGroup]
    }
    return null
  }

  /**
   * Get default color by SVG group name, similar to Scene.vue getDefaultColorBySvgGroup
   * @param svgGroup - SVG group ID
   * @param defaultColorOriginal - Original default color object
   * @returns Color object with color, pantone, and name
   */
  function getDefaultColorBySvgGroup(
    svgGroup: string,
    defaultColorOriginal: { color: string; pantone?: string; name?: string }
  ): { color: string; pantone: string; name: string } {
    const svgGroupColors = getSvgGroupColors(svgGroup)
    if (svgGroupColors && svgGroupColors.json_data) {
      const colorExists = svgGroupColors.json_data.some(
        (color: { value?: string }) => color.value === defaultColorOriginal.color
      )
      if (!colorExists && defaultColorOriginal.color) {
        // Find closest color match
        const selectProductPantonesList = getSelectedProductPantones(
          effectiveProductId.value,
          svgGroup
        )
        const closestColor = getClosestColor(
          defaultColorOriginal.color,
          selectProductPantonesList,
          getColorType(svgGroup, effectiveProductId.value)
        )
        return {
          color: closestColor.hex,
          pantone: closestColor.pantone,
          name: closestColor.name
        }
      }
    }
    return {
      color: defaultColorOriginal.color || '',
      pantone: defaultColorOriginal.pantone || '',
      name: defaultColorOriginal.name || ''
    }
  }

  /**
   * Find closest color index from product part colors to default colors
   * @param productPartColors - Array of product part colors
   * @param defaultColors - Array of default colors
   * @returns Index of the closest default color
   */
  function findClosestColorIndex(
    productPartColors: Array<{ value?: string }>,
    defaultColors: Array<{ color?: string | null }>
  ): number {
    let groupColorIndex = 0
    let leastColorDifference = 765 // Max color difference: 255 + 255 + 255 = 765

    const defaultColorsRGB = defaultColors
      .filter(color => color.color)
      .map(color => hexToRgbObject(color.color as string))
      .filter((rgb): rgb is { red: number; green: number; blue: number } => rgb !== null)

    const productPartColorsRGB = productPartColors
      .map(color => hexToRgbObject(color.value || ''))
      .filter((rgb): rgb is { red: number; green: number; blue: number } => rgb !== null)

    defaultColorsRGB.forEach((defaultColor, defaultColorIndex) => {
      productPartColorsRGB.forEach(productPartColor => {
        // Calculate the Euclidean distance
        const diff = Math.sqrt(
          Math.pow(defaultColor.red - productPartColor.red, 2) +
            Math.pow(defaultColor.green - productPartColor.green, 2) +
            Math.pow(defaultColor.blue - productPartColor.blue, 2)
        )
        if (diff < leastColorDifference) {
          leastColorDifference = diff
          groupColorIndex = defaultColorIndex
        }
      })
    })

    return groupColorIndex
  }

  /**
   * Change default colors on the canvas, similar to Scene.vue changeDefaultColors
   * @param renderTime - Optional render delay time
   */
  async function changeDefaultColors(renderTime = 0): Promise<void> {
    if (!canvas.value || !designObject.value) return

    const defaultColors = customizationStore.customization?.default_colors || []
    const filteredDefaultColors = defaultColors.filter(
      (color: { color?: string | null }) => color.color
    )

    if (filteredDefaultColors.length === 0) return

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (((designObject.value as Group)._objects || []) as FabricObject[])
      : [designObject.value as FabricObject]

    const shuffleColorNumber = customizationStore.customization?.shuffle_color_number || 0

    // If still no parts, we can't apply colors
    if (parts.value.length === 0) {
      console.warn('No parts available for default colors application')
      return
    }

    const sequences = getPermutation(shuffleColorNumber, parts.value.length)
    const appliedDefaultColors: Record<string, string | string[]> = {}
    let useColorIndex = 0

    // Apply default colors to SVG groups
    sequences.forEach((sequence: number) => {
      const svgPart = parts.value[sequence]
      if (svgPart) {
        const partIndex = svgPart.split('_')
        const part = partIndex[0] || svgPart
        const index = partIndex[1] || '1'
        const gradientColorIndex = parseInt(index) - 1
        const svgIndex = svgGroups.value.findIndex(group => group.id === part)

        if (svgIndex !== -1) {
          const svgGroup = svgGroups.value[svgIndex]
          if (!svgGroup) return

          const product = effectiveProductId.value
            ? productsStore.getProductById(effectiveProductId.value)
            : productsStore.activeProductDetails

          // Find closest color if product has svg_group_color_container
          if (product?.svg_group_color_container?.[svgGroup.id]?.json_data) {
            const productPartColors =
              product.svg_group_color_container[svgGroup.id]?.json_data || []
            useColorIndex = findClosestColorIndex(productPartColors, filteredDefaultColors)
          }

          const defaultColor = filteredDefaultColors[useColorIndex] as {
            color: string
            pantone?: string
            name?: string
          }

          if (defaultColor) {
            let finalColor: { color: string; pantone: string; name: string }

            if (svgGroup.gradient_colors) {
              finalColor = getDefaultColorBySvgGroup(svgGroup.id, defaultColor)
              if (svgGroup.gradient_colors[gradientColorIndex]) {
                svgGroup.gradient_colors[gradientColorIndex].color = finalColor.color
                svgGroup.gradient_colors[gradientColorIndex].pantone = finalColor.pantone
                svgGroup.gradient_colors[gradientColorIndex].name = finalColor.name
              }
              if (Array.isArray(appliedDefaultColors[part])) {
                ;(appliedDefaultColors[part] as string[]).push(finalColor.color)
              } else {
                appliedDefaultColors[part] = [finalColor.color]
              }
            } else {
              finalColor = getDefaultColorBySvgGroup(svgGroup.id, defaultColor)
              appliedDefaultColors[part] = finalColor.color
              svgGroup.color = finalColor.color
              svgGroup.pantone = finalColor.pantone
              svgGroup.name = finalColor.name
            }

            // Update store if mainPreview is enabled
            if (props.mainPreview) {
              productsStore.setSvgGroups(svgGroups.value, props.side, false)
            }
          }

          useColorIndex++
          if (useColorIndex >= filteredDefaultColors.length) {
            useColorIndex = 0
          }
        }
      }
    })

    // Update design objects on canvas
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()
      const appliedColor = appliedDefaultColors[itemId]

      if (appliedColor) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits
        ) {
          // Handle gradient fill
          if (Array.isArray(appliedColor)) {
            itemWithId.fill.colorStops?.forEach(
              (gradient: { color: string }, gradientIndex: number) => {
                if (appliedColor[gradientIndex]) {
                  gradient.color = appliedColor[gradientIndex]
                }
              }
            )
            itemWithId.set(
              'fill',
              new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
            )
          }
        } else if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'string' &&
          typeof appliedColor === 'string'
        ) {
          // Handle solid fill
          itemWithId.set('fill', appliedColor)
        }
      }
    })

    // Render canvas after a delay
    if (renderTime > 0) {
      setTimeout(() => {
        canvas.value?.requestRenderAll()
      }, renderTime)
    } else {
      canvas.value?.requestRenderAll()
    }
  }

  /**
   * Reset colors to their original state from initialSvgGroups
   * Similar to Scene.vue setInitialColors method
   * @param renderTime - Optional render delay time
   */
  async function resetToInitialColors(renderTime = 0): Promise<void> {
    if (!canvas.value || !designObject.value || initialSvgGroups.value.length === 0) return

    // Create a map of initial SVG groups for quick lookup
    const defaultSvgGroups: Record<string, OutputSvgGroupColor> = {}
    initialSvgGroups.value.forEach(svgGroup => {
      defaultSvgGroups[svgGroup.id] = svgGroup
    })

    // Reset SVG groups to initial state
    svgGroups.value.forEach(svgGroup => {
      if (defaultSvgGroups[svgGroup.id]) {
        const initialGroup = defaultSvgGroups[svgGroup.id]
        // Simply assign all properties from initial group
        Object.assign(svgGroup, initialGroup)

        // Update store if mainPreview is enabled
        if (props.mainPreview) {
          productsStore.setSvgGroups(svgGroups.value, props.side, false)
        }
      }
    })

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (((designObject.value as Group)._objects || []) as FabricObject[])
      : [designObject.value as FabricObject]

    // Reset design objects on canvas to initial colors
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()
      const initialGroup = defaultSvgGroups[itemId]

      if (initialGroup) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits &&
          initialGroup.gradient_colors
        ) {
          // Reset gradient fill
          itemWithId.fill.colorStops?.forEach(
            (gradient: { color: string }, gradientIndex: number) => {
              if (initialGroup.gradient_colors && initialGroup.gradient_colors[gradientIndex]) {
                gradient.color = initialGroup.gradient_colors[gradientIndex].color
              }
            }
          )
          itemWithId.set(
            'fill',
            new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
          )
        } else if (itemWithId.fill && typeof itemWithId.fill === 'string' && initialGroup.color) {
          // Reset solid fill
          itemWithId.set('fill', initialGroup.color)
        }
      }
    })

    // Render canvas after a delay
    if (renderTime > 0) {
      setTimeout(() => {
        canvas.value?.requestRenderAll()
      }, renderTime)
    } else {
      canvas.value?.requestRenderAll()
    }
  }

  /**
   * Apply all customization types to the canvas
   * This method centralizes all customization application logic
   * @param renderTime - Optional render delay time
   */
  async function applyCustomization(renderTime = 0): Promise<void> {
    if (!applyCustomizationOverrides.value && !props.mainPreview) return

    const defaultColors = customizationStore.customization?.default_colors || []
    const hasDefaultColors =
      defaultColors.filter((color: { color?: string | null }) => color.color).length > 0

    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0

    // If no colors are set, reset to initial colors
    if (!hasDefaultColors && !hasGroupColors) {
      if (applyCustomizationOverrides.value || props.mainPreview) {
        await resetToInitialColors(renderTime)
      }
      return
    }

    // Apply default colors customization
    if (hasDefaultColors) {
      if (applyCustomizationOverrides.value || props.mainPreview) {
        await changeDefaultColors(renderTime)
      }
    } else {
      // Reset to initial colors if default colors are cleared
      if (applyCustomizationOverrides.value || props.mainPreview) {
        await resetToInitialColors(renderTime)
      }
    }

    // Apply group colors customization
    if (hasGroupColors) {
      if (applyCustomizationOverrides.value || props.mainPreview) {
        await changeGroupColors(renderTime)
      }
    } else {
      // Reset to initial colors if group colors are cleared
      // Only reset if default colors are also not set (to avoid double reset)
      if (!hasDefaultColors && (applyCustomizationOverrides.value || props.mainPreview)) {
        await resetToInitialColors(renderTime)
      }
    }

    // TODO: Add more customization types here in the future
    // e.g., await applyPatterns(renderTime)
    // e.g., await applyTexts(renderTime)
    // e.g., await applyLogos(renderTime)
  }

  /**
   * Change group colors on the canvas, similar to Scene.vue changeGroupColors
   * @param renderTime - Optional render delay time
   */
  async function changeGroupColors(renderTime = 0): Promise<void> {
    if (!canvas.value || !designObject.value) return

    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0

    if (!hasGroupColors) return

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (((designObject.value as Group)._objects || []) as FabricObject[])
      : [designObject.value as FabricObject]

    // Update SVG groups in local state
    svgGroups.value.forEach(svgGroup => {
      if (groupColors[svgGroup.id]) {
        if (svgGroup.gradient_colors) {
          if (groupColors[svgGroup.id]?.gradient_colors) {
            // Update all gradient colors
            groupColors[svgGroup.id]?.gradient_colors?.forEach(
              (_gradientColor: unknown, gradientColorIndex: number) => {
                const finalColor = getGroupColorBySvgGroup(svgGroup.id, gradientColorIndex)
                if (svgGroup.gradient_colors && svgGroup.gradient_colors[gradientColorIndex]) {
                  svgGroup.gradient_colors[gradientColorIndex].color = finalColor.color
                  svgGroup.gradient_colors[gradientColorIndex].pantone = finalColor.pantone
                  svgGroup.gradient_colors[gradientColorIndex].name = finalColor.name
                }
              }
            )
          } else {
            // Update first gradient color if other product same group changed color without gradient
            if (svgGroup.gradient_colors[0]) {
              const finalColor = getGroupColorBySvgGroup(svgGroup.id)
              svgGroup.gradient_colors[0].color = finalColor.color
              svgGroup.gradient_colors[0].pantone = finalColor.pantone
              svgGroup.gradient_colors[0].name = finalColor.name
            }
          }
        } else {
          // Update solid color
          const finalColor = getGroupColorBySvgGroup(
            svgGroup.id,
            groupColors[svgGroup.id]?.gradient_colors ? 0 : null
          )
          svgGroup.color = finalColor.color
          svgGroup.name = finalColor.name
          svgGroup.pantone = finalColor.pantone
        }

        // Update store if mainPreview is enabled
        if (props.mainPreview) {
          productsStore.setSvgGroups(svgGroups.value, props.side, false)
        }
      } else {
        // Reset to initial color if no group color is set
        const initialGroup = initialSvgGroups.value.find(g => g.id === svgGroup.id)
        if (initialGroup) {
          Object.assign(svgGroup, initialGroup)
          if (props.mainPreview) {
            productsStore.setSvgGroups(svgGroups.value, props.side, false)
          }
        }
      }
    })

    // Update design objects on canvas
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()

      if (groupColors[itemId]) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits
        ) {
          // Handle gradient fill
          if (groupColors[itemId].gradient_colors) {
            // Update all gradient color stops
            groupColors[itemId].gradient_colors.forEach(
              (_gradientColor: { color: string }, gradientColorIndex: number) => {
                if (
                  itemWithId.fill &&
                  typeof itemWithId.fill === 'object' &&
                  'colorStops' in itemWithId.fill &&
                  itemWithId.fill.colorStops?.[gradientColorIndex]
                ) {
                  const finalColor = getGroupColorBySvgGroup(itemId, gradientColorIndex)
                  itemWithId.fill.colorStops[gradientColorIndex].color = finalColor.color
                }
              }
            )
          } else {
            // Update first gradient color stop
            if (
              itemWithId.fill &&
              typeof itemWithId.fill === 'object' &&
              'colorStops' in itemWithId.fill &&
              itemWithId.fill.colorStops?.[0]
            ) {
              const finalColor = getGroupColorBySvgGroup(itemId)
              itemWithId.fill.colorStops[0].color = finalColor.color
            }
          }
          // Apply the updated gradient
          if (
            itemWithId.fill &&
            typeof itemWithId.fill === 'object' &&
            'gradientUnits' in itemWithId.fill
          ) {
            itemWithId.set(
              'fill',
              new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
            )
          }
        } else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
          // Handle solid fill
          const finalColor = getGroupColorBySvgGroup(
            itemId,
            groupColors[itemId].gradient_colors ? 0 : null
          )
          itemWithId.set('fill', finalColor.color)
        }
      } else {
        const defaultColors = customizationStore.customization?.default_colors || []
        const filteredDefaultColors = defaultColors.filter(
          (color: { color?: string | null }) => color.color
        )
        // If no default colors are not set, then reset to initial color
        if (filteredDefaultColors.length === 0) {
          // Reset to initial color
          const initialGroup = initialSvgGroups.value.find(
            (g: OutputSvgGroupColor) => g.id === itemId
          )
          if (initialGroup) {
            if (
              itemWithId.fill &&
              typeof itemWithId.fill === 'object' &&
              'gradientUnits' in itemWithId.fill &&
              itemWithId.fill.gradientUnits
            ) {
              // Reset gradient fill
              if (
                initialGroup.gradient_colors &&
                itemWithId.fill &&
                typeof itemWithId.fill === 'object' &&
                'colorStops' in itemWithId.fill
              ) {
                initialGroup.gradient_colors.forEach(
                  (gradientColor: { color: string }, gradientColorIndex: number) => {
                    if (
                      itemWithId.fill &&
                      typeof itemWithId.fill === 'object' &&
                      'colorStops' in itemWithId.fill &&
                      itemWithId.fill.colorStops?.[gradientColorIndex]
                    ) {
                      itemWithId.fill.colorStops[gradientColorIndex].color = gradientColor.color
                    }
                  }
                )
                itemWithId.set(
                  'fill',
                  new Gradient(
                    itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0]
                  )
                )
              }
            } else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
              // Reset solid fill
              itemWithId.set('fill', initialGroup.color)
            }
          }
        }
      }
    })

    // Render canvas after a delay
    if (renderTime > 0) {
      setTimeout(() => {
        canvas.value?.requestRenderAll()
      }, renderTime)
    } else {
      canvas.value?.requestRenderAll()
    }
  }

  // Watch for changes in default colors from customization store
  watch(
    () => customizationStore.customization?.default_colors,
    () => {
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          changeDefaultColors(0)
        }
      } else if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        if (applyCustomizationOverrides.value || props.mainPreview) {
          resetToInitialColors(0)
        }
      }
    },
    { deep: true }
  )

  // Watch for changes in shuffle_color_number
  // When it changes, reapply default colors with new permutation
  watch(
    () => customizationStore.customization?.shuffle_color_number,
    async () => {
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          await changeDefaultColors(0)
        }
      }
    }
  )

  // Watch for changes in group colors from customization store
  watch(
    () => customizationStore.customization?.group_colors,
    () => {
      // Only apply if there are group colors set
      if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          changeGroupColors(0)
        }
      } else {
        const defaultColors = customizationStore.customization?.default_colors || []
        const hasDefaultColors =
          defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
        if (!hasDefaultColors) {
          // If group colors are undefined, reset to initial colors
          if (applyCustomizationOverrides.value || props.mainPreview) {
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
      // If not mainPreview and applyCustomizationOverrides is set to disabled, reset to initial colors
      if (!applyCustomizationOverrides.value && !props.mainPreview) {
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
      class="!w-full !aspect-square !h-auto"
      :class="canvasClass"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ maxHeight: `${canvasHeight}px !important` }"
    />
  </div>
</template>
