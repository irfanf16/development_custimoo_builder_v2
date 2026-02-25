<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import type { Colour, Locker } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { storeToRefs } from 'pinia'
  import { computed, inject, onMounted, type ComputedRef } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { locker_use_in_design } from '@/paraglide/messages'

  type ColourProps = {
    colour_group: Colour[]
    group_name: string
  }

  const props = defineProps<{ locker: Locker }>()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const lockerStore = useLockerRoomStore()
  const { lockers } = storeToRefs(lockerStore)
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const { goTo, menuItems, pickStepOrNextAvailable } = useCustomizerMenu()
  const closeLockerBrowser = inject<(() => void) | undefined>('closeLockerBrowser')

  const colour_groups: ComputedRef<ColourProps[]> = computed(() => {
    const locker = lockers.value.find(l => l.id === props.locker.id)
    return (
      locker?.folders?.map(folder => {
        const color = folder.color
        const parsed = typeof color === 'string' ? (JSON.parse(color) as Colour[]) : color
        const raw = Array.isArray(parsed) ? parsed : []
        const seen = new Set<string>()
        const colour_group = raw.filter(c => {
          const key = (c.value ?? c.color ?? '').trim().toLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        return {
          colour_group,
          group_name: folder.folder_name
        }
      }) ?? []
    )
  })

  function handleUseInDesign(colorGroup: ColourProps) {
    if (!customizationStore.customization) return
    const svgGroups = productsStore.svgGroups
    if (!svgGroups?.length) return
    const groupIds = svgGroups.map(g => g.id)
    const colours = colorGroup.colour_group
    for (let i = 0; i < colours.length && i < groupIds.length; i++) {
      const groupId = groupIds[i]
      const c = colours[i]
      if (!c || groupId === undefined) continue
      customizationStore.setGroupColor(groupId, {
        name: c.name ?? '',
        value: c.value ?? '',
        position: 0
      })
    }
    void goTo(
      pickStepOrNextAvailable(
        'colors',
        menuItems.value.map(i => i.step)
      )
    )
    closeLockerBrowser?.()
  }
  const getGridCols = (length: number) => {
    const cols = Math.ceil(Math.sqrt(length))
    return length < 4 ? `grid-cols-${length}` : `grid-cols-${cols}`
  }

  const getItemSpanClass = (length: number, index: number) => {
    // Case 1: 1, 2, 3 items
    if (length <= 3) {
      return `col-span-${6 / length}`
    }

    const remainder = length % 3

    // Case 2: last row has 1 item
    if (remainder === 1 && index === length - 1) {
      return 'col-span-6'
    }

    // Case 3: last row has 2 items
    if (remainder === 2 && index >= length - 2) {
      return 'col-span-3'
    }

    // Normal 3-per-row layout
    return 'col-span-2'
  }

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
        class="bg-secondary rounded-md aspect-video overflow-hidden grid border relative place-items-center grid-cols-6 auto-rows-fr grid-flow-dense"
        :class="getGridCols(color.colour_group.length)"
      >
        <div
          v-for="(c, cInd) in color.colour_group"
          :key="JSON.stringify(c)"
          :class="getItemSpanClass(color.colour_group.length, cInd)"
          class="w-full h-full siz"
          :style="{ backgroundColor: c.value ?? c.color }"
          :title="c.name"
        ></div>
      </div>

      <!-- Metadata -->
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="mt-2 text-sm text-center font-medium">{{ color.group_name }}</div>
        <Button variant="outline" class="w-full" @click="handleUseInDesign(color)">
          {{ locker_use_in_design({}, { locale }) }}
        </Button>
      </div>
    </Card>
  </div>
</template>
