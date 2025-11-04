<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import Button from '@/components/ui/button/Button.vue'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import type { Order } from '@/services/orders/types'

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
          Details
        </Button>
      </div>
    </div>

    <!-- Statuses -->
    <div class="flex flex-wrap justify-center gap-2 mt-2">
      <div
        v-for="(item, index) in order.items || []"
        :key="index"
        class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize"
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

    <!-- Bottom Info -->
    <div class="flex justify-between items-center text-xs text-gray-500">
      <div>Created: {{ order.created_at || 'N/A' }}</div>
      <div>Total Quantity: {{ getTotalQuantity(order) }}</div>
    </div>

    <!-- Expanded Section -->
    <div v-if="expanded" class="pt-3 border-t border-gray-100">
      <div
        v-for="(item, indexItem) in order.items || []"
        :key="'factory-' + indexItem"
        class="mb-4"
      >
        <div class="text-sm font-medium text-gray-700 mb-2">
          Factory {{ indexItem + 1 }}
          <span
            class="ml-2 px-2 py-1 rounded text-xs font-medium capitalize"
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
          </span>
        </div>

        <div class="flex flex-wrap gap-3">
          <div
            v-for="(product, productIndex) in item.factory_products || []"
            :key="'product-' + productIndex"
            class="flex items-center gap-2 border border-gray-200 p-2 rounded-md w-full sm:w-auto"
          >
            <template v-if="product.is_custom_product">
              <img
                :src="`${storage_url}${product.custom_product_placeholder || '/placeholder.png'}`"
                alt="Product"
                class="w-16 h-16 object-cover rounded border"
              />
            </template>
            <template v-else>
              <img
                :src="`${storage_url}${product.front_image || '/placeholder.png'}`"
                alt="Front"
                class="w-16 h-16 object-cover rounded border"
              />
              <img
                :src="`${storage_url}${product.back_image || '/placeholder.png'}`"
                alt="Back"
                class="w-16 h-16 object-cover rounded border"
              />
            </template>

            <div>
              <div class="text-sm font-semibold">
                {{ product.product_name || 'Unnamed Product' }}
              </div>
              <div class="text-xs text-gray-500">Quantity: {{ product.roster_quantity || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
