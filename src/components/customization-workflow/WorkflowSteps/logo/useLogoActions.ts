import { useLogosStore } from '@/stores/logos/logos.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
import type { CustomLogo } from '@/services/logos/types'
import type { OutputColor } from '@/services/products/types'
import { rgbArrayToHex } from './useLogoUtils'
import { useLogos } from './useLogos'

export type BackgroundRemovalMode = 'simple' | 'smart'

export function useLogoActions() {
  // ===== DEPENDENCIES =====
  const logosStore = useLogosStore()
  const historyStore = useHistoryStore()
  const customizationStore = useCustomizationStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()
  const { customLogos, productKey, getActiveLogoIndex } = useLogos()

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
    if (!palette?.length || !effectiveSvgGroups.value?.length) return

    const hexColors = palette.map(c => rgbArrayToHex(c))

    void historyStore.runBatch('Apply logo colors', add => {
      effectiveSvgGroups.value?.forEach((group, idx) => {
        const nextHex = hexColors[idx]
        if (!nextHex) return

        const prevRaw = customizationStore.customization?.group_colors?.[group.id]
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
          nextColor: { name: '', value: nextHex, position: 0 }
        })
      })
    })
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
    }
  }

  function setActiveLogo(logo: CustomLogo) {
    logosStore.setActiveLogo(logo)
  }

  return {
    removeBackground,
    applyLogoColors,
    recolorLogo,
    removeLogo,
    setActiveLogo
  }
}
