import type { LockerPayloadJsonValue } from '@/services/lockers/types'
import type {
  APCustomizationAddonsInfo,
  APCustomizationDefaultColor,
  APCustomizationGroupColor,
  APCustomizationLogosMap
} from './customization'
import type { OutputProductText } from './texts'
import type { SvgGroup } from '@/services/cart/types'

/**
 * Product roster detail entry
 */
export interface ProductRosterDetail {
  code?: string
  size: string
  text?: string
  number?: string
  quantity: number
  size_index: number
  information: string
}

/**
 * Common product identifier fields shared between product catalog (OutputProductDetails)
 * and customized product instances (BaseProduct)
 */
export interface ProductBase {
  product_id: number
}

/**
 * Base product interface containing all common fields shared across
 * different product contexts (Cart, Locker, Share Design)
 *
 * This represents a customized product instance with selected style, design,
 * colors, logos, and text customizations.
 *
 * Note: Some fields are optional to accommodate different product contexts
 * where not all fields may be populated
 */
export interface BaseProduct extends ProductBase {
  product_name: string
  svg_parts: string[]
  svg_groups: SvgGroup[]
  style_id: number
  design_id: number
  custom_logos:
    | APCustomizationLogosMap
    | Array<import('@/services/logos/types').CustomLogo>
    | string
    | null
  text?: OutputProductText[] | string | null
  product_custom_text?: OutputProductText[] | string | null
  shuffle_color_number: number
  defaultcolors: APCustomizationDefaultColor[] | string | null
  groupcolors: Record<string, APCustomizationGroupColor> | string | null
  front_image?: string
  locker_front_png?: string
  back_image?: string
  locker_back_png?: string
  product_roster_detail?: ProductRosterDetail[] | null
  fixed_logo_index: number
  svgcolors?: unknown[]
  group_patterns: Record<string, unknown>
  colors?: unknown
  grouped_addons: Array<{ id: number; name: string; [key: string]: unknown }>
  ungrouped_addons: Array<{ id: number; name: string; [key: string]: unknown }>
  category_id?: number
  sub_category_id?: number | null
}

/**
 * Share Design product extension
 * Adds fields specific to shared/design products
 */
export interface ShareDesignProduct extends BaseProduct {
  roster_url: string
  room_id: number | null
  rand_string: string
}

/**
 * Share Design payload interface for API requests
 * Contains all required fields for sharing a design
 * Note: Many fields are JSON-stringified for API compatibility
 */
export interface ShareDesignPayload {
  addons: APCustomizationAddonsInfo
  roster_url: string
  product_id: number
  product_name: string
  svg_parts: LockerPayloadJsonValue
  style_id: number
  design_id: number
  custom_logos: LockerPayloadJsonValue
  text: LockerPayloadJsonValue
  colors: LockerPayloadJsonValue
  shuffle_color_number: number
  defaultcolors: LockerPayloadJsonValue
  groupcolors: LockerPayloadJsonValue
  front_image: string
  back_image: string
  product_roster_detail: LockerPayloadJsonValue
  fixed_logo_index: number
  svgcolors: LockerPayloadJsonValue
  grouped_addons: LockerPayloadJsonValue
  ungrouped_addons: LockerPayloadJsonValue
  group_patterns: LockerPayloadJsonValue
  rand_string: string
  room_id: number | null
  category_id?: number
  sub_category_id?: number | null
}

/**
 * Cart product extension
 * Adds fields specific to cart products
 */
export interface CartProduct extends BaseProduct {
  product_type: string
  product_custom_text_object: {
    common: unknown[]
    roster: ProductRosterDetail[]
  }
  custom_logo_svgs: unknown[]
  id: string | number
}

/**
 * Locker product extension
 * Adds fields specific to locker room products
 */
export interface LockerProductExtension extends BaseProduct {
  roster_url: string
  room_id: number
  locker_id: number
}
