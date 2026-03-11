import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type InputLogin,
  type Customer,
  type OutputLogin,
  type InputSignup,
  type OutputSignup,
  type SalesReps
} from '@/services/authentication/types'
import { API } from '../../services'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import type { APIResponse } from '@/services/types'
import { useLocalStorage } from '@/composables/useLocalStorage'
import type { PermissionResponse, Permissions } from '@/services/permissions/types'
import { useCartStore } from '@/stores/cart/cart.store'
import { useQueryParamsStore } from '@/stores/queryParams/queryParams.store'

export const useAuthStore = defineStore('authStore', () => {
  // ===== DEPENDENCIES =====
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'authStore' } })

  // ===== STATE =====
  const customer = ref<Customer | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isRefreshing = ref(false)
  const refreshPromise = ref<Promise<boolean> | null>(null)
  const encryptionKey = ref<CryptoKey | null>(null)
  const isHydrated = ref(false)
  const permissions = ref<Permissions>()
  const salesReps = ref<SalesReps[]>([])

  const hasWindow = typeof window !== 'undefined'
  const hasCryptoSupport = hasWindow && !!window.crypto?.subtle
  const storage = useLocalStorage()
  const CUSTOMER_STORAGE_KEY = 'customer'
  const ACCESS_TOKEN_STORAGE_KEY = 'jwtToken'
  const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken'
  const REFRESH_TOKEN_CIPHER_KEY = 'refreshTokenCipher'
  const REFRESH_TOKEN_ENC_KEY = 'refreshTokenEncKey'
  const ADMIN_TOKEN_STORAGE_KEY = 'adminToken'

  let hydrationPromise: Promise<boolean> | null = null
  let lastHydrationResult = false
  let storageListenerInterval: number | null = null
  let storageEventListener: ((event: StorageEvent) => void) | null = null

  // ===== COMPUTED =====
  const isAuthenticated = computed(() => !!accessToken.value && !!customer.value)
  /** True if adminToken is set in localStorage (e.g. user landed via admin link) */
  const hasAdminToken = computed(() => hasWindow && !!storage.getItemRaw(ADMIN_TOKEN_STORAGE_KEY))
  const customerInitials = computed(() => {
    if (!customer.value) return ''
    return `${customer.value?.first_name?.charAt(0)}${customer.value?.last_name?.charAt(0)}`.toUpperCase()
  })

  // ===== ACTIONS =====
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setCustomer(data: Customer) {
    customer.value = data
  }

  function setAccessToken(data: string) {
    accessToken.value = data
  }

  function setRefreshToken(data: string) {
    refreshToken.value = data
  }

  function clearAuth() {
    customer.value = null
    accessToken.value = null
    refreshToken.value = null
    refreshPromise.value = null
    encryptionKey.value = null
    permissions.value = undefined
    isHydrated.value = false
    lastHydrationResult = false
  }

  function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    if (!hasWindow) return ''
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte)
    })
    return window.btoa(binary)
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    if (!hasWindow) return new Uint8Array()
    const binaryString = window.atob(base64)
    const length = binaryString.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  function cloneToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = bytes.slice()
    return copy.buffer.slice(0)
  }

  async function ensureEncryptionKey(): Promise<CryptoKey | null> {
    if (!hasCryptoSupport) return null
    if (encryptionKey.value) return encryptionKey.value

    let rawKeyBase64 = storage.getItemRaw(REFRESH_TOKEN_ENC_KEY)

    if (!rawKeyBase64) {
      const rawKey = window.crypto.getRandomValues(new Uint8Array(32))
      rawKeyBase64 = bufferToBase64(rawKey)
      storage.setItemRaw(REFRESH_TOKEN_ENC_KEY, rawKeyBase64)
      const keyBuffer = cloneToArrayBuffer(rawKey)
      encryptionKey.value = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
      )
      return encryptionKey.value
    }

    const rawKey = base64ToUint8Array(rawKeyBase64)
    const keyBuffer = cloneToArrayBuffer(rawKey)
    encryptionKey.value = await window.crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, [
      'encrypt',
      'decrypt'
    ])
    return encryptionKey.value
  }

  async function encryptRefreshToken(value: string): Promise<string | null> {
    if (!hasCryptoSupport) return value
    const key = await ensureEncryptionKey()
    if (!key) return null

    const encoder = new TextEncoder()
    const data = encoder.encode(value)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    return bufferToBase64(combined)
  }

  async function decryptRefreshToken(payload: string | null): Promise<string | null> {
    if (!payload) return null
    if (!hasCryptoSupport) {
      return payload
    }
    const key = await ensureEncryptionKey()
    if (!key) return null

    const combined = base64ToUint8Array(payload)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    try {
      const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Failed to decrypt refresh token:', error)
      return null
    }
  }

  // ===== TOKEN UTILITIES =====
  type JWTPayload = {
    exp?: number
    [key: string]: unknown
  }

  function parseJwt(token: string): JWTPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }
      const base64Url = parts[1]
      if (!base64Url) {
        return null
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      )
      return JSON.parse(jsonPayload) as JWTPayload
    } catch (e) {
      console.error('Invalid JWT token:', e)
      return null
    }
  }

  function isTokenExpired(token: string): boolean {
    const decoded = parseJwt(token)
    if (!decoded || typeof decoded.exp !== 'number') {
      // If no expiration claim, assume token is valid
      return false
    }
    const nowInSeconds = Math.floor(Date.now() / 1000)
    return decoded.exp < nowInSeconds
  }

  // ===== REFRESH TOKEN ACTION =====
  async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise.value) {
      return refreshPromise.value
    }

    if (!refreshToken.value) {
      console.error('No refresh token available')
      return false
    }

    const tokenToRefresh = refreshToken.value

    const operation = (async () => {
      isRefreshing.value = true
      try {
        const response = await tryCatchApi(API.authentication.refreshToken(tokenToRefresh), {
          operation: 'refreshAccessToken'
        })

        if (response.success && response.content) {
          const { access_token, refresh_token, user } = response.content

          if (access_token && typeof access_token === 'string') {
            setAccessToken(access_token)
          }
          if (refresh_token && typeof refresh_token === 'string') {
            setRefreshToken(refresh_token)
          }
          if (user) {
            setCustomer(user)
          }

          await saveToLocalStorage()
          return true
        }

        console.error('Failed to refresh access token', response.axiosError)
        logout()
        return false
      } catch (error) {
        console.error('Error refreshing token:', error)
        logout()
        return false
      } finally {
        isRefreshing.value = false
        refreshPromise.value = null
      }
    })()

    refreshPromise.value = operation
    return operation
  }

  // ===== PERSISTENCE =====
  async function saveToLocalStorage(): Promise<void> {
    if (!hasWindow) return

    if (customer.value) {
      storage.setItem(CUSTOMER_STORAGE_KEY, customer.value)
    } else {
      storage.removeItem(CUSTOMER_STORAGE_KEY)
    }

    if (accessToken.value) {
      storage.setItemRaw(ACCESS_TOKEN_STORAGE_KEY, accessToken.value)
    } else {
      storage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    }

    if (refreshToken.value) {
      const encrypted = await encryptRefreshToken(refreshToken.value)
      if (encrypted) {
        storage.setItemRaw(REFRESH_TOKEN_CIPHER_KEY, encrypted)
      }
    } else {
      storage.removeItem(REFRESH_TOKEN_CIPHER_KEY)
    }

    // Remove legacy plain-text storage if present
    storage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  }

  async function loadFromLocalStorage(options?: { force?: boolean }): Promise<boolean> {
    if (!hasWindow) {
      return false
    }

    const shouldForce = options?.force ?? false

    if (isHydrated.value && !shouldForce) {
      return lastHydrationResult
    }

    if (hydrationPromise && !shouldForce) {
      return hydrationPromise
    }

    if (shouldForce) {
      isHydrated.value = false
      lastHydrationResult = false
    }

    const operation = (async () => {
      // Helper: get query param from URL (supports ?param= and #/?param= for hash routing)
      const getUrlParam = (name: string): string | null => {
        const search = window.location.search
        const hash = window.location.hash
        if (search) {
          const value = new URLSearchParams(search.substring(1)).get(name)
          if (value) return value
        }
        if (hash && hash.includes('?')) {
          const hashQuery = hash.split('?')[1]?.split('#')[0] || ''
          if (hashQuery) {
            const value = new URLSearchParams(hashQuery).get(name)
            if (value) return value
          }
        }
        return null
      }

      // Admin impersonation: token from query params store (read by initQueryParams) or URL fallback
      const queryParamsStore = useQueryParamsStore()
      const tokenFromStore =
        queryParamsStore.getParam('token') ?? queryParamsStore.getParam('adminToken')
      const urlToken = getUrlParam('token') ?? getUrlParam('adminToken')
      const impersonationToken = tokenFromStore ?? urlToken

      if (impersonationToken) {
        const output = await tryCatchApi(API.authentication.refreshToken(impersonationToken), {
          operation: 'loginFromToken'
        })
        const raw = output.content as Record<string, unknown> | null
        const data =
          raw && typeof raw.result === 'object' ? (raw.result as Record<string, unknown>) : raw
        const userFromApi = data && (data.user ?? data.customer)
        const accessTokenFromApi =
          data && typeof data.access_token === 'string' ? data.access_token : null
        const refreshTokenFromApi =
          data && typeof data.refresh_token === 'string' ? data.refresh_token : undefined
        const accessTokenToUse = accessTokenFromApi ?? impersonationToken

        if (output.success && data && userFromApi && accessTokenToUse) {
          const payload: OutputLogin = {
            user: userFromApi as Customer,
            access_token: accessTokenToUse,
            ...(refreshTokenFromApi ? { refresh_token: refreshTokenFromApi } : {})
          }
          await initCustomerAndAccessToken(payload)
          storage.setItemRaw(ADMIN_TOKEN_STORAGE_KEY, impersonationToken)
          await saveToLocalStorage()
          // Clear token from query params store (already removed from URL by initQueryParams when present)
          queryParamsStore.clearParam('token')
          queryParamsStore.clearParam('adminToken')
          // Remove token params from URL if still present (e.g. fallback when token was read from URL)
          try {
            const search = window.location.search
            const hash = window.location.hash
            let newSearch = search
            let newHash = hash
            if (search) {
              const p = new URLSearchParams(search.substring(1))
              if (p.has('token') || p.has('adminToken')) {
                p.delete('token')
                p.delete('adminToken')
                newSearch = p.toString() ? `?${p.toString()}` : ''
              }
            }
            if (hash && hash.includes('?')) {
              const [hashPath, hashQuery] = hash.split('?')
              const qPart = hashQuery?.split('#')[0] ?? ''
              const frag = hashQuery?.includes('#')
                ? `#${hashQuery.split('#').slice(1).join('#')}`
                : ''
              const p = new URLSearchParams(qPart)
              if (p.has('token') || p.has('adminToken')) {
                p.delete('token')
                p.delete('adminToken')
                const qs = p.toString()
                newHash = qs ? `${hashPath}?${qs}${frag}` : `${hashPath}${frag}`
              }
            }
            const newUrl = window.location.pathname + newSearch + newHash
            window.history.replaceState(null, '', newUrl)
          } catch {
            // ignore URL update errors
          }
          lastHydrationResult = true
          isHydrated.value = true
          return true
        }
      }

      // If the query string has jwtToken or adminToken (storage-only, no exchange), set them in storage
      const checkForQueryStringParams = () => {
        const jwtToken = getUrlParam('jwtToken')
        const adminToken = getUrlParam('adminToken')
        if (jwtToken) {
          storage.setItemRaw(ACCESS_TOKEN_STORAGE_KEY, jwtToken)
        }
        if (adminToken) {
          storage.setItemRaw(ACCESS_TOKEN_STORAGE_KEY, adminToken)
          storage.setItemRaw(ADMIN_TOKEN_STORAGE_KEY, adminToken)
        }
      }
      checkForQueryStringParams()

      const storedCustomer = storage.getItem<Customer>(CUSTOMER_STORAGE_KEY)
      const storedAccessToken = storage.getItemRaw(ACCESS_TOKEN_STORAGE_KEY)
      const encryptedRefreshToken = storage.getItemRaw(REFRESH_TOKEN_CIPHER_KEY)
      const legacyRefreshToken = encryptedRefreshToken
        ? null
        : storage.getItemRaw(REFRESH_TOKEN_STORAGE_KEY)

      if (storedCustomer) {
        try {
          setCustomer(storedCustomer)
        } catch (error) {
          console.error('Failed to parse stored customer data:', error)
          clearAuth()
          isHydrated.value = true
          lastHydrationResult = false
          return false
        }
      }

      if (storedAccessToken) {
        setAccessToken(storedAccessToken)
      }

      if (encryptedRefreshToken) {
        const decrypted = await decryptRefreshToken(encryptedRefreshToken)
        if (decrypted) {
          setRefreshToken(decrypted)
        }
      } else if (legacyRefreshToken) {
        setRefreshToken(legacyRefreshToken)
        void saveToLocalStorage()
      }

      const hasPersistedAuth = !!(
        storedCustomer &&
        (storedAccessToken || encryptedRefreshToken || legacyRefreshToken)
      )
      lastHydrationResult = hasPersistedAuth
      isHydrated.value = true
      return hasPersistedAuth
    })()

    hydrationPromise = operation
    try {
      return await operation
    } finally {
      hydrationPromise = null
    }
  }

  function ensureHydrated(options?: { force?: boolean }): Promise<boolean> {
    return loadFromLocalStorage(options)
  }

  /**
   * Starts listening for localStorage changes to detect when jwtToken and customer
   * are set by external systems (e.g., parent window, external scripts).
   *
   * This uses two strategies:
   * 1. Storage event listener (detects changes from other tabs/windows)
   * 2. Polling interval (detects changes from same window/external scripts)
   *
   * Automatically stops listening once authentication is detected.
   */
  function startListeningForAuth(): void {
    if (!hasWindow) return

    // Don't start if already authenticated
    if (isAuthenticated.value) {
      return
    }

    // Don't start if already listening
    if (storageListenerInterval !== null || storageEventListener !== null) {
      return
    }

    console.log('[Auth] Starting localStorage listener for jwtToken and customer')

    const checkAndHydrate = async () => {
      const storedCustomer = storage.getItem<Customer>(CUSTOMER_STORAGE_KEY)
      const storedAccessToken = storage.getItemRaw(ACCESS_TOKEN_STORAGE_KEY)

      if (storedCustomer && storedAccessToken) {
        console.log('[Auth] Detected jwtToken and customer in localStorage, hydrating...')

        // Stop listening
        stopListeningForAuth()

        // Hydrate the auth state
        await loadFromLocalStorage({ force: true })

        // Fetch cart and permissions if authenticated
        if (isAuthenticated.value) {
          try {
            const cartStore = useCartStore()
            await cartStore.fetchCart()
          } catch {
            // Ignore cart fetch errors
          }
          try {
            await getPermissions()
          } catch {
            // Ignore permissions fetch errors
          }
        }
      }
    }

    // Strategy 1: Listen for storage events (cross-tab/window changes)
    storageEventListener = (event: StorageEvent) => {
      // Only respond to changes to our auth keys
      if (
        event.key === ACCESS_TOKEN_STORAGE_KEY ||
        event.key === CUSTOMER_STORAGE_KEY ||
        event.key?.endsWith(`_${ACCESS_TOKEN_STORAGE_KEY}`) ||
        event.key?.endsWith(`_${CUSTOMER_STORAGE_KEY}`)
      ) {
        void checkAndHydrate()
      }
    }
    window.addEventListener('storage', storageEventListener)

    // Strategy 2: Poll for changes (same-window changes, external scripts)
    // Check every 500ms for new auth data
    storageListenerInterval = window.setInterval(() => {
      void checkAndHydrate()
    }, 500)

    // Safety: Stop listening after 5 minutes to prevent memory leaks
    setTimeout(
      () => {
        if (storageListenerInterval !== null) {
          console.log('[Auth] Storage listener timeout reached, stopping')
          stopListeningForAuth()
        }
      },
      5 * 60 * 1000
    )
  }

  /**
   * Stops listening for localStorage changes.
   * Called automatically when authentication is detected or after timeout.
   */
  function stopListeningForAuth(): void {
    if (!hasWindow) return

    if (storageListenerInterval !== null) {
      clearInterval(storageListenerInterval)
      storageListenerInterval = null
    }

    if (storageEventListener !== null) {
      window.removeEventListener('storage', storageEventListener)
      storageEventListener = null
    }

    console.log('[Auth] Stopped localStorage listener')
  }

  /**
   * Clears all authentication-related data from localStorage and sessionStorage
   * This includes:
   * - Customer data (localStorage)
   * - Access token (sessionStorage)
   * - Refresh token cipher (localStorage)
   * - Legacy refresh token (localStorage)
   * - Encryption key (sessionStorage)
   */
  function clearLocalStorage() {
    if (!hasWindow) return

    // Clear customer data from localStorage (uses prefix-aware storage)
    storage.removeItem(CUSTOMER_STORAGE_KEY)

    // Clear tokens from sessionStorage (no prefix, stored directly)
    storage.removeItem(ACCESS_TOKEN_STORAGE_KEY)

    // Clear encrypted refresh token from localStorage
    storage.removeItem(REFRESH_TOKEN_CIPHER_KEY)

    // Clear legacy plain-text refresh token (if exists)
    storage.removeItem(REFRESH_TOKEN_STORAGE_KEY)

    // Clear encryption key from sessionStorage
    storage.removeItem(REFRESH_TOKEN_ENC_KEY)
    storage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  }

  // ===== BUSINESS LOGIC =====
  async function initCustomerAndAccessToken(data: OutputLogin): Promise<void> {
    if ('user' in data && 'access_token' in data && data.user && data.access_token) {
      setCustomer(data.user)
      setAccessToken(data.access_token)
      const refreshTokenValue = 'refresh_token' in data ? data.refresh_token : undefined
      if (refreshTokenValue && typeof refreshTokenValue === 'string') {
        setRefreshToken(refreshTokenValue)
      }
      await saveToLocalStorage()

      // Stop listening for auth since we're now authenticated
      stopListeningForAuth()

      // Fetch cart after successful authentication
      try {
        const cartStore = useCartStore()
        await cartStore.fetchCart()
      } catch {
        // Ignore cart fetch errors - cart will be fetched when needed
      }

      // Fetch customer permissions after successful authentication
      try {
        await getPermissions()
      } catch {
        // Ignore permissions fetch errors
      }
    }
  }

  /**
   * Logs out the user by clearing all authentication state
   *
   * This performs a complete auth cleanup:
   * 1. Clears in-memory auth state (customer, tokens, etc.)
   * 2. Clears auth-related data from localStorage and sessionStorage
   * 3. Clears cart state (non-blocking)
   * 4. Stops any active localStorage listeners
   * 5. Starts listening for new auth data
   *
   * Note: For additional cleanup (e.g., clearing all localStorage or resetting stores),
   * use the `handleLogout` method from `useSignIn` composable instead.
   */
  function logout() {
    clearAuth()
    clearLocalStorage()
    stopListeningForAuth()

    // Clear cart when user logs out (non-blocking to avoid circular dependencies)
    const cartStore = useCartStore()
    cartStore.clearCart()

    // After logout, start listening for new auth data
    startListeningForAuth()
  }

  async function login(input: InputLogin): Promise<APIResponse<OutputLogin>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.authentication.postLogin(input), {
      operation: 'login'
    })
    if (output.success) {
      await initCustomerAndAccessToken(output.content)
    } else {
      setError('Login error')
    }
    setLoading(false)
    return output
  }

  async function register(input: InputSignup): Promise<APIResponse<OutputSignup>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.authentication.postRegister(input), {
      operation: 'register'
    })
    if (output.success) {
      await initCustomerAndAccessToken(output.content)
    } else {
      setError('Registration error')
    }
    setLoading(false)
    return output
  }

  // ===== PERMISSIONS =====
  async function getPermissions(): Promise<APIResponse<PermissionResponse>> {
    const output = await tryCatchApi(API.permissions.getPermissions(), {
      operation: 'getPermissions'
    })
    if (output.success && output.content) {
      const content = output.content
      // API returns array of permissions e.g. ["place-order"]
      if (Array.isArray(content)) {
        permissions.value = { permissions: content as string[] }
      } else {
        const raw = content as Record<string, unknown>
        const result = raw.result as Permissions | undefined
        const topLevelPermissions = raw.permissions
        if (result && Array.isArray(result.permissions)) {
          permissions.value = result
        } else if (Array.isArray(topLevelPermissions)) {
          permissions.value = { permissions: topLevelPermissions as string[] }
        }
      }
    }
    return output
  }

  async function getSalesReps(): Promise<APIResponse<SalesReps[]>> {
    const output = await tryCatchApi(API.authentication.getSalesReps(), {
      operation: 'getSalesReps'
    })

    return output
  }

  // ===== RETURN =====
  return {
    // State
    customer,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isRefreshing,
    isHydrated,
    permissions,
    salesReps,
    // Computed
    isAuthenticated,
    hasAdminToken,
    customerInitials,
    // Actions
    setLoading,
    setError,
    setCustomer,
    setAccessToken,
    setRefreshToken,
    clearAuth,
    // Token utilities
    parseJwt,
    isTokenExpired,
    refreshAccessToken,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    ensureHydrated,
    clearLocalStorage,
    // Storage Listeners
    startListeningForAuth,
    stopListeningForAuth,
    // Business Logic
    initCustomerAndAccessToken,
    login,
    logout,
    register,
    getSalesReps,
    // Permissions
    getPermissions
  }
})
