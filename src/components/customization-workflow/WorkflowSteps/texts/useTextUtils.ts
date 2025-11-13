/**
 * Utility functions for text workflow
 *
 * These utilities are used across text-related components and composables
 * for common operations like cloning, type conversion, and URL construction
 */

/**
 * Deep clone utility with fallback support
 *
 * Attempts to use structuredClone (native browser API) for optimal performance.
 * Falls back to JSON serialization if structuredClone fails or is unavailable.
 *
 * Note: JSON fallback will lose functions, symbols, and circular references.
 * For text workflow objects, this is acceptable as they are plain data objects.
 *
 * @param value - The value to clone
 * @returns A deep clone of the input value
 */
export function clone<T>(value: T): T {
  // Try native structuredClone first (faster and handles more types)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (_error) {
      // Fallback to JSON if structuredClone fails
      // This can happen with objects containing functions, symbols, or circular references
      return JSON.parse(JSON.stringify(value)) as T
    }
  }

  // Fallback for environments without structuredClone support
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Converts string or number input to number with safe fallback
 *
 * Handles various input types and provides a default value if conversion fails.
 * Useful for parsing text item coordinates which may be strings or numbers.
 *
 * @param input - The value to convert (string, number, or undefined)
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns A valid number
 */
export function toNumber(input: string | number | undefined, fallback = 0): number {
  if (typeof input === 'number') return input
  const parsed = parseFloat(String(input ?? ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Constructs a full font URL from a relative path
 *
 * Handles both absolute URLs (http/https) and relative paths.
 * For relative paths, prepends the storage base URL from environment variables.
 *
 * @param path - Font file path (relative or absolute URL)
 * @returns Complete font URL ready for use in CSS or font loading
 */
export function getFontUrl(path: string): string {
  if (!path) return ''

  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Build URL from storage base and relative path
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
  const clean = path.startsWith('/') ? path.slice(1) : path

  return base + clean
}
