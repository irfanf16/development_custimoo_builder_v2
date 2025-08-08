import { hexToHsl } from '@/lib/colorUtils'
import { useUIStore } from '@/stores/ui'
import { loadGoogleFont, getFontFamilyCSS } from '@/lib/utils'

export function useColorScheme() {
  // Apply CSS variables to the widget container only
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

    // Generate all CSS variables for the theme
    const variables = generateLimitedCssVariables(hostTheme)

    // Clear existing variables before applying new ones
    const limitedVars = [
      '--primary',
      '--secondary',
      '--accent',
      '--radius',
      '--font-sans',
      '--font-heading'
    ]

    limitedVars.forEach(varName => {
      target.style.removeProperty(varName)
    })

    // Parse and apply each CSS variable
    variables.split('\n').forEach((line: string) => {
      const trimmed = line.trim()

      if (trimmed && trimmed.includes(':')) {
        const [property, value] = trimmed
          .split(':')
          .map((s: string) => s.trim())

        if (property && value) {
          // Remove semicolon from value if present
          const cleanValue = value.replace(/;$/, '')
          target.style.setProperty(property, cleanValue)
        }
      }
    })

    // Set the color mode
    const uiStore = useUIStore()
    uiStore.setAllowColorModeSwitch(hostTheme?.allowColorModeSwitch || false)
    uiStore.setDefaultColorMode(hostTheme?.defaultColorMode || 'light')

    // Apply theme based on configuration
    if (uiStore.allowColorModeSwitch) {
      uiStore.setTheme(uiStore.currentTheme)
    } else {
      uiStore.setTheme(uiStore.defaultColorMode)
    }

    // Add dark class to widget root
    if (uiStore.currentTheme === 'dark') {
      uiStore.widgetRoot?.classList.add('dark')
    } else {
      uiStore.widgetRoot?.classList.remove('dark')
    }
  }

  return {
    applyColorScheme
  }
}

// Generate only the limited CSS variables we want to override
function generateLimitedCssVariables(hostTheme: any): string {
  // Helper function to convert hex to HSL string (with hsl() wrapper)
  const hexToHslString = (hex: string): string => {
    const hsl = hexToHsl(hex)
    // For Tailwind v4, we need the HSL values with hsl() wrapper
    return `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`
  }

  const defaultFontCSS = hostTheme.fontFamilyDefault
    ? getFontFamilyCSS(hostTheme.fontFamilyDefault)
    : 'ui-sans-serif, system-ui, sans-serif'

  const headingFontCSS = hostTheme.fontFamilyHeading
    ? getFontFamilyCSS(hostTheme.fontFamilyHeading)
    : defaultFontCSS

  return `
    --primary: ${hexToHslString(hostTheme.primary)};
    --secondary: ${hexToHslString(hostTheme.secondary || hostTheme.primary)};
    --accent: ${hexToHslString(hostTheme.accent)};
    --radius: ${hostTheme.radius || '0.625rem'};
    --font-sans: ${defaultFontCSS};
    --font-heading: ${headingFontCSS};
  `.trim()
}
