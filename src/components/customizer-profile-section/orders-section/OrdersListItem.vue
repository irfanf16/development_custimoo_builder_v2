<script setup lang="ts">
  import { defineProps } from 'vue'
  import type { Order } from '@/services/orders/types'
  import OrderSummaryHeader from './OrderSummaryHeader.vue'
  import { PLACEHOLDER_IMAGE, onImageError } from '@/helpers/imageHelper'
  import { useOrdersStore } from '@/stores/orders/orders.store'

  defineProps<{
    order: Order
    expanded?: boolean
  }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || '' // Vite-compatible env usage
  const store = useOrdersStore()

  function showOrderDetails(order: Order) {
    store.openOrderDetails(order)
  }
</script>

<template>
  <div class="flex flex-col gap-2 py-3 px-4 border-b transition-colors hover:bg-gray-50">
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
          v-for="(product, index) in order.items?.flatMap(item => item.factory_products || [])"
          :key="'product-' + index"
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
            <button class="bg-background rounded-full p-1.5 shadow transition" title="Save">
              <i-flex-line-save class="size-4" />
            </button>
            <button class="bg-background rounded-full p-1.5 shadow transition" title="Share">
              <i-flex-line-share class="size-4" />
            </button>
            <button class="bg-background rounded-full p-1.5 shadow transition" title="Add to Cart">
              <i-flex-line-cart class="size-4" />
            </button>
            <button class="bg-background rounded-full p-1.5 shadow transition" title="Reorder">
              <i-flex-line-reorder class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
