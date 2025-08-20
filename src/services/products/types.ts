export type Category = {
  id: number
  parent_id: number | null
  category_name: string
  factory_id: number | null
  company_id: number
  image_url: string | null
  searchable: number
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  subcategories: Category[]
}

export type OutputProductCategories = {
  no_product_found: boolean
  no_search_product_found: boolean
  product_category_id: number | null
  product_sub_category_id: number | null
  data: Category[]
  customized_count: number
  personalized_count: number
  private_product_count: number
  customized: boolean
  personalized: boolean
  private_product: boolean
}

export type GetProductCategoriesParams = {
  product_id?: number
  customized?: boolean
  personalized?: boolean
  private?: boolean
  title?: string
  sync_id?: number
  share_url?: string
}

export type GetProductCategoriesByCategoryIdParams = {
  category_id: number
  customized: boolean
  personalized: boolean
  private: boolean
}

export type OutputProduct = {
  id: number
  parent_id: number | null
  factory_id: number | null
  company_id: number
  is_default: 1 | 0
  sku_id: number
  sync_id: number | null
  ecommerce_product_id: number | null
  url_slug: string
  product_type: string
  svg_group_color_container: {
    [key: string]: {
      name: string
      json_data: {
        name: string
        value: string
        position: string
      }[]
    }
  }
  created_by: number
  measurement_ratio: number
  is_private: number
  step_completed: number
  allowed_logos_count: number
  is_logo_allowed: number
  allow_name_number: number
  preview_custom_texts: number
  allow_fixed_logo: number
  is_cap_letter_available: number
  shareable: number
  is_3d_product: number
  deleted_at: string | null
  product_id: number
  using_logo_colors: number
  show_3d: number
  display_name: string
  sort_order: number
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
  }
}

// OutputProduct contains company_addons OutputCompanyAddon[], active_addons OutputAddon[], product_addons OutputAddon[], productstyles OutputProductStyle[]

// FullOutputProduct
type CustomizedAddons = {
  grouped_addons: Record<string, OutputAddon[]>
  ungrouped_addons: OutputAddon[]
}

type OutputProductStyleWithDetails = OutputProductStyle & {
  customized_addons: CustomizedAddons
  productdesigns: OutputProductStyleDesign[]
}

export type FullOutputProduct = OutputProduct & {
  active_addons: OutputAddon[]
  product_addons: OutputAddon[]
  company_addons: OutputCompanyAddon[] // If company_addons are present, ignore product_addons
  productstyles: OutputProductStyleWithDetails[]
  logo_technologies: unknown[]
  colors: OutputProductColor[]
  namefonts: OutputProductNameFont[]
  namecolors: OutputProductNameColor[]
  sizes: OutputProductSize[]
  ecommerceproduct: number | [] | null
}

// OutputProductStyle

export type OutputProductStyle = {
  id: number
  product_id: number
  name: string
  back_enabled: boolean
  composition: 'multiply' | 'screen'
  default_style: number
  style_icon_id: number | null
  style_icon: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  container_id: number
  style_icon_url: string
  is_fixed_logos_all: boolean
  logo: unknown[]
  front_models: {
    id: number
    file_url: string
    thumb_sm_url: string
    composition: 'multiply' | 'screen'
    type: string
  }[]
  back_models: {
    id: number
    file_url: string
    thumb_sm_url: string
    composition: 'multiply' | 'screen'
    type: string
  }[]
  _3d_model: {
    id: number
    file_url: string
    thumb_sm_url: string | null
    composition: 'multiply' | 'screen' | null
    type: string
  }
  _3d_texture: {
    id: number
    file_url: string
    thumb_sm_url: string | null
    composition: 'multiply' | 'screen' | null
    type: string
  }
  roughness: number | null
  metalness: number | null
  _3d_roughness_map: unknown
  _3d_metalness_map: unknown
  _3d_ao_map: unknown
  _3d_alpha_map: unknown
  is_default: 1 | 0
}

// Color

export type OutputProductColor = {
  id: number
  created_by: number
  file_size: string
  json_data: {
    name: string
    value: string
    position: string
  }[]
  file_name: string
  file_type: string
  is_default: 1 | 0
  file_url: string
  original_file_url: string | null
  thumb_sm_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  sourceable_type: string
  sourceable_id: number
  pivot: {
    product_id: number
    file_id: number
    created_at: string
    updated_at: string
  }
}

// Name Fonts
export type OutputProductNameFont = {
  file_url: string
  json_data: {
    name: string
    path: string
    extension: string
  }[]
}

// Size

export type OutputProductSize = {
  id: number
  created_by: number
  file_size: string
  json_data: {
    name: string
    value: string
    position: string
  }[]
  file_name: string
  file_type: string
  is_default: 1 | 0
  file_url: string
  original_file_url: string | null
  thumb_sm_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  sourceable_type: string
  sourceable_id: number
  pivot: {
    product_id: number
    file_id: number
    created_at: string
    updated_at: string
  }
}

export type OutputProductNameColor = {
  id: number
  created_by: number
  file_size: string
  json_data: {
    name: string
    value: string
    position: string
  }[]
  file_name: string
  file_type: string
  is_default: 1 | 0
  file_url: string
  original_file_url: string | null
  thumb_sm_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  sourceable_type: string
  sourceable_id: number
  pivot: {
    product_id: number
    file_id: number
    created_at: string
    updated_at: string
  }
}

