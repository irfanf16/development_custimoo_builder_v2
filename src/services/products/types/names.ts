export type OutputProductName = {
  arc_text_allowed: 0 | 1
  created_at: string
  deleted_at: string | null
  following_product_ids: number[] | null
  height: number
  id: number
  is_locked: 0 | 1
  name_of_placement: string
  outline_enabled: 0 | 1
  product_id: number
  rotation: number
  side: 'front' | 'back'
  text_follows_product: 0 | 1
  type: 'name'
  updated_at: string
  width: number | null
  x_axis: number
  y_axis: number
}

export type OutputProductNameFont = {
  file_url: string
  json_data: {
    extension: string
    name: string
    path: string
  }[]
}

export type OutputProductNameColor = {
  created_at: string
  created_by: number
  deleted_at: string | null
  file_name: string
  file_size: string
  file_type: string
  file_url: string
  id: number
  is_default: 1 | 0
  json_data: {
    name: string
    position: string
    value: string
  }[]
  original_file_url: string | null
  pivot: {
    created_at: string
    file_id: number
    product_id: number
    updated_at: string
  }
  sourceable_id: number
  sourceable_type: string
  thumb_sm_url: string | null
  updated_at: string
}
