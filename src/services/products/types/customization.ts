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
  following_products: number[]
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

export type APCustomizationLogo = import('@/services/logos/types').CustomLogo
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
  grouped_addons: Record<string, import('./addons').OutputAddon[]>
  ungrouped_addons: import('./addons').OutputAddon[]
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
  design_name: string
  product_index: number
  product_id: number
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
  logo_colors: import('@/services/types').LogoColor[]
  roster_detail: APCustomizationRosterEntry[]
  products_rosters: APCustomizationProductsRosters
  shuffle_color_number: number
  addons_info: APCustomizationAddonsInfo
  group_patterns: Record<string, unknown>
  sub_category_id: number | null
  sub_category_index: number | null
}