export type OutputProductStyleDesign = {
  id: number
  product_style_id: number
  product_id: number
  front_design_id: number
  container_file_id: number
  back_design_id: number
  production_design_id: number
  frontsafezone_design_id: number
  backsafezone_design_id: number
  productionsafezone_design_id: number | null
  frontboundary_design_id: number
  backboundary_design_id: number
  design_name: string
  is_active: number
  is_default: 1 | 0
  svg_parts: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  design_show: number
  design_show_on_scroll: number
  front_design: {
    id: number
    design_name: string
    design_position: string
    color_group: string | null
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  back_design: {
    id: number
    design_name: string
    design_position: string
    color_group: string | null
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  frontsafezone_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  backsafezone_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  productionsafezone_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  frontboundary_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  backboundary_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
  production_design: {
    id: number
    design_position: string
    file_url: string
    file_extension: string
    file_base_url: string
    file_thumbnail_url: string
  }
}

export type OutputCompanyAddon = {
  id: number
  company_id: number
  addon_id: number
  addon_sync_id: number | null
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_ecommerce_modifier_id: number | null
  addon_data: {
    note: string | null
    title: string
    currencies: {
      code: string
      name: string
      price: number
      symbol: string
    }[]
    description: string
  }
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Also active_addons []
export type OutputAddon = {
  addon_group_id: number | null
  data_container_id: number | null
  customized_sku_info: number | null
  addon_id: number
  title: string
  description: string
  note: string | null
  currencies: {
    name: string
    code: string
    symbol: string
    price: number
  }[]
  selected: boolean
  published: boolean
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_ecommerce_modifier_id: number | null
}

type OutputProductCustomLogo = {
  id: number
  product_id: number
  product_style_id: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  following_product_ids: number[] | null
  rotation: number
  originalWidth: string
  originalHeight: string
  actualWidth: number
  actualHeight: number
  width: number
  height: number
  name_of_placement: string
  x_axis_3d: number
  y_axis_3d: number
  x_axis: number
  y_axis: number
  is_locked: number
  is_replace_success: boolean
  is_smart_transparent: boolean
  logo_name: string
  logo_index: number
  logo_technologies: null | string[]
  original_logo: string
  transparent_logo: string
  logos_follows_product: 1 | 0
  smart_transparent_logo: string
  original_logo_url: string
  url: string
  haveControls: boolean
  logo_colors: number[][]
  side: 'front' | 'back'
  have_controls: boolean
}

/*
  ProductCustomization
*/

type SvgGroup = {
  id: string
  color: string
  count: number
  pantone?: string
  name: string
}

type ProductPriceObject = {
  product_price: number
  currency_code: string
  currency_symbol: string
  quantity: number
}

type RosterFieldColor = {
  hex: string
  name: string
  pantone: string
}

type RosterFieldItem = {
  label: string
  placement: string
  width: string
  height: string
  unit: string
  svg: string
  color: RosterFieldColor[]
  svg_height: string
  outline_color: string
  outline_color_pantone: string
  original_height: number
  original_width: number
  outline_width: string
  rotation: string
  scaleX: number
  scaleY: number
  width_px: number
  height_px: number
}

type RosterField = {
  label: string
  value: string
  font_family: string
  items: RosterFieldItem[]
}

type ProductRosterRecord = {
  size: string
  quantity: number
  name: RosterField
  number: RosterField
}

type ProductCustomTextItem = {
  label: string
  height: number
  x_axis: string
  y_axis: string
  rotation: string
  is_locked: boolean
  placement: string
  outline_enabled: boolean
  arc_text_allowed: boolean
  font_family: string
  color: string
  color_pantone: string
  outline_width: number | string
  outline_width_converted: string
  color_tab_index: number
  outline_color: string
  outline_color_pantone: string
  selected: boolean
  scaleX: number
  scaleY: number
  width: number
  actualWidth: number
  actualHeight: number
  originalWidth: string
  originalHeight: string
}

type ProductCustomText = {
  id: number
  product_id: number
  type: string
  label: string
  following_products: number[]
  items: ProductCustomTextItem[]
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

type ProductCustomTextObjects = {
  roster: Record<string, ProductRosterRecord>
  common: unknown[]
}

type ProductRosterDetail = {
  text: string
  number: string
  size: string
  quantity: number
  information: string
}

export type ProductCustomization = {
  back_image: string
  custom_logos: OutputProductCustomLogo[]
  colors: OutputProductColor[]
  design_id: number
  defaultcolors: OutputProductColor[]
  front_image: string
  fixed_logo_index: number
  measurement_ratio: number
  custom_logo_svgs: unknown[]
  product_custom_texts: ProductCustomText[]
  product_custom_text_objects: ProductCustomTextObjects
  groupcolors: Record<string, { color: string; name: string }>
  logo_colors: unknown[]
  sku_number: number
  sizechart_reference: string
  minimum_order_quantity: number
  minimum_order_quantity_type: string
  product_id: number
  ecommerce_post_id: string
  ecommerce_variant_id: string
  ecommerce_modifier_id: string
  sync_id: string
  size_variants_mapping: unknown | null
  product_type: string
  product_name: string
  product_display_name: string
  pdf_file: string | null
  production_url: string
  product_roster_detail: ProductRosterDetail[]
  style_id: number
  style_name: string
  addons: OutputAddon[]
  product_price_object: ProductPriceObject
  svg_groups: SvgGroup[]
  svg_parts: string[]
  shuffle_color_number: number
  ecommerce_cart_id: string | null
  reorder_data: unknown | null
  is_custom_product: boolean
  grouped_addons: Record<string, OutputAddon[]>
  ungrouped_addons: OutputAddon[]
  group_patterns: Record<string, unknown>
  fixed_logos: unknown[]
  id: string
  svg_url: string
  common?: OutputProductCustomLogo[]
}
