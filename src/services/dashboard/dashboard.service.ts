// src/services/dashboard/index.ts
import http from '../api'
import type { DashboardResponse, DashboardPayload } from './types'

async function getDashboard(): Promise<DashboardPayload> {
  const { data } = await http.get<DashboardResponse>('/dashboards')

  return {
    counters: {
      orders_count: data.result.orders_count,
      pending_approval_count: data.result.pending_approval_count,
      track_my_orders_count: data.result.track_my_orders_count
    }
  }
}

export default { getDashboard }
