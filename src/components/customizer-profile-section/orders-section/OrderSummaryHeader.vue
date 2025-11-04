<template>
  <div class="flex items-start justify-between">
    <div>
      <button
        v-if="clickableTitle"
        class="font-semibold text-lg text-primary hover:underline"
        @click="$emit('titleClick')"
      >
        {{ order.order_no || 'N/A' }}
      </button>
      <div v-else class="font-semibold text-lg text-gray-800">{{ order.order_no || 'N/A' }}</div>
      <div class="text-sm text-gray-500">{{ order.customer_reference_no || '-' }}</div>
    </div>
    <div class="flex items-center gap-6 text-xs text-gray-500">
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-gray-700">Created At</div>
        <div>{{ formatDate(order.created_at) }}</div>
      </div>
      <div class="flex flex-col items-end gap-1">
        <div class="font-medium text-gray-700">Total Quantity</div>
        <div>{{ getTotalQuantity(order) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Order } from '@/services/orders/types'
  import { formatDate } from '@/lib/utils'

  defineProps<{ order: Order; clickableTitle?: boolean }>()
  defineEmits<{ (e: 'titleClick'): void }>()

  function getTotalQuantity(order: Order): number {
    const items = order.items ?? []
    return items.reduce(
      (sum, item) => sum + (item.factory_products?.[0]?.prices?.total_quantity ?? 0),
      0
    )
  }
</script>
