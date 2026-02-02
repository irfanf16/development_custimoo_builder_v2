<template>
  <div class="flex flex-col w-full items-start justify-between">
    <div class="flex items-center justify-between w-full">
      <div>
        <div class="font-semibold text-foreground">#{{ order.order_no || 'N/A' }}</div>
        <div class="text-sm text-muted-foreground">
          {{ order.customer_reference_no || '-' }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <template v-if="isQuoteOrder && showQuoteButtons">
          <Button size="sm" variant="secondary" class="text-xs" @click="emit('acceptQuote', order)">
            Accept Quote
          </Button>
          <Button
            size="sm"
            variant="destructive"
            class="text-xs"
            @click="emit('rejectQuote', order)"
          >
            Reject Quote
          </Button>
        </template>
        <Button
          v-if="order.items?.some(i => i.status === 'submitted_for_factory_review')"
          size="sm"
          variant="ghost"
          class="text-xs border"
          @click="emit('cancel', order)"
        >
          Cancel
        </Button>

        <Button size="sm" variant="ghost" class="text-xs border" @click="emit('pdf', order)">
          PDF
        </Button>

        <Button
          v-if="!showTimeline"
          size="sm"
          variant="ghost"
          class="text-xs border"
          @click="emit('details', order)"
        >
          Order Details
        </Button>
        <Button
          v-if="showTimeline"
          size="sm"
          variant="ghost"
          class="text-xs border"
          @click="openTimeline()"
        >
          Order Timeline
        </Button>
      </div>
    </div>

    <!-- Bottom Info -->
    <div class="grid grid-cols-3 gap-4 text-xs text-gray-500 w-full items-start mt-2">
      <!-- Created At -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">Created At</div>
        <div class="text-foreground">{{ formatDate(order.created_at) }}</div>
      </div>

      <!-- Statuses -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">Order Status</div>
        <div class="flex flex-wrap gap-2">
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
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">Total Quantity</div>
        <div class="text-foreground">{{ getTotalQuantity(order) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Order } from '@/services/orders/types'
  import { formatDate } from '@/lib/utils'
  import { getStatusColor } from '@/helpers/orderStatuses'
  import Button from '@/components/ui/button/Button.vue'
  import { useOrdersStore } from '@/stores/orders/orders.store'

  const props = defineProps<{ order: Order; clickableTitle?: boolean; showTimeline?: boolean }>()
  const emit = defineEmits<{
    (e: 'titleClick'): void
    (e: 'cancel', order: Order): void
    (e: 'pdf', order: Order): void
    (e: 'details', order: Order): void
    (e: 'acceptQuote', order: Order): void
    (e: 'rejectQuote', order: Order): void
  }>()

  const isQuoteOrder = computed(() => props.order.is_quote_order === true)

  const showQuoteButtons = computed(() => {
    if (!isQuoteOrder.value || !props.order.items?.length) return false
    const lastOrderItem = props.order.items[props.order.items.length - 1]
    return lastOrderItem?.status === 'quote_provided'
  })

  const store = useOrdersStore()
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
