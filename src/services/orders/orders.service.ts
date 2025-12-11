import http from '../api'
import type { CancelOrderResponse, CommentResponse, OrderDetailResponse } from './types'

export type OrdersResponse = {
  result: {
    data: any[]
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

export default { getOrders, cancelOrder, getOrderDetail, addComment, updateComment, deleteComment }
