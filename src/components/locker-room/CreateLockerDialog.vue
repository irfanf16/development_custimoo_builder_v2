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
  import { ref, computed } from 'vue'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { toast } from 'vue-sonner'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_enter_name_placeholder,
    locker_create_locker_title,
    create_locker_description,
    create_locker_name_label,
    locker_name_required,
    locker_create_button,
    locker_cancel
  } from '@/paraglide/messages'
  defineProps<{
    open: boolean
  }>()

  const emit = defineEmits(['update:open'])
  //Refs
  const locker_name = ref<string | number | undefined>()
  const lockerStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const { isLoading } = storeToRefs(lockerStore)
  const locale = computed(() => profileStore.currentLocale || 'en')
  // Methods
  const handleSubmit = async () => {
    if (locker_name.value) {
      await lockerStore.createLocker(locker_name.value.toString())
      emit('update:open', false)
    } else {
      toast.error(locker_name_required({}, { locale: locale.value }), {
        richColors: true,
        position: 'top-right'
      })
    }
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ locker_create_locker_title({}, { locale }) }}</DialogTitle>
        <DialogDescription>{{ create_locker_description({}, { locale }) }}</DialogDescription>
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
