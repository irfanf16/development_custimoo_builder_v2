/**
 * If `value` is a string, parses it as JSON; otherwise returns `value` unchanged.
 * Returns `undefined` for null/undefined, empty/whitespace strings, or invalid JSON.
 */
export function safeParse<T = unknown>(value: unknown): T | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return undefined
    try {
      return JSON.parse(t) as T
    } catch {
      return undefined
    }
  }
  return value as T
}
