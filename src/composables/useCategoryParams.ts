import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { GetProductCategoriesParams } from '@/services/products/types'

/**
 * Composable to determine the appropriate category query parameters
 * based on the same priority logic as the old Vue 2 project
 */
export function useCategoryParams() {
  const route = useRoute()

  // In widget mode, we need to check the parent window's URL for query params
  // since the widget uses hash routing
  const isWidgetMode = () => document.querySelector('customizer-widget') !== null

  /**
   * Get query parameters from the appropriate location
   */
  const getUrlQueryParams = computed(() => {
    if (isWidgetMode()) {
      // In widget mode, get params from parent window's location
      if (typeof window !== 'undefined' && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search)
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })
        return params
      }
      return {}
    } else {
      // In SPA mode, use Vue Router's query params
      return route.query as Record<string, string>
    }
  })

  /**
   * Determine the appropriate category params based on priority:
   * 1. Share URL (if contains 'share')
   * 2. is_reorder + active_product_id (if both present)
   * 3. sync_id (from URL)
   * 4. product_id (from URL or passed explicitly)
   * 5. Default: customized=true
   *
   * NOTE: This composable only handles URL-based logic.
   * Edit mode state (locker_product, cart_product, order_product, reorder_product)
   * should be handled by the caller with higher priority.
   */
  const getCategoryParams = computed((): GetProductCategoriesParams | undefined => {
    const urlParams = getUrlQueryParams.value

    // Priority 1: Share URL
    if (urlParams.share_url) {
      return {
        share_url: urlParams.share_url
      }
    }

    // Priority 2: is_reorder + active_product_id
    if (urlParams.is_reorder === 'true' && urlParams.active_product_id) {
      const productId = parseInt(urlParams.active_product_id, 10)
      if (!isNaN(productId)) {
        return {
          product_id: productId
        }
      }
    }

    // Priority 3: sync_id
    if (urlParams.sync_id) {
      const syncId = parseInt(urlParams.sync_id, 10)
      if (!isNaN(syncId)) {
        return {
          sync_id: syncId
        }
      }
    }

    // Priority 4: product_id
    if (urlParams.product_id) {
      const productId = parseInt(urlParams.product_id, 10)
      if (!isNaN(productId)) {
        return {
          product_id: productId
        }
      }
    }

    // Priority 5: product_filter mode (customized, personalized, private)
    if (urlParams.customized === 'true' || urlParams.customized === '1') {
      return { customized: true }
    }
    if (urlParams.personalized === 'true' || urlParams.personalized === '1') {
      return { personalized: true }
    }
    if (urlParams.private === 'true' || urlParams.private === '1') {
      return { private: true }
    }

    // Priority 6: Default
    return undefined // Will default to { customized: true } in fetchCustomizedCategories
  })

  return {
    urlQueryParams: getUrlQueryParams,
    categoryParams: getCategoryParams
  }
}
