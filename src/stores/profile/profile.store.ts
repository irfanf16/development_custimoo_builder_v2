import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/services'
import type { DashboardCounters } from '@/services/dashboard/types'

export const useProfileStore = defineStore('profileStore', () => {
  // ✅ initialize refs with proper default values
  const counters = ref<DashboardCounters>({
    orders_count: 0,
    pending_approval_count: 0,
    track_my_orders_count: 0
  })
  const isLoading = ref(false)
  const isLoadingOrders = ref(false)
  const error = ref<string | null>(null)
  // Orders state
  const orders = ref<any[]>([])
  const ordersView = ref<'grid' | 'list'>('list')
  const ordersPageType = ref<'order' | 'quote'>('order')
  const ordersParams = ref<{ search: string; filter: string | null }>({ search: '', filter: null })
  const pagination = ref<{ currentPage: number; perPage: number; total: number; rows: number }>({
    currentPage: 1,
    perPage: 10,
    total: 0,
    rows: 0
  })

  async function fetchDashboard() {
    console.log('Fetching dashboard data...')
    isLoading.value = true
    error.value = null
    try {
      const response = await API.dashboard.getDashboard()
      console.log('Dashboard payload:', response)
      counters.value = response.counters
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
    } finally {
      isLoading.value = false
    }
  }

  // Orders
  async function fetchOrders(params?: string) {
    isLoadingOrders.value = true
    try {
      const res = await API.orders.getOrders(params, ordersPageType.value)
      console.log('Fetched orders:', res)
      orders.value = res.data
      makePagination(res)
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
    pagination.value.rows = data.total
  }

  function handlePagination(page: number | string) {
    let params = `?page=${page}`
    const { search, filter } = ordersParams.value
    if (search && filter)
      params += `&search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}`
    else if (search) params += `&search=${encodeURIComponent(search)}`
    else if (filter) params += `&filter=${encodeURIComponent(filter)}`
    void fetchOrders(params)
  }

  function clearSearch() {
    ordersParams.value.search = ''
    filterOrders()
  }
  function clearFilter() {
    ordersParams.value.filter = null
    filterOrders()
  }
  // function filterOrders() {
  //   handlePagination(pagination.value.currentPage || 1)
  // }

  async function cancelOrder(order: { id: number | string; order_no?: string }) {
    const title = order.order_no ? `Order no: ${order.order_no}` : 'Order pending confirmation'
    const msg = `${title}\nAre you sure that you want to cancel this order?`
    const confirm = window.confirm(msg)
    if (!confirm) return

    isLoading.value = true
    try {
      const res = await API.orders.cancelOrder(order.id)
      if (res.success) {
        await fetchOrders()
      }
    } catch (e: unknown) {
      console.error('Cancel order failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  function setView(mode: 'grid' | 'list') {
    ordersView.value = mode
  }
  function filterOrders() {
    const query = new URLSearchParams()
    const { search, filter } = ordersParams.value

    if (search) query.set('search', search)
    if (filter) query.set('filter', filter)

    const params = query.toString() ? `?${query.toString()}` : ''
    void fetchOrders(params)
  }

  return {
    counters,
    isLoading,
    error,
    fetchDashboard,
    // orders state
    orders,
    ordersView,
    ordersPageType,
    ordersParams,
    pagination,
    // orders actions
    fetchOrders,
    makePagination,
    handlePagination,
    clearSearch,
    clearFilter,
    cancelOrder,
    setView,
    filterOrders,
    isLoadingOrders
  }
})
