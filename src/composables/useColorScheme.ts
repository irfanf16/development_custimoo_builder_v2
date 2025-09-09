import { generateCssVariables, hexToHsl } from '@/lib/colorUtils'
import { useUIStore } from '@/stores/ui'
import { loadGoogleFont, getFontFamilyCSS } from '@/lib/utils'

export function useColorScheme() {
  // ===== BUSINESS LOGIC =====
  const applyColorScheme = async (container?: HTMLElement, hostTheme?: any) => {
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

    // Load font if specified
    if (hostTheme.fontFamilyDefault || hostTheme.fontFamilyHeading) {
      try {
        const fontsToLoad = []
        if (hostTheme.fontFamilyDefault)
          fontsToLoad.push(hostTheme.fontFamilyDefault)
        if (hostTheme.fontFamilyHeading)
          fontsToLoad.push(hostTheme.fontFamilyHeading)

        await Promise.race([
          Promise.all(fontsToLoad.map(font => loadGoogleFont(font))),
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

    // Generate color CSS variables for the theme
    const variables = generateCssVariables(hostTheme)

    // Clear existing variables before applying new ones
    const limitedVars = ['--primary', '--secondary', '--accent', '--radius']

    limitedVars.forEach(varName => {
      target.style.removeProperty(varName)
    })

    // Apply color variables
    variables.split('\n').forEach((line: string) => {
      const trimmed = line.trim()
      if (trimmed && trimmed.includes(':')) {
        const [property, value] = trimmed
          .split(':')
          .map((s: string) => s.trim())
        if (property && value) {
          const cleanValue = value.replace(/;$/, '')
          target.style.setProperty(property, cleanValue)
        }
      }
    })

    // Override for dark theme directly to avoid cascade conflicts with inline vars
    if (uiStore.currentTheme === 'dark') {
      const primaryHsl = hexToHsl(hostTheme.primary)
      const secondaryHsl = hexToHsl(hostTheme.secondary || hostTheme.primary)
      const accentHsl = hexToHsl(hostTheme.accent)

      const darkPrimary = `hsl(${Math.round(primaryHsl.h)} ${Math.round(
        primaryHsl.s
      )}% ${Math.round(Math.max(primaryHsl.l * 0.8, 10))}%)`
      const darkSecondary = `hsl(${Math.round(secondaryHsl.h)} ${Math.round(
        secondaryHsl.s
      )}% ${Math.round(Math.max(secondaryHsl.l * 0.7, 10))}%)`
      const darkAccent = `hsl(${Math.round(accentHsl.h)} ${Math.round(
        accentHsl.s
      )}% ${Math.round(Math.max(accentHsl.l * 0.6, 10))}%)`

      target.style.setProperty('--primary', darkPrimary)
      target.style.setProperty('--secondary', darkSecondary)
      target.style.setProperty('--accent', darkAccent)
    }

    // Apply font variables
    const defaultFontCSS = hostTheme.fontFamilyDefault
      ? getFontFamilyCSS(hostTheme.fontFamilyDefault)
      : 'ui-sans-serif, system-ui, sans-serif'
    const headingFontCSS = hostTheme.fontFamilyHeading
      ? getFontFamilyCSS(hostTheme.fontFamilyHeading)
      : defaultFontCSS
    target.style.setProperty('--font-sans', defaultFontCSS)
    target.style.setProperty('--font-heading', headingFontCSS)
  }

  // ===== RETURN =====
  return {
    applyColorScheme
  }
}

// Dark variants handled via CSS; no per-theme JS variables needed
