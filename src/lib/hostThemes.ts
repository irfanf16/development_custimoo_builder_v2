/**
 * Host-based color themes
 * Each host domain has its own predefined color scheme
 */

export interface HostTheme {
  primary: string
  secondary?: string
  // background: string
  // foreground: string
  // card: string
  // cardForeground: string
  // popover: string
  // popoverForeground: string
  // muted: string
  // mutedForeground: string
  accent: string
  // accentForeground: string
  // destructive: string
  // destructiveForeground: string
  // border: string
  // input: string
  // ring: string
  radius?: string
  fontFamilyDefault?: string
  fontFamilyHeading?: string
  name: string
  description: string
  allowColorModeSwitch: boolean
  defaultColorMode: 'light' | 'dark'
}

export const hostThemes: Record<string, HostTheme> = {
  // Development/Testing
  localhost: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#F3F4F6',
    radius: '0.5rem',
    fontFamilyDefault: 'Geist',
    fontFamilyHeading: 'Gesit',
    name: 'Development Blue',
    description: 'Blue primary with green accent for development',
    allowColorModeSwitch: true,
    defaultColorMode: 'light'
  },

  // Example: E-commerce site
  'shop.example.com': {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FEF2F2',
    radius: '0.75rem',
    fontFamilyDefault: 'Geist',
    fontFamilyHeading: 'Poppins',
    name: 'E-commerce Red',
    description: 'Warm red primary with teal accent for shopping sites',
    allowColorModeSwitch: false,
    defaultColorMode: 'light'
  },

  // Example: Corporate site
  'corporate.example.com': {
    primary: '#1F2937',
    secondary: '#6B7280',
    accent: '#F3F4F6',
    radius: '0.375rem',
    fontFamilyDefault: 'Geist',
    fontFamilyHeading: 'Inter',
    name: 'Corporate Gray',
    description: 'Professional gray theme for corporate sites',
    allowColorModeSwitch: true,
    defaultColorMode: 'light'
  },

  // Example: Creative agency
  'creative.example.com': {
    primary: '#8B5CF6',
    secondary: '#F59E0B',
    accent: '#FEF3C7',
    radius: '1rem',
    fontFamilyDefault: 'Geist',
    fontFamilyHeading: 'Montserrat',
    name: 'Creative Purple',
    description: 'Creative purple theme for design agencies',
    allowColorModeSwitch: true,
    defaultColorMode: 'dark'
  }
}

/**
 * Get theme for current host
 */
export function getHostTheme(): HostTheme | null {
  const host = window.location.hostname
  return hostThemes[host] || null
}

/**
 * Get theme for specific host
 */
export function getThemeForHost(hostname: string): HostTheme | null {
  return hostThemes[hostname] || null
}

/**
 * Get all available themes
 */
export function getAllThemes(): Record<string, HostTheme> {
  return hostThemes
}
