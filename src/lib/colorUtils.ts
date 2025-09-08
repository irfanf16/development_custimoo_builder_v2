/**
 * Color utility functions for generating background and foreground colors
 * based on primary and secondary colors
 */

// Convert hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error('Invalid hex color')
  }

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360
  s = s / 100
  l = l / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Calculate relative luminance
function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const [rs, gs, bs] = [r, g, b].map(c => {
    if (c <= 0.03928) {
      return c / 12.92
    }
    return Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Generate background color based on primary color
export function generateBackgroundColor(primaryColor: string): string {
  const hsl = hexToHsl(primaryColor)

  // Create a very light background based on the primary color
  // Keep the same hue, reduce saturation, increase lightness
  const backgroundHsl = {
    h: hsl.h,
    s: Math.max(0, hsl.s - 80), // Reduce saturation significantly
    l: Math.min(98, hsl.l + 40) // Increase lightness significantly
  }

  return hslToHex(backgroundHsl.h, backgroundHsl.s, backgroundHsl.l)
}

// Generate foreground color based on background color
export function generateForegroundColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)

  // Use dark text on light backgrounds, light text on dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// Generate secondary background color
export function generateSecondaryBackgroundColor(
  secondaryColor: string
): string {
  const hsl = hexToHsl(secondaryColor)

  // Create a light secondary background
  const secondaryHsl = {
    h: hsl.h,
    s: Math.max(0, hsl.s - 70),
    l: Math.min(95, hsl.l + 35)
  }

  return hslToHex(secondaryHsl.h, secondaryHsl.s, secondaryHsl.l)
}

// Generate accent color based on primary color
export function generateAccentColor(primaryColor: string): string {
  const hsl = hexToHsl(primaryColor)

  // Create a slightly different accent color
  const accentHsl = {
    h: (hsl.h + 30) % 360, // Shift hue by 30 degrees
    s: Math.min(100, hsl.s + 10), // Slightly increase saturation
    l: Math.max(20, hsl.l - 10) // Slightly decrease lightness
  }

  return hslToHex(accentHsl.h, accentHsl.s, accentHsl.l)
}

// Generate a complete color scheme
export function generateColorScheme(
  primaryColor: string,
  secondaryColor?: string
) {
  const background = generateBackgroundColor(primaryColor)
  const foreground = generateForegroundColor(background)

  const accent = generateAccentColor(primaryColor)

  return {
    primary: primaryColor,
    secondary: secondaryColor || primaryColor,
    background,
    foreground,
    card: background,
    cardForeground: foreground,
    popover: background,
    popoverForeground: foreground,
    muted: generateBackgroundColor(primaryColor),
    mutedForeground: generateForegroundColor(
      generateBackgroundColor(primaryColor)
    ),
    accent,
    accentForeground: foreground,
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: generateBackgroundColor(primaryColor),
    input: background,
    ring: primaryColor
  }
}

// Convert hex to CSS custom property format
export function hexToCssVariable(hex: string, variableName: string): string {
  return `--${variableName}: ${hex};`
}

// Generate CSS custom properties for a host theme
export function generateCssVariables(hostTheme: any): string {
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
    --radius: ${hostTheme.radius || '0.625rem'};
  `.trim()
}
