/**
 * Host-based color themes
 * Each host domain has its own predefined color scheme
 */

export interface HostTheme {
  primary: string
  secondary?: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  name: string
  description: string
}

export const hostThemes: Record<string, HostTheme> = {
  // Development/Testing
  localhost: {
    primary: '#3B82F6',
    secondary: '#10B981',
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
    ring: '#3B82F6',
    name: 'Development Blue',
    description: 'Blue primary with green accent for development'
  },

  // Example: E-commerce site
  'shop.example.com': {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#FFFFFF',
    foreground: '#1F2937',
    card: '#FFFFFF',
    cardForeground: '#1F2937',
    popover: '#FFFFFF',
    popoverForeground: '#1F2937',
    muted: '#FEF2F2',
    mutedForeground: '#DC2626',
    accent: '#FEF2F2',
    accentForeground: '#DC2626',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#FECACA',
    input: '#FFFFFF',
    ring: '#FF6B6B',
    name: 'E-commerce Red',
    description: 'Warm red primary with teal accent for shopping sites'
  }
}

/**
 * Get theme for current host
 */
export function getHostTheme(): HostTheme | null {
  const host = window.location.hostname
  return hostThemes[host] || getDefaultTheme()
}

/**
 * Get default theme for unknown hosts
 */
export function getDefaultTheme(): HostTheme {
  return {
    primary: '#6B7280',
    secondary: '#F59E0B',
    background: '#FFFFFF',
    foreground: '#1F2937',
    card: '#FFFFFF',
    cardForeground: '#1F2937',
    popover: '#FFFFFF',
    popoverForeground: '#1F2937',
    muted: '#F9FAFB',
    mutedForeground: '#6B7280',
    accent: '#F9FAFB',
    accentForeground: '#1F2937',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E5E7EB',
    input: '#FFFFFF',
    ring: '#6B7280',
    name: 'Default Gray',
    description: 'Neutral gray with amber accent for unknown hosts'
  }
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
