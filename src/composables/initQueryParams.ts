import type { Pinia } from 'pinia'
import { useQueryParamsStore } from '@/stores/queryParams/queryParams.store'
import type { QueryParams } from '@/stores/queryParams/queryParams.store'
import { canUseHistoryApi } from '@/lib/widgetUtils'

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
 * Extract query parameters from URL.
 * Works in both regular browser and Shadow DOM contexts.
 * Handles hash-based routing (#/?param=value) and regular query params (?param=value).
 * In iframe/srcdoc (when current document has no real URL), falls back to parent window's URL
 * so sync_id, token, etc. are still available (same as old custimoo_builder).
 */
function extractQueryParams(): QueryParams {
  if (typeof window === 'undefined') {
    return {}
  }

  const hash = window.location.hash
  const search = window.location.search
  const queryString =
    getQueryStringFromLocation(window.location.href, hash) || (search ? search.substring(1) : '')

  let params = parseQueryStringToParams(queryString)

  // In iframe/srcdoc the document URL is about:srcdoc with no hash – use parent URL for params
  // Same approach as old custimoo_builder: getUrlParameter uses getWindowObject().location
  if (!canUseHistoryApi() && Object.keys(params).length === 0) {
    const parentParams = extractQueryParamsFromParent()
    if (Object.keys(parentParams).length > 0) {
      params = parentParams
    }
  }

  return params
}

/**
 * Extract query string from a URL (href) and optional hash.
 * Parses both search (?key=val) and hash-based params (#/?key=val).
 */
function getQueryStringFromLocation(href: string, hash: string): string {
  let queryString = ''
  if (hash && hash.includes('?')) {
    const hashParts = hash.split('?')
    if (hashParts.length > 1 && hashParts[1]) {
      queryString = hashParts[1].split('#')[0] || ''
    }
  }
  if (!queryString && href.includes('?')) {
    const searchStart = href.indexOf('?')
    const hashStart = href.indexOf('#')
    const searchEnd = hashStart === -1 ? href.length : hashStart
    queryString = href.slice(searchStart + 1, searchEnd)
  }
  return queryString
}

/**
 * Extract query parameters from a given query string into a QueryParams object.
 */
function parseQueryStringToParams(queryString: string): QueryParams {
  const params: QueryParams = {}
  if (!queryString) return params
  const urlParams = new URLSearchParams(queryString)
  HANDLED_PARAMS.forEach(key => {
    const value = urlParams.get(key)
    if (value !== null && value !== '') {
      const parsedValue = parseQueryValue(key, value)
      ;(params as Record<string, string | number>)[key] = parsedValue
    }
  })
  return params
}

/**
 * Try to read query params from parent window (for iframe embed).
 * Same approach as old custimoo_builder: getUrlParameter uses getWindowObject().location.
 * Returns empty object if cross-origin or not in browser.
 */
function extractQueryParamsFromParent(): QueryParams {
  if (typeof window === 'undefined' || window === window.parent) return {}
  try {
    const parent = window.parent
    const href = parent.location.href
    const hash = parent.location.hash ?? ''
    const queryString = getQueryStringFromLocation(href, hash)
    return parseQueryStringToParams(queryString)
  } catch {
    return {}
  }
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

  // Only update URL if there were changes and History API is allowed (not in iframe srcdoc)
  if (hasChanges && canUseHistoryApi()) {
    const newUrl = window.location.pathname + newSearch + newHash
    try {
      const currentState = window.history.state as unknown
      window.history.replaceState(currentState, '', newUrl)
      window.dispatchEvent(new PopStateEvent('popstate', { state: currentState }))
    } catch {
      // Ignore SecurityError in srcdoc/restricted contexts
    }
  }
}

/**
 * Initialize query parameters on app bootstrap
 *
 * This function should be called once during app initialization (e.g., in bootstrap.ts or main.ts)
 *
 * It will:
 * 1. Extract handled query parameters from the URL (or from parent window when in iframe/srcdoc)
 * 2. Store them in the global queryParams store
 * 3. Remove them from the address bar using history.replaceState (skipped in iframe/srcdoc)
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
