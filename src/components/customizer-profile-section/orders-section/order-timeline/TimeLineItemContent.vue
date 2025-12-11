<template>
  <div>
    <!-- <pre>{{ activity_content }}</pre> -->
    <div class="h-max">
      <slot></slot>
    </div>
    <div v-if="!isNullOrEmpty(reference_no)" class="flex text-sm text-muted-foreground mb-2">
      <span class="font-semibold">Customer Reference No:</span>
      <span class="px-2 py-1 text-xs">{{ reference_no }}</span>
    </div>
    <div
      v-if="activity_content.content_group && activity_content.content_group.length > 0"
      class="grid grid-cols-3 gap-2 mb-4"
    >
      <div
        v-for="(content, index) in activity_content.content_group"
        :key="`image-${index}`"
        class="h-max"
      >
        <div
          v-if="
            content.third_party_approval_obj && content.third_party_approval_obj.approval_status
          "
          class="mb-2"
        >
          <span
            class="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full"
            :class="{
              'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300':
                content.third_party_approval_obj.approval_status === 'pending',
              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300':
                content.third_party_approval_obj.approval_status === 'accepted',
              'bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive':
                content.third_party_approval_obj.approval_status === 'rejected'
            }"
          >
            Third Party Status:
            {{
              content.third_party_approval_obj.approval_status.charAt(0).toUpperCase() +
              content.third_party_approval_obj.approval_status.slice(1)
            }}
          </span>
        </div>

        <div
          v-if="content.images && content.images.length > 0"
          class="border border-border rounded-lg p-3 h-full bg-card"
        >
          <div class="flex items-center gap-2 mb-2 justify-between">
            <div class="flex min-h-[22px] items-center">
              <div v-if="content.nickName" class="text-sm text-muted-foreground mb-2">
                <span class="font-semibold">Nick Name:</span>
                <span class="px-2 py-1 text-xs">
                  {{ content.nickName }}
                </span>
              </div>
              <div v-else>
                <div class="h-full"></div>
              </div>
            </div>

            <!-- <button class="bg-primary text-white rounded-md text-center p-1">
              <QueueListIcon class="size-6" />
            </button> -->
          </div>
          <div class="grid grid-cols-2">
            <template v-for="(image, _imgIdx) in content.images" :key="_imgIdx">
              <img
                :src="image.url ? `${storage_url}${image.url}` : `${PLACEHOLDER_IMAGE}`"
                :alt="image?.alt || ''"
                class="object-contain h-[200px] max-h-[200px]"
                @click="onImageClick(image?.url ?? null)"
                @error="onImageError"
              />
            </template>
          </div>
          <div
            v-if="
              content.third_party_approval_obj &&
              content.third_party_approval_obj.approval_status === 'rejected' &&
              content.third_party_approval_obj.feedback
            "
            class="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-md p-3 mb-2 mt-2"
          >
            <div class="text-sm mb-1">
              <span class="text-destructive mr-2 font-bold">Rejection Feedback</span>
            </div>
            <div class="text-destructive text-sm">
              {{ content.third_party_approval_obj.feedback }}
            </div>
          </div>
        </div>
        <div
          v-if="!isNullOrEmpty(content.design_id) && content.images.length > 0"
          class="text-sm mb-2"
        >
          <span class="font-semibold">Design ID:</span>
          <span class="px-2 py-1 text-xs">{{ content.design_id }}</span>
        </div>

        <div v-if="content.addons.length > 0" class="flex gap-2 text-sm mb-2">
          <div class="flex flex-wrap gap-1">
            <span class="font-semibold pr-1">Addons:</span>
            <span
              v-for="addon in content.addons"
              :key="`addon-${addon.addon_id}`"
              class="px-2 py-1 bg-primary text-primary-foreground rounded-lg text-[12px] font-normal"
            >
              {{ addon.title }}
            </span>
          </div>
        </div>

        <div v-if="!isNullOrEmpty(content.skipReason)" class="flex gap-2 mb-2 text-sm">
          <span class="font-semibold">Skip Reason:</span>
          <span class="px-2 py-1 text-xs">
            {{ content.skipReason }}
          </span>
        </div>

        <div v-if="!isNullOrEmpty(content.message)" class="flex gap-2 mb-2 text-sm">
          <span class="font-semibold">Feedback:</span>
          <span class="text-muted-foreground">{{ content.message }}</span>
        </div>
        <div
          v-if="
            activity_content.activity_status === CustimooOrderFlowStatuses.FACTORYREVIEW &&
            !isNullOrEmpty(content.reorder_message)
          "
          class="text-sm text-muted-foreground"
        >
          {{ content.reorder_message }}
        </div>
      </div>
    </div>
    <template v-if="activity_content.general_comments">
      <strong class="font-bold">General Comments: </strong>
      <span class="text-sm text-muted-foreground">
        {{ activity_content.general_comments }}
      </span>
    </template>
    <div
      v-if="
        activity_content.activity_status === 'quality_control' &&
        activity_content.content_group.find(item => 'quality_control' in item)
      "
      class="text-sm text-muted-foreground w-full"
    >
      <ol class="list-decimal list-inside">
        <li
          v-for="(report, reportIdx) in activity_content.content_group.find(
            item => 'quality_control' in item
          )?.quality_control?.reports || []"
          :key="`report-${reportIdx}`"
        >
          QC report {{ report.status }}:
          <a class="text-primary hover:underline" :href="report.pdf_url" target="_blank">
            {{ decodeURIComponent(report.pdf_name) }}
          </a>
          submitted at {{ report.created_at }}
        </li>
      </ol>
    </div>
    <div class="h-max">
      <slot name="comments"> </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onImageError, PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { useOrderTimeline } from '@/components/customizer-profile-section/orders-section/order-timeline/useOrderTimeline'
  import type { GetActivityContentReturn } from '@/services/orders/types'

  interface Props {
    activity_content?: GetActivityContentReturn
    reference_no?: string
    order_item_id?: number | string
  }

  withDefaults(defineProps<Props>(), {
    activity_content: () => ({
      content_group: [],
      activity_status: '',
      general_comments: null
    })
  })

  const storage_url = import.meta.env.VITE_APP_STORAGE_URL
  const emit = defineEmits(['showPreview'])
  const { isNullOrEmpty, CustimooOrderFlowStatuses } = useOrderTimeline()

  const onImageClick = (image_url: string) => {
    if (image_url) {
      emit('showPreview', image_url)
    }
    return
  }
</script>
