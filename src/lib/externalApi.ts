/**
 * External API for interacting with the Customizer from external systems
 *
 * This API is exposed globally as window.customizerApi and allows parent windows,
 * external scripts, or iframe hosts to interact with the customizer's authentication
 * and other systems.
 *
 * @example
 * // External system authenticates user
 * window.customizerApi.auth.setCredentials({
 *   jwtToken: 'eyJhbGc...',
 *   customer: { id: 123, email: 'user@example.com', ... }
 * })
 *
 * @example
 * // External system checks if user is authenticated
 * if (window.customizerApi.auth.isAuthenticated()) {
 *   console.log('User is logged in')
 * }
 *
 * @example
 * // External system logs out user
 * window.customizerApi.auth.logout()
 */

import { useAuthStore } from '@/stores/auth/auth.store'
import { useSignIn } from '@/composables/useSignIn'
import type { Customer } from '@/services/authentication/types'

declare global {
  interface Window {
    customizerApi?: CustomizerApi
  }
}

export interface AuthCredentials {
  jwtToken: string
  customer: Customer
  refreshToken?: string
}

export interface CustomizerApi {
  auth: {
    /**
     * Check if user is currently authenticated
     */
    isAuthenticated: () => boolean

    /**
     * Get current authenticated customer
     */
    getCustomer: () => Customer | null

    /**
     * Set authentication credentials from external system
     * This will write to localStorage and trigger automatic hydration
     *
     * @param credentials - Authentication credentials
     * @returns Promise that resolves when auth is hydrated
     */
    setCredentials: (credentials: AuthCredentials) => Promise<boolean>

    /**
     * Manually trigger authentication check from localStorage
     * Use this after setting localStorage values directly
     *
     * @returns Promise that resolves to true if auth was successful
     */
    checkAuth: () => Promise<boolean>

    /**
     * Start listening for localStorage changes
     * Useful when external system will set auth data asynchronously
     */
    startListening: () => void

    /**
     * Stop listening for localStorage changes
     */
    stopListening: () => void

    /**
     * Logout current user
     *
     * @param options - Logout options
     * @param options.clearAllStorage - Whether to clear all localStorage
     */
    logout: (options?: { clearAllStorage?: boolean }) => void
  }

  /**
   * Get the current version of the customizer
   */
  version: string
}

/**
 * Create and initialize the external API
 * This should be called once during app bootstrap
 */
export function initializeExternalApi(): CustomizerApi {
  const api: CustomizerApi = {
    auth: {
      isAuthenticated: () => {
        try {
          const authStore = useAuthStore()
          return authStore.isAuthenticated
        } catch (error) {
          console.error('[CustomizerApi] Error checking authentication:', error)
          return false
        }
      },

      getCustomer: () => {
        try {
          const authStore = useAuthStore()
          return authStore.customer
        } catch (error) {
          console.error('[CustomizerApi] Error getting customer:', error)
          return null
        }
      },

      setCredentials: async (credentials: AuthCredentials) => {
        try {
          console.log('[CustomizerApi] Setting authentication credentials')

          // Write to localStorage
          if (credentials.jwtToken) {
            localStorage.setItem('jwtToken', credentials.jwtToken)
          }

          if (credentials.customer) {
            localStorage.setItem('customer', JSON.stringify(credentials.customer))
          }

          // Trigger immediate hydration
          const { checkAuthFromStorage } = useSignIn()
          const success = await checkAuthFromStorage()

          if (success) {
            console.log('[CustomizerApi] Successfully authenticated')
          } else {
            console.warn('[CustomizerApi] Failed to authenticate')
          }

          return success
        } catch (error) {
          console.error('[CustomizerApi] Error setting credentials:', error)
          return false
        }
      },

      checkAuth: async () => {
        try {
          const { checkAuthFromStorage } = useSignIn()
          return await checkAuthFromStorage()
        } catch (error) {
          console.error('[CustomizerApi] Error checking auth:', error)
          return false
        }
      },

      startListening: () => {
        try {
          console.log('[CustomizerApi] Starting auth listener')
          const authStore = useAuthStore()
          authStore.startListeningForAuth()
        } catch (error) {
          console.error('[CustomizerApi] Error starting listener:', error)
        }
      },

      stopListening: () => {
        try {
          console.log('[CustomizerApi] Stopping auth listener')
          const authStore = useAuthStore()
          authStore.stopListeningForAuth()
        } catch (error) {
          console.error('[CustomizerApi] Error stopping listener:', error)
        }
      },

      logout: options => {
        try {
          const { handleLogout } = useSignIn()
          handleLogout({
            clearAllStorage: options?.clearAllStorage ?? false
          })
        } catch (error) {
          console.error('[CustomizerApi] Error during logout:', error)
        }
      }
    },

    version:
      (import.meta.env as unknown as { VITE_APP_VERSION: string }).VITE_APP_VERSION || '0.0.0'
  }

  // Expose globally
  window.customizerApi = api

  console.log('[CustomizerApi] External API initialized', {
    version: api.version
  })

  return api
}

/**
 * Get the external API instance
 * Returns undefined if not yet initialized
 */
export function getExternalApi(): CustomizerApi | undefined {
  return window.customizerApi
}
