export type Logo = {
  id: number
  customer_id?: number
  company_id?: number
  product_id?: number
  logo_name: string
  logo_url: string
  transparent_logo_url?: string
  smart_transparent_logo_url?: string
  original_logo_url?: string
  browser_key?: string
  logo_colors?: any // This is cast as array in the model
  recent_delete: number
  // Additional computed properties added in the transform
  is_vector: boolean
  url: string // This is set to logo_url in the transform
}

export type OutputRecentLogos = {
  data: Logo[]
  message: string
}
