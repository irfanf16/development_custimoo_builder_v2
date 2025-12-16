<template>
  <Dialog v-model:open="isOpen">
    <DialogContent variant="large" class="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-3">
            <DialogTitle class="text-xl font-bold text-foreground">Artwork Approval</DialogTitle>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {{ currentIndex + 1 }} / {{ activityItems.length }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button v-if="currentItem?.action" variant="outline" size="sm" disabled class="text-sm">
              {{ currentItem.action === 'accept' ? 'Accepted' : 'Rejected' }}
            </Button>
          </div>
        </div>
      </DialogHeader>
      <ScrollArea class="h-full overflow-y-auto">
        <div
          v-if="activityItems.length === 0"
          class="flex flex-col items-center justify-center py-12 px-4"
        >
          <p class="text-lg font-semibold text-foreground mb-2">No items require approval</p>
          <p class="text-sm text-muted-foreground text-center mb-6">
            All samples have approval skipped and do not require customer approval.
          </p>
          <Button variant="default" @click="closeDialog">Close</Button>
        </div>

        <div v-else-if="currentItem" class="space-y-6">
          <!-- Image Navigation -->
          <div class="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              :disabled="currentIndex === 0"
              @click="navigateActivity('back')"
            >
              <ChevronLeftIcon class="w-5 h-5" />
            </Button>

            <div class="flex-1 grid grid-cols-2 gap-4">
              <div
                v-for="(file, fileIndex) in currentItem.files"
                :key="`file-${fileIndex}`"
                class="relative"
              >
                <img
                  :ref="el => setImageRef(el as HTMLElement | null, fileIndex)"
                  :src="file.file"
                  :alt="`Preview ${fileIndex + 1}`"
                  class="w-full h-full rounded-lg border border-border hover:opacity-90 transition-opacity"
                  style="max-height: 500px; object-fit: contain"
                  crossorigin="anonymous"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              :disabled="currentIndex === activityItems.length - 1"
              @click="navigateActivity('next')"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </Button>
          </div>

          <!-- Feedback Section -->
          <div class="space-y-3">
            <h4 class="text-lg font-semibold text-foreground">Write your feedback</h4>
            <textarea
              v-model="currentItem.message"
              placeholder="Please write your feedback here..."
              rows="5"
              class="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              :class="{ 'border-destructive': feedbackError }"
              @input="feedbackError = ''"
            ></textarea>
            <p v-if="feedbackError" class="text-xs text-destructive">{{ feedbackError }}</p>
          </div>

          <!-- Footer Actions -->
          <div class="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="default" @click="closeDialog">Cancel</Button>
            <template v-if="currentItem.action">
              <span class="inline-flex items-center px-4 py-2 text-sm">
                {{ currentItem.action === 'accept' ? 'Accepted' : 'Rejected' }}
              </span>
            </template>
            <template v-else>
              <Button variant="primary" @click="handleApproveReject('reject')">Reject</Button>
              <Button variant="primary" @click="handleApproveReject('accept')">Accept</Button>
            </template>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useVModel } from '@vueuse/core'
  import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import type {
    StatusActivity,
    Item,
    ActivityItem,
    SkipCustomerApproval
  } from '@/services/orders/types'
  import { ScrollArea } from '@/components/ui/scroll-area'

  interface ActivityFile {
    file: string
    file_type: string | null
    // marker_ref?: any // Commented out - markerjs not installed
  }

  interface ActivityItemData {
    action: 'accept' | 'reject' | null
    status: string
    message: string
    files: ActivityFile[]
    factory_product_id: string
    skip_customer_approval?: SkipCustomerApproval
  }

  interface Props {
    open?: boolean
    statusActivity?: StatusActivity
    orderItem?: Item
    orderItemIndex?: number
    statusActivityIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    statusActivity: undefined,
    orderItem: undefined,
    orderItemIndex: undefined,
    statusActivityIndex: undefined
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'approved', orderItem: Item): void
  }>()

  const isOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })
  const currentIndex = ref(0)
  const activityItems = ref<ActivityItemData[]>([])
  const imageRefs = ref<Record<number, HTMLElement>>({})
  const feedbackError = ref('')
  // const markerActive = ref(false) // Commented out - markerjs not installed
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL

  const currentItem = computed(() => activityItems.value[currentIndex.value])

  const CUSTOMERAPPROVED = 'customer_approved'
  const CUSTOMERREJECTED = 'customer_rejected'

  watch(isOpen, async newValue => {
    if (newValue && props.statusActivity && props.orderItem) {
      await initializeActivityItems()
    } else if (!newValue) {
      // Cleanup
      activityItems.value = []
      currentIndex.value = 0
      feedbackError.value = ''
      // markerActive.value = false // Commented out - markerjs not installed
    }
  })

  function setImageRef(el: HTMLElement | null, index: number) {
    if (el) {
      imageRefs.value[index] = el
    }
  }

  /**
   * Check if sample approval is skipped/omitted for an activity item
   */
  function isSampleApprovalSkipped(actItem: ActivityItem): boolean {
    if (!actItem.skip_customer_approval) return false

    const skipApproval = actItem.skip_customer_approval
    const designCustomerApproval = skipApproval.design_customer_approval

    // Check if design_customer_approval is false (string "false", boolean false, or 0)
    return (
      designCustomerApproval === false ||
      designCustomerApproval === 'false' ||
      designCustomerApproval === 0 ||
      designCustomerApproval === '0'
    )
  }

  async function initializeActivityItems() {
    if (!props.statusActivity || !props.orderItem) return

    activityItems.value = []
    const activity_item = props.statusActivity

    for (const actItem of activity_item.activity_items) {
      // Skip items where sample approval is omitted
      if (isSampleApprovalSkipped(actItem)) {
        continue
      }

      const actObj: ActivityItemData = {
        action: null,
        status: activity_item.status,
        message: actItem.message || '',
        files: [],
        factory_product_id: actItem.factory_product_id,
        skip_customer_approval: actItem.skip_customer_approval
      }

      for (const actFile of actItem.activity_files) {
        actObj.files.push({
          file: `${storageUrl}${actFile.url}?nocache=${Math.random()}`,
          file_type: null
        })
      }

      activityItems.value.push(actObj)
    }

    // Reset index to 0, or keep it at 0 if no items
    currentIndex.value = 0
  }

  function navigateActivity(direction: 'next' | 'back') {
    const current = currentItem.value

    if (direction === 'next') {
      if (!current?.action) {
        // Show toast or validation message
        return
      }

      if (currentIndex.value < activityItems.value.length - 1) {
        currentIndex.value++
      } else {
        // All items processed, submit
        submitActivity()
      }
    } else {
      if (currentIndex.value > 0) {
        currentIndex.value--
      }
    }
  }

  async function handleApproveReject(action: 'accept' | 'reject') {
    const current = currentItem.value
    if (!current) return

    if (action === 'reject' && !current.message?.trim()) {
      feedbackError.value = 'Please add feedback before rejecting.'
      return
    }

    // Clear any previous error
    feedbackError.value = ''

    current.action = action
    current.status = action === 'reject' ? CUSTOMERREJECTED : CUSTOMERAPPROVED

    // Auto navigate to next or submit if last
    if (currentIndex.value === activityItems.value.length - 1) {
      await submitActivity()
    } else {
      currentIndex.value++
    }
  }

  async function submitActivity() {
    if (!props.orderItem) return

    // Prepare form data
    const formData = new FormData()

    formData.append('order_item_id', String(props.orderItem.id))
    formData.append('order_item_index', String(props.orderItemIndex ?? 0))

    // Convert activity items to FormData format (matching backend expectations)
    activityItems.value.forEach((actObj, actIndx) => {
      formData.append(`activity_item_data[${actIndx}][action]`, actObj.action || '')
      formData.append(`activity_item_data[${actIndx}][status]`, actObj.status)
      formData.append(`activity_item_data[${actIndx}][message]`, actObj.message || '')
      formData.append(
        `activity_item_data[${actIndx}][factory_product_id]`,
        actObj.factory_product_id
      )

      // Add skip_customer_approval if present
      if (actObj.skip_customer_approval) {
        Object.entries(actObj.skip_customer_approval).forEach(([key, value]) => {
          formData.append(
            `activity_item_data[${actIndx}][skip_customer_approval][${key}]`,
            String(value)
          )
        })
      }

      // Add files
      actObj.files.forEach((file, fileInd) => {
        // Send original file URL
        formData.append(`activity_item_data[${actIndx}][files][${fileInd}][file]`, file.file)
        formData.append(
          `activity_item_data[${actIndx}][files][${fileInd}][file_type]`,
          file.file_type || ''
        )
      })
    })

    const { API } = await import('@/services')
    if (!props.orderItem?.id) {
      console.error('Order item ID is missing')
      return
    }
    const { tryCatchApi } = await import('@/stores/utils')
    const response = await tryCatchApi(API.orders.submitOrderActivity(props.orderItem.id, formData))

    if (response.success && response.content?.result?.order_item) {
      emit('approved', response.content.result.order_item)
      closeDialog()
    } else if (!response.success) {
      console.error('Error submitting activity:', response.axiosError)
    }
  }

  function closeDialog() {
    isOpen.value = false
  }
</script>
