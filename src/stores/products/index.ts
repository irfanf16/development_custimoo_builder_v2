import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  OutputProductCategories,
  GetProductCategoriesParams
} from '@/services/products/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'

export const useProductsStore = defineStore('productsStore', () => {
  // State
  const categoriesResponse = ref<OutputProductCategories | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setCategoriesResponse(data: OutputProductCategories) {
    categoriesResponse.value = data
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function clearCategories() {
    categoriesResponse.value = null
  }

  function reset() {
    categoriesResponse.value = null
    isLoading.value = false
    error.value = null
  }

  // API Functions
  async function dispatchGetCategories(
    params?: GetProductCategoriesParams
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(
      API.products.getProductCategories(params ?? {})
    )
    if (output.success) {
      setCategoriesResponse(output.content)
    } else {
      setError('Error getting categories')
    }
    setLoading(false)
    return output
  }

  async function dispatchGetProductCategories(
    productId: number
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(
      API.products.getProductCategories({ product_id: productId })
    )
    if (output.success) {
      setCategoriesResponse(output.content)
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
      setCategoriesResponse(output.content)
    } else {
      setError('Error getting customized categories')
    }
    setLoading(false)
    return output
  }

  return {
    // State
    categoriesResponse,
    isLoading,
    error,

    // Actions
    setCategoriesResponse,
    setLoading,
    setError,
    clearCategories,
    reset,

    // API Functions
    dispatchGetCategories,
    dispatchGetProductCategories,
    dispatchGetCustomizedCategories
  }
})
