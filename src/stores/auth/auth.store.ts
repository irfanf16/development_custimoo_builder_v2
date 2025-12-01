import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type InputLogin,
  type Customer,
  type OutputLogin,
  type InputSignup,
  type OutputSignup
} from '@/services/authentication/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useAuthStore = defineStore('authStore', () => {
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

  const hasWindow = typeof window !== 'undefined'
  const hasCryptoSupport = hasWindow && !!window.crypto?.subtle
  const storage = useLocalStorage()
  const CUSTOMER_STORAGE_KEY = 'customer'
  const ACCESS_TOKEN_STORAGE_KEY = 'jwtToken'
  const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken'
  const REFRESH_TOKEN_CIPHER_KEY = 'refreshTokenCipher'
  const REFRESH_TOKEN_ENC_KEY = 'refreshTokenEncKey'

  let hydrationPromise: Promise<boolean> | null = null
  let lastHydrationResult = false

  // ===== COMPUTED =====
  const isAuthenticated = computed(
    () => !!accessToken.value && !!customer.value && !!refreshToken.value
  )
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
        const response = await tryCatchApi(API.authentication.refreshToken(tokenToRefresh))

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
    console.log('saveToLocalStorage')
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
      // If the query string url has params jwtToken or adminToken, set them in localStorage
      const checkForQueryStringParams = () => {
        const url = new URL(window.location.href)
        const jwtToken = url.searchParams.get('jwtToken')
        const adminToken = url.searchParams.get('adminToken')
        if (jwtToken) {
          storage.setItemRaw('jwtToken', jwtToken)
        }
        if (adminToken) {
          storage.setItemRaw('jwtToken', adminToken)
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
    }
  }

  /**
   * Logs out the user by clearing all authentication state
   *
   * This performs a complete auth cleanup:
   * 1. Clears in-memory auth state (customer, tokens, etc.)
   * 2. Clears auth-related data from localStorage and sessionStorage
   *
   * Note: For additional cleanup (e.g., clearing all localStorage or resetting stores),
   * use the `handleLogout` method from `useSignIn` composable instead.
   */
  function logout() {
    clearAuth()
    clearLocalStorage()
  }

  async function login(input: InputLogin): Promise<APIResponse<OutputLogin>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.authentication.postLogin(input))
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
    const output = await tryCatchApi(API.authentication.postRegister(input))
    if (output.success) {
      await initCustomerAndAccessToken(output.content)
    } else {
      setError('Registration error')
    }
    setLoading(false)
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
    // Computed
    isAuthenticated,
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
    // Business Logic
    initCustomerAndAccessToken,
    login,
    logout,
    register
  }
})
