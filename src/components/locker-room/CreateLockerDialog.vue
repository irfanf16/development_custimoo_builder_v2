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
  import { ref } from 'vue'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { toast } from 'vue-sonner'
  defineProps<{
    open: boolean
  }>()

  const emit = defineEmits(['update:open'])
  //Refs
  const locker_name = ref<string | number | undefined>()
  const lockerStore = useLockerRoomStore()
  const { isLoading } = storeToRefs(lockerStore)
  // Methods
  const handleSubmit = async () => {
    if (locker_name.value) {
      await lockerStore.createLocker(locker_name.value.toString())
      emit('update:open', false)
    } else {
      toast.error('Locker name is required', { richColors: true, position: 'top-right' })
    }
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Locker</DialogTitle>
        <DialogDescription> Enter your credentials to access your account. </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid gap-2">
          <Label for="locker_name">Email</Label>
          <Input id="locker_name" v-model="locker_name" required placeholder="Enter locker name" />
        </div>
        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="default" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit" :disabled="isLoading"> Ceate </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
