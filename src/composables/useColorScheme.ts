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

    // Generate all CSS variables for the theme
    const variables = generateLimitedCssVariables(
      hostTheme,
      uiStore.currentTheme
    )

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
  }

  return {
    applyColorScheme
  }
}

// Generate only the limited CSS variables we want to override
function generateLimitedCssVariables(
  hostTheme: any,
  currentTheme: string
): string {
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

  // Generate both light and dark mode variables
  const primaryHsl = hexToHsl(hostTheme.primary)
  const secondaryHsl = hexToHsl(hostTheme.secondary || hostTheme.primary)
  const accentHsl = hexToHsl(hostTheme.accent)

  // Create darker variants for dark mode
  const darkPrimaryHsl = { ...primaryHsl, l: Math.max(primaryHsl.l * 0.8, 0.1) }
  const darkSecondaryHsl = {
    ...secondaryHsl,
    l: Math.max(secondaryHsl.l * 0.7, 0.1)
  }
  const darkAccentHsl = { ...accentHsl, l: Math.max(accentHsl.l * 0.6, 0.1) }

  // Use dark variants if current theme is dark
  if (currentTheme === 'dark') {
    return `
      --primary: hsl(${Math.round(darkPrimaryHsl.h)} ${Math.round(darkPrimaryHsl.s)}% ${Math.round(darkPrimaryHsl.l)}%);
      --secondary: hsl(${Math.round(darkSecondaryHsl.h)} ${Math.round(darkSecondaryHsl.s)}% ${Math.round(darkSecondaryHsl.l)}%);
      --accent: hsl(${Math.round(darkAccentHsl.h)} ${Math.round(darkAccentHsl.s)}% ${Math.round(darkAccentHsl.l)}%);
      --radius: ${hostTheme.radius || '0.625rem'};
      --font-sans: ${defaultFontCSS};
      --font-heading: ${headingFontCSS};
    `.trim()
  }

  // Use light variants for light theme
  return `
    --primary: ${hexToHslString(hostTheme.primary)};
    --secondary: ${hexToHslString(hostTheme.secondary || hostTheme.primary)};
    --accent: ${hexToHslString(hostTheme.accent)};
    --radius: ${hostTheme.radius || '0.625rem'};
    --font-sans: ${defaultFontCSS};
    --font-heading: ${headingFontCSS};
  `.trim()
}
