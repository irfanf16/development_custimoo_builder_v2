<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import Button from '@/components/ui/button/Button.vue'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import type { Order } from '@/services/orders/types'
  import { formatDate } from '@/lib/utils'

  defineProps<{
    order: Order
    expanded?: boolean
  }>()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || '' // Vite-compatible env usage

  const emit = defineEmits<{
    (e: 'cancel', order: Order): void
    (e: 'pdf', order: Order): void
    (e: 'details', order: Order): void
  }>()

  function getTotalQuantity(order: Order): number {
    if (!order?.items?.length) return 0

    return order.items.reduce((total, item) => {
      const factoryTotal = (item.factory_products || []).reduce(
        (sum, product) => sum + (product.prices?.total_quantity || 0),
        0
      )
      return total + factoryTotal
    }, 0)
  }
</script>

<template>
  <div
    class="flex flex-col gap-2 py-3 px-4 border-b border-gray-200 transition-colors hover:bg-gray-50"
  >
    <!-- Top Row -->
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold text-gray-800">
          {{ order.order_no || 'N/A' }}
        </div>
        <div class="text-sm text-gray-500">
          {{ order.customer_reference_no || '-' }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="order.items?.some(i => i.status === 'submitted_for_factory_review')"
          size="sm"
          variant="ghost"
          class="text-xs border border-gray-200 hover:bg-gray-100"
          @click="emit('cancel', order)"
        >
          Cancel
        </Button>

        <Button
          size="sm"
          variant="ghost"
          class="text-xs border border-gray-200 hover:bg-gray-100"
          @click="emit('pdf', order)"
        >
          PDF
        </Button>

        <Button
          size="sm"
          variant="ghost"
          class="text-xs border border-gray-200 hover:bg-gray-100"
          @click="emit('details', order)"
        >
          Order Details
        </Button>
      </div>
    </div>

    <!-- Statuses -->

    <!-- Bottom Info -->
    <div class="flex justify-between items-start text-xs text-gray-500">
      <!-- Created At -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-gray-700">Created At</div>
        <div>{{ formatDate(order.created_at) }}</div>
      </div>

      <!-- Statuses -->
      <div class="flex flex-col items-start gap-1 text-center">
        <div class="font-medium text-gray-700">Order Status</div>
        <div class="flex flex-wrap justify-center gap-2">
          <div
            v-for="(item, index) in order.items || []"
            :key="index"
            class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize"
            :style="{
              backgroundColor: getStatusColor(item.status).bg,
              color: getStatusColor(item.status).text
            }"
          >
            {{
              item.status === 'order_approve'
                ? 'Submitted for Factory Review'
                : item.status?.replace(/_/g, ' ') || 'Unknown'
            }}
          </div>
        </div>
      </div>

      <!-- Total Quantity -->
      <div class="flex flex-col items-end gap-1">
        <div class="font-medium text-gray-700">Total Quantity</div>
        <div>{{ getTotalQuantity(order) }}</div>
      </div>
    </div>

    <!-- Expanded Section -->
    <div v-if="expanded" class="pt-3 border-t border-gray-100">
      <div
        v-for="(item, indexItem) in order.items || []"
        :key="'factory-' + indexItem"
        class="flex flex-wrap gap-4"
      >
        <!-- Product Image Grid (3 per row) -->
        <div
          v-for="(product, productIndex) in item.factory_products || []"
          :key="'product-' + productIndex"
          class="relative group w-[calc(33.333%-1rem)] aspect-square bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg overflow-hidden"
        >
          <!-- Product Image -->
          <img
            v-if="!product.is_custom_product"
            :src="`${storage_url}${product.front_image || '/placeholder.png'}`"
            alt="Product"
            class="w-full h-full object-cover"
          />
          <img
            v-else
            :src="`${storage_url}${product.custom_product_placeholder || '/placeholder.png'}`"
            alt="Custom Product"
            class="w-full h-full object-cover"
          />

          <!-- Hover Actions at Bottom -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <button
              class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
              title="Save"
            >
              <i-flex-line-save class="size-4" />
            </button>
            <button
              class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
              title="Share"
            >
              <i-flex-line-share class="size-4" />
            </button>
            <button
              class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
              title="Add to Cart"
            >
              <i-flex-line-cart class="size-4" />
            </button>
            <button
              class="bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
              title="Reorder"
            >
              <i-flex-line-reorder class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
