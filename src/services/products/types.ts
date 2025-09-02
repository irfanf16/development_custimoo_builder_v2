export type Category = {
  category_name: string
  company_id: number
  created_at: string
  deleted_at: string | null
  factory_id: number | null
  id: number
  image_url: string | null
  parent_id: number | null
  searchable: number
  sort_order: number
  subcategories: Category[]
  updated_at: string
}

export type OutputProductCategories = {
  customized: boolean
  customized_count: number
  data: Category[]
  no_product_found: boolean
  no_search_product_found: boolean
  personalized: boolean
  personalized_count: number
  private_product: boolean
  private_product_count: number
  product_category_id: number | null
  product_sub_category_id: number | null
}

export type GetProductCategoriesParams = {
  customized?: boolean
  private?: boolean
  personalized?: boolean
  product_id?: number
  share_url?: string
  sync_id?: number
  title?: string
}

export type getProductByCategoryIdParams = {
  category_id: number
  customized: boolean
  personalized: boolean
  private: boolean
}

export type OutputProductPreview = {
  allowed_logos_count: number
  colors: OutputProductColor[]
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
}

// OutputProductNames
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

// FullOutputProduct
type CustomizedAddons = {
  grouped_addons: Record<string, OutputAddon[]>
  ungrouped_addons: OutputAddon[]
}

// OutputProductStyle
export type OutputStylePreview = {
  front_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  id: number
  logo: unknown[]
  name: string
  product_id: number
  style_icon_url?: string
}

export type OutputStyleDetails = OutputStylePreview & {
  _3d_alpha_map: unknown
  _3d_ao_map: unknown
  _3d_metalness_map: unknown
  _3d_model: {
    composition: 'multiply' | 'screen' | null
    file_url: string
    id: number
    thumb_sm_url: string | null
    type: string
  }
  _3d_roughness_map: unknown
  _3d_texture: {
    composition: 'multiply' | 'screen' | null
    file_url: string
    id: number
    thumb_sm_url: string | null
    type: string
  }
  back_enabled: boolean
  back_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  composition: 'multiply' | 'screen'
  container_id: number
  created_at: string
  customized_addons: CustomizedAddons
  default_style: number
  deleted_at: string | null
  front_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  id: number
  is_default: 1 | 0
  is_fixed_logos_all: boolean
  logo: unknown[]
  logo_technologies: unknown[]
  metalness: number | null
  name: string
  product_id: number
  roughness: number | null
  style_icon: number
  style_icon_id: number | null
  style_icon_url: string
  updated_at: string
}

// Color

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

// Name Fonts
export type OutputProductNameFont = {
  file_url: string
  json_data: {
    extension: string
    name: string
    path: string
  }[]
}

// Size

export type OutputProductSize = {
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

export type OutputDesignPreview = {
  id: number
  is_default: 1 | 0
  front_design: {
    color_group: string | null
    design_name: string
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  }
  frontsafezone_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  frontboundary_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  svg_parts: string[]
}

export type OutputDesignDetails = OutputDesignPreview & {
  back_design: {
    color_group: string | null
    design_name: string
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  }
  backboundary_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  backsafezone_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  container_file_id: number
  created_at: string
  deleted_at: string | null
  design_name: string
  design_show: number
  design_show_on_scroll: number
  front_design_id: number
  back_design_id?: number
  frontsafezone_design_id?: number
  frontboundary_design_id?: number
  backsafezone_design_id?: number
  backboundary_design_id?: number
  is_active: number
  production_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    file_id?: number
    container_id?: number
    design_name?: string
    color_group?: string
    file_name?: string
    svg_parts?: string[]
    id: number
  }
  production_design_id: number
  productionsafezone_design: {
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  } | null
  productionsafezone_design_id: number | null
  product_id: number
  product_style_id: number
  updated_at: string
}

// Lightweight preview item used for listing products in a category
export type ProductPreviewItem = {
  productPreview: OutputProductPreview
  stylePreview: OutputStylePreview
  designPreview: OutputDesignPreview
}

// Full details for the currently active product
export type ActiveProductDetails = {
  productDetails: OutputProductDetails
  styleDetails: OutputStyleDetails
  designDetails: OutputDesignDetails
}

export type ActiveStyleDetails = {
  styleDetails: OutputStyleDetails
  designDetails: OutputDesignDetails
}

export type ActiveDesignDetails = {
  designDetails: OutputDesignDetails
}

// Recently uploaded logos
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

