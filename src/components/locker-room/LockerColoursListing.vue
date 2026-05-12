<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import type { Colour, Locker } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { storeToRefs } from 'pinia'
  import { computed, inject, onMounted, type ComputedRef } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { getSelectedProductPantones, getClosestColor, getColorType } from '@/lib/utils'
  import { stripCsvExtension } from '@/lib/utils'
  import { locker_use_in_design, locker_no_colours } from '@/paraglide/messages'

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
  const workflowStore = useWorkflowStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()
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
          group_name: stripCsvExtension(folder.folder_name || '')
        }
      }) ?? []
    )
  })

  /**
   * Apply locker colour group to product like applyLogoColors in useLogoActions:
   * sets default_colors from the colour group, clears group_colors, pushes history.
   */
  function handleUseInDesign(colorGroup: ColourProps) {
    const colours = colorGroup.colour_group
    if (!colours?.length || !customizationStore.customization) return

    const productId = customizationStore.activeProductId
    if (productId == null) return

    const svgGroup = effectiveSvgGroups.value?.[0]?.id ?? ''
    const selectProductPantonesList = getSelectedProductPantones(productId, svgGroup)
    const colorType = getColorType(svgGroup, productId)

    const defaultColorsWithPantone = colours.map(c => {
      const hex = (c.value ?? c.color ?? '').trim() || null
      if (!hex)
        return {
          color: null as string | null,
          pantone: null as string | null,
          name: null as string | null
        }
      const closestColor = getClosestColor(hex, selectProductPantonesList, colorType)
      return {
        color: hex,
        pantone: closestColor.pantone || c.pantone || null,
        name: closestColor.name || c.name || null
      }
    })

    const defaultColors: Array<{
      color: string | null
      pantone: string | null
      name: string | null
    }> = [...defaultColorsWithPantone]
    while (defaultColors.length < 4) {
      defaultColors.push({ color: null, pantone: null, name: null })
    }

    customizationStore.pushHistoryState('Design colors')
    customizationStore.customization.default_colors = defaultColors.slice(0, 4)
    customizationStore.customization.shuffle_color_number = 1
    workflowStore.setGroupColorsBeforeLogoApply(customizationStore.customization.group_colors ?? {})
    customizationStore.customization.group_colors = {}
    customizationStore.pushHistoryState('Applied logo colors')

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
  <div v-if="!colour_groups.length" class="py-8 text-center text-muted-foreground">
    {{ locker_no_colours({}, { locale }) }}
  </div>
  <div v-else data-testid="locker-room-colours-listing" class="grid grid-cols-2 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(color, group_index) in colour_groups"
      :key="group_index"
      :data-testid="`locker-room-colour-item-${group_index}`"
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
