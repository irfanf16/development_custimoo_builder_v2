import type { UIBranding } from '@/services/company/types'
import { loadCustomFont, loadGoogleFont } from '@/lib/utils'

/**
 * Loads custom / Google fonts for `ui_branding` (same rules as useBrandStyling).
 * Safe to call multiple times; loaders are defensive.
 */
export async function preloadUiBrandingFonts(branding: UIBranding): Promise<void> {
  if (
    !branding.default_font_file &&
    !branding.default_font_family &&
    !branding.brand_font_file &&
    !branding.brand_font_family
  ) {
    return
  }

  const tasks: Promise<void>[] = []

  if (branding.default_font_file) {
    tasks.push(loadCustomFont(branding.default_font_file, 'custom-font-1'))
  } else if (branding.default_font_family) {
    tasks.push(loadGoogleFont(branding.default_font_family))
  }

  if (branding.brand_font_file) {
    tasks.push(loadCustomFont(branding.brand_font_file, 'custom-font-2'))
  } else if (branding.brand_font_family) {
    tasks.push(loadGoogleFont(branding.brand_font_family))
  }

  if (tasks.length === 0) return

  try {
    await Promise.race([
      Promise.all(tasks),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Font loading timeout')), 5000)
      )
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[preloadUiBrandingFonts] ${message}`)
  }
}
