import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/services'
import type { DashboardCounters } from '@/services/dashboard/types'
import type { Order, OrderDetailResponse } from '@/services/orders/types'

export const useProfileStore = defineStore('profileStore', () => {
  // ✅ Dashboard state
  const counters = ref<DashboardCounters>({
    orders_count: 0,
    pending_approval_count: 0,
    track_my_orders_count: 0
  })
  const isLoading = ref(false)
  const isLoadingOrders = ref(false)
  const error = ref<string | null>(null)

  // ✅ Orders state
  const orders = ref<Order[]>([])
  const ordersView = ref<'list' | 'expanded-list'>('list')
  const ordersPageType = ref<'order' | 'quote'>('order')
  const ordersParams = ref<{ search: string; filter: string | null }>({
    search: '',
    filter: null
  })
  const breadcrumbs = ref<{ label: string; action?: () => void }[]>([{ label: 'Orders' }])
  const activeOrder = ref<Order | null>(null)
  const activeOrderView = ref<'details' | 'timeline'>('details')
  const pagination = ref<{
    currentPage: number
    perPage: number
    total: number
    next_page_url?: string | null
  }>({
    currentPage: 1,
    perPage: 10,
    total: 0,
    next_page_url: null
  })

  // ✅ Fetch Dashboard Data
  async function fetchDashboard() {
    isLoading.value = true
    error.value = null
    try {
      const response = await API.dashboard.getDashboard()
      counters.value = response.counters
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
    } finally {
      isLoading.value = false
    }
  }

  // ✅ Fetch Orders (base or with params)
  async function fetchOrders(params?: string) {
    isLoadingOrders.value = true
    error.value = null
    try {
      const res = await API.orders.getOrders(params, ordersPageType.value)
      orders.value = res.data ?? []
      makePagination(res)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load orders'
    } finally {
      isLoadingOrders.value = false
    }
  }

  // ✅ Pagination builder
  function makePagination(data: { current_page: number; per_page: number; total: number }) {
    pagination.value.currentPage = data.current_page
    pagination.value.perPage = data.per_page
    pagination.value.total = data.total
  }

  // ✅ Handle Pagination (for infinite scroll)
  async function handlePagination(page: number) {
    const { total, perPage, currentPage } = pagination.value
    const totalPages = Math.ceil(total / perPage)

    // ⛔ Stop if already loading or no more pages
    if (isLoadingOrders.value || page > totalPages || page === currentPage) return

    let params = `?page=${page}`
    const { search, filter } = ordersParams.value

    if (search) params += `&search=${encodeURIComponent(search)}`
    if (filter) params += `&filter=${encodeURIComponent(filter)}`

    const res = await API.orders.getOrders(params, ordersPageType.value)
    const newOrders = (res.data ?? []) as unknown[]

    if (Array.isArray(newOrders)) {
      orders.value.push(...(newOrders as Order[]))
    }
    makePagination(res)
  }

  // ✅ Clear Search & Filter
  async function clearSearch() {
    ordersParams.value.search = ''
    await filterOrders()
  }

  async function clearFilter() {
    ordersParams.value.filter = null
    await filterOrders()
  }

  // ✅ Filter Orders
  async function filterOrders() {
    const query = new URLSearchParams()
    const { search, filter } = ordersParams.value
    if (search) query.set('search', search)
    if (filter) query.set('filter', filter)

    const params = query.toString() ? `?${query.toString()}` : ''
    await fetchOrders(params)
  }

  // ✅ Cancel Order
  async function cancelOrder(order: { id: number | string; order_no?: string }) {
    const title = order.order_no ? `Order no: ${order.order_no}` : 'Order pending confirmation'
    const msg = `${title}\nAre you sure you want to cancel this order?`
    if (!window.confirm(msg)) return

    isLoading.value = true
    try {
      const res = await API.orders.cancelOrder(order.id)
      if (res.success) await fetchOrders()
    } catch (e: unknown) {
      console.error('Cancel order failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  // ✅ View Mode
  function setView(mode: 'list' | 'expanded-list') {
    ordersView.value = mode
  }

  // ✅ Open Order Details
  function openOrderDetails(order: Order) {
    if (!order) return // safety check

    activeOrder.value = order
    activeOrderView.value = 'details'
    breadcrumbs.value = [
      { label: 'Orders', action: () => closeOrderDetails() },
      { label: `Order #${order.order_no ?? 'N/A'}` }
    ]
  }

  // ✅ Fetch Order Details (Order Timeline entry point)
  async function fetchOrderDetails(orderId: number | string) {
    isLoading.value = true
    error.value = null
    try {
      const res: OrderDetailResponse = await API.orders.getOrderDetail(orderId)
      if (res.success) {
        activeOrder.value = res.result
        const ord = res.result
        breadcrumbs.value = [
          { label: 'Orders', action: () => closeOrderDetails() },
          { label: `Order #${ord.order_no ?? 'N/A'}` }
        ]
      } else {
        error.value = res.message || 'Failed to load order details'
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load order details'
    } finally {
      isLoading.value = false
    }
  }

  // ✅ Open Order Timeline (adjust breadcrumb)
  async function openOrderTimeline(orderId: number | string) {
    await fetchOrderDetails(orderId)
    activeOrderView.value = 'timeline'
    const ord = activeOrder.value
    breadcrumbs.value = [
      { label: 'Orders', action: () => closeOrderDetails() },
      { label: `Order #${ord?.order_no ?? 'N/A'}`, action: () => ord && openOrderDetails(ord) },
      { label: 'Order Timeline' }
    ]
  }
  // ✅ Close Order Details
  function closeOrderDetails() {
    activeOrder.value = null
    breadcrumbs.value = [{ label: 'Orders' }]
  }

  return {
    // State
    counters,
    isLoading,
    isLoadingOrders,
    error,
    orders,
    ordersView,
    ordersPageType,
    ordersParams,
    pagination,
    breadcrumbs,
    activeOrder,
    activeOrderView,

    // Actions
    fetchDashboard,
    fetchOrders,
    makePagination,
    handlePagination,
    clearSearch,
    clearFilter,
    cancelOrder,
    setView,
    filterOrders,
    openOrderDetails,
    fetchOrderDetails,
    openOrderTimeline,
    closeOrderDetails
  }
})
