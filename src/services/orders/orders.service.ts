import http from '../api'
import type { CancelOrderResponse, CommentResponse, Order, OrderDetailResponse } from './types'
import type { FactoryProduct } from '@/services/cart/types'

export type OrdersResponse = {
  result: {
    data: Order[]
    current_page: number
    per_page: number
    total: number
  }
}

async function getOrders(params: string | undefined, pageType?: string) {
  let qp = params || ''
  if (!qp) {
    qp = pageType ? `?page_type=${pageType}` : ''
  } else if (pageType) {
    qp += `&page_type=${pageType}`
  }
  const { data } = await http.get<OrdersResponse>(`/orders${qp}`)
  return data.result
}

export async function cancelOrder(orderId: number | string): Promise<CancelOrderResponse> {
  const response = await http.put<CancelOrderResponse>(`/customer-orders/cancel/${orderId}`)
  return response.data
}

async function getOrderDetail(orderId: number | string): Promise<OrderDetailResponse> {
  const { data } = await http.get<OrderDetailResponse>(`/order/${orderId}`)
  return data
}

async function addComment(apiUrl: string, formData: FormData) {
  return http.post<CommentResponse>(apiUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

async function updateComment(apiUrl: string, commentId: number, formData: FormData) {
  return http.post<CommentResponse>(`${apiUrl}/${commentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

async function deleteComment(commentId: number) {
  return http.delete<CommentResponse>(`order_item/${commentId}/delete_comment`)
}

async function submitOrderActivity(orderItemId: number | string, formData: FormData) {
  return http.post(`customer-orders/${orderItemId}/order-activity`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

async function sendThirdPartyApproval(orderItemId: number | string, email: string) {
  return http.post('send-third-party-approval', {
    email,
    id: orderItemId
  })
}

async function getDesignFileUrl(orderId: number | string) {
  return http.get<{ result: { url: string } }>(`designfile/order/${orderId}`)
}

async function acceptQuote(orderId: number | string) {
  return http.post<{ success: boolean; message?: string; result?: OrderDetailResponse['result'] }>(
    'accept-quote-order',
    { order_id: orderId }
  )
}

async function rejectQuote(orderId: number | string) {
  return http.post<{ success: boolean; message?: string }>('reject-quote-order', {
    order_id: orderId
  })
}

export interface PlaceOrderPayload {
  address_id: number
  customer_reference_no: string
  general_comments: string
}

/** Common API shapes for POST /orders — extend extraction if backend differs */
export type PlaceOrderApiResponse = {
  success?: boolean
  message?: string
  result?: Order | { id?: number | string; order_id?: number | string; order?: Order } | null
  data?: Order | { id?: number | string; order_id?: number | string } | null
  order_id?: number | string
  id?: number | string
}

function coerceOrderId(value: unknown): number | string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') return value
  return null
}

/** Parses placed order id from API JSON body */
export function extractPlacedOrderId(data: unknown): number | string | null {
  if (data == null || typeof data !== 'object') return null
  const o = data as Record<string, unknown>

  const top = coerceOrderId(o.id) ?? coerceOrderId(o.order_id)
  if (top != null) return top

  const result = o.result
  if (result != null && typeof result === 'object' && !Array.isArray(result)) {
    const r = result as Record<string, unknown>
    const fromResult = coerceOrderId(r.id) ?? coerceOrderId(r.order_id)
    if (fromResult != null) return fromResult
    const nestedOrder = r.order
    if (nestedOrder != null && typeof nestedOrder === 'object' && !Array.isArray(nestedOrder)) {
      const n = nestedOrder as Record<string, unknown>
      const nested = coerceOrderId(n.id)
      if (nested != null) return nested
    }
  }

  const d = o.data
  if (d != null && typeof d === 'object' && !Array.isArray(d)) {
    const dObj = d as Record<string, unknown>
    const fromData = coerceOrderId(dObj.id) ?? coerceOrderId(dObj.order_id)
    if (fromData != null) return fromData
    const orderNested = dObj.order
    if (orderNested != null && typeof orderNested === 'object' && !Array.isArray(orderNested)) {
      const on = orderNested as Record<string, unknown>
      const fromOrder = coerceOrderId(on.id) ?? coerceOrderId(on.order_id)
      if (fromOrder != null) return fromOrder
    }
  }

  return null
}

async function placeOrder(payload: PlaceOrderPayload) {
  const { data } = await http.post<PlaceOrderApiResponse>('/orders', payload)
  return data
}

export type ReorderProductResponse = {
  result: {
    factoryProducts: FactoryProduct[]
    factoryProductActiveIndex: number
  }
}

async function getReorderProduct(orderItemId: number, factoryProductId: string) {
  return http.post<ReorderProductResponse>(`orders/reorder-product/detail`, {
    active_product_type: 'reorder_product',
    item_id: orderItemId,
    factory_product_id: factoryProductId
  })
}

export default {
  getOrders,
  cancelOrder,
  getOrderDetail,
  addComment,
  updateComment,
  deleteComment,
  submitOrderActivity,
  sendThirdPartyApproval,
  getDesignFileUrl,
  acceptQuote,
  rejectQuote,
  placeOrder,
  getReorderProduct
}
