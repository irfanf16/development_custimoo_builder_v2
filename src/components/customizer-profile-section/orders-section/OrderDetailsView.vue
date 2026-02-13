<template>
  <div class="py-4 space-y-6">
    <!-- Order Info -->
    <div class="pb-3 px-4">
      <OrderSummaryHeader
        :order="order"
        :show-timeline="true"
        @cancel="store.cancelOrder"
        @pdf="() => {}"
        @details="() => {}"
        @accept-quote="handleAcceptQuote"
        @reject-quote="handleRejectQuote"
      />
    </div>

    <!-- Product List -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(item, index) in order.items || []"
        :key="index"
        class="flex flex-col gap-4 hover:shadow-sm transition"
      >
        <div
          v-for="(product, pIdx) in item.factory_products || []"
          :key="`prod-${pIdx}`"
          class="border-b px-3 py-4"
        >
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Images Section -->
            <div class="grid grid-cols-2 gap-3 bg-muted rounded-md border w-max h-24 p-[12px]">
              <!-- Front Image -->
              <div class="flex w-[60px] items-center justify-center overflow-hidden">
                <img
                  v-if="product.front_image"
                  :src="`${storage_url}${product.front_image}`"
                  alt="Front Image"
                  class="object-cover w-full h-full"
                  @error="onImageError"
                />
                <img
                  v-else-if="product.is_custom_product && product.custom_product_placeholder"
                  :src="`${storage_url}${product.custom_product_placeholder}`"
                  alt="Custom Product"
                  class="object-cover w-full h-full"
                  @error="onImageError"
                />
                <img
                  v-else
                  :src="PLACEHOLDER_IMAGE"
                  alt="Placeholder"
                  class="object-cover w-full h-full"
                />
              </div>

              <!-- Back Image -->
              <div class="flex w-[60px] items-center justify-center overflow-hidden">
                <img
                  v-if="product.back_image"
                  :src="`${storage_url}${product.back_image}`"
                  alt="Back Image"
                  class="object-cover w-full h-full"
                  @error="onImageError"
                />
                <img
                  v-else-if="product.is_custom_product && product.custom_product_placeholder"
                  :src="`${storage_url}${product.custom_product_placeholder}`"
                  alt="Custom Product"
                  class="object-cover w-full h-full"
                  @error="onImageError"
                />
                <img
                  v-else
                  :src="PLACEHOLDER_IMAGE"
                  alt="Placeholder"
                  class="object-cover w-full h-full"
                />
              </div>
            </div>

            <!-- Product Info -->
            <div class="flex-1 flex flex-col gap-2">
              <div class="font-semibold text-foreground text-base">
                {{ product.product_name || 'Unnamed Product' }}
              </div>

              <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span
                  >Quantity:
                  <span class="text-foreground">{{
                    product.prices?.total_quantity ?? product.roster_quantity ?? 0
                  }}</span></span
                >
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium capitalize"
                  :style="{
                    backgroundColor: getStatusColor(item.status).bg,
                    color: getStatusColor(item.status).text
                  }"
                >
                  {{ item.status?.replace(/_/g, ' ') || 'Unknown' }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  class="hover:bg-transparent hover:text-primary hover:border hover:border-primary"
                  :title="orders_action_save({}, { locale })"
                >
                  <i-flex-line-save class="size-4" /> {{ orders_action_save({}, { locale }) }}
                </Button>

                <Button
                  size="sm"
                  class="hover:bg-transparent hover:text-primary hover:border hover:border-primary"
                  :title="orders_action_share({}, { locale })"
                >
                  <i-flex-line-share class="size-4" /> {{ orders_action_share({}, { locale }) }}
                </Button>

                <Button
                  size="sm"
                  class="hover:bg-transparent hover:text-primary hover:border hover:border-primary"
                  :title="orders_action_add_to_cart({}, { locale })"
                  :disabled="loadingCart[`${index}-${pIdx}`]"
                  :loading="loadingCart[`${index}-${pIdx}`]"
                  @click.once="addToCart(product, item, index, pIdx)"
                >
                  <i-flex-line-cart class="size-4" /> {{ topbar_cart({}, { locale }) }}
                </Button>
                <Button
                  size="sm"
                  class="hover:bg-transparent hover:text-primary hover:border hover:border-primary"
                  :title="orders_action_reorder({}, { locale })"
                  :disabled="product.can_reorder === false"
                  @click.once="handleReorder(item, product)"
                >
                  <i-flex-line-reorder class="size-4" /> {{ orders_action_reorder({}, { locale }) }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quote Modal -->
    <QuoteModal v-model:open="showQuoteModal" :order="order" @accepted="handleQuoteAccepted" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import OrderSummaryHeader from './OrderSummaryHeader.vue'
  import QuoteModal from './order-timeline/QuoteModal.vue'
  import type { Order } from '@/services/orders/types'
  import { PLACEHOLDER_IMAGE, onImageError } from '@/helpers/imageHelper'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { API } from '@/services'
  import { useTryCatchApi } from '@/composables/useTryCatchApi'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    orders_action_save,
    orders_action_share,
    orders_action_add_to_cart,
    orders_action_reorder,
    topbar_cart
  } from '@/paraglide/messages'
  import { useLoadReorderProductIntoCustomizer } from '@/composables/useLoadReorderProductIntoCustomizer'
  import type { Item, FactoryProduct } from '@/services/orders/types'
  import Button from '@/components/ui/button/Button.vue'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { toast } from 'vue-sonner'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  const props = defineProps<{ order: Order }>()
  const emit = defineEmits<{ (e: 'back'): void; (e: 'reorder-success'): void }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const store = useOrdersStore()
  const profileStore = useProfileStore()
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { component: 'OrderDetailsView' } })
  const { loadReorderProductIntoCustomizer } =
    // isLoading: isReorderLoading
    useLoadReorderProductIntoCustomizer()
  const showQuoteModal = ref(false)
  const locale = computed(() => profileStore.currentLocale || 'en')
  const cartStore = useCartStore()
  const loadingCart = ref<Record<string, boolean>>({})
  const customizationStore = useCustomizationStore()

  async function handleAcceptQuote() {
    showQuoteModal.value = true
  }

  async function handleRejectQuote(order: Order) {
    if (!confirm('Are you sure you want to reject this quote?')) return

    const response = await tryCatchApi(API.orders.rejectQuote(order.id), {
      operation: 'handleRejectQuote',
      order_id: order.id
    })
    if (response.success && response.content?.success) {
      alert(response.content.message || 'Quote rejected successfully')
      await store.fetchOrderDetails(order.id)
    } else {
      alert(
        response.content?.message ||
          response.axiosError?.response?.data?.message ||
          'Failed to reject quote'
      )
    }
  }

  async function handleQuoteAccepted(order: Order) {
    const response = await tryCatchApi(API.orders.acceptQuote(order.id), {
      operation: 'handleQuoteAccepted',
      order_id: order.id
    })
    if (response.success && response.content?.success) {
      alert(response.content.message || 'Quote accepted successfully')
      await store.fetchOrderDetails(order.id)
    } else {
      alert(
        response.content?.message ||
          response.axiosError?.response?.data?.message ||
          'Failed to accept quote'
      )
    }
  }

  async function handleReorder(orderItem: Item, factoryProduct: FactoryProduct) {
    if (!props.order?.id || orderItem?.id == null || factoryProduct?.id == null) return
    const orderId = Number(props.order.id)
    const orderItemId = Number(orderItem.id)
    const factoryProductId = factoryProduct.id
    const productId = Number(factoryProduct.product_id)
    if (!orderId || !orderItemId || !factoryProductId || !productId) return
    // Save reorder data to customization store
    customizationStore.setReorderData(orderItemId, String(factoryProductId))

    const success = await loadReorderProductIntoCustomizer({
      orderItemId,
      factoryProductId
    })
    if (success) {
      emit('reorder-success')
    } else {
      alert('Failed to load reorder product. Please try again.')
      customizationStore.clearReorderData()
    }
  }
  async function addToCart(product: any, item: any, index: number, pIdx: number) {
    const key = `${index}-${pIdx}`
    loadingCart.value[key] = true

    const response = await tryCatchApi(
      API.cart.addToCartFromOrder(product.product_id, item.id, product.id),
      {
        operation: 'addToCartFromOrder'
      }
    )
    if (response.success) {
      toast.success(response.content?.message || 'Product added to cart successfully', {
        position: 'top-right',
        richColors: true
      })
      cartStore.fetchCart(true)
      loadingCart.value[key] = false
    } else {
      toast.error(
        (response.content as any)?.message ||
          response.axiosError?.response?.data?.message ||
          'Failed to add product to cart',
        { position: 'top-right', richColors: true }
      )
      loadingCart.value[key] = false
    }
  }
</script>
