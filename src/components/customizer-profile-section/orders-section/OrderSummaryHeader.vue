<template>
  <div class="flex flex-col w-full items-start justify-between" data-testid="profile-orders-summary-header">
    <div class="flex items-center justify-between w-full">
      <div>
        <div class="font-semibold text-foreground">#{{ order.order_no || t.orderNoNa }}</div>
        <div class="text-sm text-muted-foreground">
          {{ order.customer_reference_no || '-' }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <template v-if="isQuoteOrder && showQuoteButtons">
          <Button size="sm" variant="secondary" class="text-xs" @click="emit('acceptQuote', order)">
            {{ t.acceptQuote }}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            class="text-xs"
            @click="emit('rejectQuote', order)"
          >
            {{ t.rejectQuote }}
          </Button>
        </template>
        <Button
          v-if="order.items?.every(i => i.status === 'submitted_for_factory_review')"
          size="sm"
          variant="outline"
          class="bg-muted hover:bg-muted/80 hover:text-red-600 hover:border-red-600"
          @click.stop="handleCancelOrder"
        >
          {{ t.cancel }}
        </Button>

        <Button
          v-if="!order.additional_fields.is_manual_order"
          size="sm"
          variant="outline"
          class="bg-muted hover:bg-muted/80 hover:text-primary hover:border-primary"
          @click.stop="handleDownloadPdf"
        >
          {{ t.pdf }}
        </Button>

        <Button
          v-if="!showTimeline"
          size="sm"
          variant="outline"
          class="bg-muted hover:bg-muted/80 hover:text-primary hover:border-primary"
          @click="emit('details', order)"
        >
          {{ t.orderDetails }}
        </Button>
        <Button
          v-if="showTimeline"
          size="sm"
          variant="outline"
          class="bg-muted hover:bg-muted/80"
          data-testid="profile-orders-button-timeline"
          @click.stop="openTimeline()"
        >
          {{ t.orderTimeline }}
        </Button>
      </div>
    </div>

    <!-- Bottom Info -->
    <div class="grid grid-cols-3 gap-4 text-xs text-gray-500 w-full items-start mt-2">
      <!-- Created At -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">{{ t.createdAt }}</div>
        <div class="text-foreground">{{ formatDate(order.created_at) }}</div>
      </div>

      <!-- Statuses -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">{{ t.orderStatus }}</div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(item, index) in order.items || []"
            :key="index"
            class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize text-center"
            :style="{
              backgroundColor: getStatusColor(item.status).bg,
              color: getStatusColor(item.status).text
            }"
          >
            {{
              item.status === 'order_approve'
                ? t.submittedForFactoryReview
                : item.status?.replace(/_/g, ' ') || t.statusUnknown
            }}
          </div>
        </div>
      </div>

      <!-- Total Quantity -->
      <div class="flex flex-col items-start gap-1">
        <div class="font-medium text-muted-foreground">{{ t.totalQuantity }}</div>
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
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    orders_order_no_na,
    orders_accept_quote,
    orders_reject_quote,
    orders_cancel,
    orders_pdf,
    orders_order_details,
    orders_order_timeline,
    orders_created_at,
    orders_order_status,
    orders_submitted_for_factory_review,
    orders_status_unknown,
    orders_total_quantity
  } from '@/paraglide/messages'

  const props = defineProps<{ order: Order; clickableTitle?: boolean; showTimeline?: boolean }>()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale)
  const t = computed(() => ({
    orderNoNa: orders_order_no_na({}, { locale: locale.value }),
    acceptQuote: orders_accept_quote({}, { locale: locale.value }),
    rejectQuote: orders_reject_quote({}, { locale: locale.value }),
    cancel: orders_cancel({}, { locale: locale.value }),
    pdf: orders_pdf({}, { locale: locale.value }),
    orderDetails: orders_order_details({}, { locale: locale.value }),
    orderTimeline: orders_order_timeline({}, { locale: locale.value }),
    createdAt: orders_created_at({}, { locale: locale.value }),
    orderStatus: orders_order_status({}, { locale: locale.value }),
    submittedForFactoryReview: orders_submitted_for_factory_review({}, { locale: locale.value }),
    statusUnknown: orders_status_unknown({}, { locale: locale.value }),
    totalQuantity: orders_total_quantity({}, { locale: locale.value })
  }))
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

  function handleDownloadPdf() {
    emit('pdf', props.order)
  }

  function handleCancelOrder() {
    emit('cancel', props.order)
  }
</script>
