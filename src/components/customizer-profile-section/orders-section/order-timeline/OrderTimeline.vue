<template>
  <!-- <div class="p-4 space-y-6"> -->
  <div class="flex flex-col gap-4 sm:gap-6 w-full">
    <template v-for="(item, idx) in order.items || []" :key="`item-${idx}`">
      <!-- class="border rounded p-3 w-full" -->
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
          :title="activityStatus[status_activity.status]?.title ?? ''"
          :index="isaIdx"
          :total-items="item.status_activities.length"
          :alternating="false"
          :activity-date-time="status_activity.created_at"
          :icon="getActivityIcon(status_activity.status)"
          :completed-icon="getActivityIcon(status_activity.status)"
          :activity-user="status_activity.user"
        >
          <TimeLineItemContent
            :activity_content="
              getActivityContent(
                status_activity.activity_items,
                status_activity.status,
                order,
                item
              )
            "
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
    </template>
  </div>
  <!-- </div> -->
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { Order, StatusActivity, Comment } from '@/services/orders/types'
  import { usePermissions } from '@/composables/usePermissions.ts'
  import CommentsList from '@/components/customizer-profile-section/orders-section/order-timeline/order-timeline-comments/CommentsList.vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useOrderTimeline } from '@/components/customizer-profile-section/orders-section/order-timeline/useOrderTimeline'
  import TimeLine from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLine.vue'
  import TimeLineItem from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLineItem.vue'
  import TimeLineItemContent from '@/components/customizer-profile-section/orders-section/order-timeline/TimeLineItemContent.vue'

  defineProps<{ order: Order }>()
  const { activityStatus, CustimooOrderFlowStatuses, getActivityIcon, getActivityContent } =
    useOrderTimeline()
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL
  const { can } = usePermissions()
  const canAddComments = computed(() => can('add-comment'))
  const canEditComments = computed(() => can('edit-comment'))
  const canDeleteComments = computed(() => can('delete-comment'))
  const { customer: currentUser } = storeToRefs(useAuthStore())

  const handleCommentsUpdated = (activity: StatusActivity, comments: Comment[]) => {
    activity.comments = comments
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
</script>
