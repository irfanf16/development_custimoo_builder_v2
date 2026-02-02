import { computed } from 'vue'
import { useQueryParamsStore } from '@/stores/queryParams/queryParams.store'
import type { QueryParams } from '@/stores/queryParams/queryParams.store'

/**
 * Composable to access query parameters anywhere in the app
 *
 * @example
 * // In a component or composable:
 * const { syncId, updateItem, hasSyncId } = useQueryParams()
 *
 * @example
 * // Get all params:
 * const { allParams } = useQueryParams()
 * console.log(allParams.value)
 */
export function useQueryParams() {
  const store = useQueryParamsStore()

  /**
   * Get sync_id parameter
   */
  const syncId = computed(() => store.getParam('sync_id'))

  /**
   * Get update_item parameter
   */
  const updateItem = computed(() => store.getParam('update_item'))

  /**
   * Get update_cart parameter
   */
  const updateCart = computed(() => store.getParam('update_cart'))

  /**
   * Get line parameter
   */
  const line = computed(() => store.getParam('line'))

  /**
   * Get roster parameter
   */
  const isRosterParam = computed(() => store.getParam('roster'))

  /**
   * Check if sync_id exists
   */
  const hasSyncId = computed(() => store.hasParam('sync_id'))

  /**
   * Check if update_item exists
   */
  const hasUpdateItem = computed(() => store.hasParam('update_item'))

  /**
   * Check if update_cart exists
   */
  const hasUpdateCart = computed(() => store.hasParam('update_cart'))

  /**
   * Get all parameters as a computed ref
   */
  const allParams = computed(() => store.getAllParams())

  /**
   * Get a specific parameter by key
   */
  function getParam<K extends keyof QueryParams>(key: K): QueryParams[K] {
    return store.getParam(key)
  }

  /**
   * Check if a parameter exists
   */
  function hasParam(key: keyof QueryParams): boolean {
    return store.hasParam(key)
  }

  return {
    // Individual params (computed)
    syncId,
    updateItem,
    updateCart,
    line,
    isRosterParam,
    // Existence checks (computed)
    hasSyncId,
    hasUpdateItem,
    hasUpdateCart,
    // All params
    allParams,
    // Utility methods
    getParam,
    hasParam
  }
}
