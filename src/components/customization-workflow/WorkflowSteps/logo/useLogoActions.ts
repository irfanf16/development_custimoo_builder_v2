import { useLogosStore } from '@/stores/logos/logos.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { CustomLogo } from '@/services/logos/types'
import type { OutputColor } from '@/services/products/types'
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

  function applyLogoColors(logo: CustomLogo, customLogosArrayIndex: number) {
    const palette = logo.logo_colors as number[][] | undefined
    if (!palette?.length) return
    if (customLogosArrayIndex < 0) return

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
    workflowStore.setAppliedLogoColorsSource(String(logo.id), customLogosArrayIndex)

    if (customizationStore.customization) {
      // Push current state (with design colors) so undo can restore it
      customizationStore.pushHistoryState('Design colors')
      customizationStore.customization.default_colors = defaultColors.slice(0, 4)
      customizationStore.customization.shuffle_color_number = 1
      workflowStore.setGroupColorsBeforeLogoApply(
        customizationStore.customization.group_colors ?? {}
      )
      customizationStore.customization.group_colors = {}
      workflowStore.setDefaultColorsSource('logo')
      customizationStore.pushHistoryState('Applied logo colors')
    }
  }

  /**
   * Rebuilds `default_colors` from the logo's current `logo_colors` (hex + pantone mapping),
   * without clearing `group_colors` or pushing history. Used before shuffle when the user
   * edited extracted colors in the logo editor so the design uses the latest swatches.
   */
  function syncDefaultColorsFromLogoPalette(logo: CustomLogo): boolean {
    const palette = logo.logo_colors || []
    if (!palette.length) return false

    const hexColors: string[] = []
    for (const entry of palette) {
      if (Array.isArray(entry)) {
        hexColors.push(rgbArrayToHex(entry))
      } else if (entry.hex?.trim()) {
        const h = entry.hex.trim()
        hexColors.push(h.startsWith('#') ? h : `#${h}`)
      }
    }
    if (hexColors.length === 0) return false

    const productId = customizationStore.activeProductId
    const defaultColorsWithPantone = hexColors.map(hex => {
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

    const defaultColors: Array<{
      color: string | null
      pantone: string | null
      name: string | null
    }> = [...defaultColorsWithPantone]
    while (defaultColors.length < 4) {
      defaultColors.push({ color: null, pantone: null, name: null })
    }

    if (!customizationStore.customization) return false
    customizationStore.customization.default_colors = defaultColors.slice(0, 4)
    return true
  }

  function useOriginalColorsAndProceed() {
    const snapshot = workflowStore.getAndClearGroupColorsBeforeLogoApply()
    if (customizationStore.customization) {
      customizationStore.customization.group_colors = snapshot ? { ...snapshot } : {}
      customizationStore.clearDefaultColors()
      customizationStore.pushHistoryState('Use original colors')
    }
    workflowStore.setDefaultColorsSource(null)
    workflowStore.setActiveLogoId(null)
    workflowStore.setLogosSubStep('list')
    logosStore.setActiveLogo(null)
    workflowStore.setActiveColorAccordionIndex(null)
    workflowStore.setActiveStep('colors')
  }

  function shuffleColors() {
    customizationStore.shuffleDefaultColors('Shuffled colors')
  }

  /** Shuffle design colors from extracted logo slots; refreshes from `logo` when that logo is active. */
  function shuffleExtractedColorsForActiveLogo(logo: CustomLogo, listIndex?: number): void {
    const hasAppliedSlots = (customizationStore.customization?.default_colors || []).some(
      (c: { color?: string | null }) => c.color
    )
    const pinned = workflowStore.logoApplySourceIndex
    const idMatches = workflowStore.activeLogoId === String(logo.id)
    const indexMatches = pinned === null || (listIndex !== undefined && pinned === listIndex)
    if (hasAppliedSlots && idMatches && indexMatches) {
      syncDefaultColorsFromLogoPalette(logo)
    }
    customizationStore.shuffleDefaultColors('Shuffle extracted colors')
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
      const appliedId = workflowStore.activeLogoId
      const pinned = workflowStore.logoApplySourceIndex
      const clearsApplied =
        appliedId != null &&
        String(logo.id) === String(appliedId) &&
        (pinned === index ||
          (pinned === null &&
            index === customLogos.value.findIndex(l => String(l.id) === String(appliedId))))

      void historyStore.execute('logo.remove', { key, index })
      workflowStore.adjustLogoApplySourceIndexAfterRemoval(index)
      workflowStore.setLogoEditorLogoId(null)
      workflowStore.setActiveLogoIndex(null)
      if (clearsApplied) {
        workflowStore.setActiveLogoId(null)
      }
    }
  }

  function setActiveLogo(logo: CustomLogo) {
    logosStore.setActiveLogo(logo)
  }

  return {
    removeBackground,
    applyLogoColors,
    syncDefaultColorsFromLogoPalette,
    shuffleExtractedColorsForActiveLogo,
    shuffleColors,
    useOriginalColorsAndProceed,
    recolorLogo,
    removeLogo,
    setActiveLogo
  }
}
