import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useProductsStore } from '@/stores/products/products.store'
import { useCompanyStore } from '@/stores/company/company.store'
import { pantonesTcx } from './pantonesTcx'
import { pantonesCoated } from './pantonesCoated'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensure a generic link tag exists */
function ensureLink(rel: string, href: string, crossOrigin?: string): void {
  try {
    const exists = Array.from(
      document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
    ).some(l => l.href === href)
    if (!exists) {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      if (crossOrigin) link.crossOrigin = crossOrigin
      document.head.appendChild(link)
    }
  } catch (_) {}
}

/** Ensure a stylesheet link with the given href exists in document.head */
export function ensureStylesheet(href: string): void {
  try {
    const exists = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).some(l => l.href === href)
    if (!exists) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  } catch (_) {}
}

export function filterFields<T extends Record<string, unknown>>(
  data: T | T[] | null | undefined,
  fields: (keyof T)[]
): T | T[] | undefined {
  if (data == null) return undefined

  // If it's an array — return array of filtered objects
  if (Array.isArray(data)) {
    return data.map(item => filterObject(item, fields))
  }

  // If it's a single object — return single filtered object
  return filterObject(data, fields)
}

// helper for filtering a single object
function filterObject<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  const filtered: Partial<T> = {}
  for (const field of fields) {
    if (field in obj) {
      filtered[field] = obj[field]
    }
  }
  return filtered as T
}

/**
 * Load Google Font dynamically
 */
function loadFont(url: string, fontFamily: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      ensureLink('preconnect', 'https://fonts.googleapis.com')
      ensureLink('preconnect', 'https://fonts.gstatic.com', 'anonymous')
      ensureStylesheet(url)

      const timeout = setTimeout(() => {
        reject(new Error(`Timed out loading font: ${fontFamily}`))
      }, 7000)

      const fontsApi = (
        document as unknown as {
          fonts?: { load?: (desc: string) => Promise<unknown> }
        }
      ).fonts
      const wait = fontsApi?.load
        ? Promise.all([
            fontsApi.load(`1em "${fontFamily}"`),
            fontsApi.load(`700 1em "${fontFamily}"`).catch(() => Promise.resolve([]))
          ])
        : new Promise<void>(res => setTimeout(res, 300))

      wait
        .then(() => {
          clearTimeout(timeout)
          resolve()
        })
        .catch(err => {
          clearTimeout(timeout)
          reject(err as Error)
        })
    } catch (err) {
      reject(err as Error)
    }
  })
}

/**
 * Get font family CSS value
 */
export function getFontFamilyCSS(fontFamily: string): string {
  // Handle fonts with spaces - always wrap in quotes for consistency
  return `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
}

// Format date to "MMM DD, YYYY" (e.g., "Jan 01, 2023")
export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

export function loadCustomFont(url: string, fontFamily: string): Promise<void> {
  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''

  const fileExt = url.split('.').pop()
  let fontFormat = ''
  if (fileExt === 'woff2') {
    fontFormat = 'woff2'
  } else if (fileExt === 'woff') {
    fontFormat = 'woff'
  }

  const style = document.createElement('style')
  style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${storageBase + url}') format('${fontFormat}');
        font-display: swap;
      }
    `
  document.head.appendChild(style)
  return loadFont(url, fontFamily)
}

export function loadGoogleFont(fontFamily: string): Promise<void> {
  const family = fontFamily.trim()
  // Always ensure stylesheet link exists (no early exit)
  const href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  return loadFont(href, fontFamily)
}

// ===== COLOR & PANTONE HELPERS =====

type PantoneColor = {
  pantone: string
  name: string
  hex: string
}

type RGBColor = {
  R: number
  G: number
  B: number
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): RGBColor | null {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return null

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null

  return { R: r, G: g, B: b }
}

/**
 * Calculate Euclidean distance between two RGB colors
 */
