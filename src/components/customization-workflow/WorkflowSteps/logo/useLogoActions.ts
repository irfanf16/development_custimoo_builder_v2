import { useLogosStore } from '@/stores/logos/logos.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { CustomLogo } from '@/services/logos/types'
import type { OutputColor, APCustomizationDefaultColor } from '@/services/products/types'
import { rgbArrayToHex } from './useLogoUtils'
import { useLogos } from './useLogos'
import { getSelectedProductPantones, getClosestColor, getColorType } from '@/lib/utils'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

export type BackgroundRemovalMode = 'simple' | 'smart'

export function useLogoActions() {
  // ===== DEPENDENCIES =====
  const logosStore = useLogosStore()
  const historyStore = useHistoryStore()
  const customizationStore = useCustomizationStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()
  const { customLogos, productKey, getActiveLogoIndex } = useLogos()
  const workflowStore = useWorkflowStore()

  // ===== ACTIONS =====
  async function removeBackground(
    customLogo: CustomLogo,
    type: BackgroundRemovalMode,
    productId: number,
    logoIndex: number
  ) {
    const productKey = String(productId)
    const prevLogo = { ...customLogo }

    let nextUrl = ''
    if (type === 'simple') {
      nextUrl = `${customLogo.transparent_logo_url}`
    } else if (type === 'smart') {
      nextUrl = `${customLogo.smart_transparent_logo_url}`
    }

    const nextLogo = { ...customLogo, url: nextUrl }

    const response = await logosStore.updateAndPostNewLogo(nextLogo)
    if (!response.success) {
      console.error('Error updating and posting new logo')
      return
    }

    const apiUpdatedLogo = response.content?.customer_logo
    if (!apiUpdatedLogo) {
      console.error('No logo data in API response')
      return
    }

    await historyStore.execute('logo.remove-background', {
      key: productKey,
      index: logoIndex,
      prevLogo,
      nextLogo: apiUpdatedLogo
    })

    return apiUpdatedLogo
  }

  function applyLogoColors(logo: CustomLogo) {
    const palette = logo.logo_colors as number[][] | undefined
    if (!palette?.length) return

    const hexColors = palette.map(c => rgbArrayToHex(c))
    const productId = customizationStore.activeProductId

    // Get pantone and name for each hex color
    const defaultColorsWithPantone = hexColors.map(hex => {
      // Use first SVG group for color type detection, or empty string for general
      const svgGroup = effectiveSvgGroups.value?.[0]?.id || ''
      const selectProductPantonesList = getSelectedProductPantones(productId, svgGroup)
      const closestColor = getClosestColor(
        hex,
        selectProductPantonesList,
        getColorType(svgGroup, productId)
      )

      return {
        color: hex,
        pantone: closestColor.pantone || null,
        name: closestColor.name || null
      } as { color: string | null; pantone: string | null; name: string | null }
    })

    // Ensure we have 4 default colors (pad with null if needed)
    const defaultColors: Array<{
      color: string | null
      pantone: string | null
      name: string | null
    }> = [...defaultColorsWithPantone]
    while (defaultColors.length < 4) {
      defaultColors.push({ color: null, pantone: null, name: null })
    }
    workflowStore.setActiveLogoId(String(logo.id))

    // Set default_colors in customization store
    if (customizationStore.customization) {
      customizationStore.customization.default_colors = defaultColors.slice(0, 4)
      customizationStore.customization.shuffle_color_number = 1
      // Clear group_colors when applying logo colors
      customizationStore.customization.group_colors = {}
      customizationStore.saveToLocalStorage()
    }
  }

  function shuffleColors() {
    if (!customizationStore.customization) return

    const currentDefaultColors = customizationStore.customization.default_colors || []
    const filteredColors = currentDefaultColors.filter(
      (color: { color?: string | null }) => color.color
    )

    if (filteredColors.length === 0) return

    // If there's only one color, there's nothing to shuffle
    // Just update the shuffle_color_number and return
    if (filteredColors.length === 1) {
      customizationStore.customization.shuffle_color_number = Math.floor(Math.random() * 24) + 1
      customizationStore.saveToLocalStorage()
      return
    }

    // Store previous default colors for potential rollback
    const previousDefaultColors: APCustomizationDefaultColor[] = JSON.parse(
      JSON.stringify(filteredColors)
    ) as APCustomizationDefaultColor[]

    // Shuffle the colors array
    let shuffled = [...filteredColors].sort(() => Math.random() - 0.5)

    // Ensure shuffled result is different from previous
    // Only check if there are multiple colors (already handled single color case above)
    while (JSON.stringify(shuffled) === JSON.stringify(previousDefaultColors)) {
      shuffled = [...filteredColors].sort(() => Math.random() - 0.5)
    }

    // Create new default_colors array with shuffled colors
    const newDefaultColors = [...shuffled]
    while (newDefaultColors.length < 4) {
      newDefaultColors.push({ color: null, pantone: null, name: null })
    }

    // Update default_colors in customization store
    customizationStore.customization.default_colors = newDefaultColors.slice(0, 4)

    // Set random shuffle_color_number between 1-24
    customizationStore.customization.shuffle_color_number = Math.floor(Math.random() * 24) + 1

    // Clear group_colors when applying logo colors
    customizationStore.customization.group_colors = {}

    customizationStore.saveToLocalStorage()
  }

  async function recolorLogo(logo: CustomLogo, color: OutputColor) {
    if (!logo.id || !logo.url || !color.value) return

    const response = await logosStore.editLogo({
      logo_id: logo.id,
      type: 'floodfill',
      image: logo.url,
      color: color.value
    })

    if (!response.success) {
      console.error('Error recoloring logo:', response.axiosError?.message)
      return
    }

    const key = productKey.value
    const index = getActiveLogoIndex(logo.id)
    if (key && index !== -1) {
      await historyStore.execute('logo.recolor', {
        key,
        index,
        prevImage: logo.url,
        nextImage: response.content.logo
      })
    }

    return response.content?.logo
  }

  function removeLogo(logo: CustomLogo) {
    const key = productKey.value
    if (!key) return

    const index = customLogos.value.findIndex(l => l.id === logo.id)
    if (index !== -1) {
      void historyStore.execute('logo.remove', { key, index })
      workflowStore.setActiveLogoId(null)
      workflowStore.setActiveLogoIndex(null)
    }
  }

  function setActiveLogo(logo: CustomLogo) {
    logosStore.setActiveLogo(logo)
  }

  return {
    removeBackground,
    applyLogoColors,
    shuffleColors,
    recolorLogo,
    removeLogo,
    setActiveLogo
  }
}
