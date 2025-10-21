export type OutputTextItem = {
  label: string
  height: string
  x_axis: string
  y_axis: string
  rotation: string
  is_locked: boolean
  placement: 'Front' | 'Back'
  outline_enabled: boolean
  arc_text_allowed: boolean
}

export type OutputText = {
  id: number
  product_id: number
  type: string
  label: string
  following_products: number[]
  items: OutputTextItem[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type OutputFontFile = {
  name: string
  path: string
  extension: string
}

export type OutputFontPivot = {
  product_id: number
  file_id: number
  created_at: string
  updated_at: string
}

export type OutputFont = {
  file_url: string
  json_data: OutputFontFile[]
  file_name: string
  pivot: OutputFontPivot
}

export type OutputProductName = {
  id: number
  product_id: number
  x_axis: number
  y_axis: number
  rotation: number
  width: number | null
  height: number | null
  name_of_placement: string
  side: 'front' | 'back'
  type: 'name' | 'number'
  arc_text_allowed: 0 | 1
  outline_enabled: 0 | 1
  is_locked: 0 | 1
  text_follows_product: 0 | 1
  following_product_ids: number[] | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type OutputSizeJsonDataItem = {
  name: string
}

export type OutputSizePivot = {
  product_id: number
  file_id: number
  created_at: string
  updated_at: string
}

export type OutputSize = {
  id: number
  created_by: number
  file_size: string
  json_data: OutputSizeJsonDataItem[]
  file_name: string
  file_type: string
  is_default: number
  file_url: string
  original_file_url: string | null
  thumb_sm_url: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  sourceable_type: string
  sourceable_id: number
  pivot: OutputSizePivot
}
