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
