import { useLogosStore } from '@/stores/logos/logos.store'
import { useHistoryStore } from '@/stores/history/history.store'
import type { CustomLogo } from '../services/logos/types'

export type BackgroundRemovalMode = 'simple' | 'smart'
export function useLogoActions() {
  const logosStore = useLogosStore()
  const historyStore = useHistoryStore()

  // ===== ACTIONS =====
  async function removeBackground(
    customLogo: CustomLogo,
    type: BackgroundRemovalMode,
    productId: number,
    logoIndex: number
  ) {
    const productKey = String(productId)
    // Store the complete original logo state
    const prevLogo = { ...customLogo }

    // Determine the new URL based on background removal type
    let nextUrl = ''
    if (type === 'simple') {
      nextUrl = `${customLogo.transparent_logo_url}`
    } else if (type === 'smart') {
      nextUrl = `${customLogo.smart_transparent_logo_url}`
    }

    // Create the updated logo object with the new URL
    const nextLogo = { ...customLogo, url: nextUrl }

    // Make the API call FIRST to get the complete updated logo from server
    const response = await logosStore.updateAndPostNewLogo(nextLogo)
    if (!response.success) {
      console.error('Error updating and posting new logo')
      return
    }

    // Get the complete logo object from API response (may have additional fields updated)
    const apiUpdatedLogo = response.content?.result?.customer_logo
    if (!apiUpdatedLogo) {
      console.error('No logo data in API response')
      return
    }

    // Now update customization store via history with the complete API response
    // This ensures we track ALL field changes, not just the URL
    await historyStore.execute('logo.remove-background', {
      key: productKey,
      index: logoIndex,
      prevLogo,
      nextLogo: apiUpdatedLogo
    })

    // Return the complete updated logo from API
    return apiUpdatedLogo
  }

  return {
    removeBackground
  }
}
