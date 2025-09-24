import { hexToHsl } from '@/lib/colorUtils'
import { useUIStore } from '@/stores/ui'
import { loadGoogleFont, getFontFamilyCSS } from '@/lib/utils'
import type { HostTheme } from '@/lib/hostThemes'

export function useColorScheme() {
  // ===== BUSINESS LOGIC =====
  const applyColorScheme = async (
    container?: HTMLElement,
    hostTheme?: HostTheme | null
  ) => {
    const target = container || document.documentElement

    // If no host theme provided, use CSS defaults
    if (!hostTheme) {
      const uiStore = useUIStore()
      uiStore.setAllowColorModeSwitch(true)
      uiStore.setDefaultColorMode('light')
      uiStore.setTheme(uiStore.currentTheme)

      // Add dark class to widget root
      if (uiStore.currentTheme === 'dark') {
        uiStore.widgetRoot?.classList.add('dark')
      } else {
        uiStore.widgetRoot?.classList.remove('dark')
      }
      return
    }

    // Load fonts if specified (Google or arbitrary URLs)
    if (hostTheme.font?.default?.name || hostTheme.font?.brandAccent?.name) {
      try {
        // Default font: try URL if provided, else Google
        const tasks: Promise<void>[] = []
        const defaultFont = hostTheme.font?.default
        const brandFont = hostTheme.font?.brandAccent

        if (defaultFont?.name) {
          tasks.push(loadGoogleFont(defaultFont.name, defaultFont.url))
        }
        if (brandFont?.name) {
          tasks.push(loadGoogleFont(brandFont.name, brandFont.url))
        }

        await Promise.race([
          Promise.all(tasks),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Font loading timeout')), 5000)
          )
        ])
      } catch (error) {
        console.warn(`Failed to load fonts: ${error}`)
        // Continue with font application even if loading fails
      }
    }

    // Set the color mode FIRST
    const uiStore = useUIStore()
    uiStore.setAllowColorModeSwitch(hostTheme?.allowColorModeSwitch || false)
    uiStore.setDefaultColorMode(hostTheme?.defaultColorMode || 'light')

    // Apply theme based on configuration
    if (uiStore.allowColorModeSwitch) {
      uiStore.setTheme(uiStore.currentTheme)
    } else {
      uiStore.setTheme(uiStore.defaultColorMode)
    }

    // Add dark class to widget root BEFORE setting CSS variables
    if (uiStore.currentTheme === 'dark') {
      uiStore.widgetRoot?.classList.add('dark')
    } else {
      uiStore.widgetRoot?.classList.remove('dark')
    }

    // Clear existing variables before applying new ones
    const limitedVars = [
      '--primary',
      '--radius',
      '--font-sans',
      '--font-heading'
    ]
    limitedVars.forEach(varName => target.style.removeProperty(varName))

    // Apply minimal variables from host theme
    const primaryHsl = hexToHsl(hostTheme.primary)
    const primary = `hsl(${Math.round(primaryHsl.h)} ${Math.round(
      primaryHsl.s
    )}% ${Math.round(primaryHsl.l)}%)`
    target.style.setProperty('--primary', primary)
    target.style.setProperty('--radius', hostTheme.radius || '0.625rem')

    // Dark mode tweak for primary only
    if (uiStore.currentTheme === 'dark') {
      const darkPrimary = `hsl(${Math.round(primaryHsl.h)} ${Math.round(
        primaryHsl.s
      )}% ${Math.round(Math.max(primaryHsl.l * 0.8, 10))}%)`
      target.style.setProperty('--primary', darkPrimary)
    }

    // Apply font variables
    const defaultFontCSS = hostTheme.font?.default?.name
      ? getFontFamilyCSS(hostTheme.font.default.name)
      : 'ui-sans-serif, system-ui, sans-serif'
    const headingFontCSS = hostTheme.font?.brandAccent?.name
      ? getFontFamilyCSS(hostTheme.font.brandAccent.name)
      : defaultFontCSS
    target.style.setProperty('--font-sans', defaultFontCSS)
    target.style.setProperty('--font-heading', headingFontCSS)
    target.style.setProperty('--font-brand', headingFontCSS)
  }

  // ===== RETURN =====
  return {
    applyColorScheme
  }
}

// Dark variants handled via CSS; no per-theme JS variables needed
