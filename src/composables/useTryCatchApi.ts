import type { AxiosError, AxiosResponse } from 'axios'
import type { APIResponse } from '@/services/types'
import { posthog } from 'posthog-js'
import type { Properties } from 'posthog-js'

// ===== TYPES =====
export interface UseTryCatchApiOptions {
  /**
   * Default properties to include in all exception tracking
   * Common examples: { store: 'productsStore' }
   */
  defaultProperties?: Properties
}

// ===== INTERNAL UTILITIES =====
/**
 * Safely gets user context from auth store
 * Uses a cached module reference to avoid repeated imports
 */
let authStoreModule: typeof import('@/stores/auth/auth.store') | null = null

async function getUserContextAsync(): Promise<{
  user_id?: number
  user_email?: string
  is_authenticated: boolean
} | null> {
  try {
    if (!authStoreModule) {
      authStoreModule = await import('@/stores/auth/auth.store')
    }
    const authStore = authStoreModule.useAuthStore()
    return {
      user_id: authStore.customer?.id,
      user_email: authStore.customer?.email,
      is_authenticated: !!authStore.customer
    }
  } catch {
    return null
  }
}

/**
 * Extracts useful context from AxiosError for exception tracking
 */
function extractExceptionContext<T>(error: AxiosError<T>): Properties {
  const config = error.config
  const response = error.response
  const hasRequest = !!error.request

  const context: Properties = {
    // Request information
    request_url: config?.url || 'unknown',
    request_method: config?.method?.toUpperCase() || 'unknown',
    request_base_url: config?.baseURL || 'unknown',
    request_full_url: config?.url ? `${config.baseURL || ''}${config.url}` : 'unknown',
    request_params: config?.params ? JSON.stringify(config.params) : undefined,
    request_headers: config?.headers
      ? Object.keys(config.headers)
          .filter(key => !['CustomerToken', 'Authorization'].includes(key))
          .reduce(
            (acc, key) => {
              acc[key] = '[REDACTED]'
              return acc
            },
            {} as Record<string, string>
          )
      : undefined,

    // Response information
    response_status: response?.status || 0,
    response_status_text: response?.statusText || 'unknown',
    response_data: response?.data ? JSON.stringify(response.data).substring(0, 1000) : undefined, // Limit size to avoid huge payloads
    response_headers: response?.headers
      ? (() => {
          const headers: Record<string, string> = {}
          if (response.headers) {
            const headerKeys = Object.keys(response.headers) as Array<keyof typeof response.headers>
            for (const key of headerKeys) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const value = response.headers[key]
              if (value !== undefined && value !== null) {
                headers[key as string] = String(value).substring(0, 100)
              }
            }
          }
          return headers
        })()
      : undefined,

    // Error information
    error_message: error.message || 'unknown',
    error_code: error.code || 'unknown',
    error_name: error.name || 'AxiosError',
    is_network_error: !response && hasRequest,
    is_timeout: error.code === 'ECONNABORTED',

    // Request timing
    request_timeout: config?.timeout || undefined,

    // Browser/environment context
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    current_url: typeof window !== 'undefined' ? window.location.href : undefined,
    current_path: typeof window !== 'undefined' ? window.location.pathname : undefined
  }

  return context
}

// ===== COMPOSABLE =====
/**
 * Composable for API error handling with automatic exception tracking
 *
 * @param options - Configuration options including default properties
 * @returns Configured tryCatchApi function that merges defaults with call-specific properties
 *
 * @example
 * ```ts
 * // In a store
 * const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'productsStore' } })
 *
 * // Usage - defaults are automatically included
 * const result = await tryCatchApi(API.products.getProductDetails(id), {
 *   operation: 'fetchProductDetails',
 *   product_id: id
 * })
 * ```
 */
export function useTryCatchApi(options: UseTryCatchApiOptions = {}) {
  const { defaultProperties = {} } = options

  /**
   * Wraps an API call with error handling and exception tracking
   *
   * @param promise - The axios promise to execute
   * @param additionalExceptionProperties - Additional properties to include in exception tracking
   * @returns APIResponse with success status and data/error
   */
  async function tryCatchApi<T>(
    promise: Promise<AxiosResponse<T>>,
    additionalExceptionProperties?: Properties
  ): Promise<APIResponse<T>> {
    try {
      const { status, data } = await promise
      if (status === 200 || status === 201 || status === 204) {
        return { success: true, content: data, status, axiosError: null }
      }
    } catch (error) {
      const _error = error instanceof Error ? error : new Error(String(error))
      const axiosError = _error as AxiosError<T>
      const responseData = axiosError.response?.data as Record<string, unknown> | undefined
      const message =
        (Array.isArray(responseData?.errors) ? (responseData.errors[0] as string) : undefined) ||
        (responseData?.message as string) ||
        (responseData?.error as string) ||
        axiosError.message ||
        'Something went wrong'

      // Extract automatic context from the error
      const exceptionContext = extractExceptionContext(axiosError)

      // Try to get user context (non-blocking, with timeout)
      let userContext: Awaited<ReturnType<typeof getUserContextAsync>> = null
      try {
        userContext = await Promise.race([
          getUserContextAsync(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 100)) // 100ms timeout
        ])
      } catch {
        // Silently fail if user context can't be retrieved
      }

      // Merge all properties: defaults -> exception context -> additional properties
      const finalProperties: Properties = {
        ...defaultProperties,
        ...exceptionContext,
        ...additionalExceptionProperties,
        custom_source: 'tryCatchApi',
        timestamp: new Date().toISOString()
      }

      if (userContext) {
        Object.assign(finalProperties, {
          user_id: userContext.user_id,
          user_email: userContext.user_email,
          is_authenticated: userContext.is_authenticated
        })
      }

      posthog.captureException(axiosError, finalProperties)
      return {
        success: false,
        content: null,
        status: axiosError.response?.status || 0,
        message,
        axiosError: axiosError
      }
    }
    return { success: false, content: null, status: 400, axiosError: null }
  }

  return {
    tryCatchApi
  }
}
