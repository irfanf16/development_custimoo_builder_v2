import { useAppStore } from '@/stores/app/app.store'
import {
  CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
  getKeyWithSubPageSuffix
} from '@/helpers/subPageUrlHelper'

/**
 * App version injected at build time
 * This will be replaced by Vite's define during build
 */
declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

const VERSION_KEY = '__customizer_version__'

/**
 * Composable for managing localStorage with app-specific prefixing and version tracking
 *
 * Features:
 * - Automatically prefixes keys with app's subpage_url if available
 * - Tracks app version and clears localStorage on version change
 * - Provides type-safe getItem, setItem, removeItem, and clear methods
 *
 * @example
 * ```ts
 * const storage = useLocalStorage()
 * storage.setItem('myKey', { data: 'value' })
 * const value = storage.getItem('myKey')
 * ```
 */
export function useLocalStorage() {
  const appStore = useAppStore()

  /**
   * Check version and clear localStorage if version changed
   * This should be called once during app initialization
   */
  function checkVersion(): void {
    if (typeof window === 'undefined') return

    try {
      const storedVersion = localStorage.getItem(VERSION_KEY)
      if (storedVersion !== APP_VERSION) {
        // Version changed - clear all localStorage
        localStorage.clear()
        // Set new version
        localStorage.setItem(VERSION_KEY, APP_VERSION)
      }
    } catch (e) {
      console.error('Failed to check localStorage version:', e)
    }
  }

  /**
   * Get item from localStorage
   * @param key - The storage key (will be prefixed automatically)
   * @returns The stored value or null if not found
   */
  function getItem<T = unknown>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const fullKey = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(key, appStore.appInfo?.suppage_url ?? '')
        : key
      const item = localStorage.getItem(fullKey)
      if (item === null) return null
      return JSON.parse(item) as T
    } catch (e) {
      console.error(`Failed to get item from localStorage: ${key}`, e)
      return null
    }
  }

  /**
   * Set item in localStorage
   * @param key - The storage key (will be prefixed automatically)
   * @param value - The value to store (will be JSON stringified)
   */
  function setItem<T = unknown>(key: string, value: T): void {
    if (typeof window === 'undefined') return

    try {
      const fullKey = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(key, appStore.appInfo?.suppage_url ?? '')
        : key
      const serialized = JSON.stringify(value)
      localStorage.setItem(fullKey, serialized)
    } catch (e) {
      console.error(`Failed to set item in localStorage: ${key}`, e)
    }
  }

  /**
   * Remove item from localStorage
   * @param key - The storage key (will be prefixed automatically)
   */
  function removeItem(key: string): void {
    if (typeof window === 'undefined') return

    try {
      const fullKey = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(key, appStore.appInfo?.suppage_url ?? '')
        : key
      localStorage.removeItem(fullKey)
    } catch (e) {
      console.error(`Failed to remove item from localStorage: ${key}`, e)
    }
  }

  /**
   * Clear all localStorage items that match the current prefix
   * If no prefix, clears all items
   */
  function clear(): void {
    if (typeof window === 'undefined') return

    try {
      const currentPrefix = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(
            CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
            appStore.appInfo?.suppage_url ?? ''
          )
        : ''

      if (!currentPrefix) {
        // No prefix - clear everything
        localStorage.clear()
        // But preserve the version key
        const version = localStorage.getItem(VERSION_KEY)
        localStorage.clear()
        if (version) localStorage.setItem(VERSION_KEY, version)
        return
      }

      // Clear only items with the current prefix
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(currentPrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
  }

  /**
   * Clear ALL localStorage items (regardless of prefix)
   * Useful for sign-out scenarios where you want to clear everything
   * Preserves the version key
   */
  function clearAll(): void {
    if (typeof window === 'undefined') return

    try {
      const version = localStorage.getItem(VERSION_KEY)
      localStorage.clear()
      if (version) localStorage.setItem(VERSION_KEY, version)
    } catch (e) {
      console.error('Failed to clear all localStorage:', e)
    }
  }

  /**
   * Get raw string value from localStorage (without JSON parsing)
   * Useful for legacy code or when you need the raw string
   */
  function getItemRaw(key: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      const fullKey = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(key, appStore.appInfo?.suppage_url ?? '')
        : key
      return localStorage.getItem(fullKey)
    } catch (e) {
      console.error(`Failed to get raw item from localStorage: ${key}`, e)
      return null
    }
  }

  /**
   * Set raw string value in localStorage (without JSON stringifying)
   * Useful for legacy code or when you need to store raw strings
   */
  function setItemRaw(key: string, value: string): void {
    if (typeof window === 'undefined') return

    try {
      const fullKey = appStore.appInfo?.is_subpage
        ? getKeyWithSubPageSuffix(key, appStore.appInfo?.suppage_url ?? '')
        : key
      localStorage.setItem(fullKey, value)
    } catch (e) {
      console.error(`Failed to set raw item in localStorage: ${key}`, e)
    }
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    clearAll,
    getItemRaw,
    setItemRaw,
    checkVersion
  }
}
