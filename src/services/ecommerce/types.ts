/**
 * Ecommerce Cart Service Types
 *
 * Shared types and interfaces for ecommerce platform cart synchronization
 */

/**
 * Cart item data for ecommerce platforms
 */
export interface EcommerceCartItem {
  id: string | number
  quantity: number
  properties?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Addon data for ecommerce platforms
 */
export interface EcommerceAddon {
  id: string | number
  quantity: number
  properties?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Result from adding/updating addons
 */
export interface EcommerceAddonResult {
  addons: EcommerceAddon[]
}

/**
 * Configuration for processing cart items
 */
export interface ProcessCartItemConfig {
  cartProduct: Record<string, unknown>
  custimooCartItem: {
    new_created_id: number | string
    cart_item_key: string
    front_image_url: string
    back_image_url: string
    front_image_short: string
    back_image_short: string
  }
  productEditInfo?: {
    cart_product_info?: {
      ecommerce_cart_id?: string
      shopify_line_item?: string | number
    }
  }
  collectionView?: boolean
  merchantMoq?: number
  companyDomain: string
  customizerPageUrl?: string
  deleteCartItemUrl: string
}

/**
 * Result from processing cart
 */
export interface ProcessCartResult {
  success: boolean
  redirectUrl?: string
  error?: string
}

/**
 * Ecommerce Cart Service Interface
 *
 * All ecommerce platform implementations must implement this interface
 */
export interface IEcommerceCartService {
  /**
   * Process and sync a cart item to the ecommerce platform
   */
  processCartItem(config: ProcessCartItemConfig): Promise<ProcessCartResult>

  /**
   * Remove cart items from the ecommerce platform
   */
  removeCartItems(removeItems: Record<string, number>): Promise<void>

  /**
   * Get the current cart from the ecommerce platform
   */
  getCart(): Promise<{ items: EcommerceCartItem[] }>
}
