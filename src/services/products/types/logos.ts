export type OutputProductLogosSetting = {
  created_at: string
  following_product_ids: number[] | null
  haveControls: boolean
  height: number
  id: number
  is_locked: 0 | 1
  is_replace_success: boolean
  is_smart_transparent: boolean | null
  is_vector: boolean
  logo_colors: any[]
  length: number
  logo_index: number
  logo_name: string | null
  logo_technologies: string[] | null
  logos_follows_product: 0 | 1
  name_of_placement: string
  originalHeight: number
  originalWidth: number
  original_logo: any | null
  original_logo_url: string | null
  product_id: number
  product_style_id: number | null
  rotation: number
  side: 'front' | 'back'
  smart_transparent_logo: any | null
  transparent_logo: any | null
  updated_at: string
  url: string | null
  width: number
  x_axis: number
  x_axis_3d: number
  y_axis: number
  y_axis_3d: number
}

export type OutputRecentLogo = {
  id: number
  company_id: number
  product_id: number
  is_vector: boolean
  logo_name: string
  logo_url: string
  transparent_logo_url: string
  smart_transparent_logo_url: string
  original_logo_url: string
  original_png: string
  browser_key: string
  logo_colors: number[][]
  recent_delete: number
  url: string
}
