<template>
  <div class="flex flex-col w-full items-start justify-between">
    <div class="flex items-center justify-between w-full">
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
          v-if="!showTimeline"
          size="sm"
          variant="ghost"
          class="text-xs border border-gray-200 hover:bg-gray-100"
          @click="emit('details', order)"
        >
          Order Details
        </Button>
        <Button
          v-if="showTimeline"
          size="sm"
          variant="ghost"
          class="text-xs border border-gray-200 hover:bg-gray-100"
          @click="openTimeline()"
        >
          Order Timeline
        </Button>
      </div>
    </div>

    <!-- Bottom Info -->
    <div class="flex justify-between items-start text-xs text-gray-500 w-full">
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
  </div>
</template>

<script setup lang="ts">
  import type { Order } from '@/services/orders/types'
  import { formatDate } from '@/lib/utils'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import Button from '@/components/ui/button/Button.vue'

  const props = defineProps<{ order: Order; clickableTitle?: boolean; showTimeline?: boolean }>()
  const emit = defineEmits<{
    (e: 'titleClick'): void
    (e: 'cancel', order: Order): void
    (e: 'pdf', order: Order): void
    (e: 'details', order: Order): void
  }>()

  const store = useProfileStore()
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
  function openTimeline() {
    if (!props.order?.id) return
    // Fetch latest detail and update breadcrumb to include timeline wording
    store.openOrderTimeline(props.order.id)
  }
</script>
