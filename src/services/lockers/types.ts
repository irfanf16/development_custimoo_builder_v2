export interface LockerResponse<T> {
  data: T;
}

export interface LockerUpdatePayload {
  room_name: string;
  id: number;
}

export interface LockerDeletionResponse {
  message?: string;
  errors?: string[]
}

export interface Locker {
  id: number;
  room_name: string;
  products: string[];
  product_count: number;
  customer_id: number
  company_id: number;
  have_yearly_planner: number
  deleted_at: any
  created_at: string
  updated_at: string
  active_tab: boolean
  product: LockerProduct[]
  folders: Folder[]
  logos: Logo[]
  collection: Collection2
  contacts: Contact[]
  details_fetched: boolean;
}

export interface LockerCollection {
  id: number;
  room_id: number;
}

export interface LockerProduct {
  id: number
  company_id: number
  customer_id: number
  room_id: number
  design_id: number
  product_id: number
  model_id?: number
  product_name: string
  random_string: string
  style_id: number
  product_roster_detail?: ProductRosterDetail[]
  colors: string
  defaultcolors: string
  groupcolors: string
  custom_logos: string
  text: Text[]
  product_attribute?: string
  product_url: string
  product_front_url: string
  product_back_url: string
  is_back_img: number
  svg_parts: any
  product_type: string
  is_private: number
  name: string
  description: string
  price: number
  roster_count: number
  roster_total_quantity: number
  disable_style: boolean
  collections_details: CollectionsDetail[]
  shared_url?: string
  company_product: CompanyProduct
  design?: Design
  style: Style
  product: Product2
  collections: Collection[]
  shared_product: SharedProduct[]
}

export interface ProductRosterDetail {
  code?: string
  size: string
  text?: string
  number?: string
  quantity: any
  size_index: any
  information: any
}

export interface Text {
  id: number
  type: string
  items: Item[]
  label: string
  value?: string
  created_at: any
  deleted_at: any
  product_id: number
  updated_at: any
  font_family: string
  is_first_name?: boolean
  manually_added: boolean
  active_item_index: number
  following_products: any[]
  following_product_ids: any[]
  is_first_number?: boolean
}

export interface Item {
  color: string
  label: string
  width?: number
  height: number
  scaleX?: number
  scaleY?: number
  x_axis: any
  y_axis: any
  rotation: any
  selected: boolean
  is_locked: boolean
  placement: string
  font_family: string
  color_pantone: string
  outline_color: string
  outline_width: any
  color_tab_index: number
  outline_enabled: any
  arc_text_allowed: any
  outline_color_pantone: string
  originalWidth?: string
  originalHeight?: string
  outline_width_converted?: number
}

export interface CollectionsDetail {
  id: number
  name: string
  laravel_through_key: number
}

export interface CompanyProduct {
  product_id: number
  custom_skus: CustomSkus
  laravel_through_key: number
}

export interface CustomSkus {
  moq: any
  title: string
  prices: Price[]
  moq_type: string
  size_chart: string
  description: string
  current_title: string
  is_custom_moq: boolean
  size_reference: string
  is_custom_title: boolean
  is_custom_prices: boolean
  is_custom_size_chart: boolean
  is_custom_description: boolean
  is_custom_size_reference: boolean
  is_custom_addons?: boolean
}

export interface Price {
  id: number
  code: string
  name: string
  price: string
  value: any
  symbol: string
  created_at: string
  updated_at: string
}

export interface Design {
  id: number
  product_style_id: number
  front_design_id: number
  back_design_id: number
  production_design_id?: number
  design_name: string
  back_design_count: number
  front_design: FrontDesign
  back_design: BackDesign
  production_design?: ProductionDesign
}

export interface FrontDesign {
  id: number
  design_name: string
  design_position: string
  color_group?: string
  file_url: string
  file_extension: string
  file_base_url: string
  file_thumbnail_url: string
}

export interface BackDesign {
  id: number
  design_name: string
  design_position: string
  color_group?: string
  file_url: string
  file_extension: string
  file_base_url: string
  file_thumbnail_url: string
}

export interface ProductionDesign {
  id: number
  design_name: string
  design_position: string
  color_group: string
  file_url: string
  file_extension: string
  file_base_url: string
  file_thumbnail_url: string
}

