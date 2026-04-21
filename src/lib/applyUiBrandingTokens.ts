import { hexToHsl } from '@/lib/colorUtils'
import { getFontFamilyCSS } from '@/lib/utils'
import type { UIBranding } from '@/services/company/types'

const BRANDING_CSS_VARS = [
  '--primary',
  '--radius',
  '--font-sans',
  '--font-brand',
  '--accent',
  '--ring'
] as const

export function clearUiBrandingCssVariables(target: HTMLElement): void {
  BRANDING_CSS_VARS.forEach(varName => target.style.removeProperty(varName))
}

/**
 * Applies `ui_branding` as CSS custom properties on `target` (sync, no webfont loading).
 */
export function applyUiBrandingCssVariables(target: HTMLElement, branding: UIBranding): void {
  BRANDING_CSS_VARS.forEach(varName => target.style.removeProperty(varName))

  const primaryHsl = hexToHsl(branding.theme_color || '#000000')
  const primary = `hsl(${Math.round(primaryHsl.h)} ${Math.round(primaryHsl.s)}% ${Math.round(
    primaryHsl.l
  )}%)`
  target.style.setProperty('--primary', primary)

  const radiusRem =
    branding.border_radius != null && Number.isFinite(Number(branding.border_radius))
      ? `${Number(branding.border_radius)}rem`
      : '0.625rem'
  target.style.setProperty('--radius', radiusRem)

  const ring = `rgb(from var(--primary) r g b / 0.5)`
  target.style.setProperty('--ring', ring)

  let defaultFontCSS = 'ui-sans-serif, system-ui, sans-serif'
  if (branding.default_font_is_custom === '1') {
    defaultFontCSS = 'custom-font-1, ui-sans-serif, system-ui, sans-serif'
  } else if (branding.default_font_family) {
    defaultFontCSS = getFontFamilyCSS(branding.default_font_family)
  }

  let brandFontCSS = 'ui-sans-serif, system-ui, sans-serif'
  if (branding.brand_font_is_custom === '1') {
    brandFontCSS = 'custom-font-2, ui-sans-serif, system-ui, sans-serif'
  } else if (branding.brand_font_family) {
    brandFontCSS = getFontFamilyCSS(branding.brand_font_family)
  }
  target.style.setProperty('--font-sans', defaultFontCSS)
  target.style.setProperty('--font-brand', brandFontCSS)
}
