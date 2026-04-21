import { useUIStore } from '@/stores/ui/ui.store'
import { applyCompanyUiBrandingTheme } from '@/lib/companyUiBrandingTheme'
import { useCompanyStore } from '@/stores/company/company.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { preloadUiBrandingFonts } from '@/lib/preloadUiBrandingFonts'

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

    await preloadUiBrandingFonts(defaultUiBranding)

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

    applyCompanyUiBrandingTheme(target, defaultUiBranding)
  }

  // ===== RETURN =====
  return {
    applyBrandStyling
  }
}

// Dark variants handled via CSS; no per-theme JS variables needed
