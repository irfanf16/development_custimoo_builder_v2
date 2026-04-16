// Types generated from the product_texts object

export type OutputProductTextItem = {
  label: string
  height: string
  /** Placement width string (optional; defaults to height in UI when missing) */
  width?: string
  /** Sizing panel width (user units); persisted from canvas / orders / share */
  originalWidth?: string | number
  /** Sizing panel height (user units); persisted from canvas / orders / share */
  originalHeight?: string | number
  x_axis: string
  y_axis: string
  rotation: string
  is_locked: boolean
  placement: 'Front' | 'Back'
  outline_enabled: boolean
  arc_text_allowed: boolean
  font_family: string
  color: string
  color_pantone: string
  outline_width: number
  outline_width_converted: number
  color_tab_index: number
  outline_color: string
  outline_color_pantone: string
  selected: boolean
  scaleX: number
  scaleY: number
  /** When true, text cannot be moved on canvas (pin control). */
  pinned?: boolean
}

export type OutputProductText = {
  id: number
  product_id: number
  type: 'name' | 'number' | 'team_name'
  label: string
  placeholder?: string | null
  following_products: number[]
  items: OutputProductTextItem[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  value: string
  manually_added: boolean
  font_family: string
  following_product_ids: number[]
  active_item_index: number
  is_first_name?: boolean // present only on name type
  is_first_number?: boolean // present only on number type
  is_default?: boolean
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
  preview_url?: string
  pivot: OutputFontPivot
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
