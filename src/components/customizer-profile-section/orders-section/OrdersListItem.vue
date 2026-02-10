<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { Order } from '@/services/orders/types'
  import OrderSummaryHeader from './OrderSummaryHeader.vue'
  import { PLACEHOLDER_IMAGE, onImageError } from '@/helpers/imageHelper'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    orders_action_save,
    orders_action_share,
    orders_action_add_to_cart,
    orders_action_reorder
  } from '@/paraglide/messages'
  import Button from '@/components/ui/button/Button.vue'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useTryCatchApi } from '@/composables'
  import { API } from '@/services'
  import { toast } from 'vue-sonner'

  const props = defineProps<{
    order: Order
    expanded?: boolean
  }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || '' // Vite-compatible env usage
  const store = useOrdersStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const cartStore = useCartStore()
  const loadingCart = ref<Record<string, boolean>>({})
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { component: 'OrderDetailsView' } })

  function showOrderDetails(order: Order) {
    store.openOrderDetails(order)
  }
  const flattenedProducts = computed(() => {
    return (
      props.order.items?.flatMap((item, itemIndex) => {
        return (item.factory_products || []).map((product, pIdx) => ({
          product,
          item,
          itemIndex,
          pIdx
        }))
      }) || []
    )
  })
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

<template>
  <div class="flex flex-col gap-2 py-3 px-4 border-b transition-colors hover:bg-muted/50">
    <!-- Top Row -->
    <OrderSummaryHeader
      :order="order"
      :show-timeline="false"
      @cancel="store.cancelOrder"
      @pdf="() => {}"
      @details="() => showOrderDetails(order)"
    />

    <!-- Expanded Section -->
    <div v-if="expanded" class="pt-3 border-t">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Flatten all factory_products into one list -->
        <div
          v-for="({ product, item, itemIndex, pIdx }, index) in flattenedProducts"
          :key="`product-${itemIndex}-${pIdx}`"
          class="relative group bg-muted border rounded-lg overflow-hidden aspect-square"
        >
          <!-- Product Image -->
          <img
            v-if="!product.is_custom_product"
            :src="`${storage_url}${product.front_image || PLACEHOLDER_IMAGE}`"
            alt="Product"
            class="w-full h-full object-cover"
            @error="onImageError"
          />
          <img
            v-else
            :src="`${storage_url}${product.custom_product_placeholder || PLACEHOLDER_IMAGE}`"
            alt="Custom Product"
            class="w-full h-full object-cover"
            @error="onImageError"
          />

          <!-- Hover Actions -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-foreground/40 backdrop-blur-sm py-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <button
              class="bg-background rounded-full p-1.5 shadow transition"
              :title="orders_action_save({}, { locale })"
            >
              <i-flex-line-save class="size-4" />
            </button>
            <button
              class="bg-background rounded-full p-1.5 shadow transition"
              :title="orders_action_share({}, { locale })"
            >
              <i-flex-line-share class="size-4" />
            </button>
            <Button
              size="sm"
              class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary"
              :title="orders_action_add_to_cart({}, { locale })"
              :disabled="loadingCart[`${index}-${pIdx}`]"
              :loading="loadingCart[`${index}-${pIdx}`]"
              @click="addToCart(product, item, index, pIdx)"
            >
              <i-flex-line-cart class="size-4" />
            </Button>
            <button
              class="bg-background rounded-full p-1.5 shadow transition"
              :title="orders_action_reorder({}, { locale })"
            >
              <i-flex-line-reorder class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
