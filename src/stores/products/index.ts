import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  ProductCustomization
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
    const output = await tryCatchApi(
      API.products.getProductByCategoryId({ category_id: categoryId })
    )
    if (output.success) {
      setProducts(output.content)
    } else {
      setError('Error getting products')
    }
    setLoading(false)
    return output
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
    // API Functions
    dispatchGetCategoriesWithNoDefaultCategoryOrProduct,
    dispatchGetProductCategoriesWithProductId,
    dispatchGetCustomizedCategories
  }
})
