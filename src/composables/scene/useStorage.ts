/**
 * Composable for storage URL helpers
 * Provides utilities for constructing storage URLs from relative paths
 */
export function useStorage() {
  // ===== STATE =====
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''

  // ===== UTILITIES =====
  /**
   * Convert a relative storage path to a full URL
   * @param path - Relative path (e.g., "super_admin/files/product/design.svg")
   * @returns Full storage URL
   */
  function fromStorage(path: string): string {
    if (!path?.trim()) return ''
    const trimmed = path.trim()
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    return base + clean
  }

  // ===== RETURN =====
  return {
    fromStorage,
    storageBase
  }
}
