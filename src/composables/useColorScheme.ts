import { generateCssVariables } from '@/lib/colorUtils'

export function useColorScheme() {
  // Apply CSS variables to the widget container only
  const applyColorScheme = (container?: HTMLElement, hostTheme?: any) => {
    const target = container || document.documentElement

    // If no host theme provided, use default theme
    const themeToApply = hostTheme || {
      primary: '#3B82F6',
      secondary: '#6B7280',
      background: '#FFFFFF',
      foreground: '#1F2937',
      card: '#FFFFFF',
      cardForeground: '#1F2937',
      popover: '#FFFFFF',
      popoverForeground: '#1F2937',
      muted: '#F3F4F6',
      mutedForeground: '#6B7280',
      accent: '#F3F4F6',
      accentForeground: '#1F2937',
      destructive: '#EF4444',
      destructiveForeground: '#FFFFFF',
      border: '#E5E7EB',
      input: '#FFFFFF',
      ring: '#3B82F6'
    }

    const variables = generateCssVariables(themeToApply)

    // Clear any existing variables first
    const standardVars = [
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--destructive-foreground',
      '--border',
      '--input',
      '--ring'
    ]

    standardVars.forEach(varName => {
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
