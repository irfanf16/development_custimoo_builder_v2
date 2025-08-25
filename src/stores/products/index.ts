import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  ProductCustomization,
  ActiveProductDetails,
  ProductPreviewItem,
  OutputProductStyleDesignBase
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
  const product = ref<Object | null>(null)
  // By default, it will chose the first style of the product
  const style = ref<Object | null>(null)
  // By default, it will chose the first design of the style
  const design = ref<Object | null>(null)
  // By default, no add-ons will be selected. Add-ons will be populated based on the selected product, style, and design
  const addOns = ref<Array<Object> | null>(null)

  // List of objects with Partial objects information to be displayed in the Customizer Menu
  // ProductsList will be populated based on the selected category
  const productsList = ref<Array<Object> | null>(null)
  // StylesList will be populated based on the selected product
  const stylesList = ref<Array<Object> | null>(null)
  // DesignsList will be populated based on the selected style
  const designsList = ref<Array<Object> | null>(null)
  // Add-onsList will be populated based on the selected product, style, and design
  const addOnsList = ref<Array<Object> | null>(null)

  // Customized Product State
  const customizedProduct = ref<ProductCustomization | null>(null)

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
  const designPreviews = ref<OutputProductStyleDesignBase[] | null>(null)

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

  // API Functions
  // async function dispatchGetCategories(
  //   params?: GetProductCategoriesParams
  // ): Promise<APIResponse<OutputProductCategories>> {
  //   setLoading(true)
  //   setError(null)
  //   const output = await tryCatchApi(
  //     API.products.getProductCategories(params ?? {})
  //   )
  //   if (output.success) {
  //     setCategories(output.content)
  //   } else {
  //     setError('Error getting categories')
  //   }
  //   setLoading(false)
  //   return output
  // }

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

  function initCustomizationFromLocalStorage() {
    const raw = localStorage.getItem('customizedProduct')
    if (raw) {
      try {
        customizedProduct.value = JSON.parse(raw)
      } catch (_e) {
        customizedProduct.value = null
      }
    }
  }

  function saveCustomizationToLocalStorage() {
    if (customizedProduct.value) {
      localStorage.setItem(
        'customizedProduct',
        JSON.stringify(customizedProduct.value)
      )
    } else {
      localStorage.removeItem('customizedProduct')
    }
  }

  function resetCustomizationToDefaults() {
    customizedProduct.value = null
    saveCustomizationToLocalStorage()
  }

  async function dispatchGetActiveProductDetails(productId: number) {
    setLoading(true)
    setError(null)
    const result = await tryCatchApi(
      API.products.getActiveProductDetails(productId)
    )
    if (result.success) {
      const details = result.content as unknown as ActiveProductDetails
      product.value = details.product
      style.value = details.productstyle
      design.value = details.productdesign
      setActiveStyle(details.productstyle.id)
      setActiveDesign(details.productdesign.id)
      setActiveProduct(details.product.id)
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
    customization: ProductCustomization | null
  } | null>(null)

  function captureDefaultsSnapshot() {
    defaultActiveDetails.value = {
      product: product.value ? JSON.parse(JSON.stringify(product.value)) : null,
      style: style.value ? JSON.parse(JSON.stringify(style.value)) : null,
      design: design.value ? JSON.parse(JSON.stringify(design.value)) : null,
      customization: customizedProduct.value
        ? (JSON.parse(
            JSON.stringify(customizedProduct.value)
          ) as ProductCustomization)
        : null
    }
  }

  function resetToDefaultsSnapshot() {
    if (defaultActiveDetails.value) {
      product.value = defaultActiveDetails.value.product
      style.value = defaultActiveDetails.value.style
      design.value = defaultActiveDetails.value.design
      customizedProduct.value = defaultActiveDetails.value.customization
      setActiveStyle((style.value as any)?.id ?? null)
      setActiveDesign((design.value as any)?.id ?? null)
    }
  }

  // Apply a design preview: update current design id and minimal customization fields
  function applyDesignPreview(preview: OutputProductStyleDesignBase) {
    // Update selected design id
    setActiveDesign(preview.id)
    // Update current design ref minimally (front design preview info)
    design.value = Object.assign({}, design.value || {}, {
      id: preview.id,
      front_design: preview.front_design,
      frontsafezone_design: preview.frontsafezone_design,
      frontboundary_design: preview.frontboundary_design,
      svg_parts: preview.svg_parts
    })
    // Update customization svg parts if present
    if (customizedProduct.value) {
      customizedProduct.value.svg_parts = preview.svg_parts
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
        resp.content as unknown as OutputProductStyleDesignBase[]
    } else {
      setError('Error getting design previews')
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
    addOns,
    productsList,
    stylesList,
    designsList,
    addOnsList,

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
    dispatchGetDesignPreviewsByStyleId,
    dispatchGetProductPreviews,
    productPreviews,
    designPreviews,
    activeCategoryId,
    activeProductId,
    activeStyleId,
    activeDesignId,
    activeStep,
    applyDesignPreview,
    captureDefaultsSnapshot,
    resetToDefaultsSnapshot,
    initCustomizationFromLocalStorage,
    saveCustomizationToLocalStorage,
    resetCustomizationToDefaults
  }
})