export type OutputCompanyAddon = {
  id: number
  addon_data: {
    currencies: {
      code: string
      name: string
      price: number
      symbol: string
    }[]
    description: string
    note: string | null
    title: string
  }
  addon_ecommerce_modifier_id: number | null
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_id: number
  addon_sync_id: number | null
  company_id: number
  created_at: string
  deleted_at: string | null
  updated_at: string
}

// Also active_addons []
export type OutputAddon = {
  addon_ecommerce_modifier_id: number | null
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_group_id: number | null
  addon_id: number
  currencies: {
    code: string
    name: string
    price: number
    symbol: string
  }[]
  customized_sku_info: number | null
  data_container_id: number | null
  description: string
  note: string | null
  published: boolean
  selected: boolean
  title: string
}

/*
  Product Customization (updated to match last-active-product-data.json)
*/

export type APCustomizationTextItem = {
  label: string
  height: number | string
  x_axis: number | string
  y_axis: number | string
  rotation: number | string
  is_locked: boolean
  placement: string
  outline_enabled: boolean | number
  arc_text_allowed: boolean | number
  font_family: string
  color: string | null
  color_pantone: string
  outline_width: number
  outline_width_converted: number | string
  color_tab_index: number
  outline_color: string | null
  outline_color_pantone: string
  selected: boolean
  scaleX: number
  scaleY: number
  width?: number
  actualWidth?: number
  actualHeight?: number
  originalWidth?: string | number
  originalHeight?: string | number
  x_axis_3d?: number
  y_axis_3d?: number
}

export type APCustomizationText = {
  id: number | null
  product_id: number
  type: string
  label: string
  following_products: unknown[]
  items: APCustomizationTextItem[]
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  value: string
  manually_added: boolean
  font_family: string
  following_product_ids: number[]
  active_item_index: number
  is_first_name?: boolean
  is_first_number?: boolean
}

export type APCustomizationTextsMap = Record<string, APCustomizationText[]>

export type APCustomizationLogoColor =
  | number[]
  | { hex: string | null; pantone: string | null; name: string | null }

export type APCustomizationLogo = {
  id: number
  product_id: number
  product_style_id: number | null
  following_product_ids: number[] | null
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
  is_locked: number
  logo_name: string
  original_logo?: string
  transparent_logo?: string
  smart_transparent_logo?: string
  original_logo_url?: string
  is_smart_transparent: boolean
  url: string
  haveControls: boolean
  logo_colors: APCustomizationLogoColor[]
  is_replace_success: boolean
  logo_index: number
  is_vector?: boolean
  logos_follows_product?: number
  logo_technologies?: null | string[]
  created_at?: string
  updated_at?: string
  is_recent_logo?: boolean
  actualWidth?: number
  actualHeight?: number
  scaleX?: number
  scaleY?: number
}

export type APCustomizationLogosMap = Record<string, APCustomizationLogo[]>

export type APCustomizationDefaultColor = {
  color: string | null
  pantone: string | null
  name: string | null
}

export type APCustomizationGroupColor = {
  color: string | null
  name: string | null
}

export type APCustomizationRosterEntry = {
  text: string
  number: string
  size: string
  quantity: number
  information: string
}

export type APCustomizationProductsRosters = Record<
  string,
  APCustomizationRosterEntry[]
>

export type APCustomizationAddonsInfoEntry = {
  grouped_addons: Record<string, unknown>
  ungrouped_addons: unknown[]
  simple_addons: number[]
}

export type APCustomizationAddonsInfo = Record<
  string,
  APCustomizationAddonsInfoEntry
>

export type ActiveProductCustomization = {
  fixed_logo_index: number
  category_index: number
  category_id: number
  design_index: number
  design_id: number
  product_index: number
  product_id: string
  search_products: string
  style_index: number
  style_id: number
  page_no: number
  customized: boolean
  personalized: boolean
  private_product: boolean
  product_custom_texts: APCustomizationTextsMap
  custom_logos: APCustomizationLogosMap
  default_colors: APCustomizationDefaultColor[]
  group_colors: Record<string, APCustomizationGroupColor>
  logo_colors: unknown[]
  roster_detail: APCustomizationRosterEntry[]
  products_rosters: APCustomizationProductsRosters
  shuffle_color_number: number
  addons_info: APCustomizationAddonsInfo
  group_patterns: Record<string, unknown>
  sub_category_id: number | null
  sub_category_index: number | null
}
