import type { LogoPlacementBase, LogoColor } from '@/services/types'
import type { OutputProductLogoTechnology } from '../products/types'
export type { LogoColor } from '@/services/types'

export type CustomLogo = LogoPlacementBase & {
  // Refinements for this domain
  url: string // stricter than base's string | null
  logo_colors: LogoColor[] // refine unknown[] to concrete union
  logo_name: string // refine from string | null

  // Extras only present on logos API
  original_logo?: string
  transparent_logo_url?: string
  smart_transparent_logo_url?: string
  original_logo_url?: string
  is_recent_logo?: boolean
  actualWidth?: number
  actualHeight?: number
  scaleX?: number
  scaleY?: number
  placement?: string
  /** Selected logo technology (single object). Sent with custom_logos to cart/locker/share APIs. */
  logo_technology: OutputProductLogoTechnology | null
  /** When true, logo cannot be moved on canvas (pin control). */
  pinned?: boolean
}

/**
 * Shape of custom_logos array sent to backend (add to cart, locker, share product).
 * Each item has:
 * - logo_technologies: array of available logo tech sku_ids (numbers)
 * - logo_technology: the selected logo technology object, or null
 */
export type CustomLogosPayload = CustomLogo[]

export type OutputRecentLogos = {
  data: CustomLogo[]
  message: string
}

export type UploadLogoParams = {
  file: File
  product_id: number
}

export type UpdateAndPostNewLogoParams = {
  logo_id: number
  product_id: number
  logo: string
}

export type OutputUploadLogo = {
  success: boolean
  message: string
  result: {
    customer_logo: CustomLogo
  }
  errors: { code?: string; message?: string }[]
  status_code: number
}

export type OutputUpdateAndPostNewLogo = {
  customer_logo: CustomLogo
}

// {
//   "logo_id": 169725,
//   "type": "floodfill",
//   "image": "6/guest/logos/1663574532.AalborgPirateslogo.svg1760705225WYrFThHLq5_png.png",
//   "color": "#00843D"
// }
export type UpdateLogoParams = {
  logo_id: number
  type: 'floodfill'
  image: string
  color: string
}

export type OutputUpdateLogo = {
  message: string
  logo: string
}

export type OutputLogoColors = {
  message: string
  result: {
    logo_colors: number[][]
  }
  errors: string[]
}