function colorDistance(color1: RGBColor, color2: RGBColor): number {
  const dr = color1.R - color2.R
  const dg = color1.G - color2.G
  const db = color1.B - color2.B
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Get CMYK object from hex color
 */
function getCmykObject(hexColor: string): { C: number; M: number; Y: number; K: number } | null {
  const hex = hexColor.charAt(0) === '#' ? hexColor.substring(1, 7) : hexColor
  if (hex.length !== 6 || !/[0-9a-f]{6}/i.test(hex)) {
    return null
  }

  const cmyk = { C: 0, M: 0, Y: 0, K: 0 }
  const R = parseInt(hex.substring(0, 2), 16)
  const G = parseInt(hex.substring(2, 4), 16)
  const B = parseInt(hex.substring(4, 6), 16)

  // BLACK
  if (R === 0 && G === 0 && B === 0) {
    cmyk.K = 100
    return cmyk
  }

  cmyk.C = 1 - R / 255
  cmyk.M = 1 - G / 255
  cmyk.Y = 1 - B / 255

  const minCMY = Math.min(cmyk.C, Math.min(cmyk.M, cmyk.Y))
  cmyk.C = ((cmyk.C - minCMY) / (1 - minCMY)) * 100
  cmyk.M = ((cmyk.M - minCMY) / (1 - minCMY)) * 100
  cmyk.Y = ((cmyk.Y - minCMY) / (1 - minCMY)) * 100
  cmyk.K = minCMY * 100

  return cmyk
}

/**
 * Convert CMYK object to label string
 */
function cmykObjectToLabel(cmyk: { C: number; M: number; Y: number; K: number }): string {
  let label = ''
  Object.entries(cmyk).forEach(([key, value]) => {
    const roundValue = Math.round(value)
    label += key + ' ' + (Number.isInteger(roundValue) ? roundValue : roundValue.toFixed(2)) + '% '
  })
  return label.trim()
}

/**
 * Get selected product pantones from the store
 * @param productId - Optional product ID, uses active product if not provided
 * @param svgGroup - Optional SVG group name to filter colors
 * @returns Array of pantone colors with pantone, name, and hex values
 */
export function getSelectedProductPantones(
  productId: number | null = null,
  svgGroup = ''
): PantoneColor[] {
  const productsStore = useProductsStore()

  const product = productId
    ? productsStore.getProductById(productId)
    : productsStore.activeProductDetails

  if (!product) return []

  const productPantones: PantoneColor[] = []
  let colors: Array<{ name: string; value: string; position?: number | string }> = []

  // Check if we have svg_group specific colors
  if (svgGroup && product.svg_group_color_container?.[svgGroup]) {
    colors = product.svg_group_color_container[svgGroup].json_data || []
  } else if (product.colors && product.colors.length > 0) {
    // Use first color group's json_data
    colors = product.colors[0]?.json_data || []
  }

  colors.forEach(color => {
    const pantone = (color as { pantone?: string }).pantone || ''
    productPantones.push({
      pantone,
      name: color.name || '',
      hex: color.value || ''
    })
  })

  return productPantones
}

/**
 * Get closest color match from pantone array
 * @param inputHex - Input hex color (with or without #)
 * @param pantonesArray - Array of pantone colors to search
 * @param colorType - Color type: 'pantone-tcx', 'pantone-coated', 'product_color', or 'cmyk'
 * @returns Closest pantone color match
 */
export function getClosestColor(
  inputHex: string,
  pantonesArray: PantoneColor[] = [],
  colorType: 'pantone-tcx' | 'pantone-coated' | 'product_color' | 'cmyk' = 'pantone-tcx'
): PantoneColor {
  // Normalize input hex
  let normalizedHex = inputHex.trim()
  if (!normalizedHex.startsWith('#')) {
    normalizedHex = '#' + normalizedHex
  }

  // Handle CMYK color type
  if (colorType === 'cmyk') {
    const colorObject = pantonesArray.find(
      pantone => pantone.hex.toLowerCase() === normalizedHex.toLowerCase()
    )
    if (colorObject) {
      return colorObject
    }
    const cmyk = getCmykObject(normalizedHex)
    if (cmyk) {
      return {
        pantone: '',
        name: cmykObjectToLabel(cmyk),
        hex: normalizedHex
      }
    }
    return { pantone: '', name: '', hex: normalizedHex }
  }

  // For product_color, only search in provided array
  if (colorType === 'product_color') {
    const inputRgb = hexToRgb(normalizedHex)
    if (!inputRgb || pantonesArray.length === 0) {
      return { pantone: '', name: '', hex: normalizedHex }
    }

    let closestDistance = Infinity
    let closestColor: PantoneColor | null = null

    pantonesArray.forEach(pantone => {
      const pantoneRgb = hexToRgb(pantone.hex)
      if (pantoneRgb) {
        const distance = colorDistance(inputRgb, pantoneRgb)
        if (distance < closestDistance) {
          closestDistance = distance
          closestColor = pantone
        }
      }
    })

    return closestColor || { pantone: '', name: '', hex: normalizedHex }
  }

  // For pantone-tcx and pantone-coated, merge with standard pantone libraries
  const inputRgb = hexToRgb(normalizedHex)
  if (!inputRgb) {
    return { pantone: '', name: '', hex: normalizedHex }
  }

  // Get standard pantone library based on color type
  const standardPantones = colorType === 'pantone-tcx' ? pantonesTcx : pantonesCoated

  // Merge provided pantones array with standard library
  // Convert standard pantones to match PantoneColor type
  const standardPantonesFormatted: PantoneColor[] = standardPantones.map(p => ({
    pantone: p.pantone || '',
    name: p.name || '',
    hex: p.hex || ''
  }))

  const mergedPantones = [...pantonesArray, ...standardPantonesFormatted]

  // Search in merged pantones array
  let closestDistance = Infinity
  let closestColor: PantoneColor | null = null

  mergedPantones.forEach(pantone => {
    const pantoneRgb = hexToRgb(pantone.hex)
    if (pantoneRgb) {
      const distance = colorDistance(inputRgb, pantoneRgb)
      if (distance < closestDistance) {
        closestDistance = distance
        closestColor = pantone
      }
    }
  })

  return closestColor || { pantone: '', name: '', hex: normalizedHex }
}

/**
 * Get color type setting from store
 * @param svgGroup - Optional SVG group name
 * @param productId - Optional product ID
 * @param colorType - Color type setting key: 'color_type' or 'logo_color_type'
 * @returns Color type string: 'pantone-tcx', 'pantone-coated', 'product_color', or 'cmyk'
 */
export function getColorType(
  svgGroup = '',
  productId: number | null = null,
  colorType: 'color_type' | 'logo_color_type' = 'color_type'
): 'pantone-tcx' | 'pantone-coated' | 'product_color' | 'cmyk' {
  const productsStore = useProductsStore()
  const companyStore = useCompanyStore()

  const product = productId
    ? productsStore.getProductById(productId)
    : productsStore.activeProductDetails

  // Check if product has svg_group specific color container
  if (svgGroup && product?.svg_group_color_container?.[svgGroup]) {
    return 'product_color'
  }

  // Check if product doesn't allow custom colors
  // Note: is_custom_color_allowed may not exist in all product types
  const isCustomColorAllowed = (product as { is_custom_color_allowed?: number })
    ?.is_custom_color_allowed
  if (product && isCustomColorAllowed === 0 && colorType === 'color_type') {
    return 'product_color'
  }

  // Get setting from company store
  const setting = companyStore.settings?.settings?.[colorType]
  if (!setting) {
    return 'pantone-tcx' // Default
  }

  // If product allows custom colors and color_type setting suggests product_color, use logo_color_type
  // Note: The setting type only includes 'pantone_coated' | 'pantone_tcx', so we check differently
  if (isCustomColorAllowed === 1 && colorType === 'color_type') {
    // If we need to fall back to logo_color_type, use it
    const logoColorType = companyStore.settings?.settings?.logo_color_type
    if (logoColorType) {
      return logoColorType === 'pantone_coated' ? 'pantone-coated' : 'pantone-tcx'
    }
  }

  // Map setting values to return types
  if (setting === 'pantone_coated') return 'pantone-coated'
  if (setting === 'pantone_tcx') return 'pantone-tcx'
  // Note: 'product_color' and 'cmyk' are not in the type but may be used in practice
  if (setting === ('product_color' as string)) return 'product_color'
  if (setting === ('cmyk' as string)) return 'cmyk'

  return 'pantone-tcx' // Default fallback
}

/**
 * Convert hex color to RGB object
 * @param hex - Hex color string (with or without #)
 * @returns RGB object with red, green, blue properties
 */
export function hexToRgbObject(hex: string): { red: number; green: number; blue: number } | null {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return null

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null

  return { red: r, green: g, blue: b }
}

/**
 * Calculate factorial for permutation calculation
 */
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

/**
 * Get permutation sequence for color shuffling
 * @param n - Permutation index (1-based, will be converted to 0-based)
 * @param number_of_parts - Total number of parts
 * @returns Array of part indices
 */
export function getPermutation(n: number, number_of_parts: number): number[] {
  const result: number[] = []
  const sequences: number[] = []
  const nums = [1, 2, 3, 4]
  let k = n - 1 // Convert to 0-based index

  while (nums.length > 0) {
    const fact = factorial(nums.length - 1)
    const index = Math.floor(k / fact)
    const spliced = nums.splice(index, 1)[0]
    if (spliced !== undefined) {
      sequences.push(spliced)
    }
    k %= fact
  }

  for (let i = 0; i < Math.ceil(number_of_parts / 4); i++) {
    sequences.forEach((sequence: number) => {
      const value = sequence + i * 4 - 1 // Scale and adjust the sequence value
      if (value < number_of_parts) {
        result.push(value)
      }
    })
  }
  return result
}
