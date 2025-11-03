import http from '../api'
import type { CancelOrderResponse } from './types'

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

export default { getOrders, cancelOrder }
