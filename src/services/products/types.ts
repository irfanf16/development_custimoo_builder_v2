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

export type OutputProductCustomLogo = {
  actualHeight: number
  actualWidth: number
  created_at: string
  deleted_at: string | null
  following_product_ids: number[] | null
  haveControls: boolean
  have_controls: boolean
  height: number
  id: number
  is_locked: number
  is_replace_success: boolean
  is_smart_transparent: boolean
  logo_colors: number[][]
  logo_index: number
  logo_name: string
  logo_technologies: null | string[]
  name_of_placement: string
  originalHeight: string
  originalWidth: string
  original_logo: string
  original_logo_url: string
  product_id: number
  product_style_id: number | null
  rotation: number
  side: 'front' | 'back'
  smart_transparent_logo: string
  transparent_logo: string
  updated_at: string
  url: string
  width: number
  x_axis: number
  x_axis_3d: number
  y_axis: number
  y_axis_3d: number
}

/*
  ProductCustomization
*/

type SvgGroup = {
  color: string
  count: number
  id: string
  name: string
  pantone?: string
}

type ProductPriceObject = {
  currency_code: string
  currency_symbol: string
  product_price: number
  quantity: number
}

type RosterFieldColor = {
  hex: string
  name: string
  pantone: string
}

type RosterFieldItem = {
  color: RosterFieldColor[]
  height: string
  height_px: number
  label: string
  original_height: number
  original_width: number
  outline_color: string
  outline_color_pantone: string
  outline_width: string
  placement: string
  rotation: string
  scaleX: number
  scaleY: number
  svg: string
  svg_height: string
  unit: string
  width: string
  width_px: number
}

type RosterField = {
  font_family: string
  items: RosterFieldItem[]
  label: string
  value: string
}

type ProductRosterRecord = {
  name: RosterField
  number: RosterField
  quantity: number
  size: string
}

type ProductCustomTextItem = {
  actualHeight: number
  actualWidth: number
  arc_text_allowed: boolean
  color: string
  color_pantone: string
  color_tab_index: number
  font_family: string
  height: number
  is_locked: boolean
  label: string
  originalHeight: string
  originalWidth: string
  outline_color: string
  outline_color_pantone: string
  outline_enabled: boolean
  outline_width: number | string
  outline_width_converted: string
  placement: string
  rotation: string
  scaleX: number
  scaleY: number
  selected: boolean
  width: number
  x_axis: string
  y_axis: string
}

type ProductCustomText = {
  active_item_index: number
  created_at: string | null
  deleted_at: string | null
  following_product_ids: number[]
  following_products: number[]
  font_family: string
  id: number
  is_first_name?: boolean
  is_first_number?: boolean
  items: ProductCustomTextItem[]
  label: string
  manually_added: boolean
  product_id: number
  type: string
  updated_at: string | null
  value: string
}

type ProductCustomTextObjects = {
  common: unknown[]
  roster: Record<string, ProductRosterRecord>
}

type ProductRosterDetail = {
  information: string
  number: string
  quantity: number
  size: string
  text: string
}

export type ActiveProductCustomization = {
  addons: OutputAddon[]
  back_image: string
  category_id: number | null
  colors: OutputProductColor[]
  common?: OutputProductCustomLogo[]
  custom_logo_svgs: unknown[]
  custom_logos: OutputProductCustomLogo[]
  defaultcolors: OutputProductColor[]
  design_id: number
  ecommerce_cart_id: string | null
  ecommerce_modifier_id: string
  ecommerce_post_id: string
  ecommerce_variant_id: string
  fixed_logo_index: number
  fixed_logos: unknown[]
  front_image: string
  group_patterns: Record<string, unknown>
  grouped_addons: Record<string, OutputAddon[]>
  groupcolors: Record<string, { color: string; name: string }>
  id: string
  is_custom_product: boolean
  logo_colors: unknown[]
  measurement_ratio: number
  minimum_order_quantity: number
  minimum_order_quantity_type: string
  pdf_file: string | null
  product_custom_text_objects: ProductCustomTextObjects
  product_custom_texts: ProductCustomText[]
  product_display_name: string
  product_id: number
  product_name: string
  product_price_object: ProductPriceObject
  product_roster_detail: ProductRosterDetail[]
  product_type: string
  production_url: string
  reorder_data: unknown | null
  shuffle_color_number: number
  size_variants_mapping: unknown | null
  sizechart_reference: string
  sku_number: number
  style_id: number
  style_name: string
  svg_groups: SvgGroup[]
  svg_parts: string[]
  svg_url: string
  sync_id: string
  ungrouped_addons: OutputAddon[]
}
