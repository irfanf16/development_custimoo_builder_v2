import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/services'
import type { Order, OrderDetailResponse } from '@/services/orders/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useOrdersStore = defineStore('ordersStore', () => {
  // --- STATE ---
  const orders = ref<Order[]>([])
  const isLoadingOrders = ref(false)
  const error = ref<string | null>(null)
  const isLoadingMore = ref(false)

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

  // --- LOCAL STORAGE PERSISTENCE ---
  const STORAGE_KEY = 'ordersStore'
  const { getItem, setItem, removeItem } = useLocalStorage()

  function saveToLocalStorage() {
    try {
      const state = {
        ordersView: ordersView.value,
        ordersPageType: ordersPageType.value,
        ordersParams: ordersParams.value,
        breadcrumbs: breadcrumbs.value.map(b => ({ label: b.label })),
        activeOrder: activeOrder.value,
        activeOrderView: activeOrderView.value,
        pagination: pagination.value,
        orders: orders.value
      }
      setItem(STORAGE_KEY, state)
    } catch (e) {
      console.error('Failed to save ordersStore to localStorage:', e)
    }
  }

  function loadFromLocalStorage() {
    try {
      const state = getItem<{
        ordersView?: 'list' | 'expanded-list'
        ordersPageType?: 'order' | 'quote'
        ordersParams?: { search: string; filter: string | null }
        breadcrumbs?: Array<{ label: string }>
        activeOrder?: Order | null
        activeOrderView?: 'details' | 'timeline'
        pagination?: {
          currentPage: number
          perPage: number
          total: number
          next_page_url?: string | null
        }
        orders?: Order[]
      }>(STORAGE_KEY)

      if (!state) return false

      if (state.ordersView) ordersView.value = state.ordersView
      if (state.ordersPageType) ordersPageType.value = state.ordersPageType
      if (state.ordersParams) ordersParams.value = state.ordersParams
      if (state.activeOrderView) activeOrderView.value = state.activeOrderView
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
    removeItem(STORAGE_KEY)
  }

  // --- ACTIONS ---

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

  function makePagination(data: { current_page: number; per_page: number; total: number }) {
    pagination.value.currentPage = data.current_page
    pagination.value.perPage = data.per_page
    pagination.value.total = data.total
  }

  async function handlePagination(page: number) {
    const { total, perPage, currentPage } = pagination.value
    const totalPages = Math.ceil(total / perPage)

    if (isLoadingOrders.value || isLoadingMore.value || page > totalPages || page === currentPage)
      return

    isLoadingMore.value = true
    try {
      let params = `?page=${page}`
      const { search, filter } = ordersParams.value
      if (search) params += `&search=${encodeURIComponent(search)}`
      if (filter) params += `&filter=${encodeURIComponent(filter)}`

      const res = await API.orders.getOrders(params, ordersPageType.value)
      const newOrders = (res.data ?? []) as Order[]
      orders.value.push(...newOrders)
      makePagination(res)
      saveToLocalStorage()
    } finally {
      isLoadingMore.value = false
    }
  }

  async function filterOrders() {
    const query = new URLSearchParams()
    const { search, filter } = ordersParams.value
    if (search) query.set('search', search)
    if (filter) query.set('filter', filter)
    const params = query.toString() ? `?${query.toString()}` : ''
    await fetchOrders(params)
    saveToLocalStorage()
  }

  async function clearSearch() {
    ordersParams.value.search = ''
    await filterOrders()
  }

  async function clearFilter() {
    ordersParams.value.filter = null
    await filterOrders()
  }

  async function cancelOrder(order: { id: number | string; order_no?: string }) {
    const title = order.order_no ? `Order no: ${order.order_no}` : 'Order pending confirmation'
    const msg = `${title}\nAre you sure you want to cancel this order?`
    if (!window.confirm(msg)) return

    isLoadingOrders.value = true
    try {
      const res = await API.orders.cancelOrder(order.id)
      if (res.success) await fetchOrders()
    } catch (e: unknown) {
      console.error('Cancel order failed:', e)
    } finally {
      isLoadingOrders.value = false
    }
  }

  function setView(mode: 'list' | 'expanded-list') {
    ordersView.value = mode
    saveToLocalStorage()
  }

  function openOrderDetails(order: Order) {
    if (!order) return
    activeOrder.value = order
    activeOrderView.value = 'details'
    breadcrumbs.value = [
      { label: 'Orders', action: () => closeOrderDetails() },
      { label: `#${order.order_no ?? 'N/A'}` }
    ]
    saveToLocalStorage()
  }

  async function fetchOrderDetails(orderId: number | string) {
    isLoadingOrders.value = true
    error.value = null
    const wasOnTimeline = activeOrderView.value === 'timeline'
    try {
      const res: OrderDetailResponse = await API.orders.getOrderDetail(orderId)
      if (res.success) {
        activeOrder.value = res.result
        const ord = res.result
        breadcrumbs.value = wasOnTimeline
          ? [
              { label: 'Orders', action: () => closeOrderDetails() },
              { label: `Order #${ord.order_no ?? 'N/A'}`, action: () => openOrderDetails(ord) },
              { label: 'Order Timeline' }
            ]
          : [
              { label: 'Orders', action: () => closeOrderDetails() },
              { label: `Order #${ord.order_no ?? 'N/A'}` }
            ]
        saveToLocalStorage()
      } else {
        error.value = res.message || 'Failed to load order details'
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load order details'
    } finally {
      isLoadingOrders.value = false
    }
  }

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

  function closeOrderDetails() {
    activeOrder.value = null
    breadcrumbs.value = [{ label: 'Orders' }]
    saveToLocalStorage()
  }

  // --- RETURN ---
  return {
    // State
    orders,
    isLoadingOrders,
    error,
    ordersView,
    ordersPageType,
    ordersParams,
    pagination,
    breadcrumbs,
    activeOrder,
    activeOrderView,
    isLoadingMore,

    // Actions
    fetchOrders,
    makePagination,
    handlePagination,
    filterOrders,
    clearSearch,
    clearFilter,
    cancelOrder,
    setView,
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
