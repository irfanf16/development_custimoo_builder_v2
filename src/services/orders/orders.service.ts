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

async function placeOrder(payload: {
  address_id: number
  customer_reference_no: string
  general_comments: string
}) {
  return http.post('/orders', payload)
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
