import type { Pinia } from 'pinia'
import { useQueryParamsStore } from '@/stores/queryParams/queryParams.store'
import type { QueryParams } from '@/stores/queryParams/queryParams.store'

/**
 * List of query parameters that should be extracted and removed from URL
 * Includes token/adminToken for admin login flow (consumed by auth store after init)
 */
const HANDLED_PARAMS = [
  'sync_id',
  'update_item',
  'update_cart',
  'line',
  'roster',
  'token',
  'adminToken'
] as const

/**
 * Parse a query parameter value to the appropriate type
 */
function parseQueryValue(key: string, value: string): string | number {
  // Parse numeric params
  if (key === 'sync_id' || key === 'update_cart' || key === 'line' || key === 'roster') {
    const num = parseInt(value, 10)
    return isNaN(num) ? value : num
  }
  // token, adminToken and update_item stay as string
  return value
}

/**
 * Extract query parameters from URL
 * Works in both regular browser and Shadow DOM contexts
 * Handles both hash-based routing (#/?param=value) and regular query params (?param=value)
 */
function extractQueryParams(): QueryParams {
  if (typeof window === 'undefined') {
    return {}
  }

  const params: QueryParams = {}

  // Check if we have hash-based routing (e.g., #/?sync_id=55)
  // In hash routing, query params come after the hash
  const hash = window.location.hash
  const search = window.location.search

  // Determine which source to use: hash fragment or search params
  let queryString = ''

  if (hash && hash.includes('?')) {
    // Hash-based routing: extract query string from hash (e.g., #/?sync_id=55)
    const hashParts = hash.split('?')
    if (hashParts.length > 1 && hashParts[1]) {
      queryString = hashParts[1].split('#')[0] || '' // Remove any trailing hash
    }
  } else if (search) {
    // Regular query params: use search string (e.g., ?sync_id=55)
    queryString = search.substring(1) // Remove leading '?'
  }

  // Parse the query string
  if (queryString) {
    const urlParams = new URLSearchParams(queryString)

    HANDLED_PARAMS.forEach(key => {
      const value = urlParams.get(key)
      if (value !== null && value !== '') {
        const parsedValue = parseQueryValue(key, value)
        // Type assertion needed because QueryParams allows undefined
        ;(params as Record<string, string | number>)[key] = parsedValue
      }
    })
  }

  return params
}

/**
 * Remove handled query parameters from URL
 * Uses history.replaceState to avoid page reload
 * Handles both hash-based routing and regular query params
 */
function removeQueryParamsFromUrl(): void {
  if (typeof window === 'undefined') {
    return
  }

  const hash = window.location.hash
  const search = window.location.search
  let hasChanges = false
  let newHash = hash
  let newSearch = search

  // Check if params are in hash (hash-based routing)
  if (hash && hash.includes('?')) {
    const hashParts = hash.split('?')
    const hashPath = hashParts[0] || '#' // e.g., "#/" or "#"
    const hashQuery = hashParts[1]?.split('#')[0] || '' // Query string from hash

    if (hashQuery) {
      const urlParams = new URLSearchParams(hashQuery)

      // Remove handled params
      HANDLED_PARAMS.forEach(key => {
        if (urlParams.has(key)) {
          urlParams.delete(key)
          hasChanges = true
        }
      })

      // Reconstruct hash
      const remainingQuery = urlParams.toString()
      const hashIndex = hash.indexOf('?')
      const trailingHash =
        hashIndex !== -1 && hash.includes('#', hashIndex + 1)
          ? '#' + hash.split('#').slice(2).join('#')
          : ''
      newHash = remainingQuery
        ? `${hashPath}?${remainingQuery}${trailingHash}`
        : hashPath + trailingHash
    }
  }

  // Check if params are in search (regular query params)
  if (search) {
    const urlParams = new URLSearchParams(search.substring(1))

    HANDLED_PARAMS.forEach(key => {
      if (urlParams.has(key)) {
        urlParams.delete(key)
        hasChanges = true
      }
    })

    const remainingQuery = urlParams.toString()
    newSearch = remainingQuery ? `?${remainingQuery}` : ''
  }

  // Only update URL if there were changes
  if (hasChanges) {
    const newUrl = window.location.pathname + newSearch + newHash
    // Use replaceState to update URL without adding to history
    // This must be synchronous to prevent router from seeing the old URL
    const currentState = window.history.state as unknown
    window.history.replaceState(currentState, '', newUrl)

    // Force a synchronous update by dispatching a popstate event
    // This ensures the browser URL bar is updated immediately
    window.dispatchEvent(new PopStateEvent('popstate', { state: currentState }))
  }
}

/**
 * Initialize query parameters on app bootstrap
 *
 * This function should be called once during app initialization (e.g., in bootstrap.ts or main.ts)
 *
 * It will:
 * 1. Extract handled query parameters from the URL
 * 2. Store them in the global queryParams store
 * 3. Remove them from the address bar using history.replaceState (synchronously, before router init)
 *
 * @param pinia - Pinia instance (optional, will use default if not provided)
 *
 * @example
 * // In bootstrap.ts or main.ts:
 * import { initQueryParams } from '@/composables/initQueryParams'
 *
 * const pinia = createPinia()
 * initQueryParams(pinia)
 */
export function initQueryParams(pinia?: Pinia): void {
  // Extract params from URL FIRST (before any modifications)
  const extractedParams = extractQueryParams()

  // Store in global state FIRST (before removing from URL)
  // This ensures params are available immediately for any code that needs them
  const store = pinia ? useQueryParamsStore(pinia) : useQueryParamsStore()
  store.setParams(extractedParams)

  // Remove params from URL AFTER storing (so they're available during the brief moment)
  // This must happen before Vue Router initializes to prevent it from reading the params
  removeQueryParamsFromUrl()
}
