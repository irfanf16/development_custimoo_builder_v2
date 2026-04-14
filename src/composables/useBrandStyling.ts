import { hexToHsl } from '@/lib/colorUtils'
import { useUIStore } from '@/stores/ui/ui.store'
import { useCompanyStore } from '@/stores/company/company.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { loadCustomFont, loadGoogleFont, getFontFamilyCSS } from '@/lib/utils'

export function useBrandStyling() {
  // ===== BUSINESS LOGIC =====
  const applyBrandStyling = async (container?: HTMLElement) => {
    const target = container || document.documentElement
    const companyStore = useCompanyStore()
    const profileStore = useProfileStore()
    const defaultUiBranding = companyStore.settings?.ui_branding
    // If no host theme provided, use CSS defaults
    if (!defaultUiBranding) {
      const uiStore = useUIStore()
      uiStore.setAllowColorModeSwitch(true)
      uiStore.setDefaultColorMode('light')
      // Theme is now managed by profileStore, so we just ensure it's applied
      // The theme will be applied via uiStore's watch on currentTheme
      return
    }

    // Load fonts if specified (custom URLs or Google fonts)
    if (
      defaultUiBranding?.default_font_file ||
      defaultUiBranding?.default_font_family ||
      defaultUiBranding?.brand_font_file ||
      defaultUiBranding?.brand_font_family
    ) {
      try {
        const tasks: Promise<void>[] = []

        // Handle default font: custom URL or Google font family
        if (defaultUiBranding?.default_font_file) {
          // Custom font with URL
          tasks.push(loadCustomFont(defaultUiBranding.default_font_file, 'custom-font-1'))
        } else if (defaultUiBranding?.default_font_family) {
          // Google font family (no custom URL)
          tasks.push(loadGoogleFont(defaultUiBranding.default_font_family))
        }

        // Handle brand font: custom URL or Google font family
        if (defaultUiBranding?.brand_font_file) {
          // Custom font with URL
          tasks.push(loadCustomFont(defaultUiBranding.brand_font_file, 'custom-font-2'))
        } else if (defaultUiBranding?.brand_font_family) {
          // Google font family (no custom URL)
          tasks.push(loadGoogleFont(defaultUiBranding.brand_font_family))
        }

        await Promise.race([
          Promise.all(tasks),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Font loading timeout')), 5000)
          )
        ])
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`Failed to load fonts: ${message}`)
        // Continue with font application even if loading fails
      }
    }

    // Set the color mode configuration
    const uiStore = useUIStore()
    uiStore.setAllowColorModeSwitch(defaultUiBranding?.allow_color_mode_switch || true)
    uiStore.setDefaultColorMode(defaultUiBranding?.theme || 'light')

    // Apply theme based on configuration and user preferences
    // If color mode switch is allowed, respect user preference from profileStore
    // Otherwise, use the default from company settings
    if (defaultUiBranding?.allow_color_mode_switch) {
      // User preference takes precedence (already set in profileStore)
      // Theme will be applied via uiStore's watch on currentTheme
    } else {
      // If switching is not allowed, force the default theme
      const forcedTheme = defaultUiBranding?.theme || uiStore.defaultColorMode
      profileStore.setPreferences({ display: forcedTheme })
    }

    // Clear existing variables before applying new ones
    const limitedVars = [
      '--primary',
      '--radius',
      '--radius-active',
      '--font-sans',
      '--font-brand',
      '--accent'
    ]
    limitedVars.forEach(varName => target.style.removeProperty(varName))

    // Apply minimal variables from host theme
    const primaryHsl = hexToHsl(defaultUiBranding?.theme_color || '#000000')
    const primary = `hsl(${Math.round(primaryHsl.h)} ${Math.round(
      primaryHsl.s
    )}% ${Math.round(primaryHsl.l)}%)`
    target.style.setProperty('--primary', primary)
    const borderRadius = defaultUiBranding?.border_radius
    target.style.setProperty(
      '--radius',
      typeof borderRadius === 'number' && !Number.isNaN(borderRadius)
        ? `${borderRadius}rem`
        : '0.5rem'
    )
    const ring = `rgb(from var(--primary) r g b / 0.5)`
    target.style.setProperty('--ring', ring)

    // Apply font variables
    let defaultFontCSS = 'ui-sans-serif, system-ui, sans-serif'
    if (defaultUiBranding?.default_font_is_custom === '1') {
      defaultFontCSS = 'custom-font-1, ui-sans-serif, system-ui, sans-serif'
    } else if (defaultUiBranding?.default_font_family) {
      defaultFontCSS = getFontFamilyCSS(defaultUiBranding.default_font_family)
    }

    let brandFontCSS = 'ui-sans-serif, system-ui, sans-serif'
    if (defaultUiBranding?.brand_font_is_custom === '1') {
      brandFontCSS = 'custom-font-2, ui-sans-serif, system-ui, sans-serif'
    } else if (defaultUiBranding?.brand_font_family) {
      brandFontCSS = getFontFamilyCSS(defaultUiBranding.brand_font_family)
    }
    target.style.setProperty('--font-sans', defaultFontCSS)
    target.style.setProperty('--font-brand', brandFontCSS)
  }

  // ===== RETURN =====
  return {
    applyBrandStyling
  }
}

// Dark variants handled via CSS; no per-theme JS variables needed
