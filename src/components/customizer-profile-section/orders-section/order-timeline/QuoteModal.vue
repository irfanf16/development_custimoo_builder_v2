<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold text-foreground">Accept Quote</DialogTitle>
        <DialogDescription> Are you sure you want to accept this quote? </DialogDescription>
      </DialogHeader>
      <div class="flex justify-end gap-2 pt-4">
        <Button variant="outline" @click="closeDialog">Cancel</Button>
        <Button variant="primary" @click="handleAccept">Accept Quote</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { useVModel } from '@vueuse/core'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import type { Order } from '@/services/orders/types'

  interface Props {
    open?: boolean
    order?: Order
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    order: undefined
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'accepted', order: Order): void
  }>()

  const isOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })

  function closeDialog() {
    isOpen.value = false
  }

  function handleAccept() {
    if (props.order) {
      emit('accepted', props.order)
      closeDialog()
    }
  }
</script>
