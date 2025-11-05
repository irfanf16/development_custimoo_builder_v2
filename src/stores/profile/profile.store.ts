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
  const activeTab = ref<'account' | 'orders' | 'address' | 'preferences'>('account')
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

  // ===== PERSISTENCE =====
  const STORAGE_KEY = 'profileStore'

  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const state = {
        ordersView: ordersView.value,
        ordersPageType: ordersPageType.value,
        ordersParams: ordersParams.value,
        breadcrumbs: breadcrumbs.value.map(b => ({
          label: b.label
          // Note: actions are functions and cannot be serialized, so we skip them
        })),
        activeOrder: activeOrder.value, // Store full order for restoration
        activeOrderView: activeOrderView.value,
        activeTab: activeTab.value,
        pagination: pagination.value,
        orders: orders.value // Persist all loaded orders
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save profile store to localStorage:', e)
    }
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const state = JSON.parse(stored) as {
        ordersView?: 'list' | 'expanded-list'
        ordersPageType?: 'order' | 'quote'
        ordersParams?: { search: string; filter: string | null }
        breadcrumbs?: Array<{ label: string }>
        activeOrder?: Order | null
        activeOrderView?: 'details' | 'timeline'
        activeTab?: 'account' | 'orders' | 'address' | 'preferences'
        pagination?: {
          currentPage: number
          perPage: number
          total: number
          next_page_url?: string | null
        }
        orders?: Order[]
      }

      if (state.ordersView) ordersView.value = state.ordersView
      if (state.ordersPageType) ordersPageType.value = state.ordersPageType
      if (state.ordersParams) ordersParams.value = state.ordersParams
      if (state.activeOrderView) activeOrderView.value = state.activeOrderView
      if (state.activeTab) activeTab.value = state.activeTab
      if (state.pagination) pagination.value = state.pagination
      if (state.orders && Array.isArray(state.orders)) orders.value = state.orders

      // Restore breadcrumbs with proper actions - handle all breadcrumb labels
      if (state.breadcrumbs) {
        breadcrumbs.value = state.breadcrumbs.map((b, idx) => {
          if (idx === 0) {
            return { label: b.label, action: () => closeOrderDetails() }
          }
          // For order detail breadcrumb, add action if we have the order
          if (state.activeOrder && b.label.includes('Order #')) {
            return { label: b.label, action: () => openOrderDetails(state.activeOrder!) }
          }
          // For Order Timeline breadcrumb, just return the label (no action needed)
          return { label: b.label }
        })
      }

      // Restore activeOrder
      if (state.activeOrder) {
        activeOrder.value = state.activeOrder
      }

      return true
    } catch (e) {
      console.error('Failed to load profile store from localStorage:', e)
      return false
    }
  }

  function clearLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }

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
      saveToLocalStorage()
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
    saveToLocalStorage()
  }

  // ✅ Clear Search & Filter
  async function clearSearch() {
    ordersParams.value.search = ''
    await filterOrders()
    saveToLocalStorage()
  }

  async function clearFilter() {
    ordersParams.value.filter = null
    await filterOrders()
    saveToLocalStorage()
  }

  // ✅ Filter Orders
  async function filterOrders() {
    const query = new URLSearchParams()
    const { search, filter } = ordersParams.value
    if (search) query.set('search', search)
    if (filter) query.set('filter', filter)

    const params = query.toString() ? `?${query.toString()}` : ''
    await fetchOrders(params)
    saveToLocalStorage()
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
    saveToLocalStorage()
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
    saveToLocalStorage()
  }

  // ✅ Fetch Order Details (Order Timeline entry point)
  async function fetchOrderDetails(orderId: number | string) {
    isLoading.value = true
    error.value = null
    const wasOnTimeline = activeOrderView.value === 'timeline'
    try {
      const res: OrderDetailResponse = await API.orders.getOrderDetail(orderId)
      if (res.success) {
        activeOrder.value = res.result
        const ord = res.result
        // If we were on timeline view, preserve the timeline breadcrumb structure
        if (wasOnTimeline) {
          breadcrumbs.value = [
            { label: 'Orders', action: () => closeOrderDetails() },
            { label: `Order #${ord.order_no ?? 'N/A'}`, action: () => openOrderDetails(ord) },
            { label: 'Order Timeline' }
          ]
        } else {
          breadcrumbs.value = [
            { label: 'Orders', action: () => closeOrderDetails() },
            { label: `Order #${ord.order_no ?? 'N/A'}` }
          ]
        }
        saveToLocalStorage()
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
    saveToLocalStorage()
  }
  // ✅ Close Order Details
  function closeOrderDetails() {
    activeOrder.value = null
    breadcrumbs.value = [{ label: 'Orders' }]
    saveToLocalStorage()
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
    activeTab,

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
    closeOrderDetails,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})
