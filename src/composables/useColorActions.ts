import { computed } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { OutputColor } from '@/services/products/types'

export type Palette = {
  id: number
  name: string
  colors: OutputColor[]
}

export function useColorActions() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()

  // ===== COMPUTED =====
  const palettes = computed<Palette[] | undefined>(() => {
    return productsStore.activeProductDetails?.namecolors?.map(colorGroup => ({
      id: colorGroup.id,
      name: colorGroup.file_name,
      colors: colorGroup.json_data
    }))
  })

  // ===== ACTIONS =====
  function shuffleColors(paletteId?: number) {
    const availablePalettes = palettes.value
    if (!availablePalettes || !availablePalettes.length) return
    const selected =
      (paletteId != null
        ? availablePalettes.find(p => p.id === paletteId)
        : availablePalettes[0]) || availablePalettes[0]
    const colors = selected?.colors
    if (!colors?.length || !effectiveSvgGroups.value) return
    effectiveSvgGroups.value.forEach(group => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      if (!randomColor) return
      customizationStore.setGroupColor(group.id, randomColor, undefined, { skipHistory: true })
    })
    customizationStore.pushHistoryState('Shuffle colors')
  }

  // ===== RETURN =====
  return { palettes, shuffleColors }
}
