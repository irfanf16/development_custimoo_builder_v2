export type OutputProductColor = {
  created_at: string
  created_by: number
  deleted_at: string | null
  file_name: string
  file_size: string
  file_type: string
  file_url: string
  id: number
  is_default: 1 | 0
  json_data: OutputColor[]
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

export type OutputColor = {
  position: number
  name: string
  value: string
}