export interface Style {
  id: number
  product_id: number
  name: string
  back_enabled: boolean
  composition: string
  default_style: number
  style_icon_id: any
  style_icon: any
  created_at: string
  updated_at: string
  deleted_at: any
}

export interface Product2 {
  id: number
  parent_id: any
  factory_id?: number
  company_id: any
  is_default: number
  sku_id: number
  sync_id: any
  ecommerce_product_id: any
  sync_on_install: number
  url_slug: string
  product_type: string
  svg_group_color_container?: any[]
  created_by: number
  measurement_ratio: number
  is_private: number
  step_completed: number
  allowed_logos_count: number
  is_logo_allowed: number
  allow_name_number: number
  preview_custom_texts: number
  allow_fixed_logo: number
  created_at: string
  updated_at: string
  is_custom_color_allowed: number
  allow_extra_text: number
  is_cap_letter_available: number
  shareable: number
  is_3d_product: number
  sort_order: number
  deleted_at: any
  sku: Sku
  addons: Addon[]
  ecommerceproduct: Ecommerceproduct[]
}

export interface Sku {
  id: number
  addon_group_id: any
  data_container_id: any
  customized_sku_info: any
  sku_id: string
  sku_number: number
  design_customer_approval: number
  image_url: any
  specs_sheet_url: any
  sizechart_reference: any
  factory_id?: number
  asana_task_template_id?: string
  asana_task_template_id_reorder?: string
  note: any
  minimum_order_quantity_type: string
  minimum_order_quantity?: number
  description: string
  reorder_follows_moq: number
  type: string
  is_selected: any
  production_days: any
  created_at: string
  updated_at: string
  deleted_at: any
  pattern_name?: string
  skucurrency: Skucurrency[]
}

export interface Skucurrency {
  id: number
  symbol: string
  name: string
  code: string
  value: any
  created_at: string
  updated_at: string
  pivot: Pivot
}

export interface Pivot {
  sku_id: number
  currency_id: number
  price?: number
  net_price: any
}

export interface Addon {
  id: number
  addon_group_id: any
  data_container_id: any
  customized_sku_info: any
  sku_id: string
  sku_number: number
  design_customer_approval: number
  image_url: any
  specs_sheet_url: any
  sizechart_reference: any
  factory_id?: number
  asana_task_template_id: any
  asana_task_template_id_reorder: any
  note?: string
  minimum_order_quantity_type: string
  minimum_order_quantity: number
  description: string
  reorder_follows_moq: number
  type: string
  is_selected: number
  production_days: any
  created_at: string
  updated_at: string
  deleted_at: any
  pattern_name: any
  pivot: Pivot2
  skucurrency: Skucurrency2[]
}

export interface Pivot2 {
  product_id: number
  addon_id: number
}

export interface Skucurrency2 {
  id: number
  code: string
  name: string
  symbol: string
  pivot: Pivot3
}

export interface Pivot3 {
  sku_id: number
  currency_id: number
  price?: number
  net_price: any
}

export interface Ecommerceproduct {
  id: number
  company_id: number
  product_id: number
  sync_id: string
  ecommerce_product_id: string
  ecommerce_variant_id: string
  ecommerce_modifier_id?: string
  size_variants: any
  created_at: string
  updated_at: string
}

export interface Collection {
  id: number
  name: string
  laravel_through_key: number
}

export interface SharedProduct {
  id: number
  shared_url: string
  product_locker_id: number
  collection_id: any
  status: string
  created_at: string
  updated_at: string
  deleted_at: any
}

export interface Folder {
  id: number
  folder_name: string
  room_id: number
  color: string
  created_at: string
  updated_at: string
  deleted_at: any
}

export interface Logo {
  id: number
  company_id: number
  product_id: number
  is_vector: number
  logo_name: string
  logo_url: string
  transparent_logo_url: string
  smart_transparent_logo_url: string
  original_logo_url: string
  original_png?: string
  browser_key: string
  logo_colors: number[][]
  recent_delete: number
  laravel_through_key: number
}

export interface Collection2 {
  id: number
  name: string
  link: string
  pdf_link: any
  random_string: any
  file_name: string
  company_id: number
  customer_id: number
  room_id: number
  ecommerce_collection_id: any
  is_exporting: number
  created_at: string
  updated_at: string
  deleted_at: any
}

export interface Contact {
  id: number
  room_id: number
  email: string
}

export interface Colour {
  name: string
  value: string
}

