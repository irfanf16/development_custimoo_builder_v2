/**
 * Normalize font names so variants that differ only by case, spaces, dashes,
 * or underscores match (e.g. "The-Magic-Castle" ≡ "The Magic Castle" ≡ "The_Magic_Castle").
 */
export function canonicalFontKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

export type FontOptionLike = { value: string }

/**
 * Map an API / stored font name to the product font option `value` when keys match canonically.
 */
export function resolveFontToOptionValue(
  requested: string,
  options: FontOptionLike[]
): string | null {
  const t = requested.trim()
  if (!t || !options.length) return null
  const key = canonicalFontKey(t)
  const hit = options.find(o => canonicalFontKey(o.value) === key)
  return hit ? hit.value : null
}

/**
 * Match a requested font name to a key in `productsFonts` (opentype map) using the same rules.
 */
export function resolveFontToProductsFontKey(
  requested: string,
  productsFonts: Record<string, unknown>
): string | null {
  const t = requested.trim()
  if (!t || !Object.keys(productsFonts).length) return null
  const want = canonicalFontKey(t)
  for (const k of Object.keys(productsFonts)) {
    if (canonicalFontKey(k) === want) return k
  }
  return null
}
