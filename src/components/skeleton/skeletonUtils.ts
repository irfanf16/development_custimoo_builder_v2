/** CSS length from a Tailwind-friendly value or pixel number */
export function skeletonDimension(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}
