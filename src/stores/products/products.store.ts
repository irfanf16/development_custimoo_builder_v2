import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  ActiveProductCustomization,
  ProductPreviewItem,
  OutputStylePreviewFront,
  OutputStyleDetails,
  OutputDesignDetails,
  OutputRecentLogo,
  OutputProductDetails,
  OutputSvgGroupColor,
  OutputDesignPreviewFront
} from '@/services/products/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'
import { useCustomizationStore } from '../customization/customization.store'
export const useProductsStore = defineStore('productsStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()

  // ===== STATE =====
  const categories = ref<OutputProductCategories | null>(null)
  const activeProductDetails = ref<OutputProductDetails | null>(null)
  const activeStyleDetails = ref<OutputStyleDetails | null>(null)
  const activeDesignDetails = ref<OutputDesignDetails | null>(null)
  const svgGroupsFront = ref<OutputSvgGroupColor[]>([])
  const svgGroupsBack = ref<OutputSvgGroupColor[]>([])
  const svgGroups = computed<OutputSvgGroupColor[]>(() => {
    // Merge front and back groups, removing duplicates by id
    const allGroups = [...svgGroupsFront.value, ...svgGroupsBack.value]
    const uniqueGroups = new Map<string, OutputSvgGroupColor>()
    allGroups.forEach(group => {
      if (!uniqueGroups.has(group.id)) {
        uniqueGroups.set(group.id, group)
      }
    })
    return Array.from(uniqueGroups.values())
  })
  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputStylePreviewFront[] | null>(null)
  const designPreviews = ref<OutputDesignPreviewFront[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ===== COMPUTED =====
  // Product type flags from categories response
  const isCustomized = computed(() => categories.value?.customized ?? false)
  const isPersonalized = computed(() => categories.value?.personalized ?? false)
  const isPrivateProduct = computed(() => categories.value?.private_product ?? false)
  const customizedCount = computed(() => categories.value?.customized_count ?? 0)
  const personalizedCount = computed(() => categories.value?.personalized_count ?? 0)
  const privateProductCount = computed(() => categories.value?.private_product_count ?? 0)

  // ===== ACTIONS =====
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setCategories(data: OutputProductCategories) {
    categories.value = data
  }

  // Strongly-typed setters to mutate internal state
  function setActiveProductDetailsState(payload: OutputProductDetails | null) {
    activeProductDetails.value = payload
  }

  function setActiveStyleDetailsState(payload: OutputStyleDetails | null) {
    activeStyleDetails.value = payload
  }

  function setActiveDesignDetailsState(payload: OutputDesignDetails | null) {
    activeDesignDetails.value = payload
  }

  // Addons setters to avoid direct mutations from components
  // function setActiveAddonsList(addons: OutputAddon[]) {
  //   activeAddons.value = addons
  // }

  // function updateActiveAddonSelected(addonId: number, selected: boolean) {
  //   if (!activeAddons.value) return
  //   const idx = activeAddons.value.findIndex(a => a.addon_id === addonId)
  //   if (idx >= 0) {
  //     activeAddons.value[idx].selected = selected
  //   }
  // }
  // ===== BUSINESS LOGIC =====

  function setSvgGroups(
    groups: OutputSvgGroupColor[] | null | undefined,
    side: 'front' | 'back' = 'front'
  ): void {
    const targetGroups = side === 'front' ? svgGroupsFront : svgGroupsBack

    if (!groups || !Array.isArray(groups)) {
      targetGroups.value = []
      return
    }

    const uniqueGroups = Array.from(new Map(groups.map(g => [g.id, g])).values())

    targetGroups.value = uniqueGroups
  }

  function reset() {
    categories.value = null
    isLoading.value = false
    error.value = null
  }

  function initActiveSelectionFromLocalStorage() {
    customization.loadFromLocalStorage()
  }

  function setActiveStep(_: string | null) {}

  function saveCustomizationToLocalStorage() {
    customization.saveToLocalStorage()
  }

  // ===== API FUNCTIONS =====
  async function fetchCustomizedCategories(
    params?: GetProductCategoriesParams
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    const queryParams: GetProductCategoriesParams = params ?? {
      customized: true,
      personalized: true,
      private: false
    }
    const output = await tryCatchApi(API.products.getProductCategories(queryParams))
    if (output.success) {
      setCategories(output.content)

      // If product not found and we have a stored customization, clear it
      // This happens when localStorage has a product_id but the product is no longer available
      if (output.content?.no_product_found && customization.customization) {
        customization.customization = null
        customization.clearLocalStorage()
      }
    } else {
      setError('Error getting customized categories')
    }
    setLoading(false)
    return output
  }

  async function fetchProductPreviews(categoryId: number | null, subcategoryId?: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getProductPreviewsByCategory(categoryId ?? null, subcategoryId ?? undefined)
    )
    if (resp.success) {
      productPreviews.value = resp.content as unknown as ProductPreviewItem[]
    } else {
      setError('Error getting product previews')
    }
    setLoading(false)
    return resp
  }

  async function fetchStylePreviews(productId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getStylePreviewsByProduct(productId))
    if (resp.success) {
      stylePreviews.value = resp.content as unknown as OutputStylePreviewFront[]
    }
    setLoading(false)
    return resp
  }

  async function fetchActiveStyleDetails(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getActiveStyleDetails(styleId, customization.customization?.design_name)
    )
    if (resp.success) {
      const payload = resp.content
      setActiveStyleDetailsState(payload.styleDetails)
      setActiveDesignDetailsState(payload.designDetails)
      customization.setStyle(styleId)
      customization.setDesign(payload.designDetails)
    } else {
      setError('Error getting active style details')
    }
    setLoading(false)
    return resp
  }

  async function fetchActiveProductDetails(productId: number) {
    setLoading(true)
    setError(null)
    const result = await tryCatchApi(API.products.getActiveProductDetails(productId))
    if (result.success && result.content) {
      const details = result.content
      setActiveProductDetailsState(details.productDetails)
      setActiveStyleDetailsState(details.styleDetails)
      setActiveDesignDetailsState(details.designDetails)
      customization.setProduct(productId)
      customization.setStyle(details.styleDetails.id)
      customization.setDesign(details.designDetails)
      if (!customization.customization) {
        customization.ensureCustomization()
        saveCustomizationToLocalStorage()
      }
      // Initialize product_custom_texts from product_texts if available
      if (details.productDetails?.product_texts) {
        customization.initializeProductTextsFromDetails(
          productId,
          details.productDetails.product_texts
        )
      }
    } else {
      setError('Error getting active product details')
    }
    setLoading(false)
    return result
  }

  const defaultActiveDetails = ref<{
    product: OutputProductDetails | null
    style: OutputStyleDetails | null
    design: OutputDesignDetails | null
    customization: ActiveProductCustomization | null
  } | null>(null)

  function resetToDefaultsSnapshot() {
    if (defaultActiveDetails.value) {
      activeProductDetails.value = defaultActiveDetails.value.product
      activeStyleDetails.value = defaultActiveDetails.value.style
      activeDesignDetails.value = defaultActiveDetails.value.design
      customization.setCustomization(
        (defaultActiveDetails.value.customization ||
          (null as unknown)) as ActiveProductCustomization
      )
    }
  }

  function applyDesignPreview(designPreview: OutputDesignPreviewFront) {
    if (customization.customization) {
      customization.setDesign(designPreview)
      saveCustomizationToLocalStorage()
    }
  }

  async function fetchDesignPreviewsByStyleId(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getDesignPreviewsByStyleId(styleId))
    if (resp.success) {
      designPreviews.value = resp.content as OutputDesignPreviewFront[]
    } else {
      setError('Error getting design previews')
    }
    setLoading(false)
    return resp
  }

  async function fetchDesignDetailsById(designId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getDesignDetailsById(designId))
    if (resp.success) {
      activeDesignDetails.value = resp.content as unknown as OutputDesignDetails
    } else {
      setError('Error getting design details')
    }
    setLoading(false)
    return resp
  }

  // Centralized fetch orchestration reacting to customization selections
  watch(
    [
      () => customization.activeProductId,
      () => customization.activeStyleId,
      () => customization.activeDesignId
    ],
    async ([productId, styleId, designId], [prevProductId, prevStyleId, prevDesignId]) => {
      // No changes detected
      if (productId === prevProductId && styleId === prevStyleId && designId === prevDesignId)
        return

      // Product fetch sets default style/design
      if (productId && activeProductDetails.value?.id !== productId) {
        await fetchActiveProductDetails(productId)
      }
      // Explicit style selection overrides design
      if (styleId && activeStyleDetails.value?.id !== styleId) {
        await fetchActiveStyleDetails(styleId)
      }
      // Explicit design selection overrides current
      if (designId && activeDesignDetails.value?.id !== designId) {
        await fetchDesignDetailsById(designId)
      }
    },
    { immediate: true }
  )

  // ===== RENDER MODE SELECTION =====
  /**
   * Determine whether to render in 2D (Fabric) or 3D (Three.js)
   * Priority order:
   * - If product declares show_3d/is_3d_product and style exposes any 3D maps/model → '3d'
   * - Otherwise → '2d'
   */
  const activeRenderMode = computed<'2d' | '3d'>(() => {
    const product = activeProductDetails.value
    const style = activeStyleDetails.value
    const productWants3D = !!(product?.is_3d_product || product?.show_3d)
    const styleHas3DAssets = !!(
      style &&
      (style._3d_model?.file_url ||
        style._3d_texture?.file_url ||
        style._3d_alpha_map?.file_url ||
        style._3d_ao_map?.file_url ||
        style._3d_metalness_map?.file_url ||
        style._3d_roughness_map?.file_url)
    )
    return productWants3D && styleHas3DAssets ? '3d' : '2d'
  })

  // ===== RETURN =====
  return {
    // State
    categories,
    activeProductDetails,
    activeStyleDetails,
    activeDesignDetails,
    activeRenderMode,
    svgGroups,
    //activeAddons,
    //productAddons,
    //companyAddons,
    productPreviews,
    stylePreviews,
    designPreviews,
    recentLogos,
    isLoading,
    error,
    // Computed
    isCustomized,
    isPersonalized,
    isPrivateProduct,
    customizedCount,
    personalizedCount,
    privateProductCount,
    // Actions
    setLoading,
    setError,
    setCategories,
    setActiveProductDetailsState,
    setActiveStyleDetailsState,
    setActiveDesignDetailsState,
    // Business Logic
    setSvgGroups,
    reset,
    initActiveSelectionFromLocalStorage,
    setActiveStep,
    saveCustomizationToLocalStorage,
    applyDesignPreview,
    resetToDefaultsSnapshot,
    // API Functions
    fetchCustomizedCategories,
    fetchProductPreviews,
    fetchStylePreviews,
    fetchActiveProductDetails,
    fetchActiveStyleDetails,
    //fetchProductAddons,
    fetchDesignPreviewsByStyleId,
    fetchDesignDetailsById
  }
})
