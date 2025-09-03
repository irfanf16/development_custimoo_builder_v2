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
import { useSelectionStore } from '../selection.store'

export const useProductsStore = defineStore('productsStore', () => {
  const categories = ref<OutputProductCategories | null>(null)
  const activeProductDetails = ref<OutputProductDetails | null>(null)
  const activeStyleDetails = ref<OutputStyleDetails | null>(null)
  const activeDesignDetails = ref<OutputDesignDetails | null>(null)
  const activeAddons = ref<OutputAddon[] | null>(null)
  const productAddons = ref<OutputAddon[] | null>(null)
  const companyAddons = ref<OutputCompanyAddon[] | null>(null)
  const selectedCategoryId = ref<number | null>(null)

  const selection = useSelectionStore()
  const activeProductCustomization =
    computed<ActiveProductCustomization | null>(() => selection.customization)
  const activeStep = computed<string | null>(() => selection.activeStep)

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
  const activeSubCategoryId = computed(
    () => activeProductCustomization.value?.sub_category_id ?? null
  )
  const effectiveCategoryId = computed<number | null>(() => {
    return (
      selectedCategoryId.value ??
      activeSubCategoryId.value ??
      activeCategoryId.value ??
      null
    )
  })

  const effectiveStyleDetails = computed(() => {
    if (
      !activeProductCustomization.value?.style_id ||
      !activeStyleDetails.value
    ) {
      return activeStyleDetails.value
    }
    if (
      activeProductCustomization.value.style_id === activeStyleDetails.value.id
    ) {
      return activeStyleDetails.value
    }
    return activeStyleDetails.value
  })

  const effectiveDesignDetails = computed(() => {
    if (
      !activeProductCustomization.value?.design_id ||
      !activeDesignDetails.value
    ) {
      return activeDesignDetails.value
    }
    if (
      activeProductCustomization.value.design_id ===
      activeDesignDetails.value.id
    ) {
      return activeDesignDetails.value
    }
    return activeDesignDetails.value
  })

  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputStylePreview[] | null>(null)
  const designPreviews = ref<OutputDesignPreview[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
  const selectedCustomLogoIdx = ref<number | null>(null)
  const logosSubStep = ref<'list' | 'placement' | 'edit'>('list')
  const productsSubStep = ref<'category' | 'subcategory' | 'product'>(
    'category'
  )
  const activeCanvasSide = ref<'front' | 'back'>('front')
  const canvasZoom = ref<number>(1)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
    selection.load()
  }
  function setActiveStep(step: string | null) {
    selection.setActiveStep(step)
  }
  function setActiveCategory(categoryId: number | null) {
    if (categoryId == null) return
    selection.setCategory(categoryId)
  }
  function setSelectedCategoryForPreview(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }
  const selectedSubCategoryId = ref<number | null>(null)
  function setSelectedSubCategoryForPreview(subCategoryId: number | null) {
    selectedSubCategoryId.value = subCategoryId
  }
  function setActiveSubCategory(subCategoryId: number | null) {
    if (subCategoryId == null) return
    selection.setSubCategory(subCategoryId)
  }
  function commitSelectedCategory() {
    if (selectedCategoryId.value != null) {
      setActiveCategory(selectedCategoryId.value)
      selectedCategoryId.value = null
    }
  }
  function commitSelectedSubCategory() {
    if (selectedSubCategoryId.value != null) {
      setActiveSubCategory(selectedSubCategoryId.value)
      selectedSubCategoryId.value = null
    }
  }
  function setActiveProduct(productId: number) {
    selection.setProduct(productId)
  }
  function setActiveStyle(styleId: number) {
    selection.setStyle(styleId)
  }
  function setActiveDesign(designId: number) {
    selection.setDesign(designId)
  }
  function setActiveAddons(addons: OutputAddon[]) {
    selection.setAddons(addons)
  }
  function reset() {
    categories.value = null
    isLoading.value = false
    error.value = null
  }
  function setLogosSubStep(step: 'list' | 'placement' | 'edit') {
    logosSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.logosSubStep', step)
    }
  }
  function setProductsSubStep(step: 'category' | 'subcategory' | 'product') {
    productsSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.productsSubStep', step)
    }
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

  function saveCustomizationToLocalStorage() {
    selection.save()
  }

  function loadWorkflowSubStepsFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const logos = window.localStorage.getItem('workflow.logosSubStep') as
        | 'list'
        | 'placement'
        | 'edit'
        | null
      const products = window.localStorage.getItem(
        'workflow.productsSubStep'
      ) as 'category' | 'subcategory' | 'product' | null
      if (logos) logosSubStep.value = logos
      if (products) productsSubStep.value = products
    } catch (_) {}
  }

  function resetCustomizationToDefaults() {
    selection.setCustomization({
      fixed_logo_index: 0,
      category_index: 0,
      category_id: 0,
      design_index: 0,
      design_id: 0,
      product_index: 0,
      product_id: '0',
      search_products: '',
      style_index: 0,
      style_id: 0,
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
    } as ActiveProductCustomization)
  }

  function resetCustomizationToCurrentProductDefaults() {
    if (!activeProductDetails.value) return
    const productId = (activeProductDetails.value as any)?.id ?? 0
    const styleId = (activeStyleDetails.value as any)?.id ?? 0
    const designId = (activeDesignDetails.value as any)?.id ?? 0
    selection.setCustomization({
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
    } as ActiveProductCustomization)
  }

  function ensureCustomization() {
    if (activeProductCustomization.value) return
    resetCustomizationToDefaults()
  }

  function addCustomLogoFromRecent(_recent: OutputRecentLogo) {
    ensureCustomization()
    // To be centralized later
  }

  function setSelectedCustomLogoIndex(idx: number | null) {
    selectedCustomLogoIdx.value = idx
  }

  function applyLogoPlacementToSelected(_setting: OutputProductLogosSetting) {
    if (
      !activeProductCustomization.value ||
      selectedCustomLogoIdx.value == null
    )
      return
    saveCustomizationToLocalStorage()
  }

  function addCustomLogoFromUpload(_file: File, _fileUrl: string) {
    ensureCustomization()
    if (!activeProductCustomization.value) return
    saveCustomizationToLocalStorage()
  }

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
      setActiveProduct(productId)
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
      selection.setCustomization(
        (defaultActiveDetails.value.customization ||
          (null as unknown)) as ActiveProductCustomization
      )
    }
  }

  function applyDesignPreview(preview: OutputDesignPreview) {
    if (activeProductCustomization.value) {
      setActiveDesign(preview.id)
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
    categories,
    isLoading,
    error,
    activeProductDetails: activeProductDetails,
    activeStyleDetails: activeStyleDetails,
    activeDesignDetails: activeDesignDetails,
    setCategories,
    setLoading,
    setError,
    reset,
    setActiveCategory,
    initActiveSelectionFromLocalStorage,
    setActiveStep,
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
    // sub-step states
    logosSubStep,
    productsSubStep,
    activeAddons,
    productAddons,
    companyAddons,
    activeStep,
    activeCategoryId,
    activeSubCategoryId,
    selectedCategoryId,
    selectedSubCategoryId,
    effectiveCategoryId,
    activeProductId,
    activeStyleId,
    activeDesignId,
    applyDesignPreview,
    captureDefaultsSnapshot,
    resetToDefaultsSnapshot,
    saveCustomizationToLocalStorage,
    resetCustomizationToDefaults,
    resetCustomizationToCurrentProductDefaults,
    ensureCustomization,
    addCustomLogoFromRecent,
    setSelectedCustomLogoIndex,
    applyLogoPlacementToSelected,
    addCustomLogoFromUpload,
    setLogosSubStep,
    setProductsSubStep,
    setSelectedSubCategoryForPreview,
    setActiveSubCategory,
    commitSelectedSubCategory,
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut,
    setActiveProduct,
    setActiveStyle,
    setActiveDesign,
    setActiveAddons,
    setSelectedCategoryForPreview,
    commitSelectedCategory,
    loadWorkflowSubStepsFromLocalStorage,
    effectiveStyleDetails,
    effectiveDesignDetails
  }
})
