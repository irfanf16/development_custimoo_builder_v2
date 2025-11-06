/**
 * Utility functions for text workflow
 */

/**
 * Deep clone utility
 * Handles objects that may contain non-cloneable properties by falling back to JSON
 */
export function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (_error) {
      // Fallback to JSON if structuredClone fails (e.g., non-cloneable properties)
      // This can happen with objects containing functions, symbols, or circular references
      return JSON.parse(JSON.stringify(value)) as T
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Convert string or number input to number with fallback
 */
export function toNumber(input: string | number | undefined, fallback = 0): number {
  if (typeof input === 'number') return input
  const parsed = parseFloat(String(input ?? ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Construct full font URL from path
 */
export function getFontUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
  const clean = path.startsWith('/') ? path.slice(1) : path
  return base + clean
}
