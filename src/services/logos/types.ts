import type { LogoPlacementBase, LogoColor } from '@/services/types'
export type { LogoColor } from '@/services/types'

export type CustomLogo = LogoPlacementBase & {
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
  placement?: string
}

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
