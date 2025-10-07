/**
 * Host-based color themes
 * Each host domain has its own predefined color scheme
 */

export interface HostTheme {
  primary: string
  radius?: string
  font?: {
    default?: { name: string; url?: string }
    brandAccent?: { name: string; url?: string }
  }
  name: string
  description: string
  allowColorModeSwitch: boolean
  defaultColorMode: 'light' | 'dark'
}

export const hostThemes: Record<string, HostTheme> = {
  // Development/Testing
  localhost: {
    primary: '#3B82F6',
    radius: '0.5rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: { name: 'Geist' }
    },
    name: 'Development Blue',
    description: 'Blue primary with green accent for development',
    allowColorModeSwitch: true,
    defaultColorMode: 'light'
  },

  'test.custimoo.com': {
    primary: '#3B82F6',
    radius: '0.5rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: {
        name: 'Orbitron',
        url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap'
      }
    },
    name: 'Development Blue',
    description: 'Blue primary with green accent for development',
    allowColorModeSwitch: true,
    defaultColorMode: 'light'
  },

  // Staging
  'builder-v2.custimoo.com': {
    primary: '#e12d2e',
    radius: '0.5rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: {
        name: 'Orbitron',
        url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap'
      }
    },
    name: 'E-commerce Red',
    description: 'Warm red primary with teal accent for shopping sites',
    allowColorModeSwitch: true,
    defaultColorMode: 'dark'
  },

  // Example: E-commerce site
  'shop.example.com': {
    primary: '#FF6B6B',
    radius: '0.75rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: { name: 'Poppins' }
    },
    name: 'E-commerce Red',
    description: 'Warm red primary with teal accent for shopping sites',
    allowColorModeSwitch: false,
    defaultColorMode: 'light'
  },

  // Example: Corporate site
  'corporate.example.com': {
    primary: '#1F2937',
    radius: '0.375rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: { name: 'Inter' }
    },
    name: 'Corporate Gray',
    description: 'Professional gray theme for corporate sites',
    allowColorModeSwitch: true,
    defaultColorMode: 'light'
  },

  // Example: Creative agency
  'creative.example.com': {
    primary: '#8B5CF6',
    radius: '1rem',
    font: {
      default: { name: 'Geist' },
      brandAccent: { name: 'Montserrat' }
    },
    name: 'Creative Purple',
    description: 'Creative purple theme for design agencies',
    allowColorModeSwitch: true,
    defaultColorMode: 'dark'
  }
}

/**
 * Get theme for current host
 */
export function getHostTheme(): HostTheme | undefined {
  const rawHost = window.location.hostname.toLowerCase()
  const normalizedHost =
    rawHost === '127.0.0.1' || rawHost === '::1' ? 'localhost' : rawHost

  // Exact match first
  if (hostThemes[normalizedHost]) return hostThemes[normalizedHost]

  // Try suffix match for subdomains, pick the longest matching suffix
  const candidates = Object.keys(hostThemes).filter(key =>
    normalizedHost.endsWith(key)
  )
  if (candidates.length > 0) {
    const best = candidates.sort((a, b) => b.length - a.length)[0]
    return hostThemes[best ?? 'localhost']
  }

  return undefined
}

/**
 * Get all available themes
 */
export function getAllThemes(): Record<string, HostTheme> {
  return hostThemes
}
