import type { LogoPlacementBase } from '@/services/types'
import type { LogoColor } from '@/services/types'

export type OutputProductLogosSetting = LogoPlacementBase & {
  // Refinements for products API shape
  originalWidth: number // products API guarantees numbers
  originalHeight: number
  logo_colors: any[]
  logo_technologies: string[] | null
  logo_name: string | null
  is_locked: 0 | 1
  logos_follows_product: 0 | 1
  created_at: string
  updated_at: string
  length: number
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
  logo_colors: LogoColor[]
  recent_delete: number
  url: string
}
