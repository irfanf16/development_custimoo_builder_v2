<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import type { Colour, Locker } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, type ComputedRef } from 'vue'

  type ColourProps = {
    colour_group: Colour[]
    group_name: string
  }

  const props = defineProps<{ locker: Locker }>()
  const lockerStore = useLockerRoomStore()
  const { lockers } = storeToRefs(lockerStore)

  const colour_groups: ComputedRef<ColourProps[]> = computed(() => {
    const locker = lockers.value.find(l => l.id === props.locker.id)
    return (
      locker?.folders?.map(folder => {
        return {
          colour_group: JSON.parse(folder.color),
          group_name: folder.folder_name
        }
      }) ?? []
    )
  })
  onMounted(() => {
    if (!props.locker.colours_fetched) {
      useLockerRoomStore().fetchLockerAssets(props.locker.id)
    }
  })
</script>
<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(color, group_index) in colour_groups"
      :key="group_index"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <div
        class="bg-secondary rounded-md aspect-video overflow-hidden grid border relative place-items-center"
        :class="{
          'grid-cols-3': color.colour_group.length >= 3,
          'grid-cols-2': color.colour_group.length === 2,
          'grid-cols-1': color.colour_group.length === 1
        }"
      >
        <div
          v-for="(c, cInd) in color.colour_group.slice(0, 3)"
          :key="cInd"
          class="w-full h-full"
          :style="{ backgroundColor: c.value }"
          :title="c.name"
        ></div>
      </div>

      <!-- Metadata -->
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="mt-2 text-sm text-center font-medium">{{ color.group_name }}</div>
        <Button variant="outline" class="w-full">Use In Design</Button>
      </div>
    </Card>
  </div>
</template>
