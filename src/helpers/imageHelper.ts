import placeholderImg from '@/images/placeholder-product.png'

export const PLACEHOLDER_IMAGE = placeholderImg

export function onImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = PLACEHOLDER_IMAGE
}
