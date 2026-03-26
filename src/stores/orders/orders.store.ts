import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/services'
import type { Order, OrderDetailResponse, Item, FactoryProduct } from '@/services/orders/types'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { confirmDialog } from '@/lib/confirm-dialog'
import { toast } from 'vue-sonner'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useCartStore } from '@/stores/cart/cart.store'
import {
  msg_failed_to_load_pdf,
  msg_pdf_not_ready,
  msg_cancel_order_error,
  msg_failed_to_add_to_cart,
  msg_failed_to_load_reorder_product,
  msg_invalid_order_product,
  msg_failed_to_load_product_sharing,
  msg_product_data_not_found,
  msg_product_id_not_found,
  msg_design_shared_success,
  msg_failed_to_share_design
} from '@/paraglide/messages'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLoadReorderProductIntoCustomizer } from '@/composables/useLoadReorderProductIntoCustomizer'
import { useProductsStore } from '@/stores/products/products.store'
import { useAppStore } from '@/stores/app/app.store'
import { generateRandomString } from '@/lib/utils'
import type { ShareDesignPayload } from '@/services/products/types/base-product'

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
      const newOrders = res.data ?? []
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

  // Loading states for order actions
  const isCancelling = ref(false)
  const loadingCart = ref<Record<string, boolean>>({})
  const loadingShare = ref<Record<string, boolean>>({})

  // Dependencies for order actions
  const cartStore = useCartStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const appStore = useAppStore()
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'ordersStore' } })
  const { loadReorderProductIntoCustomizer } = useLoadReorderProductIntoCustomizer()

  /**
   * Download PDF for an order
   */
  async function downloadOrderPdf(order: Order) {
    if (!order?.id) return

    const response = await tryCatchApi(API.orders.getDesignFileUrl(order.id), {
      operation: 'downloadOrderPdf',
      order_id: order.id
    })

    if (response.success && response.content?.result?.url) {
      window.open(response.content.result.url, '_blank')
    } else if (!response.success) {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_failed_to_load_pdf({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
    } else {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_pdf_not_ready({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
    }
  }

  /**
   * Cancel an order with confirmation dialog
   */
  async function cancelOrder(order: Order) {
    if (!order?.id) return

    // Build confirmation message
    const title = order.order_no ? `Order no: ${order.order_no}` : 'Order pending confirmation'
    const description = 'Are you sure that you want to cancel this order?'

    // Show confirmation dialog
    const confirmed = await confirmDialog({
      title,
      description,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    isCancelling.value = true
    try {
      const response = await API.orders.cancelOrder(order.id)

      // Treat as success when backend sends success !== false or when we have result (backend may omit success)
      const isSuccess = response && response.success !== false
      const rawResult: unknown = response?.result
      let updatedOrder: Order | undefined
      if (rawResult && typeof rawResult === 'object' && 'order' in rawResult) {
        updatedOrder = (rawResult as { order: Order }).order
      } else if (rawResult && typeof rawResult === 'object') {
        updatedOrder = rawResult as Order
      } else {
        updatedOrder = undefined
      }

      if (isSuccess) {
        toast.success(response.message || 'Order cancelled successfully', {
          position: 'top-right',
          richColors: true
        })
        if (updatedOrder) {
          if (activeOrder.value?.id === order.id) {
            activeOrder.value = updatedOrder
          }
          const idx = orders.value.findIndex(o => String(o.id) === String(order.id))
          if (idx !== -1) {
            const next = [...orders.value]
            next[idx] = updatedOrder
            orders.value = next
          }
          saveToLocalStorage()
        } else {
          if (activeOrder.value?.id === order.id) {
            await fetchOrderDetails(order.id)
          }
          await fetchOrders()
        }
      } else {
        const locale = useProfileStore().currentLocale || 'en'
        toast.error(response?.message || msg_cancel_order_error({}, { locale }), {
          position: 'top-right',
          richColors: true
        })
      }
    } catch (_error) {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_cancel_order_error({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
    } finally {
      isCancelling.value = false
    }
  }

  /**
   * Add product to cart from order
   */
  async function addProductToCartFromOrder(
    product: FactoryProduct,
    item: Item,
    key: string
  ): Promise<boolean> {
    if (!product?.product_id || !item?.id || !product?.id) return false

    const productId = Number(product.product_id)
    if (!Number.isFinite(productId)) return false

    loadingCart.value[key] = true
    try {
      const response = await tryCatchApi(
        API.cart.addToCartFromOrder(productId, item.id, product.id),
        {
          operation: 'addProductToCartFromOrder'
        }
      )

      if (response.success) {
        const successMessage =
          (response.content as { message?: string })?.message ||
          'Product added to cart successfully'
        toast.success(successMessage, {
          position: 'top-right',
          richColors: true
        })
        void cartStore.fetchCart(true)
        return true
      } else {
        let errorMessage = 'Failed to add product to cart'

        if (
          response.axiosError?.response?.data &&
          typeof response.axiosError.response.data === 'object' &&
          'message' in response.axiosError.response.data
        ) {
          const axiosMessage = (response.axiosError.response.data as { message?: unknown }).message
          if (typeof axiosMessage === 'string') {
            errorMessage = axiosMessage
          }
        }

        toast.error(errorMessage, {
          position: 'top-right',
          richColors: true
        })
        return false
      }
    } catch (_error) {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_failed_to_add_to_cart({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
      return false
    } finally {
      loadingCart.value[key] = false
    }
  }

  /**
   * Reorder a product from an order
   */
  async function reorderProduct(
    order: Order,
    orderItem: Item,
    factoryProduct: FactoryProduct,
    onSuccess?: () => void
  ): Promise<boolean> {
    console.log('Starting reorderProduct with', { order, orderItem, factoryProduct })
    if (!order?.id || orderItem?.id == null || factoryProduct?.id == null) return false

    const orderId = Number(order.id)
    const orderItemId = Number(orderItem.id)
    const factoryProductId = factoryProduct.id
    const productId = Number(factoryProduct.product_id)

    if (!orderId || !orderItemId || !factoryProductId || !productId) return false

    customizationStore.setReorderData({
      order_item_id: orderItemId,
      factory_product_id: String(factoryProductId),
      order_number: order.order_no ?? undefined,
      factory_id: orderItem?.factory_id ?? undefined,
      factory_name: orderItem?.factory_name ?? undefined
    })

    const success = await loadReorderProductIntoCustomizer({
      orderItemId,
      factoryProductId
    })

    if (success) {
      if (onSuccess) onSuccess()
      return true
    } else {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_failed_to_load_reorder_product({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
      customizationStore.clearReorderData()
      return false
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

  function getShareBaseUrl() {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    if (!appStore.appInfo?.is_subpage) return origin
    const subpageUrl = appStore.appInfo?.suppage_url ?? ''
    if (!subpageUrl) return origin
    const normalizedSubpage = `/${subpageUrl.replace(/^\/+/, '').replace(/\/+$/, '')}`
    return `${origin}${normalizedSubpage}`
  }

  /**
   * Share design for an order product
   */
  async function shareOrderProductDesign(
    order: Order,
    orderItem: Item,
    factoryProduct: FactoryProduct
  ): Promise<string | null> {
    if (!orderItem?.id || !factoryProduct?.id) {
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_invalid_order_product({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
      return null
    }

    const key = `${orderItem.id}-${factoryProduct.id}`
    loadingShare.value[key] = true

    try {
      // Get full product data from reorder API
      const reorderResp = await tryCatchApi(
        API.orders.getReorderProduct(Number(orderItem.id), factoryProduct.id),
        {
          operation: 'shareOrderProductDesign',
          order_item_id: orderItem.id,
          factory_product_id: factoryProduct.id
        }
      )

      if (!reorderResp.success || !reorderResp.content?.result?.factoryProducts?.length) {
        const locale = useProfileStore().currentLocale || 'en'
        toast.error(msg_failed_to_load_product_sharing({}, { locale }), {
          position: 'top-right',
          richColors: true
        })
        return null
      }

      const fullProduct = reorderResp.content.result.factoryProducts[0]
      if (!fullProduct) {
        const locale = useProfileStore().currentLocale || 'en'
        toast.error(msg_product_data_not_found({}, { locale }), {
          position: 'top-right',
          richColors: true
        })
        return null
      }

      // Build share design payload
      const productId = Number(fullProduct.product_id || factoryProduct.product_id)
      if (!productId) {
        const locale = useProfileStore().currentLocale || 'en'
        toast.error(msg_product_id_not_found({}, { locale }), {
          position: 'top-right',
          richColors: true
        })
        return null
      }

      const productName = fullProduct.product_name || factoryProduct.product_name || 'Product'
      const encodedName = encodeURIComponent(productName).replace(/%20/g, '+')
      const randString = generateRandomString()

      // Normalize image paths - ensure they're file paths, not full URLs

      const frontImage = (fullProduct.front_image as string) || factoryProduct.front_image

      const backImage = (fullProduct.back_image as string) || factoryProduct.back_image

      // Extract customization data from full product
      const sharePayload: ShareDesignPayload = {
        addons:
          (fullProduct.addons as ShareDesignPayload['addons']) ||
          ({} as ShareDesignPayload['addons']),
        roster_url: `${getShareBaseUrl()}/share/${encodedName}/${randString}`,
        product_id: productId,
        product_name: productName,
        svg_groups: (fullProduct.svg_groups as ShareDesignPayload['svg_groups']) || [],
        svg_parts: (fullProduct.svg_parts as ShareDesignPayload['svg_parts']) || [],
        style_id: Number(fullProduct.style_id || factoryProduct.style_id || 0),
        design_id: Number(fullProduct.design_id || factoryProduct.design_id || 0),
        custom_logos: (fullProduct.custom_logos as ShareDesignPayload['custom_logos']) || [],
        text: (fullProduct.text as ShareDesignPayload['text']) || [],
        product_custom_texts:
          (fullProduct.product_custom_texts as ShareDesignPayload['product_custom_texts']) || [],
        colors: (fullProduct.colors as ShareDesignPayload['colors']) || [],
        shuffle_color_number: Number(fullProduct.shuffle_color_number) || 0,
        defaultcolors: (fullProduct.defaultcolors as ShareDesignPayload['defaultcolors']) || [],
        groupcolors: (fullProduct.groupcolors as ShareDesignPayload['groupcolors']) || {},
        front_image: frontImage ?? '',
        back_image: backImage ?? '',
        product_roster_detail:
          (fullProduct.product_roster_detail as ShareDesignPayload['product_roster_detail']) || [],
        fixed_logo_index: Number(fullProduct.fixed_logo_index) || 0,
        svgcolors: (fullProduct.svgcolors as ShareDesignPayload['svgcolors']) || [],
        grouped_addons: (fullProduct.grouped_addons as ShareDesignPayload['grouped_addons']) || {},
        ungrouped_addons:
          (fullProduct.ungrouped_addons as ShareDesignPayload['ungrouped_addons']) || [],
        group_patterns: (fullProduct.group_patterns as ShareDesignPayload['group_patterns']) || {},
        rand_string: randString,
        room_id: null,
        category_id:
          typeof fullProduct.category_id === 'number' ? fullProduct.category_id : undefined,
        sub_category_id:
          typeof fullProduct.sub_category_id === 'number' || fullProduct.sub_category_id === null
            ? fullProduct.sub_category_id
            : null
      }

      const response = await productsStore.shareDesign(sharePayload)

      if (response.success && response.content?.url) {
        // Update the product with share URL
        if (!factoryProduct.share_design_info) {
          factoryProduct.share_design_info = {}
        }
        factoryProduct.share_design_info.share_url = response.content.url

        // Update in active order if it's the current one
        if (activeOrder.value?.id === order.id) {
          const item = activeOrder.value.items?.find(i => i.id === orderItem.id)
          if (item) {
            const prod = item.factory_products?.find(p => p.id === factoryProduct.id)
            if (prod && !prod.share_design_info) {
              prod.share_design_info = {}
            }
            if (prod?.share_design_info) {
              prod.share_design_info.share_url = response.content.url
            }
          }
        }

        // Update in orders list
        const orderInList = orders.value.find(o => o.id === order.id)
        if (orderInList) {
          const item = orderInList.items?.find(i => i.id === orderItem.id)
          if (item) {
            const prod = item.factory_products?.find(p => p.id === factoryProduct.id)
            if (prod && !prod.share_design_info) {
              prod.share_design_info = {}
            }
            if (prod?.share_design_info) {
              prod.share_design_info.share_url = response.content.url
            }
          }
        }

        const locale = useProfileStore().currentLocale || 'en'
        toast.success(msg_design_shared_success({}, { locale }), {
          position: 'top-right',
          richColors: true,
          duration: 3000
        })

        return response.content.url
      } else {
        const locale = useProfileStore().currentLocale || 'en'
        toast.error(msg_failed_to_share_design({}, { locale }), {
          position: 'top-right',
          richColors: true
        })
        return null
      }
    } catch (error) {
      console.error('Share order product design error:', error)
      const locale = useProfileStore().currentLocale || 'en'
      toast.error(msg_failed_to_share_design({}, { locale }), {
        position: 'top-right',
        richColors: true
      })
      return null
    } finally {
      loadingShare.value[key] = false
    }
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
    isCancelling,
    loadingCart,
    loadingShare,

    // Actions
    fetchOrders,
    makePagination,
    handlePagination,
    filterOrders,
    clearSearch,
    clearFilter,
    cancelOrder,
    downloadOrderPdf,
    addProductToCartFromOrder,
    reorderProduct,
    shareOrderProductDesign,
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
