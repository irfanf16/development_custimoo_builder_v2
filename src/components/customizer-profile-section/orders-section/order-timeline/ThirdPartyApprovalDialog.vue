<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold text-foreground"
          >Third Party Approval</DialogTitle
        >
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label for="approvalEmail" class="text-sm font-medium text-foreground">
            Enter Email for Approval
          </label>
          <input
            id="approvalEmail"
            v-model="approvalEmail"
            type="email"
            placeholder="Enter email address"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            :class="{ 'border-destructive': emailError }"
          />
          <p v-if="emailError" class="text-xs text-destructive">{{ emailError }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline" @click="closeDialog">Cancel</Button>
        <Button :disabled="isSubmitting" @click="sendForApproval">
          <span v-if="isSubmitting">Sending...</span>
          <span v-else>Send for Approval</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useVModel } from '@vueuse/core'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import type { Item, StatusActivity } from '@/services/orders/types'
  import { useTryCatchApi } from '@/composables/useTryCatchApi'
  import { API } from '@/services'

  const { tryCatchApi } = useTryCatchApi({
    defaultProperties: { component: 'ThirdPartyApprovalDialog' }
  })

  interface Props {
    open?: boolean
    orderItem?: Item
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    orderItem: undefined
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'sent', orderItem: Item): void
  }>()

  const isOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })
  const approvalEmail = ref('')
  const emailError = ref('')
  const isSubmitting = ref(false)

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async function sendForApproval() {
    emailError.value = ''

    if (!approvalEmail.value.trim()) {
      emailError.value = 'Please enter a valid email address.'
      return
    }

    if (!isValidEmail(approvalEmail.value)) {
      emailError.value = 'Invalid email format. Please enter a valid email address.'
      return
    }

    if (!props.orderItem?.id) {
      emailError.value = 'Order item not found.'
      return
    }

    isSubmitting.value = true

    const response = await tryCatchApi(
      API.orders.sendThirdPartyApproval(props.orderItem.id, approvalEmail.value),
      {
        operation: 'sendForApproval',
        order_item_id: props.orderItem.id
      }
    )

    if (response.success && response.content?.result?.activity_items && props.orderItem) {
      // Update the order item with new activity items
      const updatedOrderItem = { ...props.orderItem }
      const customerReviewActivity = updatedOrderItem.status_activities?.find(
        (activity: StatusActivity) => activity.status === 'submitted_for_customer_review'
      )

      if (customerReviewActivity) {
        customerReviewActivity.activity_items = response.content.result.activity_items
      }

      emit('sent', updatedOrderItem)
      closeDialog()
    } else {
      emailError.value =
        response.content?.message ||
        response.axiosError?.response?.data?.message ||
        'An error occurred while sending the email.'
    }

    isSubmitting.value = false
  }

  function closeDialog() {
    approvalEmail.value = ''
    emailError.value = ''
    isOpen.value = false
  }

  watch(isOpen, newValue => {
    if (!newValue) {
      approvalEmail.value = ''
      emailError.value = ''
    }
  })
</script>
