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
  OutputDesignPreviewBack,
  GeneratePdfPayload,
  GeneratePdfResponse,
  ActiveProductDetails,
  ActiveStyleDetails
} from '@/services/products/types'
import type { FactoryProduct } from '@/services/cart/types'

import { API } from '../../services'
import {
  normalizePresignedCustomDesignResponse,
  normalizeDesignPreviewsPayload,
  parseCustomDesignUploadResponseId
} from '@/services/products/products.service'
import { extractSvgPartIdsFromSvgText } from '@/lib/extractSvgPartIds'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import type { APIResponse } from '@/services/types'
import { useCustomizationStore } from '../customization/customization.store'
import type { CanvasSide } from '../workflow/workflow.store.types'
import { useQueryParams } from '@/composables/useQueryParams'
import type { LockerResponse } from '@/services/lockers/types'

/** Matches API `getProductsByShareUrl` response shape */
type ProductsByShareUrlData = {
  factoryProducts: FactoryProduct[]
  factoryProductActiveIndex: number
  lockerProductId: number | null
  activityId: number | null
  activityItems: unknown
  cartId: number | null
  factoryId: number | null
  id: number | null
  orderId: number | null
}

export const useProductsStore = defineStore('productsStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'productsStore' } })

  // ===== INTERNAL FLAGS =====
  /** Prevents stale `fetchDesignPreviewsByStyleId` responses from overwriting newer data (e.g. after custom upload). */
  let fetchDesignPreviewsGeneration = 0
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

  /**
   * Main preview loading flag used by `ProductPreview.vue`.
   * This must not be affected by thumbnail scenes rendered in selection grids.
   */
  const mainPreviewLoadComplete = ref(false)

  function setMainPreviewLoadComplete(complete: boolean): void {
    mainPreviewLoadComplete.value = complete
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

  /**
   * `active_design_name` for GET product/style/:id — must match the selected row in the new style,
   * including customer uploads. Customization.design_name can lag (e.g. still "Basic") while
   * activeDesignDetails or designPreviews hold the real name.
   */
  function activeDesignNameParamForStyleRequest(designId: number): string | undefined {
    if (designId > 0) {
      const full = activeDesignDetails.value
      if (full && Number(full.id) === Number(designId) && full.design_name?.trim()) {
        return full.design_name.trim()
      }
      const preview = designPreviews.value?.find(d => Number(d.id) === Number(designId))
      if (preview?.design_name?.trim()) {
        return preview.design_name.trim()
      }
    }
    const n = customization.customization?.design_name?.trim()
    return n || undefined
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
    const output = await tryCatchApi<OutputProductCategories>(
      API.products.getProductCategories(queryParams),
      {
        operation: 'fetchCustomizedCategories'
      }
    )
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

  async function fetchProductsByShareUrl(
    shareUrl: string
  ): Promise<APIResponse<LockerResponse<ProductsByShareUrlData>>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi<LockerResponse<ProductsByShareUrlData>>(
      API.products.getProductsByShareUrl(shareUrl),
      {
        operation: 'fetchProductsByShareUrl',
        share_url: shareUrl
      }
    )
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

    const resp = await tryCatchApi<ProductPreviewItem[]>(
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
      productPreviews.value = resp.content
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
    const resp = await tryCatchApi<OutputStylePreviewFront[]>(
      API.products.getStylePreviewsByProduct(productId),
      {
        operation: 'fetchStylePreviews',
        product_id: productId
      }
    )
    if (resp.success) {
      stylePreviews.value = resp.content
    }
    setLoading(false)
    return resp
  }

  async function fetchActiveStyleDetails(styleId: number) {
    setLoading(true)
    setError(null)
    const designIdToKeep = Number(customization.customization?.design_id) || 0

    const resp = await tryCatchApi<ActiveStyleDetails>(
      API.products.getActiveStyleDetails(
        styleId,
        activeDesignNameParamForStyleRequest(designIdToKeep)
      ),
      {
        operation: 'fetchActiveStyleDetails',
        style_id: styleId
      }
    )
    if (resp.success) {
      const payload = resp.content

      setActiveStyleDetailsState(payload.styleDetails)

      // Apply new style to customization only after design details are resolved. Updating
      // style_id before activeDesignDetails matches would let the auto-sync watch run with a
      // mismatched triple and overwrite the design (default for the new style).
      if (designIdToKeep > 0) {
        const detailsResp = await fetchDesignDetailsById(designIdToKeep)
        if (detailsResp.success && activeDesignDetails.value) {
          customization.setStyle(styleId)
          if (
            customization.customization &&
            activeDesignDetails.value.id !== customization.customization.design_id
          ) {
            customization.setDesign(activeDesignDetails.value)
          }
        } else {
          setActiveDesignDetailsState(payload.designDetails)
          customization.setStyle(styleId)
          customization.setDesign(payload.designDetails)
        }
      } else {
        setActiveDesignDetailsState(payload.designDetails)
        customization.setStyle(styleId)
        customization.setDesign(payload.designDetails)
      }
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
    const result = await tryCatchApi<ActiveProductDetails>(
      API.products.getActiveProductDetails(productId, hasSyncId),
      {
        operation: 'fetchActiveProductDetails',
        product_id: productId
      }
    )
    if (result.success && result.content) {
      const details = result.content
      setActiveProductDetailsState(details.productDetails)
      setActiveStyleDetailsState(details.styleDetails)
      setActiveDesignDetailsState(details.designDetails)
      const prevProductId = customization.customization?.product_id
      if (prevProductId && prevProductId !== productId) {
        customization.replicateActiveProductLogosToMatchingPlacements()
      }
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
    const gen = ++fetchDesignPreviewsGeneration
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi<unknown>(API.products.getDesignPreviewsByStyleId(styleId), {
      operation: 'fetchDesignPreviewsByStyleId',
      style_id: styleId
    })
    if (gen !== fetchDesignPreviewsGeneration) {
      return resp
    }
    if (resp.success) {
      const list = normalizeDesignPreviewsPayload(resp.content)
      if (list != null) {
        designPreviews.value = list
      } else {
        setError('Error getting design previews')
      }
    } else {
      setError('Error getting design previews')
    }
    setLoading(false)
    return resp
  }

  async function fetchProductDetailsAndDesignsForProductPreview(productId: number) {
    setLoading(true)
    setError(null)
    const productDetailsPromise = tryCatchApi<ActiveProductDetails>(
      API.products.getActiveProductDetails(productId),
      {
        operation: 'fetchProductDetailsAndDesignsForProductPreview',
        product_id: productId
      }
    )
    const styleId =
      productPreviews.value?.find(preview => preview.productPreview.id === productId)?.stylePreview
        .id ?? 0
    const designPreviewsByStyleIdPromise = tryCatchApi<
      (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
    >(API.products.getDesignPreviewsByStyleId(styleId), {
      operation: 'fetchProductDetailsAndDesignsForProductPreview',
      product_id: productId,
      style_id: styleId
    })
    const [responseProductDetails, responseDesignPreviewsByStyleId] = await Promise.all([
      productDetailsPromise,
      designPreviewsByStyleIdPromise
    ])
    const designList = responseDesignPreviewsByStyleId.success
      ? normalizeDesignPreviewsPayload(responseDesignPreviewsByStyleId.content)
      : null
    if (responseProductDetails.success && responseProductDetails.content && designList != null) {
      const productResponse = responseProductDetails.content
      const payload = {
        productDetails: productResponse.productDetails,
        styleDetails: productResponse.styleDetails,
        defaultDesignDetails: productResponse.designDetails,
        designPreviews: designList
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

  async function uploadCustomDesignAndRefresh(
    file: File
  ): Promise<APIResponse<OutputDesignDetails | null>> {
    const styleId = customization.activeStyleId
    const productId = customization.activeProductId
    if (!styleId || !productId) {
      setError('Missing product or style')
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (
      ext !== 'svg' &&
      file.type !== 'image/svg+xml' &&
      !file.name.toLowerCase().endsWith('.svg')
    ) {
      setError('Only SVG files are supported')
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    setLoading(true)
    setError(null)

    let svgText: string
    try {
      svgText = await file.text()
    } catch {
      setError('Could not read file')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    let svgParts: string[]
    try {
      svgParts = await extractSvgPartIdsFromSvgText(svgText)
    } catch {
      setError('Could not parse SVG for color parts')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    if (svgParts.length === 0) {
      setError('No customizable SVG parts found (expected groups with ids and fills)')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    const baseName = file.name.replace(/\.[^/.]+$/i, '') || 'design'

    const presignedPayload = {
      name: baseName,
      extension: 'svg',
      content_type: 'image/svg',
      expiration_minutes: '60'
    }

    const presignedResp = await tryCatchApi<unknown>(
      API.products.getCustomDesignPresignedUploadUrl(presignedPayload),
      {
        operation: 'getCustomDesignPresignedUploadUrl',
        style_id: styleId,
        product_id: productId
      }
    )

    if (!presignedResp.success || presignedResp.content == null) {
      setError(presignedResp.message ?? 'Could not get upload URL')
      setLoading(false)
      return {
        success: false,
        content: null,
        status: presignedResp.status,
        axiosError: null
      }
    }

    const normalized = normalizePresignedCustomDesignResponse(presignedResp.content)
    if (!normalized?.uploadUrl) {
      setError('Invalid presigned URL response')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    if (!normalized.fileUrl?.trim()) {
      setError('Presigned response missing path or file_url')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }

    const putContentType = normalized.contentType?.trim() || presignedPayload.content_type

    try {
      const putRes = await API.products.putCustomDesignFileToPresignedUrl(
        normalized.uploadUrl,
        file,
        putContentType
      )
      if (putRes.status !== 200 && putRes.status !== 204) {
        throw new Error('bad status')
      }
    } catch {
      setError('Upload to storage failed')
      setLoading(false)
      return { success: false, content: null, status: 500, axiosError: null, message: undefined }
    }

    const registerDesignName = normalized.designName?.trim() || baseName

    const registerResp = await tryCatchApi<unknown>(
      API.products.registerCustomDesign({
        product_id: productId,
        product_style_id: styleId,
        svg_parts: svgParts,
        design_name: registerDesignName,
        file_url: normalized.fileUrl.trim(),
        productionsafezone_design_id:
          activeDesignDetails.value?.productionsafezone_design_id ?? null
      }),
      {
        operation: 'registerCustomDesign',
        style_id: styleId,
        product_id: productId
      }
    )

    if (!registerResp.success) {
      setError(registerResp.message ?? 'Register custom design failed')
      setLoading(false)
      return {
        success: false,
        content: null,
        status: registerResp.status,
        axiosError: null
      }
    }

    const newId = parseCustomDesignUploadResponseId(registerResp.content)
    if (newId == null) {
      setError('Invalid upload response')
      setLoading(false)
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }
    const refresh = await fetchDesignPreviewsByStyleId(styleId)
    if (!refresh.success) {
      setLoading(false)
      return { success: false, content: null, status: refresh.status, axiosError: null }
    }
    const preview = designPreviews.value?.find(d => d.id === newId)
    if (preview) {
      applyDesignPreview(preview)
    } else {
      const detailsResp = await fetchDesignDetailsById(newId)
      if (detailsResp.success && detailsResp.content) {
        customization.setDesign(detailsResp.content)
        saveCustomizationToLocalStorage()
      }
    }
    setLoading(false)
    return {
      success: true,
      content: activeDesignDetails.value,
      status: 200,
      axiosError: null
    }
  }

  async function deleteCustomDesign(designId: number): Promise<APIResponse<null>> {
    const styleId = customization.activeStyleId
    if (!styleId) {
      setError('Missing style')
      return { success: false, content: null, status: 400, axiosError: null, message: undefined }
    }
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi<unknown>(API.products.deleteCustomDesign(designId), {
      operation: 'deleteCustomDesign',
      design_id: designId
    })
    if (!resp.success) {
      setError(resp.message ?? 'Delete failed')
      setLoading(false)
      return { success: false, content: null, status: resp.status, axiosError: null }
    }
    const refresh = await fetchDesignPreviewsByStyleId(styleId)
    if (!refresh.success) {
      setLoading(false)
      return { success: false, content: null, status: refresh.status, axiosError: null }
    }
    const wasActive = customization.customization?.design_id === designId
    if (wasActive) {
      const first = designPreviews.value?.[0]
      if (first) {
        applyDesignPreview(first)
      } else {
        await fetchActiveStyleDetails(styleId)
      }
    } else {
      setLoading(false)
    }
    return { success: true, content: null, status: 200, axiosError: null }
  }

  async function fetchDesignDetailsById(designId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi<OutputDesignDetails>(
      API.products.getDesignDetailsById(designId),
      {
        operation: 'fetchDesignDetailsById',
        design_id: designId
      }
    )
    if (resp.success) {
      activeDesignDetails.value = resp.content
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
    const resp = await tryCatchApi<GeneratePdfResponse>(API.products.generatePDF(payload), {
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
    const resp = await tryCatchApi<{ url: string }>(API.products.shareDesignUrl(payload), {
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
    mainPreviewLoadComplete,
    setMainPreviewLoadComplete,
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
    uploadCustomDesignAndRefresh,
    deleteCustomDesign,
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
