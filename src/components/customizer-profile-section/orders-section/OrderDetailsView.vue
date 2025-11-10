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
            <div class="grid grid-cols-2 gap-3 bg-accent rounded-md border w-max h-24 p-[12px]">
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
                <button
                  class="flex items-center justify-center gap-1 border text-base text-sm px-4 py-2 rounded-md transition"
                  title="Save"
                >
                  <i-flex-line-save class="size-4" /> Save
                </button>

                <button
                  class="flex items-center justify-center gap-1 border text-base text-sm px-4 py-2 rounded-md transition"
                  title="Share"
                >
                  <i-flex-line-share class="size-4" /> Share
                </button>

                <button
                  class="flex items-center justify-center gap-1 border text-base text-sm px-4 py-2 rounded-md transition"
                  title="Add to Cart"
                >
                  <i-flex-line-cart class="size-4" /> Cart
                </button>

                <button
                  class="flex items-center justify-center gap-1 border text-base text-sm px-4 py-2 rounded-md transition"
                  title="Reorder"
                >
                  <i-flex-line-reorder class="size-4" /> Reorder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import OrderSummaryHeader from './OrderSummaryHeader.vue'
  import type { Order } from '@/services/orders/types'
  import { PLACEHOLDER_IMAGE, onImageError } from '@/helpers/imageHelper'
  import { useOrdersStore } from '@/stores/orders/orders.store'

  defineProps<{ order: Order }>()
  defineEmits<{ (e: 'back'): void }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const store = useOrdersStore()
</script>
