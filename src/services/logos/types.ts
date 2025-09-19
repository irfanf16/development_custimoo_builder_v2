export type LogoColor =
  | number[]
  | { hex: string | null; pantone: string | null; name: string | null }

export type Logo = {
  id: number
  product_id: number
  product_style_id: number | null
  following_product_ids: number[] | null
  rotation: number
  originalWidth: number | string
  originalHeight: number | string
  width: number
  height: number
  name_of_placement: string
  side: 'front' | 'back'
  x_axis: number
  y_axis: number
  x_axis_3d: number
  y_axis_3d: number
  is_locked: number
  logo_name: string
  original_logo?: string
  transparent_logo?: string
  smart_transparent_logo?: string
  original_logo_url?: string
  is_smart_transparent: boolean
  url: string
  haveControls: boolean
  logo_colors: LogoColor[]
  is_replace_success: boolean
  logo_index: number
  is_vector?: boolean
  logos_follows_product?: number
  logo_technologies?: null | string[]
  created_at?: string
  updated_at?: string
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
  errors: any[]
  status_code: number
}
