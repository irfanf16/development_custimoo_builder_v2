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
  OutputDesignPreviewFront,
  GeneratePdfPayload,
  GeneratePdfResponse
} from '@/services/products/types'

import { API } from '../../services'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import type { APIResponse } from '@/services/types'
import { useCustomizationStore } from '../customization/customization.store'
import type { CanvasSide } from '../workflow/workflow.store.types'
import { useQueryParams } from '@/composables/useQueryParams'
import type { LockerResponse } from '@/services/lockers/types'
export const useProductsStore = defineStore('productsStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'productsStore' } })

  // ===== INTERNAL FLAGS =====
  let customizationAutoSyncSuspendCount = 0
  const isCustomizationAutoSyncSuspended = () => customizationAutoSyncSuspendCount > 0

  function suspendCustomizationAutoSync() {
    customizationAutoSyncSuspendCount += 1
  }

  function resumeCustomizationAutoSync() {
    customizationAutoSyncSuspendCount = Math.max(0, customizationAutoSyncSuspendCount - 1)
  }

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
  const initialSvgGroupsFront = ref<OutputSvgGroupColor[]>([])
  const initialSvgGroupsBack = ref<OutputSvgGroupColor[]>([])
  const initialSvgGroups = computed<OutputSvgGroupColor[]>(() => {
    // Merge front and back initial groups, removing duplicates by id
    const allGroups = [...initialSvgGroupsFront.value, ...initialSvgGroupsBack.value]
    const uniqueGroups = new Map<string, OutputSvgGroupColor>()
    allGroups.forEach(group => {
      if (!uniqueGroups.has(group.id)) {
        uniqueGroups.set(group.id, group)
      }
    })
    return Array.from(uniqueGroups.values())
  })
  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  /** Last category/subcategory we fetched product previews for; used to avoid clearing previews on same-category refetch (e.g. going back to product tab). */
  const lastProductPreviewsCategoryId = ref<number | null>(null)
  const lastProductPreviewsSubCategoryId = ref<number | undefined>(undefined)
  const stylePreviews = ref<OutputStylePreviewFront[] | null>(null)
  const designPreviews = ref<OutputDesignPreviewFront[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /** Set true when scene has finished loading the design and extractSvgGroups has run (menu tabs e.g. Colors are then reliable). */
  const sceneLoadComplete = ref(false)

  function setSceneLoadComplete(complete: boolean): void {
    sceneLoadComplete.value = complete
  }

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

  // ===== BUSINESS LOGIC =====

  function setSvgGroups(
    groups: OutputSvgGroupColor[] | null | undefined,
    side: CanvasSide = 'front',
    setInitial = false
  ): void {
    const targetGroups = side === 'front' ? svgGroupsFront : svgGroupsBack
    const targetInitialGroups = side === 'front' ? initialSvgGroupsFront : initialSvgGroupsBack

    if (!groups || !Array.isArray(groups)) {
      targetGroups.value = []
      if (setInitial) {
        targetInitialGroups.value = []
      }
      return
    }

    const uniqueGroups = Array.from(new Map(groups.map(g => [g.id, g])).values())

    targetGroups.value = uniqueGroups
    if (setInitial) {
      // Store a deep copy as the initial state
      targetInitialGroups.value = JSON.parse(JSON.stringify(uniqueGroups)) as OutputSvgGroupColor[]
    }
  }

  /**
   * Get product by ID from the store
   * @param productId - Product ID to retrieve
   * @returns Product details if found, null otherwise
   * Note: This only checks the active product. For other products, use fetchActiveProductDetails first.
   */
  function getProductById(productId: number): OutputProductDetails | null {
    // Check if the active product matches the requested ID
    if (activeProductDetails.value?.id === productId) {
      return activeProductDetails.value
    }

    // Product previews don't have full details, so we can't use them
    // If the product isn't active, it needs to be fetched first
    return null
  }

  function reset() {
    categories.value = null
    isLoading.value = false
    error.value = null
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
    const { syncId, hasSyncId } = useQueryParams()
    if (hasSyncId.value) {
      queryParams.sync_id = syncId.value
    }
    const output = await tryCatchApi(API.products.getProductCategories(queryParams), {
      operation: 'fetchCustomizedCategories'
    })
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

  async function fetchProductsByShareUrl(shareUrl: string): Promise<
    APIResponse<
      LockerResponse<{
        factoryProducts: import('@/services/cart/types').FactoryProduct[]
        factoryProductActiveIndex: number
        lockerProductId: number | null
        activityId: number | null
        activityItems: unknown
        cartId: number | null
        factoryId: number | null
        id: number | null
        orderId: number | null
      }>
    >
  > {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.products.getProductsByShareUrl(shareUrl), {
      operation: 'fetchProductsByShareUrl',
      share_url: shareUrl
    })
    if (output.success) {
      // If product not found and we have a stored customization, clear it
      if (output.content?.result?.factoryProducts?.[0] && customization.customization) {
        customization.customization = null
        customization.clearLocalStorage()
      }
    } else {
      setError('Error getting products by share URL')
    }
    setLoading(false)
    return output
  }

  async function fetchProductPreviews(categoryId: number | null, subcategoryId?: number) {
    setLoading(true)
    setError(null)
    const isSameCategory =
      lastProductPreviewsCategoryId.value === (categoryId ?? null) &&
      lastProductPreviewsSubCategoryId.value === (subcategoryId ?? undefined)
    if (!isSameCategory) {
      productPreviews.value = null
    }
    const { syncId } = useQueryParams()

    const resp = await tryCatchApi(
      API.products.getProductPreviewsByCategory(
        categoryId ?? null,
        subcategoryId ?? undefined,
        syncId.value
      ),
      {
        operation: 'fetchProductPreviews',
        category_id: categoryId,
        subcategory_id: subcategoryId
      }
    )
    if (resp.success) {
      productPreviews.value = resp.content as unknown as ProductPreviewItem[]
      lastProductPreviewsCategoryId.value = categoryId ?? null
      lastProductPreviewsSubCategoryId.value = subcategoryId ?? undefined
    } else {
      setError('Error getting product previews')
    }
    setLoading(false)
    return resp
  }

  async function fetchStylePreviews(productId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getStylePreviewsByProduct(productId), {
      operation: 'fetchStylePreviews',
      product_id: productId
    })
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
      API.products.getActiveStyleDetails(styleId, customization.customization?.design_name),
      {
        operation: 'fetchActiveStyleDetails',
        style_id: styleId
      }
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

  async function fetchActiveProductDetails(productId: number, hasSyncId: boolean = false) {
    setLoading(true)
    setError(null)
    designPreviews.value = null
    stylePreviews.value = null
    const result = await tryCatchApi(API.products.getActiveProductDetails(productId, hasSyncId), {
      operation: 'fetchActiveProductDetails',
      product_id: productId
    })
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
      // Sync product_custom_texts with backend presets (initializes if empty, or migrates to new preset IDs when backend returns new ids after an edit)
      if (details.productDetails?.product_texts) {
        customization.syncProductTextsWithPresets(productId, details.productDetails.product_texts)
      }
      customization.replaceHistoryWithCurrentState()
    } else {
      setError('Error getting active product details')
    }
    setLoading(false)
    return result
  }

  async function fetchDesignPreviewsByStyleId(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getDesignPreviewsByStyleId(styleId), {
      operation: 'fetchDesignPreviewsByStyleId',
      style_id: styleId
    })
    if (resp.success) {
      designPreviews.value = resp.content as OutputDesignPreviewFront[]
    } else {
      setError('Error getting design previews')
    }
    setLoading(false)
    return resp
  }

  async function fetchProductDetailsAndDesignsForProductPreview(productId: number) {
    setLoading(true)
    setError(null)
    const productDetailsPromise = tryCatchApi(API.products.getActiveProductDetails(productId), {
      operation: 'fetchProductDetailsAndDesignsForProductPreview',
      product_id: productId
    })
    const styleId =
      productPreviews.value?.find(preview => preview.productPreview.id === productId)?.stylePreview
        .id ?? 0
    const designPreviewsByStyleIdPromise = tryCatchApi(
      API.products.getDesignPreviewsByStyleId(styleId),
      {
        operation: 'fetchProductDetailsAndDesignsForProductPreview',
        product_id: productId,
        style_id: styleId
      }
    )
    const [responseProductDetails, responseDesignPreviewsByStyleId] = await Promise.all([
      productDetailsPromise,
      designPreviewsByStyleIdPromise
    ])
    if (
      responseProductDetails.success &&
      responseProductDetails.content &&
      responseDesignPreviewsByStyleId.success &&
      responseDesignPreviewsByStyleId.content
    ) {
      const productResponse = responseProductDetails.content
      const payload = {
        productDetails: productResponse.productDetails,
        styleDetails: productResponse.styleDetails,
        defaultDesignDetails: productResponse.designDetails,
        designPreviews: responseDesignPreviewsByStyleId.content
      }
      setLoading(false)
      return payload
    } else {
      setError('Error getting product details and design previews')
    }
    setLoading(false)
    return null
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

  async function fetchDesignDetailsById(designId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.getDesignDetailsById(designId), {
      operation: 'fetchDesignDetailsById',
      design_id: designId
    })
    if (resp.success) {
      activeDesignDetails.value = resp.content as unknown as OutputDesignDetails
    } else {
      setError('Error getting design details')
    }
    setLoading(false)
    return resp
  }

  async function generatePDF(
    payload: GeneratePdfPayload
  ): Promise<APIResponse<GeneratePdfResponse>> {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.generatePDF(payload), {
      operation: 'generatePDF'
    })
    if (!resp.success) {
      setError('Error generating PDF')
    }
    setLoading(false)
    return resp
  }

  async function shareDesign(
    payload: import('@/services/products/types/base-product').ShareDesignPayload
  ): Promise<APIResponse<{ url: string }>> {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(API.products.shareDesignUrl(payload), {
      operation: 'shareDesign'
    })
    if (!resp.success) {
      setError('Error sharing design')
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
      if (isCustomizationAutoSyncSuspended()) return
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
    initialSvgGroups,
    //activeAddons,
    //productAddons,
    //companyAddons,
    productPreviews,
    stylePreviews,
    designPreviews,
    recentLogos,
    isLoading,
    error,
    sceneLoadComplete,
    setSceneLoadComplete,
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
    saveCustomizationToLocalStorage,
    getProductById,
    reset,
    setActiveStep,
    applyDesignPreview,
    resetToDefaultsSnapshot,
    // API Functions
    fetchCustomizedCategories,
    fetchProductPreviews,
    fetchStylePreviews,
    fetchActiveProductDetails,
    fetchActiveStyleDetails,
    fetchProductDetailsAndDesignsForProductPreview,
    fetchDesignPreviewsByStyleId,
    fetchDesignDetailsById,
    generatePDF,
    shareDesign,
    fetchProductsByShareUrl,
    suspendCustomizationAutoSync,
    resumeCustomizationAutoSync
  }
})
