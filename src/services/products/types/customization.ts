export type APCustomizationText = import('./texts').OutputProductText
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
  gradient_colors?: Array<{ color: string; pantone: string; name: string }>
}

export type APCustomizationRosterEntry = {
  text: string
  number: string
  size: string
  quantity: number
  information: string
}

export type APCustomizationProductsRosters = Record<string, APCustomizationRosterEntry[]>

export type APCustomizationAddonsInfoEntry = {
  grouped_addons: Record<string, import('./addons').OutputAddon[]>
  ungrouped_addons: import('./addons').OutputAddon[]
  simple_addons: number[]
}

export type APCustomizationAddonsInfo = Record<string, APCustomizationAddonsInfoEntry>

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
  products_rosters: APCustomizationProductsRosters
  shuffle_color_number: number
  addons_info: APCustomizationAddonsInfo
  group_patterns: Record<string, unknown>
  sub_category_id: number | null
  sub_category_index: number | null
}
