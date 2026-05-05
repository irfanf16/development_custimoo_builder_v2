/**
 * Some API responses wrap setting keys in HTML (e.g. `<strong>ai_logo_generation_daily_quota</strong>`).
 * Resolve by canonical key name.
 */
export function normalizeCompanySettingKey(key: string): string {
  return key.replace(/<\/?[^>]+>/g, '').trim()
}

export function getCompanySettingValue(
  settings: Record<string, unknown> | null | undefined,
  canonicalKey: string
): unknown {
  if (!settings || typeof settings !== 'object') return undefined
  const direct = (settings)[canonicalKey]
  if (direct !== undefined) return direct
  const found = Object.entries(settings).find(
    ([k]) => normalizeCompanySettingKey(k) === canonicalKey
  )
  return found?.[1]
}
