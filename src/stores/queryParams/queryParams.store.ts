import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

/**
 * Query parameters that are handled by the app
 */
export interface QueryParams {
  sync_id?: number
  update_item?: string
  update_cart?: number
  line?: number
  roster?: number
  [key: string]: string | number | undefined
}

/**
 * Global store for query parameters extracted from URL
 * These params are read once on app bootstrap and removed from URL
 */
export const useQueryParamsStore = defineStore('queryParams', () => {
  // Store extracted query parameters
  const params = ref<QueryParams>({})

  /**
   * Set query parameters (called during initialization)
   */
  function setParams(newParams: QueryParams) {
    params.value = { ...newParams }
  }

  /**
   * Get a specific query parameter
   */
  function getParam<K extends keyof QueryParams>(key: K): QueryParams[K] {
    return params.value[key]
  }

  /**
   * Check if a specific parameter exists
   */
  function hasParam(key: keyof QueryParams): boolean {
    return params.value[key] !== undefined
  }

  /**
   * Get all parameters
   */
  function getAllParams(): Readonly<QueryParams> {
    return readonly(params.value)
  }

  /**
   * Clear all parameters
   */
  function clearParams() {
    params.value = {}
  }

  return {
    // Readonly state
    params: readonly(params),
    // Methods
    setParams,
    getParam,
    hasParam,
    getAllParams,
    clearParams
  }
})
