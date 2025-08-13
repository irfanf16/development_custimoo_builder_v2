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
  const categories = ref<OutputProductCategories | null>(null)
  const lastCategoryId = ref<number | null>(null)
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
  async function dispatchGetCategories(
    params?: GetProductCategoriesParams
  ): Promise<APIResponse<OutputProductCategories>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(
      API.products.getProductCategories(params ?? {})
    )
    if (output.success) {
      setCategories(output.content)
    } else {
      setError('Error getting categories')
    }
    setLoading(false)
    return output
  }

  async function dispatchGetCategoriesWithNoDefaultCategoryOrProduct(): Promise<APIResponse<OutputProductCategories>> {
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

  return {
    // State
    categories,
    lastCategoryId,
    isLoading,
    error,

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
