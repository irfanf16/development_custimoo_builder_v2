export type LogoColor =
  | number[]
  | { hex: string | null; pantone: string | null; name: string | null }

import type { LogoPlacementBase } from '@/services/types'

export type Logo = LogoPlacementBase & {
  // Refinements for this domain
  url: string // stricter than base's string | null
  logo_colors: LogoColor[] // refine unknown[] to concrete union
  logo_name: string // refine from string | null

  // Extras only present on logos API
  original_logo?: string
  transparent_logo?: string
  smart_transparent_logo?: string
  original_logo_url?: string
  is_recent_logo?: boolean
  actualWidth?: number
  actualHeight?: number
  scaleX?: number
  scaleY?: number
}

export type OutputRecentLogos = {
  data: Logo[]
  message: string
}

export type UploadLogoParams = {
  file: File
  product_id: number
}

export type OutputUploadLogo = {
  success: boolean
  message: string
  result: {
    customer_logo: Logo
  }
  errors: { code?: string; message?: string }[]
  status_code: number
}
