export type OutputProductLogosSetting = {
  created_at: string
  height: number
  id: number
  logos_follows_product: 0 | 1
  following_product_ids: number[] | null
  is_locked: 0 | 1
  logo_technologies: string[] | null
  name_of_placement: string
  product_id: number
  product_style_id: number | null
  rotation: number
  side: 'front' | 'back'
  updated_at: string
  width: number
  x_axis: number
  y_axis: number
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
