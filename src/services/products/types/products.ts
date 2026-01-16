import type { OutputProductColor } from './colors'
import type { OutputAddon, OutputCompanyAddon } from './addons'
import type { OutputProductLogosSetting, OutputProductLogoTechnology } from './logos'
import type { OutputProductPattern } from './patterns'
import type { OutputFont, OutputSize, OutputProductText } from './texts'

export type OutputProductPreview = {
  allowed_logos_count: number
  display_name: string
  id: number
  is_logo_allowed: number
  measurement_ratio: number
  product_id: number
  is_3d_product: number
  show_3d: number
  product_type: 'customized' | 'personalized'
}

export type OutputProductDesignCategory = {
  category_name: string
  created_at: string
  id: number
  updated_at: string
}

export type OutputProductDetails = OutputProductPreview & {
  allow_fixed_logo: number
  allow_name_number: number
  allow_extra_text: number
  company_id: number
  created_by: number
  deleted_at: string | null
  design_categories: OutputProductDesignCategory[]
  ecommerce_product_id: number | null
  factory_id: number | null
  is_cap_letter_available: number
  is_default: 1 | 0
  is_private: number
  parent_id: number | null
  preview_custom_texts: number
  shareable: number
  sku: {
    id: number
    addon_group_id: number | null
    data_container_id: number | null
    customized_sku_info: number | null
    sku_id: string
    sku_number: number
    design_customer_approval: number
    image_url: string | null
    specs_sheet_url: string | null
    sizechart_reference: string | null
    factory_id: number | null
    asana_task_template_id: number | null
    asana_task_template_id_reorder: number | null
    note: string | null
    minimum_order_quantity_type: 'by_design' | 'by_cart'
    minimum_order_quantity: number
    description: string | null
    reorder_follows_moq: number | null
    type: string | null
    is_selected: number | null
    production_days: number | null
    created_at: string | null
    updated_at: string | null
    deleted_at: string | null
    pattern_name: string | null
    is_default: number | null
    skucurrency: Array<{
      id: number
      code: string
      name: string
      symbol: string
      pivot: {
        sku_id: number
        currency_id: number
        price: number
        net_price: number
      }
    }>
    factory: any
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
  logo_technologies: Record<number, OutputProductLogoTechnology[]>
  logos_setting: OutputProductLogosSetting[]
  patterns: OutputProductPattern[]
  colors: OutputProductColor[]
  namecolors: OutputProductColor[]
  product_texts: OutputProductText[]
  namefonts: OutputFont[]
  sizes: OutputSize[]
  is_custom_color_allowed: boolean
}

export type ProductPreviewItem = {
  productPreview: OutputProductPreview
  stylePreview: import('./styles').OutputStylePreviewFront &
    import('./styles').OutputStylePreviewBack
  designPreview: import('./designs').OutputDesignPreviewFront &
    import('./designs').OutputDesignPreviewBack
}
