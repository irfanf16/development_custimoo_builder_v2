<script setup lang="ts">
  import { useVModel } from '@vueuse/core'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import {
    actions_reset_customization,
    actions_reset_customization_description,
    actions_reset_customization_cancel,
    actions_reset_customization_confirm
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'

  const props = withDefaults(
    defineProps<{
      open?: boolean
    }>(),
    {
      open: false
    }
  )

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'confirm'): void
  }>()

  const profileStore = useProfileStore()
  const dialogOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })

  const handleCancel = () => {
    dialogOpen.value = false
  }

  const handleConfirm = () => {
    emit('confirm')
    dialogOpen.value = false
  }
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent data-testid="customizer-reset-dialog">
      <DialogHeader>
        <DialogTitle>
          {{ actions_reset_customization({}, { locale: profileStore.currentLocale }) }}?
        </DialogTitle>
        <DialogDescription>
          {{ actions_reset_customization_description({}, { locale: profileStore.currentLocale }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex flex-row gap-2 justify-end">
        <Button variant="outline" @click="handleCancel">
          {{ actions_reset_customization_cancel({}, { locale: profileStore.currentLocale }) }}
        </Button>
        <Button variant="destructive" @click="handleConfirm">
          {{ actions_reset_customization_confirm({}, { locale: profileStore.currentLocale }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
