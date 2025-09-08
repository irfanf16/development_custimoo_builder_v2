import type { OutputProductColor } from './colors'
import type { OutputProductName } from './names'
import type { OutputAddon, OutputCompanyAddon } from './addons'
import type { OutputProductLogosSetting } from './logos'
import type { OutputProductPattern } from './patterns'

export type OutputProductPreview = {
  allowed_logos_count: number
  display_name: string
  id: number
  is_logo_allowed: number
  measurement_ratio: number
  product_id: number
  productnames: OutputProductName[]
}

export type OutputProductDetails = OutputProductPreview & {
  allow_fixed_logo: number
  allow_name_number: number
  company_id: number
  created_by: number
  deleted_at: string | null
  ecommerce_product_id: number | null
  factory_id: number | null
  is_3d_product: number
  is_cap_letter_available: number
  is_default: 1 | 0
  is_private: number
  parent_id: number | null
  preview_custom_texts: number
  shareable: number
  show_3d: number
  sku: {
    addon_group_id: number | null
    asana_task_template_id: number | null
    customized_sku_info: number | null
    data_container_id: number | null
    design_customer_approval: number
    factory_id: number | null
    id: number
    image_url: string | null
    sizechart_reference: string | null
    sku_id: string
    sku_number: number
    specs_sheet_url: string | null
    description?: string | null
  }
  sku_id: number
  sort_order: number
  step_completed: number
  svg_group_color_container: {
    [key: string]: {
      json_data: {
        name: string
        position: string
        value: string
      }[]
      name: string
    }
  }
  sync_id: number | null
  url_slug: string
  using_logo_colors: number
  product_addons: OutputAddon[]
  company_addons: OutputCompanyAddon[]
  active_addons: OutputAddon[]
  logos_setting: OutputProductLogosSetting[]
  patterns: OutputProductPattern[]
  colors: OutputProductColor[]
  namecolors: OutputProductColor[]
}

export type ProductPreviewItem = {
  productPreview: OutputProductPreview
  stylePreview: import('./styles').OutputStylePreview
  designPreview: import('./designs').OutputDesignPreview
}
