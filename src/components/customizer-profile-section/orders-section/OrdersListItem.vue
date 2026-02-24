<script setup lang="ts">
  import { computed } from 'vue'
  import type { FactoryProduct, Item, Order } from '@/services/orders/types'
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
  import { RefreshCw, Copy } from 'lucide-vue-next'
  import { toast } from 'vue-sonner'
  import { useUIStore } from '@/stores/ui/ui.store'

  const props = defineProps<{
    order: Order
    expanded?: boolean
  }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const store = useOrdersStore()
  const profileStore = useProfileStore()
  const uiStore = useUIStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const emit = defineEmits<{ (e: 'back'): void; (e: 'reorder-success'): void }>()

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

  async function addToCart(product: FactoryProduct, item: Item, index: number, pIdx: number) {
    const key = `${index}-${pIdx}`
    await store.addProductToCartFromOrder(product, item, key)
  }

  async function handleReorder(orderItem: Item, factoryProduct: FactoryProduct) {
    const success = await store.reorderProduct(props.order, orderItem, factoryProduct, () => {
      emit('reorder-success')
    })
    if (!success) {
      // Error is already handled in store
    }
  }

  async function handleShareDesign(item: Item, product: FactoryProduct) {
    await store.shareOrderProductDesign(props.order, item, product)
  }

  async function handleSaveToLocker(item: Item, product: FactoryProduct) {
    // Pass order product data to save design dialog
    uiStore.openSaveDesignDialog({
      product,
      item,
      order: props.order
    })
  }

  function copyShareUrl(url: string, event?: Event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!', {
        position: 'top-right',
        richColors: true,
        duration: 2000
      })
    })
  }
</script>

<template>
  <div
    class="flex flex-col gap-2 py-3 px-4 border-b transition-colors hover:bg-muted/50 cursor-pointer"
    @click="showOrderDetails(order)"
  >
    <!-- Top Row -->
    <OrderSummaryHeader
      :order="order"
      :show-timeline="false"
      @cancel="store.cancelOrder"
      @pdf="store.downloadOrderPdf"
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
            <Button
              size="sm"
              class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary"
              :title="orders_action_save({}, { locale })"
              @click.stop="handleSaveToLocker(item, product)"
            >
              <i-flex-line-save class="size-4" />
            </Button>
            <template v-if="product.share_design_info?.share_url">
              <Button
                size="sm"
                class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary"
                :title="'Copy Share Url'"
                @click.stop="copyShareUrl(product.share_design_info.share_url!, $event)"
              >
                <Copy class="size-4" />
              </Button>
            </template>
            <Button
              v-else
              size="sm"
              class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary disabled:cursor-not-allowed"
              :title="orders_action_share({}, { locale })"
              :disabled="store.loadingShare[`${item.id}-${product.id}`]"
              @click.stop="handleShareDesign(item, product)"
            >
              <i-flex-line-share
                v-if="!store.loadingShare[`${item.id}-${product.id}`]"
                class="size-4"
              />
              <RefreshCw v-else class="size-4 animate-spin" />
            </Button>
            <Button
              size="sm"
              class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary disabled:cursor-not-allowed"
              :title="orders_action_add_to_cart({}, { locale })"
              :disabled="store.loadingCart[`${index}-${pIdx}`]"
              :loading="store.loadingCart[`${index}-${pIdx}`]"
              @click.once.stop="addToCart(product, item, index, pIdx)"
            >
              <i-flex-line-cart class="size-4" />
            </Button>
            <Button
              size="sm"
              class="hover:bg-transparent rounded-full p-1.5 hover:text-primary hover:border hover:border-primary disabled:cursor-not-allowed"
              :title="orders_action_reorder({}, { locale })"
              :disabled="!product.can_reorder || Boolean(order.order_no) === false"
              @click.once.stop="handleReorder(item, product)"
            >
              <RefreshCw class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
