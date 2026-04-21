import { computed } from 'vue'
import type { OutputProductText, OutputFont, OutputColor } from '@/services/products/types'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { getFontUrl } from './useTextUtils'

export function useTexts() {
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  // ===== COMPUTED =====

  /**
   * Combines preset texts (from product) with custom texts (user-added)
   *
   * This computed property merges:
   * 1. Preset texts from product_details.product_texts (default texts)
   * 2. Custom texts from customization store (user customizations and new entries)
   *
   * Logic:
   * - If a preset text has been customized, show the customized version
   * - If a preset text hasn't been customized, show the original preset
   * - Always include all manually-added texts (new entries with negative IDs)
   *
   * This ensures:
   * - Preset texts are always visible (even if not customized)
   * - Customizations override preset values
   * - New manually-added texts appear in the list
   */
  const customAndPresetTexts = computed<OutputProductText[]>(() => {
    const customTexts = customizationStore.activeProductTexts
    const presetTexts = productsStore.activeProductDetails?.product_texts || []

    // If no customizations, return presets as-is
    if (customTexts.length === 0) {
      return presetTexts
    }

    const result: OutputProductText[] = []
    const usedCustomIds = new Set<number | string>()

    // Step 1: Process preset texts and match with customizations
    // If a preset has been customized, use the custom version; otherwise use preset
    for (const presetText of presetTexts) {
      const customText = customTexts.find(custom => custom.id === presetText.id)
      if (customText) {
        // Preset has been customized - use custom version
        result.push(customText)
        usedCustomIds.add(customText.id)
      } else {
        // Preset hasn't been customized - use original preset
        result.push(presetText)
      }
    }

    // Step 2: Add any custom texts that don't match presets (newly added texts)
    // These are manually-added entries with negative IDs that aren't based on presets
    for (const customText of customTexts) {
      if (!usedCustomIds.has(customText.id)) {
        result.push(customText)
      }
    }

    return result
  })

  /**
   * Raw color palettes from product details
   * These are the namecolors associated with the product
   */
  const palettes = computed(() => productsStore.activeProductDetails?.namecolors ?? [])

  /**
   * Fallback colors used when no product colors are available
   * Provides basic black, white, and grey options
   */
  const fallbackColors: OutputColor[] = [
    { position: 0, name: 'Black', value: '#000000' },
    { position: 1, name: 'White', value: '#ffffff' },
    { position: 2, name: 'Grey', value: '#808080' }
  ]

  /**
   * Formatted color palettes ready for UI components
   *
   * Transforms product color data into a format suitable for color selectors.
   * If no product colors are available, returns a default palette with fallback colors.
   */
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
    return source.map(group => ({
      id: group.id,
      name: group.file_name,
      colors: group.json_data
    }))
  })

  /**
   * Helper function to add font files from an OutputFont to an options array
   *
   * Processes each font file in the font's json_data and adds it to the bucket
   * with proper formatting for font selectors.
   *
   * @param font - The font object containing font files
   * @param bucket - Array to add font options to
   */
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

  /**
   * Available font options for text editing
   *
   * Extracts all font files from product namefonts and formats them
   * for use in font selector components.
   */
  const fontOptions = computed(() => {
    const options: {
      label: string
      value: string
      preview?: string
      fontUrl?: string
      fontFamily?: string
    }[] = []
    const fonts = productsStore.activeProductDetails?.namefonts ?? []

    for (const font of fonts) {
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
