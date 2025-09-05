import { defineStore } from 'pinia'
import { ref } from 'vue'
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
  OutputProductDetails,
  OutputSvgGroupColor
} from '@/services/products/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'
import { useCustomizationStore } from '../customization.store'
import { useFabricPreview } from '@/composables/useFabricPreview'

const { getSvgGroup } = useFabricPreview()
export const useProductsStore = defineStore('productsStore', () => {
  const categories = ref<OutputProductCategories | null>(null)
  const activeProductDetails = ref<OutputProductDetails | null>(null)
  const activeStyleDetails = ref<OutputStyleDetails | null>(null)
  const activeDesignDetails = ref<OutputDesignDetails | null>(null)

  const svgGroups = ref<OutputSvgGroupColor[] | null>(null)

  const activeAddons = ref<OutputAddon[] | null>(null)
  const productAddons = ref<OutputAddon[] | null>(null)
  const companyAddons = ref<OutputCompanyAddon[] | null>(null)

  const customization = useCustomizationStore()

  const productPreviews = ref<ProductPreviewItem[] | null>(null)
  const stylePreviews = ref<OutputStylePreview[] | null>(null)
  const designPreviews = ref<OutputDesignPreview[] | null>(null)
  const recentLogos = ref<OutputRecentLogo[] | null>(null)
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
    customization.load()
  }
  function setActiveStep(_: string | null) {}
  async function setSvgGroups(): Promise<void> {
    console.log('setSvgGroups')
    const frontDesignUrl = activeDesignDetails.value?.front_design.file_url
    const fileExtension = activeDesignDetails.value?.front_design.file_extension
    console.log('frontDesignUrl', frontDesignUrl)
    console.log('fileExtension', fileExtension)
    if (!frontDesignUrl || !fileExtension) return
    const group = await getSvgGroup(frontDesignUrl, fileExtension)
    console.log('group', group)
    if (!group?._objects) return
    svgGroups.value = group._objects
      .filter(
        obj =>
          !(obj as any).id?.toLowerCase().includes('noncustomizable') &&
          !(obj as any).id?.toLowerCase().includes('inside') &&
          !(obj as any).id?.toLowerCase().includes('anchor')
      )
      .map(obj => {
        // Extract color as string from Fabric.js fill property
        const getColorString = (fill: any): string => {
          if (typeof fill === 'string') return fill
          if (fill && typeof fill === 'object' && fill.toHex)
            return fill.toHex()
          if (fill && typeof fill === 'object' && fill.color) return fill.color
          return '#000000' // fallback color
        }

        // Access id property with proper type assertion since CustomFabricGroup guarantees it exists
        const id = (obj as any).id || 'unknown'

        return {
          id,
          color: getColorString(obj.fill),
          pantone: '',
          name: '',
          count: id === 'base' ? 10000 : 1,
          gradient_colors: []
        }
      })
    console.log('svgGroups', svgGroups.value)
  }
  function reset() {
    categories.value = null
    isLoading.value = false
    error.value = null
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
  function setActiveAddonsList(addons: OutputAddon[]) {
    activeAddons.value = addons
  }

  function updateActiveAddonSelected(addonId: number, selected: boolean) {
    if (!activeAddons.value) return
    const idx = activeAddons.value.findIndex(
      a => (a as any).addon_id === addonId
    )
    if (idx >= 0) {
      ;(activeAddons.value[idx] as any).selected = selected
    }
  }

  async function fetchCategoriesWithNoDefaultCategoryOrProduct(): Promise<
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
    const resp = await tryCatchApi(API.products.getActiveStyleDetails(styleId))
    if (resp.success) {
      const payload = resp.content as unknown as {
        productstyle: any
        productdesign: any
      }
      setActiveStyleDetailsState(payload.productstyle)
      setActiveDesignDetailsState(
        (payload as any).productdesign as OutputDesignDetails
      )
      customization.setStyle(styleId)
      setSvgGroups()
    } else {
      setError('Error getting active style details')
    }
    setLoading(false)
    return resp
  }

  async function fetchProductAddons(productId: number) {
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
    customization.save()
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
      await (setSvgGroups as any)()
      customization.setCustomization(
        (defaultActiveDetails.value.customization ||
          (null as unknown)) as ActiveProductCustomization
      )
    }
  }

  function applyDesignPreview(designPreview: OutputDesignPreview) {
    if (customization.customization) {
      customization.setDesign(designPreview.id)
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

  async function fetchRecentLogos(companyId?: number) {
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
    setActiveProductDetailsState,
    setActiveStyleDetailsState,
    setActiveDesignDetailsState,
    setActiveAddonsList,
    updateActiveAddonSelected,
    initActiveSelectionFromLocalStorage,
    setActiveStep,
    fetchCategoriesWithNoDefaultCategoryOrProduct,
    fetchCustomizedCategories,
    fetchProductPreviews,
    fetchStylePreviews,
    fetchActiveProductDetails,
    fetchActiveStyleDetails,
    fetchProductAddons,
    fetchDesignPreviewsByStyleId,
    fetchDesignDetailsById,
    fetchRecentLogos,
    productPreviews,
    designPreviews,
    stylePreviews,
    recentLogos,
    activeAddons,
    productAddons,
    companyAddons,
    applyDesignPreview,
    captureDefaultsSnapshot,
    resetToDefaultsSnapshot,
    saveCustomizationToLocalStorage,
    svgGroups
  }
})
