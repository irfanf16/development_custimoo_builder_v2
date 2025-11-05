import { computed } from 'vue'
import type { OutputProductText, OutputFont, OutputColor } from '@/services/products/types'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { getFontUrl } from './useTextUtils'

export function useTexts() {
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()

  // ===== COMPUTED =====
  const customAndPresetTexts = computed<OutputProductText[]>(() => {
    const customProductTexts = customizationStore.activeProductTexts
    const productDetailsTexts = productsStore.activeProductDetails?.product_texts || []

    if (customProductTexts.length === 0) {
      return productDetailsTexts
    }

    const response: OutputProductText[] = []
    productDetailsTexts.forEach(text => {
      if (customProductTexts.some(customText => customText.id === text.id)) {
        const customText = customProductTexts.find(customText => customText.id === text.id)
        if (customText) {
          response.push(customText)
        }
      } else {
        response.push(text)
      }
    })
    return response
  })

  const palettes = computed(() => productsStore.activeProductDetails?.namecolors ?? [])

  const fallbackColors: OutputColor[] = [
    { position: 0, name: 'Black', value: '#000000' },
    { position: 1, name: 'White', value: '#ffffff' },
    { position: 2, name: 'Grey', value: '#808080' }
  ]

  const colorPalettes = computed(() => {
    const source = palettes.value
    if (!source?.length) {
      return [
        {
          id: 0,
          name: 'Defaults',
          colors: fallbackColors
        }
      ]
    }
    return source.map(group => ({ id: group.id, name: group.file_name, colors: group.json_data }))
  })

  function addFontOption(
    font: OutputFont,
    bucket: {
      label: string
      value: string
      preview?: string
      fontUrl?: string
      fontFamily?: string
    }[]
  ) {
    ;(font.json_data ?? []).forEach(file => {
      bucket.push({
        label: file.name,
        value: file.name,
        preview: file.name,
        fontUrl: getFontUrl(file.path),
        fontFamily: file.name
      })
    })
  }

  const fontOptions = computed(() => {
    const options: {
      label: string
      value: string
      preview?: string
      fontUrl?: string
      fontFamily?: string
    }[] = []
    for (const font of productsStore.activeProductDetails?.namefonts ?? []) {
      addFontOption(font, options)
    }
    return options
  })

  // ===== RETURN =====
  return {
    customAndPresetTexts,
    palettes,
    colorPalettes,
    fontOptions,
    fallbackColors,
    addFontOption
  }
}
