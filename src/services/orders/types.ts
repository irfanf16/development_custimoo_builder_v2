export interface CancelOrderResponse {
  success: boolean
  message?: string
}
interface FactoryProduct {
  product_name?: string
  is_custom_product?: boolean
  front_image?: string
  back_image?: string
  custom_product_placeholder?: string
  prices?: { total_quantity?: number }
  roster_quantity?: number
}
export interface OrdersResponse {
  data: Order[]
  current_page: number
  per_page: number
  total: number
  next_page_url?: string | null
}
export interface Item {
  id?: number | string
  status?: string
  factory_products?: FactoryProduct[]
}

export interface Order {
  id: number | string
  order_no?: string
  customer_reference_no?: string
  created_at?: string
  items?: Item[]
}
