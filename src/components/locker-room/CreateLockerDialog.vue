<script setup lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { ref, computed, watch } from 'vue'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { toast } from 'vue-sonner'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { Locker } from '@/services/lockers/types'
  import {
    locker_enter_name_placeholder,
    locker_create_locker_title,
    create_locker_description,
    create_locker_name_label,
    locker_name_required,
    locker_create_button,
    locker_cancel,
    locker_edit_locker_tooltip
  } from '@/paraglide/messages'
  const props = defineProps<{
    open: boolean
    locker?: Locker | null
  }>()

  const emit = defineEmits(['update:open', 'created', 'updated'])
  //Refs
  const locker_name = ref<string | number | undefined>()
  const lockerStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const { isLoading } = storeToRefs(lockerStore)
  const locale = computed(() => profileStore.currentLocale || 'en')
  const isEditMode = computed(() => !!props.locker)
  const dialogTitle = computed(() =>
    isEditMode.value
      ? locker_edit_locker_tooltip({}, { locale: locale.value })
      : locker_create_locker_title({}, { locale: locale.value })
  )

  watch(
    () => [props.open, props.locker] as const,
    ([open, locker]) => {
      if (open) {
        locker_name.value = locker?.room_name ?? undefined
      } else {
        locker_name.value = undefined
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    const name = locker_name.value?.toString().trim()
    if (!name) {
      toast.error(locker_name_required({}, { locale: locale.value }), {
        richColors: true,
        position: 'top-right'
      })
      return
    }
    if (isEditMode.value && props.locker) {
      const updated = { ...props.locker, room_name: name }
      await lockerStore.updateLockers(updated)
      emit('updated', updated)
      emit('update:open', false)
    } else {
      const created = await lockerStore.createLocker(name)
      emit('update:open', false)
      if (created) {
        emit('created', created)
      }
    }
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription v-if="!isEditMode">{{
          create_locker_description({}, { locale })
        }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid gap-2">
          <Label for="locker_name">{{ create_locker_name_label({}, { locale }) }}</Label>
          <Input
            id="locker_name"
            v-model="locker_name"
            required
            :placeholder="locker_enter_name_placeholder({}, { locale })"
          />
        </div>
        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="default" @click="emit('update:open', false)">
            {{ locker_cancel({}, { locale }) }}
          </Button>
          <Button type="submit" :disabled="isLoading">
            {{ locker_create_button({}, { locale }) }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
