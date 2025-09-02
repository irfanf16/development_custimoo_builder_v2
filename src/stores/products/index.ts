import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  ActiveProductCustomization,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputDesignPreview,
  OutputStylePreview,
  OutputStyleDetails,
  OutputDesignDetails,
  OutputAddon,
  OutputCompanyAddon,
  OutputRecentLogo,
  OutputProductLogosSetting,
  OutputProductDetails
} from '@/services/products/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'

export const useProductsStore = defineStore('productsStore', () => {
  // State
  const categories = ref<OutputProductCategories | null>(null)

  // Full information based on the customization of the product.
  // This information will be populated once a product, style, or design, etc is selected by the user
  const activeProductDetails = ref<OutputProductDetails | null>(null)
  // By default, it will chose the first style of the product
  const activeStyleDetails = ref<OutputStyleDetails | null>(null)
  // By default, it will chose the first design of the style
  const activeDesignDetails = ref<OutputDesignDetails | null>(null)
  // By default, no add-ons will be selected. Add-ons will be populated based on the selected product, style, and design

  const activeAddons = ref<OutputAddon[] | null>(null)
  const productAddons = ref<OutputAddon[] | null>(null)
  const companyAddons = ref<OutputCompanyAddon[] | null>(null)

  // Customized Product State
  const activeProductCustomization = ref<ActiveProductCustomization | null>(
    null
  )

  // Active step (separate from customization since it's UI state)
  const activeStep = ref<string | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('activeStep')
      : null
  )

  // Computed getters for IDs from activeProductCustomization
  const activeProductId = computed(() =>
    activeProductCustomization.value
      ? Number(activeProductCustomization.value.product_id)
      : null
  )
  const activeStyleId = computed(
    () => activeProductCustomization.value?.style_id ?? null
  )
  const activeDesignId = computed(
    () => activeProductCustomization.value?.design_id ?? null
  )
  const activeCategoryId = computed(
    () => activeProductCustomization.value?.category_id ?? null
  )

  // Computed getters for effective details that combine customization with defaults
  const effectiveStyleDetails = computed(() => {
    if (
      !activeProductCustomization.value?.style_id ||
      !activeStyleDetails.value
    ) {
      return activeStyleDetails.value
    }

    // If customization has a different style than the current activeStyleDetails,
    // we need to return the style that matches the customization
    if (
      activeProductCustomization.value.style_id === activeStyleDetails.value.id
    ) {
      return activeStyleDetails.value
    }

    // For now, return the active style details, but in the future this could
    // fetch the specific style details if needed
    return activeStyleDetails.value
  })

  const effectiveDesignDetails = computed(() => {
    if (
      !activeProductCustomization.value?.design_id ||
      !activeDesignDetails.value
    ) {
      return activeDesignDetails.value
    }

    // If customization has a different design than the current activeDesignDetails,
    // we need to return the design that matches the customization
    if (
      activeProductCustomization.value.design_id ===
      activeDesignDetails.value.id
    ) {
      return activeDesignDetails.value
    }

    // For now, return the active design details, but in the future this could
    // fetch the specific design details if needed
    return activeDesignDetails.value
  })

  // Lightweight previews for ProductPanel
  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputStylePreview[] | null>(null)
  const designPreviews = ref<OutputDesignPreview[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
  const selectedCustomLogoIdx = ref<number | null>(null)
  const logosSubStep = ref<'list' | 'placement' | 'controls' | 'editor'>('list')
  // Canvas state
  const activeCanvasSide = ref<'front' | 'back'>('front')
  const canvasZoom = ref<number>(1)
  // Loading state
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setCategories(data: OutputProductCategories) {
    categories.value = data
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function initActiveSelectionFromLocalStorage() {
    // Only load activeStep since other IDs are now part of activeProductCustomization
    const step = localStorage.getItem('activeStep')
    activeStep.value = step
  }

  function setActiveStep(step: string | null) {
    activeStep.value = step
    if (step) localStorage.setItem('activeStep', step)
    else localStorage.removeItem('activeStep')
  }

  function setActiveCategory(categoryId: number | null) {
    if (!activeProductCustomization.value) {
      ensureCustomization()
    }
    if (activeProductCustomization.value) {
      activeProductCustomization.value.category_id = categoryId ?? 0
      saveCustomizationToLocalStorage()
    }
  }

  // New function to update product selection in customization
  function setActiveProduct(productId: number) {
    if (!activeProductCustomization.value) {
      ensureCustomization()
    }
    if (activeProductCustomization.value) {
      activeProductCustomization.value.product_id = String(productId)
      // Reset style and design to defaults when product changes
      activeProductCustomization.value.style_id = 0
      activeProductCustomization.value.design_id = 0
      saveCustomizationToLocalStorage()
    }
  }

  // New function to update style selection in customization
  function setActiveStyle(styleId: number) {
    if (!activeProductCustomization.value) {
      ensureCustomization()
    }
    if (activeProductCustomization.value) {
      activeProductCustomization.value.style_id = styleId
      // Reset design to default when style changes
      activeProductCustomization.value.design_id = 0
      saveCustomizationToLocalStorage()
    }
  }

  // New function to update design selection in customization
  function setActiveDesign(designId: number) {
    if (!activeProductCustomization.value) {
      ensureCustomization()
    }
    if (activeProductCustomization.value) {
      activeProductCustomization.value.design_id = designId
      saveCustomizationToLocalStorage()
    }
  }

  // New function to update addon selection in customization
  function setActiveAddons(addons: OutputAddon[]) {
    if (!activeProductCustomization.value) {
      ensureCustomization()
    }
    if (activeProductCustomization.value) {
      const key = activeProductCustomization.value.product_id
      if (!activeProductCustomization.value.addons_info) {
        activeProductCustomization.value.addons_info = {} as any
      }
      activeProductCustomization.value.addons_info[key] = {
        grouped_addons: {},
        ungrouped_addons: [],
        simple_addons: addons.map(a => a.addon_id)
      }
      saveCustomizationToLocalStorage()
    }
  }

  function reset() {
    categories.value = null
    isLoading.value = false
    error.value = null
  }

  function setLogosSubStep(step: 'list' | 'placement' | 'controls' | 'editor') {
    logosSubStep.value = step
  }

  async function dispatchGetCategoriesWithNoDefaultCategoryOrProduct(): Promise<
    APIResponse<OutputProductCategories>
  > {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(
      API.products.getProductCategories({ customized: true })
    )
    if (output.success) {
      setCategories(output.content)
      // Category selection is now handled through activeProductCustomizationca
    } else {
      setError('Error getting categories')
    }
    setLoading(false)
    return output
  }

  async function dispatchGetCustomizedCategories(): Promise<
    APIResponse<OutputProductCategories>
  > {
    setLoading(true)
    setError(null)
    const params: GetProductCategoriesParams = { customized: true }
    const output = await tryCatchApi(API.products.getProductCategories(params))
    if (output.success) {
      setCategories(output.content)
    } else {
      setError('Error getting customized categories')
    }
    setLoading(false)
    return output
  }

  async function dispatchGetProductPreviews(categoryId: number | null) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getProductPreviewsByCategory(categoryId ?? null)
    )
    if (resp.success) {
      productPreviews.value = resp.content as unknown as ProductPreviewItem[]
      // Category selection is now handled through activeProductCustomization
    } else {
      setError('Error getting product previews')
    }
    setLoading(false)
    return resp
  }

  async function dispatchGetStylePreviews(productId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getStylePreviewsByProduct(productId)
    )
    if (resp.success) {
      stylePreviews.value = resp.content as unknown as OutputStylePreview[]
    }
    setLoading(false)
    return resp
  }

  async function dispatchGetActiveStyleDetails(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getActiveStyleDetails(styleId))
    if (resp.success) {
      const payload = resp.content as unknown as {
        productstyle: any
        productdesign: any
      }
      activeStyleDetails.value = payload.productstyle
      activeDesignDetails.value = payload.productdesign

      // Update customization state with the new style selection
      setActiveStyle(styleId)
    } else {
      setError('Error getting active style details')
    }
    setLoading(false)
    return resp
  }

  async function dispatchGetProductAddons(productId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getProductAddons(productId))
    if (resp.success) {
      const content = resp.content as unknown as {
        active_addons: OutputAddon[]
        product_addons: OutputAddon[]
        company_addons: OutputCompanyAddon[]
      }
      activeAddons.value = content.active_addons
      productAddons.value = content.product_addons
      companyAddons.value = content.company_addons
    }
    setLoading(false)
    return resp
  }

  function initActiveCustomizationFromLocalStorage(): boolean {
    const raw = localStorage.getItem('activeProductCustomization')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        // Basic validation - check if required fields exist
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.product_id === 'string' &&
          typeof parsed.style_id === 'number' &&
          typeof parsed.design_id === 'number'
        ) {
          activeProductCustomization.value = parsed
          return true
        }
      } catch (_e) {
        // Invalid JSON, discard
      }
    }
    activeProductCustomization.value = null
    return false
  }

  async function hydrateFromActiveCustomization(): Promise<void> {
    if (!activeProductCustomization.value) return

    const apc = activeProductCustomization.value

    // Step 1: Load product details (this loads default style + design)
    await dispatchGetActiveProductDetails(Number(apc.product_id))

    // Step 2: If APC has a different style than the default, load that style
    if (
      activeStyleDetails.value &&
      apc.style_id !== activeStyleDetails.value.id
    ) {
      await dispatchGetActiveStyleDetails(apc.style_id)
    }

    // Step 3: If APC has a different design than the current style's default, load that design
    if (
      activeDesignDetails.value &&
      apc.design_id !== activeDesignDetails.value.id
    ) {
      // Fetch design details by ID
      const result = await tryCatchApi(
        API.products.getDesignDetailsById(apc.design_id)
      )
      if (result.success) {
        activeDesignDetails.value =
          result.content as unknown as OutputDesignDetails
        // Design ID is now stored in activeProductCustomization
      }
    }

    // Step 4: activeProductCustomization already contains the correct IDs
  }

  function saveCustomizationToLocalStorage() {
    if (activeProductCustomization.value) {
      localStorage.setItem(
        'activeProductCustomization',
        JSON.stringify(activeProductCustomization.value)
      )
    } else {
      localStorage.removeItem('activeProductCustomization')
    }
  }

  function resetCustomizationToDefaults() {
    activeProductCustomization.value = null
    saveCustomizationToLocalStorage()
  }

  // New function to set default customization values for the current product
  function resetCustomizationToCurrentProductDefaults() {
    if (!activeProductDetails.value) return

    const productId = (activeProductDetails.value as any)?.id ?? 0
    // const productName = (activeProductDetails.value as any)?.display_name ?? ''
    const styleId = (activeStyleDetails.value as any)?.id ?? 0
    // const styleName = (activeStyleDetails.value as any)?.name ?? ''
    const designId = (activeDesignDetails.value as any)?.id ?? 0
    // const svgParts = (activeDesignDetails.value as any)?.svg_parts ?? []
    // const measurementRatio =
    //   (activeProductDetails.value as any)?.measurement_ratio ?? 1
    // const sizechartRef =
    //   (activeProductDetails.value as any)?.sku?.sizechart_reference ?? ''
    // const skuNumber = (activeProductDetails.value as any)?.sku?.sku_number ?? 0

    activeProductCustomization.value = {
      fixed_logo_index: 0,
      category_index: 0,
      category_id: activeProductCustomization.value?.category_id ?? 0,
      design_index: 0,
      design_id: designId,
      product_index: 0,
      product_id: String(productId),
      search_products: '',
      style_index: 0,
      style_id: styleId,
      page_no: 1,
      customized: true,
      personalized: false,
      private_product: false,
      product_custom_texts: {},
      custom_logos: {},
      default_colors: [
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null }
      ],
      group_colors: {},
      logo_colors: [],
      roster_detail: [],
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      sub_category_id: null,
      sub_category_index: null
    } as ActiveProductCustomization

    saveCustomizationToLocalStorage()
  }

  function ensureCustomization() {
    if (activeProductCustomization.value) return
    const productId = (activeProductDetails.value as any)?.id ?? 0
    // const productName = (activeProductDetails.value as any)?.display_name ?? ''
    const styleId = (activeStyleDetails.value as any)?.id ?? 0
    // const styleName = (activeStyleDetails.value as any)?.name ?? ''
    const designId = (activeDesignDetails.value as any)?.id ?? 0
    activeProductCustomization.value = {
      fixed_logo_index: 0,
      category_index: 0,
      category_id: 0,
      design_index: 0,
      design_id: designId,
      product_index: 0,
      product_id: String(productId),
      search_products: '',
      style_index: 0,
      style_id: styleId,
      page_no: 1,
      customized: true,
      personalized: false,
      private_product: false,
      product_custom_texts: {},
      custom_logos: {},
      default_colors: [
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null }
      ],
      group_colors: {},
      logo_colors: [],
      roster_detail: [],
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      sub_category_id: null,
      sub_category_index: null
    } as ActiveProductCustomization
  }

  function addCustomLogoFromRecent(recent: OutputRecentLogo) {
    ensureCustomization()
    if (!activeProductCustomization.value) return
    const pid = String((activeProductDetails.value as any)?.id ?? 0)
    if (!activeProductCustomization.value.custom_logos[pid]) {
      activeProductCustomization.value.custom_logos[pid] = [] as any
    }
    const newLogo = {
      id: Date.now(),
      product_id: Number(pid),
      product_style_id: (activeStyleDetails.value as any)?.id ?? 0,
      following_product_ids: null,
      rotation: 0,
      originalWidth: '0',
      originalHeight: '0',
      width: 100,
      height: 100,
      name_of_placement: '',
      side: 'front' as const,
      x_axis: 300,
      y_axis: 300,
      x_axis_3d: 0,
      y_axis_3d: 0,
      is_locked: 0,
      logo_name: recent.logo_name,
      original_logo: recent.original_png,
      transparent_logo: recent.transparent_logo_url,
      smart_transparent_logo: recent.smart_transparent_logo_url,
      original_logo_url: recent.original_logo_url,
      is_smart_transparent: !!recent.transparent_logo_url,
      url: recent.url,
      haveControls: false,
      logo_colors: recent.logo_colors as any,
      is_replace_success: false,
      logo_index:
        (activeProductCustomization.value.custom_logos[pid]?.length || 0) + 1
    }
    ;(activeProductCustomization.value.custom_logos[pid] as any).push(newLogo)
    selectedCustomLogoIdx.value =
      (activeProductCustomization.value.custom_logos[pid] as any).length - 1
    saveCustomizationToLocalStorage()
  }

  function setSelectedCustomLogoIndex(idx: number | null) {
    selectedCustomLogoIdx.value = idx
  }

  function applyLogoPlacementToSelected(setting: OutputProductLogosSetting) {
    if (
      !activeProductCustomization.value ||
      selectedCustomLogoIdx.value == null
    )
      return
    const pid = String((activeProductDetails.value as any)?.id ?? 0)
    const list = activeProductCustomization.value.custom_logos[pid] as any[]
    const logo = list?.[selectedCustomLogoIdx.value]
    if (!logo) return
    logo.x_axis = setting.x_axis
    logo.y_axis = setting.y_axis
    logo.height = setting.height
    logo.width = setting.width
    logo.side = setting.side
    logo.name_of_placement = setting.name_of_placement
    saveCustomizationToLocalStorage()
  }

  function addCustomLogoFromUpload(file: File, fileUrl: string) {
    ensureCustomization()
    if (!activeProductCustomization.value) return
    const pid = String((activeProductDetails.value as any)?.id ?? 0)
    if (!activeProductCustomization.value.custom_logos[pid]) {
      activeProductCustomization.value.custom_logos[pid] = [] as any
    }
    const newLogo = {
      id: Date.now(),
      product_id: Number(pid),
      product_style_id: (activeStyleDetails.value as any)?.id ?? 0,
      following_product_ids: null,
      rotation: 0,
      originalWidth: '0',
      originalHeight: '0',
      width: 100,
      height: 100,
      name_of_placement: '',
      side: 'front' as const,
      x_axis: 300,
      y_axis: 300,
      x_axis_3d: 0,
      y_axis_3d: 0,
      is_locked: 0,
      logo_name: file.name,
      original_logo: file.name,
      transparent_logo: '',
      smart_transparent_logo: '',
      original_logo_url: fileUrl,
      is_smart_transparent: false,
      url: fileUrl,
      haveControls: false,
      logo_colors: [],
      is_replace_success: false,
      logo_index:
        (activeProductCustomization.value.custom_logos[pid]?.length || 0) + 1
    }
    ;(activeProductCustomization.value.custom_logos[pid] as any).push(newLogo)
    selectedCustomLogoIdx.value =
      (activeProductCustomization.value.custom_logos[pid] as any).length - 1
    saveCustomizationToLocalStorage()
  }

  // Canvas actions
  function setActiveCanvasSide(side: 'front' | 'back') {
    activeCanvasSide.value = side
  }
  function toggleActiveCanvasSide() {
    activeCanvasSide.value =
      activeCanvasSide.value === 'front' ? 'back' : 'front'
  }
  function setCanvasZoom(zoom: number) {
    const clamped = Math.max(0.25, Math.min(4, zoom))
    canvasZoom.value = clamped
  }
  function zoomIn(step = 0.1) {
    setCanvasZoom(canvasZoom.value + step)
  }
  function zoomOut(step = 0.1) {
    setCanvasZoom(canvasZoom.value - step)
  }

  async function dispatchGetActiveProductDetails(productId: number) {
    setLoading(true)
    setError(null)
    const result = await tryCatchApi(
      API.products.getActiveProductDetails(productId)
    )
    if (result.success) {
      const details = result.content as ActiveProductDetails
      activeProductDetails.value = details.productDetails
      activeStyleDetails.value = details.styleDetails
      activeDesignDetails.value = details.designDetails

      // Update customization state with the new product selection
      setActiveProduct(productId)

      // Initialize customized product defaults on first load for this product
      if (!activeProductCustomization.value) {
        ensureCustomization()
        saveCustomizationToLocalStorage()
      }
    } else {
      setError('Error getting active product details')
    }
    setLoading(false)
    return result
  }

  // Defaults snapshot for reset
  const defaultActiveDetails = ref<{
    product: any
    style: any
    design: any
    customization: ActiveProductCustomization | null
  } | null>(null)

  function captureDefaultsSnapshot() {
    defaultActiveDetails.value = {
      product: activeProductDetails.value
        ? JSON.parse(JSON.stringify(activeProductDetails.value))
        : null,
      style: activeStyleDetails.value
        ? JSON.parse(JSON.stringify(activeStyleDetails.value))
        : null,
      design: activeDesignDetails.value
        ? JSON.parse(JSON.stringify(activeDesignDetails.value))
        : null,
      customization: activeProductCustomization.value
        ? (JSON.parse(
            JSON.stringify(activeProductCustomization.value)
          ) as ActiveProductCustomization)
        : null
    }
  }

  function resetToDefaultsSnapshot() {
    if (defaultActiveDetails.value) {
      activeProductDetails.value = defaultActiveDetails.value.product
      activeStyleDetails.value = defaultActiveDetails.value.style
      activeDesignDetails.value = defaultActiveDetails.value.design
      activeProductCustomization.value =
        defaultActiveDetails.value.customization
      // Style and design IDs are now stored in activeProductCustomization
    }
  }

  // Apply a design preview: update current design id and minimal customization fields
  function applyDesignPreview(preview: OutputDesignPreview) {
    // Update selected design id in activeProductCustomization
    if (activeProductCustomization.value) {
      activeProductCustomization.value.design_id = preview.id
      saveCustomizationToLocalStorage()
    }
  }

  async function dispatchGetDesignPreviewsByStyleId(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getDesignPreviewsByStyleId(styleId)
    )
    if (resp.success) {
      designPreviews.value = resp.content as unknown as OutputDesignPreview[]
    } else {
      setError('Error getting design previews')
    }
    setLoading(false)
    return resp
  }

  async function dispatchGetRecentLogos(companyId?: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getRecentLogos(companyId))
    if (resp.success) {
      recentLogos.value = resp.content as unknown as OutputRecentLogo[]
    } else {
      setError('Error getting recent logos')
    }
    setLoading(false)
    return resp
  }

  return {
    // State
    categories,
    isLoading,
    error,
    activeProductDetails,
    activeStyleDetails,
    activeDesignDetails,

    // Actions
    setCategories,
    setLoading,
    setError,
    reset,
    setActiveCategory,
    initActiveSelectionFromLocalStorage,

    setActiveStep,
    // API Functions
    dispatchGetCategoriesWithNoDefaultCategoryOrProduct,
    dispatchGetCustomizedCategories,
    dispatchGetProductPreviews,
    dispatchGetStylePreviews,
    dispatchGetActiveProductDetails,
    dispatchGetActiveStyleDetails,
    dispatchGetProductAddons,
    dispatchGetDesignPreviewsByStyleId,
    dispatchGetRecentLogos,
    productPreviews,
    designPreviews,
    stylePreviews,
    recentLogos,
    activeProductCustomization,
    selectedCustomLogoIdx,
    activeCanvasSide,
    canvasZoom,
    activeAddons,
    productAddons,
    companyAddons,

    activeStep,
    activeCategoryId,
    activeProductId,
    activeStyleId,
    activeDesignId,
    applyDesignPreview,
    captureDefaultsSnapshot,
    resetToDefaultsSnapshot,
    initActiveCustomizationFromLocalStorage,
    hydrateFromActiveCustomization,
    saveCustomizationToLocalStorage,
    resetCustomizationToDefaults,
    resetCustomizationToCurrentProductDefaults,
    ensureCustomization,
    // Logos
    addCustomLogoFromRecent,
    setSelectedCustomLogoIndex,
    applyLogoPlacementToSelected,
    addCustomLogoFromUpload,
    logosSubStep,
    setLogosSubStep,
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut,
    setActiveProduct,
    setActiveStyle,
    setActiveDesign,
    setActiveAddons,
    effectiveStyleDetails,
    effectiveDesignDetails
  }
})
