import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadSVGFromURL, util, type FabricObject, type Group } from 'fabric'
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
  OutputRecentLogo,
  OutputProductDetails,
  OutputSvgGroupColor,
  ActiveStyleDetails
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
  const svgGroups = ref<OutputSvgGroupColor[] | null>(null)
  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputStylePreview[] | null>(null)
  const designPreviews = ref<OutputDesignPreview[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ===== UTILITIES =====
  const storageBase = import.meta.env.VITE_APP_STORAGE_URL || ''
  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  type CustomFabricGroup = Group & { _objects: FabricObject & { id: string }[] }
  async function getSvgGroup(url: string, ext?: string) {
    if (ext?.toLowerCase() === 'svg' && !url.toLowerCase().endsWith('.svg')) {
      url += '.svg'
    }
    const { objects } = await loadSVGFromURL(fromStorage(url))
    const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
    return util.groupSVGElements(safeObjects) as CustomFabricGroup
  }

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
  async function setSvgGroups(): Promise<void> {
    const frontDesignUrl = activeDesignDetails.value?.front_design.file_url
    const fileExtension = activeDesignDetails.value?.front_design.file_extension
    if (!frontDesignUrl || !fileExtension) return
    const group = await getSvgGroup(frontDesignUrl, fileExtension)
    if (!group?._objects) return
    type FillWithToHex = { toHex: () => string }
    type FillWithColor = { color: string }
    const getColorString = (fill: unknown): string => {
      if (typeof fill === 'string') return fill
      if (fill && typeof (fill as FillWithToHex).toHex === 'function')
        return (fill as FillWithToHex).toHex()
      if (fill && typeof (fill as FillWithColor).color === 'string')
        return (fill as FillWithColor).color
      return '#000000'
    }
    svgGroups.value = group._objects
      .filter(obj => {
        const id = (obj as { id?: string }).id?.toLowerCase() || ''
        return (
          !id.includes('noncustomizable') &&
          !id.includes('inside') &&
          !id.includes('anchor')
        )
      })
      .map(obj => {
        const id = (obj as { id?: string }).id || 'unknown'
        return {
          id,
          color: getColorString((obj as { fill?: unknown }).fill),
          pantone: '',
          name: '',
          count: id === 'base' ? 10000 : 1,
          gradient_colors: [] as Array<{
            color: string
            pantone: string
            name: string
          }>
        }
      })
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
  async function fetchCustomizedCategories(): Promise<
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

  async function fetchProductPreviews(categoryId: number | null) {
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

  async function fetchStylePreviews(productId: number) {
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

  async function fetchActiveStyleDetails(styleId: number) {
    setLoading(true)
    setError(null)
    const resp = await tryCatchApi(
      API.products.getActiveStyleDetails(
        styleId,
        customization.customization?.design_name
      )
    )
    if (resp.success) {
      const payload = resp.content as ActiveStyleDetails
      setActiveStyleDetailsState(payload.styleDetails)
      setActiveDesignDetailsState(payload.designDetails)
      customization.setStyle(styleId)
      customization.setDesign(payload.designDetails)
      setSvgGroups()
    } else {
      setError('Error getting active style details')
    }
    setLoading(false)
    return resp
  }

  async function fetchActiveProductDetails(productId: number) {
    setLoading(true)
    setError(null)
    const result = await tryCatchApi(
      API.products.getActiveProductDetails(productId)
    )
    if (result.success && result.content) {
      const details = result.content as ActiveProductDetails
      setActiveProductDetailsState(details.productDetails)
      setActiveStyleDetailsState(details.styleDetails)
      setActiveDesignDetailsState(details.designDetails as OutputDesignDetails)
      customization.setProduct(productId)
      customization.setStyle(details.styleDetails.id)
      customization.setDesign(details.designDetails)
      await setSvgGroups()
      if (!customization.customization) {
        customization.ensureCustomization()
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
      customization: customization.customization
        ? (JSON.parse(
            JSON.stringify(customization.customization)
          ) as ActiveProductCustomization)
        : null
    }
  }

  async function resetToDefaultsSnapshot() {
    if (defaultActiveDetails.value) {
      activeProductDetails.value = defaultActiveDetails.value.product
      activeStyleDetails.value = defaultActiveDetails.value.style
      activeDesignDetails.value = defaultActiveDetails.value.design
      svgGroups.value = []
      await setSvgGroups()
      customization.setCustomization(
        (defaultActiveDetails.value.customization ||
          (null as unknown)) as ActiveProductCustomization
      )
    }
  }

  function applyDesignPreview(designPreview: OutputDesignPreview) {
    if (customization.customization) {
      customization.setDesign(designPreview)
      saveCustomizationToLocalStorage()
    }
  }

  async function fetchDesignPreviewsByStyleId(styleId: number) {
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

  // async function fetchRecentLogos(companyId?: number) {
  //   setLoading(true)
  //   setError(null)
  //   const resp = await tryCatchApi(API.products.getRecentLogos(companyId))
  //   if (resp.success) {
  //     recentLogos.value = resp.content as unknown as OutputRecentLogo[]
  //   } else {
  //     setError('Error getting recent logos')
  //   }
  //   setLoading(false)
  //   return resp
  // }

  // Centralized fetch orchestration reacting to customization selections
  watch(
    [
      () => customization.activeProductId,
      () => customization.activeStyleId,
      () => customization.activeDesignId
    ],
    async (
      [productId, styleId, designId],
      [prevProductId, prevStyleId, prevDesignId]
    ) => {
      // No changes detected
      if (
        productId === prevProductId &&
        styleId === prevStyleId &&
        designId === prevDesignId
      )
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
        await setSvgGroups()
      }
    },
    { immediate: true }
  )

  // ===== RETURN =====
  return {
    // State
    categories,
    activeProductDetails,
    activeStyleDetails,
    activeDesignDetails,
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
    // Actions
    setLoading,
    setError,
    setCategories,
    setActiveProductDetailsState,
    setActiveStyleDetailsState,
    setActiveDesignDetailsState,
    //setActiveAddonsList,
    //updateActiveAddonSelected,
    // Business Logic
    setSvgGroups,
    reset,
    initActiveSelectionFromLocalStorage,
    setActiveStep,
    saveCustomizationToLocalStorage,
    applyDesignPreview,
    captureDefaultsSnapshot,
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
    //fetchRecentLogos
  }
})
