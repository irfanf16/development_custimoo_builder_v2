import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  ActiveProductCustomization,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputProductStyleDesignPreview,
  OutputProductStylePreview,
  OutputProductStyleDetails,
  OutputProductStyleDesignDetails,
  OutputAddon,
  OutputCompanyAddon,
  OutputRecentLogo,
  OutputProductLogosSetting,
  OutputProductCustomLogo,
  OutputProductDetails
} from '@/services/products/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'

export const useProductsStore = defineStore('productsStore', () => {
  // State
  const categories = ref<OutputProductCategories | null>(null)
  const lastCategoryId = ref<number | null>(null)

  // Full information based on the customization of the product.
  // This information will be populated once a product, style, or design, etc is selected by the user
  const product = ref<OutputProductDetails | null>(null)
  // By default, it will chose the first style of the product
  const style = ref<OutputProductStyleDetails | null>(null)
  // By default, it will chose the first design of the style
  const design = ref<OutputProductStyleDesignDetails | null>(null)
  // By default, no add-ons will be selected. Add-ons will be populated based on the selected product, style, and design

  const activeAddons = ref<OutputAddon[] | null>(null)
  const productAddons = ref<OutputAddon[] | null>(null)
  const companyAddons = ref<OutputCompanyAddon[] | null>(null)

  // Customized Product State
  const activeProductCustomization = ref<ActiveProductCustomization | null>(
    null
  )

  // Active selections
  const activeCategoryId = ref<number | null>(null)
  const activeProductId = ref<number | null>(null)
  const activeStyleId = ref<number | null>(null)
  const activeDesignId = ref<number | null>(null)
  const activeStep = ref<string | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('activeStep')
      : null
  )

  // Lightweight previews for ProductPanel
  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputProductStylePreview[] | null>(null)
  const designPreviews = ref<OutputProductStyleDesignPreview[] | null>(null)
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

  function setlastCategoryId(id: number) {
    lastCategoryId.value = id
    localStorage.setItem('lastCategoryId', id.toString())
  }

  function clearlastCategoryId() {
    lastCategoryId.value = null
  }

  // Alias with conventional casing for component usage
  function clearLastCategoryId() {
    clearlastCategoryId()
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function clearCategories() {
    categories.value = null
    clearlastCategoryId()
  }

  function initLastCategoryIdFromLocalStorage() {
    const lastCategoryId = localStorage.getItem('lastCategoryId')
    if (lastCategoryId) {
      setlastCategoryId(Number(lastCategoryId))
    }
  }

  function initActiveSelectionFromLocalStorage() {
    const cat = localStorage.getItem('activeCategoryId')
    const pid = localStorage.getItem('activeProductId')
    const sid = localStorage.getItem('activeStyleId')
    const did = localStorage.getItem('activeDesignId')
    const step = localStorage.getItem('activeStep')
    activeCategoryId.value = cat ? Number(cat) : null
    activeProductId.value = pid ? Number(pid) : null
    activeStyleId.value = sid ? Number(sid) : null
    activeDesignId.value = did ? Number(did) : null
    activeStep.value = step
  }

  function setActiveCategory(categoryId: number | null) {
    activeCategoryId.value = categoryId
    if (categoryId != null) {
      localStorage.setItem('activeCategoryId', String(categoryId))
    } else {
      localStorage.removeItem('activeCategoryId')
    }
  }

  function setActiveProduct(productId: number | null) {
    activeProductId.value = productId
    if (productId != null) {
      localStorage.setItem('activeProductId', String(productId))
    } else {
      localStorage.removeItem('activeProductId')
    }
  }

  function setActiveStyle(styleId: number | null) {
    activeStyleId.value = styleId
    if (styleId != null) localStorage.setItem('activeStyleId', String(styleId))
    else localStorage.removeItem('activeStyleId')
  }

  function setActiveDesign(designId: number | null) {
    activeDesignId.value = designId
    if (designId != null)
      localStorage.setItem('activeDesignId', String(designId))
    else localStorage.removeItem('activeDesignId')
  }

  function setActiveStep(step: string | null) {
    activeStep.value = step
    if (step) localStorage.setItem('activeStep', step)
    else localStorage.removeItem('activeStep')
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
      if (categories.value?.data?.length && categories.value.data.length > 0) {
        setlastCategoryId(categories.value.data[0].id)
      } else {
        clearlastCategoryId()
      }
    } else {
      setError('Error getting categories')
    }
    setLoading(false)
    return output
  }

  async function dispatchGetProductCategoriesWithProductId(
    productId: number
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(
      API.products.getProductCategories({ product_id: productId })
    )
    if (output.success) {
      setCategories(output.content)
    } else {
      setError('Error getting product categories')
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

  async function dispatchGetProductsByCategoryId(
    categoryId: number
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    // Fetch previews for the ProductPanel (lightweight)
    const previews = await tryCatchApi(
      API.products.getProductPreviewsByCategory(categoryId)
    )
    if (previews.success) {
      productPreviews.value =
        previews.content as unknown as ProductPreviewItem[]
    }
    // Also keep existing products-by-category request if needed elsewhere
    const output = await tryCatchApi(
      API.products.getProductByCategoryId({
        category_id: categoryId,
        customized: true,
        personalized: false,
        private: false
      })
    )
    if (!output.success) {
      setError('Error getting products')
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
      setActiveCategory(categoryId ?? null)
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
      stylePreviews.value =
        resp.content as unknown as OutputProductStylePreview[]
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
      style.value = payload.productstyle
      design.value = payload.productdesign
      setActiveStyle(payload.productstyle.id)
      setActiveDesign(payload.productdesign.id)
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
    const raw = localStorage.getItem('customizedProduct')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        // Basic validation - check if required fields exist
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.product_id === 'number' &&
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
    await dispatchGetActiveProductDetails(apc.product_id)

    // Step 2: If APC has a different style than the default, load that style
    if (style.value && apc.style_id !== style.value.id) {
      await dispatchGetActiveStyleDetails(apc.style_id)
    }

    // Step 3: If APC has a different design than the current style's default, load that design
    if (design.value && apc.design_id !== design.value.id) {
      // Fetch design details by ID
      const result = await tryCatchApi(
        API.products.getDesignDetailsById(apc.design_id)
      )
      if (result.success) {
        design.value =
          result.content as unknown as OutputProductStyleDesignDetails
        setActiveDesign(apc.design_id)
      }
    }

    // Step 4: Update active IDs to match APC
    setActiveProduct(apc.product_id)
    setActiveStyle(apc.style_id)
    setActiveDesign(apc.design_id)
  }

  function saveCustomizationToLocalStorage() {
    if (activeProductCustomization.value) {
      localStorage.setItem(
        'customizedProduct',
        JSON.stringify(activeProductCustomization.value)
      )
    } else {
      localStorage.removeItem('customizedProduct')
    }
  }

  function resetCustomizationToDefaults() {
    activeProductCustomization.value = null
    saveCustomizationToLocalStorage()
  }

  function ensureCustomization() {
    if (activeProductCustomization.value) return
    const productId = (product.value as any)?.id ?? 0
    const productName = (product.value as any)?.display_name ?? ''
    const styleId = (style.value as any)?.id ?? 0
    const styleName = (style.value as any)?.name ?? ''
    const designId = (design.value as any)?.id ?? 0
    const svgParts = (design.value as any)?.svg_parts ?? []
    const measurementRatio = (product.value as any)?.measurement_ratio ?? 1
    const sizechartRef = (product.value as any)?.sku?.sizechart_reference ?? ''
    const skuNumber = (product.value as any)?.sku?.sku_number ?? 0

    activeProductCustomization.value = {
      addons: [],
      back_image: '',
      colors: [],
      custom_logo_svgs: [],
      custom_logos: [],
      defaultcolors: [],
      design_id: designId,
      ecommerce_cart_id: null,
      ecommerce_modifier_id: '',
      ecommerce_post_id: '',
      ecommerce_variant_id: '',
      fixed_logo_index: 0,
      fixed_logos: [],
      front_image: '',
      group_patterns: {},
      grouped_addons: {},
      groupcolors: {},
      id: '',
      is_custom_product: true,
      logo_colors: [],
      measurement_ratio: measurementRatio,
      minimum_order_quantity: 0,
      minimum_order_quantity_type: '',
      pdf_file: null,
      product_custom_text_objects: { common: [], roster: {} as any },
      product_custom_texts: [],
      product_display_name: productName,
      product_id: productId,
      product_name: productName,
      product_price_object: {} as any,
      product_roster_detail: [],
      product_type: '',
      production_url: '',
      reorder_data: null,
      shuffle_color_number: 0,
      size_variants_mapping: null,
      sizechart_reference: sizechartRef,
      sku_number: skuNumber,
      style_id: styleId,
      style_name: styleName,
      svg_groups: [],
      svg_parts: svgParts,
      svg_url: '',
      sync_id: '',
      ungrouped_addons: []
    } as unknown as ActiveProductCustomization
  }

  function addCustomLogoFromRecent(recent: OutputRecentLogo) {
    ensureCustomization()
    if (!activeProductCustomization.value) return
    const newLogo: OutputProductCustomLogo = {
      actualHeight: 0,
      actualWidth: 0,
      created_at: new Date().toISOString(),
      deleted_at: null,
      following_product_ids: null,
      haveControls: false,
      have_controls: false,
      height: 100,
      id: Date.now(),
      is_locked: 0,
      is_replace_success: false,
      is_smart_transparent: !!recent.transparent_logo_url,
      logo_colors: recent.logo_colors,
      logo_index:
        (activeProductCustomization.value.custom_logos?.length || 0) + 1,
      logo_name: recent.logo_name,
      logo_technologies: null,
      name_of_placement: '',
      originalHeight: '0',
      originalWidth: '0',
      original_logo: recent.original_png,
      original_logo_url: recent.original_logo_url,
      product_id: (product.value as any)?.id ?? 0,
      product_style_id: (style.value as any)?.id ?? 0,
      rotation: 0,
      side: 'front',
      smart_transparent_logo: recent.smart_transparent_logo_url,
      transparent_logo: recent.transparent_logo_url,
      updated_at: new Date().toISOString(),
      url: recent.url,
      width: 100,
      x_axis: 300,
      x_axis_3d: 0,
      y_axis: 300,
      y_axis_3d: 0
    }
    activeProductCustomization.value.custom_logos.push(newLogo)
    selectedCustomLogoIdx.value =
      activeProductCustomization.value.custom_logos.length - 1
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
    const logo =
      activeProductCustomization.value.custom_logos[selectedCustomLogoIdx.value]
    if (!logo) return
    logo.x_axis = setting.x_axis
    logo.y_axis = setting.y_axis
    logo.height = setting.height
    logo.width = setting.width
    logo.side = setting.side
    logo.name_of_placement = setting.name_of_placement
    logo.updated_at = new Date().toISOString()
    saveCustomizationToLocalStorage()
  }

  function addCustomLogoFromUpload(file: File, fileUrl: string) {
    ensureCustomization()
    if (!activeProductCustomization.value) return
    const newLogo: OutputProductCustomLogo = {
      actualHeight: 0,
      actualWidth: 0,
      created_at: new Date().toISOString(),
      deleted_at: null,
      following_product_ids: null,
      haveControls: false,
      have_controls: false,
      height: 100,
      id: Date.now(),
      is_locked: 0,
      is_replace_success: false,
      is_smart_transparent: false,
      logo_colors: [],
      logo_index:
        (activeProductCustomization.value.custom_logos?.length || 0) + 1,
      logo_name: file.name,
      logo_technologies: null,
      name_of_placement: '',
      originalHeight: '0',
      originalWidth: '0',
      original_logo: file.name,
      original_logo_url: fileUrl,
      product_id: (product.value as any)?.id ?? 0,
      product_style_id: (style.value as any)?.id ?? 0,
      rotation: 0,
      side: 'front',
      smart_transparent_logo: '',
      transparent_logo: '',
      updated_at: new Date().toISOString(),
      url: fileUrl,
      width: 100,
      x_axis: 300,
      x_axis_3d: 0,
      y_axis: 300,
      y_axis_3d: 0
    }
    activeProductCustomization.value.custom_logos.push(newLogo)
    selectedCustomLogoIdx.value =
      activeProductCustomization.value.custom_logos.length - 1
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
      product.value = details.product
      style.value = details.productstyle
      design.value = details.productdesign
      setActiveStyle(details.productstyle.id)
      setActiveDesign(details.productdesign.id)
      setActiveProduct(details.product.id)
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
      product: product.value ? JSON.parse(JSON.stringify(product.value)) : null,
      style: style.value ? JSON.parse(JSON.stringify(style.value)) : null,
      design: design.value ? JSON.parse(JSON.stringify(design.value)) : null,
      customization: activeProductCustomization.value
        ? (JSON.parse(
            JSON.stringify(activeProductCustomization.value)
          ) as ActiveProductCustomization)
        : null
    }
  }

  function resetToDefaultsSnapshot() {
    if (defaultActiveDetails.value) {
      product.value = defaultActiveDetails.value.product
      style.value = defaultActiveDetails.value.style
      design.value = defaultActiveDetails.value.design
      activeProductCustomization.value =
        defaultActiveDetails.value.customization
      setActiveStyle((style.value as any)?.id ?? null)
      setActiveDesign((design.value as any)?.id ?? null)
    }
  }

  // Apply a design preview: update current design id and minimal customization fields
  function applyDesignPreview(preview: OutputProductStyleDesignPreview) {
    // Update selected design id
    setActiveDesign(preview.id)
    // For now, we'll need to fetch the full design details to update the design ref
    // This is a temporary solution until we have a proper design details endpoint
    if (activeProductCustomization.value) {
      activeProductCustomization.value.svg_parts = preview.svg_parts
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
      designPreviews.value =
        resp.content as unknown as OutputProductStyleDesignPreview[]
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
    lastCategoryId,
    isLoading,
    error,
    product,
    style,
    design,

    // Actions
    setCategories,
    setLoading,
    setError,
    clearCategories,
    reset,
    setlastCategoryId,
    clearLastCategoryId,
    initLastCategoryIdFromLocalStorage,
    initActiveSelectionFromLocalStorage,
    setActiveCategory,
    setActiveProduct,
    setActiveStyle,
    setActiveDesign,
    setActiveStep,
    // API Functions
    dispatchGetCategoriesWithNoDefaultCategoryOrProduct,
    dispatchGetProductCategoriesWithProductId,
    dispatchGetCustomizedCategories,
    dispatchGetProductsByCategoryId,
    dispatchGetActiveProductDetails,
    dispatchGetStylePreviews,
    dispatchGetActiveStyleDetails,
    dispatchGetProductAddons,
    dispatchGetDesignPreviewsByStyleId,
    dispatchGetProductPreviews,
    dispatchGetRecentLogos,
    productPreviews,
    designPreviews,
    stylePreviews,
    recentLogos,
    customizedProduct: activeProductCustomization,
    selectedCustomLogoIdx,
    activeCanvasSide,
    canvasZoom,
    activeAddons,
    productAddons,
    companyAddons,
    activeCategoryId,
    activeProductId,
    activeStyleId,
    activeDesignId,
    activeStep,
    applyDesignPreview,
    captureDefaultsSnapshot,
    resetToDefaultsSnapshot,
    initActiveCustomizationFromLocalStorage,
    hydrateFromActiveCustomization,
    saveCustomizationToLocalStorage,
    resetCustomizationToDefaults,
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
    zoomOut
  }
})
