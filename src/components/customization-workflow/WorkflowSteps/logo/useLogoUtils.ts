/**
 * Utility functions for logo workflow
 */

/**
 * Convert RGB array to hex color string
 */
export function rgbArrayToHex(arr: number[]): string {
  const [r = 0, g = 0, b = 0] = arr
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Maximum decimal places allowed for dimension inputs
 */
export const MAX_DECIMALS = 2

/**
 * Restricts input to numbers with max decimal places
 * @param value - Input value
 * @param maxDecimals - Maximum decimal places allowed
 * @returns Sanitized value
 */
export function restrictDecimalInput(value: string, maxDecimals: number = MAX_DECIMALS): string {
  // Remove all non-numeric characters except decimal point
  let sanitized = value.replace(/[^0-9.]/g, '')

  // Prevent multiple decimal points
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    sanitized = (parts[0] ?? '') + '.' + parts.slice(1).join('')
  }

  // Limit decimal places
  if (parts.length === 2 && parts[1] && parts[1].length > maxDecimals) {
    sanitized = (parts[0] ?? '') + '.' + parts[1].substring(0, maxDecimals)
  }

  return sanitized
}

/**
 * Formats and validates value on blur
 * @param value - Input value to format
 * @param defaultValue - Default value to return if invalid
 * @param maxDecimals - Maximum decimal places
 * @returns Formatted value or default
 */
export function formatOnBlur(
  value: string,
  defaultValue: string = '',
  maxDecimals: number = MAX_DECIMALS
): string {
  const str = value.trim()
  if (str === '' || str === '.') return defaultValue

  const num = Number.parseFloat(str)
  if (Number.isFinite(num) && num >= 0) {
    return num.toFixed(maxDecimals)
  }
  return defaultValue
}
