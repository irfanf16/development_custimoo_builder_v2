<template>
  <!-- <div class="p-4 space-y-6"> -->
  <div class="flex flex-col gap-4 sm:gap-6 w-full">
    <Tabs v-if="order.items && order.items.length > 0" v-model="activeTab">
      <TabsList
        class="grid w-1/2"
        :style="{ gridTemplateColumns: `repeat(${order.items.length}, 1fr)` }"
      >
        <TabsTrigger
          v-for="(_item, idx) in order.items"
          :key="`tab-trigger-${idx}`"
          :value="`factory-${idx}`"
        >
          Factory {{ idx + 1 }}
        </TabsTrigger>
      </TabsList>
      <template v-for="(item, idx) in order.items || []" :key="`item-${idx}`">
        <TabsContent :value="`factory-${idx}`" class="mt-4">
          <TimeLine
            :order-status="item.status"
            :is-order-status="false"
            :current-step="1"
            :total-items="item.status_activities.length"
            :direction="'vertical'"
            :alternating="false"
          >
            <TimeLineItem
              v-for="(status_activity, isaIdx) in item.status_activities"
              :key="`timeline-item-${isaIdx}`"
              :attribution="getAttributionHtml(status_activity)"
              :title="getActivityTitle(status_activity, isaIdx, item.status_activities.length)"
              :index="isaIdx"
              :total-items="item.status_activities.length"
              :alternating="false"
              :activity-date-time="formatDate(status_activity.created_at, 'HH:MM DDth MMM YYYY')"
              :icon="getActivityIcon(status_activity.status)"
              :completed-icon="getActivityIcon(status_activity.status)"
              :activity-user="status_activity.user"
            >
              <TimeLineItemContent
                :activity-content="
                  getActivityContent(
                    status_activity.activity_items,
                    status_activity.status,
                    order,
                    item
                  )
                "
                :order="order"
                :order-item="item"
                :status-activity="status_activity"
                :order-item-index="idx"
                :status-activity-index="isaIdx"
                @show-preview="contentGroup => handleImagePreview(contentGroup)"
                @order-item-updated="updatedItem => handleOrderItemUpdated(idx, updatedItem)"
              >
                <template #comments>
                  <CommentsList
                    :order_item_id="item.id as number"
                    :isa-idx="isaIdx"
                    :api-url="`/order_item/${status_activity.id}/comment`"
                    :current-user="currentUser"
                    :can-add-comments="canAddComments"
                    :can-edit-comments="canEditComments"
                    :can-delete-comments="canDeleteComments"
                    :initial-comments="status_activity.comments || []"
                    :storage-url="storageUrl"
                    @comments-updated="
                      (comments: Comment[]) => handleCommentsUpdated(status_activity, comments)
                    "
                  />
                </template>
              </TimeLineItemContent>
            </TimeLineItem>
          </TimeLine>
        </TabsContent>
      </template>
    </Tabs>

    <!-- Image Preview Dialog -->
    <ImagePreview
      v-model:open="showImagePreview"
      :content_group="selectedContentGroup"
      :images="selectedImages"
    />

    <!-- Quote Modal -->
    <QuoteModal v-model:open="showQuoteModal" :order="order" @accepted="handleQuoteAccepted" />
  </div>
  <!-- </div> -->
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { Order, StatusActivity, Comment, ContentGroup, Item } from '@/services/orders/types'
  import { usePermissions } from '@/composables/usePermissions.ts'
  import CommentsList from '@/components/customizer-profile-section/orders-section/order-timeline/order-timeline-comments/CommentsList.vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useOrderTimeline } from '@/components/customizer-profile-section/orders-section/order-timeline/useOrderTimeline'
  import TimeLine from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLine.vue'
  import TimeLineItem from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLineItem.vue'
  import TimeLineItemContent from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLineItemContent.vue'
  import ImagePreview from '@/components/customizer-profile-section/orders-section/order-timeline/ImagePreview.vue'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import QuoteModal from './QuoteModal.vue'
  import { API } from '@/services'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { useTryCatchApi } from '@/composables/useTryCatchApi'
  import { formatDate } from '@/lib/utils'

  const props = defineProps<{ order: Order }>()
  const order = computed(() => props.order)
  const { activityStatus, CustimooOrderFlowStatuses, getActivityIcon, getActivityContent } =
    useOrderTimeline()
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL
  const { can } = usePermissions()
  const canAddComments = computed(() => can('add-comment'))
  const canEditComments = computed(() => can('edit-comment'))
  const canDeleteComments = computed(() => can('delete-comment'))
  const { customer: currentUser } = storeToRefs(useAuthStore())
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { component: 'OrderTimeline' } })

  const activeTab = ref('factory-0')
  const showQuoteModal = ref(false)
  const ordersStore = useOrdersStore()

  // Reset active tab when order changes
  watch(
    () => order.value?.id,
    () => {
      activeTab.value = 'factory-0'
    }
  )
  const showImagePreview = ref(false)
  const selectedContentGroup = ref<ContentGroup | undefined>(undefined)
  const selectedImages = ref<Array<{ url: string; alt?: string }> | undefined>(undefined)

  const handleImagePreview = (
    contentGroup: ContentGroup | Array<{ url: string; alt?: string }>
  ) => {
    if (Array.isArray(contentGroup)) {
      // If it's an array of images
      selectedImages.value = contentGroup
      selectedContentGroup.value = undefined
    } else {
      // If it's a ContentGroup
      selectedContentGroup.value = contentGroup
      selectedImages.value = undefined
    }
    showImagePreview.value = true
  }

  const handleCommentsUpdated = (activity: StatusActivity, comments: Comment[]) => {
    activity.comments = comments
  }

  const handleOrderItemUpdated = (itemIndex: number, updatedItem: Item) => {
    if (order.value?.items) {
      order.value.items[itemIndex] = updatedItem
    }
  }

  const getActivityTitle = (
    status_activity: StatusActivity,
    activityIndex: number,
    totalActivities: number
  ): string => {
    // Show "Artwork Updated" for factory review when it's not the last activity
    if (
      status_activity.status === CustimooOrderFlowStatuses.FACTORYREVIEW &&
      activityIndex + 1 !== totalActivities
    ) {
      return 'Artwork Updated'
    }
    return activityStatus[status_activity.status as keyof typeof activityStatus]?.title ?? ''
  }

  const getAttributionHtml = (status_activity: StatusActivity): string => {
    const message =
      activityStatus[status_activity.status as keyof typeof activityStatus]?.message || ''
    let html = `<div class="activity-text p-2 text-sm text-muted-foreground">`

    if (
      status_activity.status === CustimooOrderFlowStatuses.ORDERINPRODUCTION ||
      status_activity.status === CustimooOrderFlowStatuses.CUSTOMERREVIEW
    ) {
      html += message
    } else {
      html += message
      if (
        status_activity.status === CustimooOrderFlowStatuses.QUALITYCONTROL &&
        status_activity.quality_control_status
      ) {
        let badgeClass = ''
        switch (status_activity.quality_control_status) {
          case 'Approved':
            badgeClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            break
          case 'Rejected':
            badgeClass =
              'bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive'
            break
          case 'Pending':
            badgeClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
            break
        }
        html += `
        <div class="mt-1">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
            ${status_activity.quality_control_status}
          </span>
        </div>
      `
      }
    }
    html += `</div>`
    return html
  }

  async function handleQuoteAccepted(orderToAccept: Order) {
    const response = await tryCatchApi(API.orders.acceptQuote(orderToAccept.id), {
      operation: 'handleQuoteAccepted',
      order_id: orderToAccept.id
    })
    if (response.success && response.content?.success) {
      alert(response.content.message || 'Quote accepted successfully')
      await ordersStore.fetchOrderDetails(orderToAccept.id)
    } else {
      alert(
        response.content?.message ||
          response.axiosError?.response?.data?.message ||
          'Failed to accept quote'
      )
    }
  }
</script>
