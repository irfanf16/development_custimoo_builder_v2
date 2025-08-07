import { generateCssVariables, hexToHsl } from '@/lib/colorUtils'
import { useUIStore } from '@/stores/ui'

export function useColorScheme() {
  // Apply CSS variables to the widget container only
  const applyColorScheme = (container?: HTMLElement, hostTheme?: any) => {
    const target = container || document.documentElement

    // If no host theme provided, use default theme
    const themeToApply = hostTheme || {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#F3F4F6',
      accentForeground: '#1F2937'
    }

    // Generate all CSS variables for the theme
    const variables = generateLimitedCssVariables(themeToApply)

    // Clear existing variables before applying new ones
    const limitedVars = [
      '--primary',
      '--secondary',
      '--accent',
      '--accent-foreground',
      '--radius'
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

  return `
    --primary: ${hexToHslString(hostTheme.primary)};
    --secondary: ${hexToHslString(hostTheme.secondary || hostTheme.primary)};
    --accent: ${hexToHslString(hostTheme.accent)};
    --accent-foreground: ${hexToHslString(hostTheme.accentForeground)};
    --radius: ${hostTheme.radius || '0.625rem'};
  `.trim()
}
