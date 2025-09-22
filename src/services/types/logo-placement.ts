export type LogoColor =
  | number[]
  | { hex: string | null; pantone: string | null; name: string | null }

export type LogoPlacementBase = {
  // Identity
  id: number
  product_id: number
  product_style_id: number | null
  following_product_ids: number[] | null

  // Geometry
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

  // Media/meta
  url: string | null
  original_logo?: string | null
  transparent_logo?: string | null
  smart_transparent_logo?: string | null
  original_logo_url?: string | null
  logo_name: string | null

  // Flags/status
  is_locked: 1 | 0
  is_vector?: boolean
  is_smart_transparent: boolean | null
  haveControls: boolean
  logos_follows_product?: 0 | 1
  is_replace_success: boolean

  // Bookkeeping
  logo_colors: LogoColor[]
  logo_technologies?: string[] | null
  logo_index: number
  created_at?: string
  updated_at?: string
}
