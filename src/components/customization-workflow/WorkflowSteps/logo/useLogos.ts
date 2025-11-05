import { computed } from 'vue'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLogosStore } from '@/stores/logos/logos.store'
import type { CustomLogo } from '@/services/logos/types'

export function useLogos() {
  // ===== DEPENDENCIES =====
  const customizationStore = useCustomizationStore()
  const logosStore = useLogosStore()

  // ===== COMPUTED =====
  const customLogos = computed<CustomLogo[]>(() => {
    const key = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    if (!key || !map) return []
    return (map as Record<string, CustomLogo[]>)[String(key)] || []
  })

  const productKey = computed<string | null>(() => {
    const id = customizationStore.customization?.product_id
    if (!id) return null
    return String(id)
  })

  function getActiveLogoIndex(logoId: string | number | null): number {
    if (!logoId) return -1
    const id = typeof logoId === 'string' ? parseInt(logoId, 10) : logoId
    return customLogos.value.findIndex(l => l.id === id)
  }

  function getLogoById(logoId: string | number | null): CustomLogo | null {
    if (!logoId) return null
    const id = typeof logoId === 'string' ? parseInt(logoId, 10) : logoId
    return customLogos.value.find(l => l.id === id) ?? null
  }

  // ===== RETURN =====
  return {
    customLogos,
    productKey,
    activeLogo: logosStore.activeLogo,
    getActiveLogoIndex,
    getLogoById
  }
}
