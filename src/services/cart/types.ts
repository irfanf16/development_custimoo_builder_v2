// Cart types
import type { CartProduct } from '@/services/products/types'

export interface SvgGroup {
  id: string
  name: string
  color: string
  count: number
  pantone?: string | null
}

export interface ProductPriceObject {
  product_price: number
  currency_code: string
  currency_symbol: string
  quantity: number
}

/**
 * FactoryProduct extends CartProduct with additional cart-specific fields
 */
export interface FactoryProduct extends CartProduct {
  product_display_name: string
  style_name: string
  product_price_object: ProductPriceObject
  svg_url?: string
  [key: string]: unknown
}

export interface CartItem {
  id: number
  cart_id: number
  factory_id: number | null
  factory_name: string | null
  items_count: number
  factory_products: FactoryProduct[]
  product_ids: number[]
  created_at: string
  updated_at: string
}

export interface Cart {
  id: number
  customer_id: number
  customer_name: string
  company_id: number
  company_name: string
  items: CartItem[]
  items_count: string
  created_at: string
  updated_at: string
}

export interface GetCustomerCartResponse {
  errors: any[]
  message: string
  result: Cart
}

export interface StoreProductToCartPayload {
  factory_product?: Record<string, unknown>
  factory_product_id?: number
  quantity?: number
  get_quote?: boolean
  product_assets?: File[]
  [key: string]: unknown
}

export interface StoreProductToCartResponse {
  errors: any[]
  message: string
  result: CartItem | Cart
}

export interface UpdateCartItemPayload {
  factory_product?: Record<string, unknown>
  quantity?: number
  get_quote?: boolean
  product_assets?: File[]
  [key: string]: unknown
}

export interface UpdateCartItemResponse {
  errors: any[]
  message: string
  result: CartItem
}

export interface DeleteCartItemResponse {
  errors: any[]
  message: string
  result: CartItem
}
export interface UploadCartAssetsPayload {
  files: File[]
  cart_item_id?: number
  [key: string]: unknown
}

export interface UploadCartAssetsResponse {
  success: boolean
  message?: string
  result?: {
    urls?: string[]
    [key: string]: unknown
  }
}

export interface GenerateSignedUploadUrlPayload {
  files: File[]
  factory_id?: number | null
  company_id: number
}

export interface SignedUploadUrlItem {
  signed_url: string
  file_path: string
  file_name: string
  file_type: string
  file_side?: string
  [key: string]: unknown
}

export interface GenerateSignedUploadUrlResponse {
  errors: any[]
  message: string
  result: {
    urls: SignedUploadUrlItem[]
  }
}
