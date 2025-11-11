export type DashboardCounters = {
  orders_count: number
  pending_approval_count: number
  track_my_orders_count: number
}
export interface DashboardResponse {
  result: {
    orders_count: number
    pending_approval_count: number
    track_my_orders_count: number
  }
}
export type DashboardPayload = {
  counters: DashboardCounters
}
