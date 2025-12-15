<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { Spinner } from '@/components/ui/spinner'
  import type { Locker, Logo } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, type ComputedRef } from 'vue'

  const props = defineProps<{ locker: Locker }>()

  const { isLoading, lockers } = storeToRefs(useLockerRoomStore())
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  const logos: ComputedRef<Logo[]> = computed(() => {
    const locker = lockers.value.find(l => l.id === props.locker.id)
    return locker?.logos ?? []
  })
  onMounted(() => {
    if (!props.locker.colours_fetched) {
      useLockerRoomStore().fetchLockerAssets(props.locker.id)
    }
  })
</script>
<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(logo, logoIndex) in logos"
      :key="logoIndex"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative gap-0! h-fit duration-150 border-0"
    >
      <div
        class="bg-secondary rounded-md aspect-video overflow-hidden gap-1 p-[20px] border relative place-items-center"
      >
        <img
          :src="baseStorageUrl + logo.logo_url"
          class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
        />
      </div>

      <!-- Metadata -->
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="mt-2 text-sm text-center font-medium">{{ logo.logo_name }}</div>
        <Button variant="outline" class="w-full">Use In Design</Button>
      </div>
    </Card>
  </div>
</template>
