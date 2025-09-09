import { computed } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { OutputColor } from '@/services/products/types'

type Palette = {
  id: number
  name: string
  colors: OutputColor[]
}

export function useColorActions() {
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()

  const palettes = computed<Palette[] | undefined>(() => {
    return productsStore.activeProductDetails?.namecolors?.map(colorGroup => ({
      id: colorGroup.id,
      name: colorGroup.file_name,
      colors: colorGroup.json_data
    }))
  })

  function shuffleColors(paletteId?: number) {
    const availablePalettes = palettes.value
    if (!availablePalettes || !availablePalettes.length) return
    const selected =
      (paletteId != null
        ? availablePalettes.find(p => p.id === paletteId)
        : availablePalettes[0]) || availablePalettes[0]
    const colors = selected?.colors
    if (!colors?.length || !effectiveSvgGroups.value) return
    history.runBatch('Shuffle colors', add => {
      effectiveSvgGroups.value?.forEach(group => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        if (!randomColor) return
        const prevRaw =
          customizationStore.customization?.group_colors?.[group.id]
        const prevColor = prevRaw
          ? {
              name: prevRaw.name || '',
              value: prevRaw.color || '',
              position: 0
            }
          : null
        add('color.set-group', {
          groupId: group.id,
          prevColor,
          nextColor: randomColor
        })
      })
    })
  }

  return { palettes, shuffleColors }
}
