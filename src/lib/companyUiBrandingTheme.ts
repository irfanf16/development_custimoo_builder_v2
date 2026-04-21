import type { UIBranding } from '@/services/company/types'
import { applyUiBrandingCssVariables, clearUiBrandingCssVariables } from '@/lib/applyUiBrandingTokens'

const RADIUS_ZERO_MODE_VAR = '--radius-zero-mode' as const

/**
 * Tailwind v4 often inlines `calc(var(--radius) + 8px)` for `rounded-2xl`, so overriding
 * `--radius-2xl` on the root does nothing. `@theme` uses `--radius-zero-mode` (see styles.css).
 */
export function syncTailwindRadiusScaleFromUiBranding(
  target: HTMLElement,
  branding: UIBranding
): void {
  const radiusNum =
    branding.border_radius != null && Number.isFinite(Number(branding.border_radius))
      ? Number(branding.border_radius)
      : null

  if (radiusNum === 0) {
    target.style.setProperty(RADIUS_ZERO_MODE_VAR, '1')
  } else {
    target.style.removeProperty(RADIUS_ZERO_MODE_VAR)
  }
}

/** Apply company `ui_branding` tokens + Tailwind radius scale (kept out of generic token helper). */
export function applyCompanyUiBrandingTheme(target: HTMLElement, branding: UIBranding): void {
  applyUiBrandingCssVariables(target, branding)
  syncTailwindRadiusScaleFromUiBranding(target, branding)
}

export function clearCompanyUiBrandingTheme(target: HTMLElement): void {
  clearUiBrandingCssVariables(target)
  target.style.removeProperty(RADIUS_ZERO_MODE_VAR)
}
