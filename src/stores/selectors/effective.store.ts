import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { OutputSvgGroupColor } from '@/services/products/types'
import type { CustomLogo } from '@/services/logos/types'

export function useEffectiveSelectors() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()

  // ===== STORE REFS =====
  const {
    activeProductDetails,
    activeStyleDetails,
    activeDesignDetails,
    svgGroups
  } = storeToRefs(productsStore)

  // ===== COMPUTED =====
  const effectiveProductId = computed<number | null>(() => {
    const fromCustomization = customizationStore.customization?.product_id
    if (fromCustomization != null) return Number(fromCustomization)
    return activeProductDetails.value?.id ?? null
  })

  const effectiveStyleId = computed<number | null>(() => {
    const fromCustomization = customizationStore.customization?.style_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return activeStyleDetails.value?.id ?? null
  })

  const effectiveDesignId = computed<number | null>(() => {
    const fromCustomization = customizationStore.customization?.design_id
    if (fromCustomization && fromCustomization > 0) return fromCustomization
    return activeDesignDetails.value?.id ?? null
  })

  const effectiveSvgGroups = computed<OutputSvgGroupColor[] | undefined>(() => {
    const base = svgGroups.value
    if (!base) return undefined

    const overrides = customizationStore.customization?.group_colors || {}
    return base.map(svgGroup => {
      const customized = overrides[svgGroup.id]
      if (customized) {
        return {
          id: svgGroup.id,
          name: customized.name ?? '',
          color: customized.color ?? '',
          pantone: '',
          count: 0
        }
      }
      return svgGroup
    })
  })

  const effectiveLogos = computed<CustomLogo[]>(() => {
    if (!effectiveProductId.value) return []
    return (
      customizationStore.customization?.custom_logos[
        effectiveProductId.value.toString()
      ] || []
    )
  })

  const renderVersion = computed<string>(() => {
    const idPart = [
      effectiveProductId.value ?? 'null',
      effectiveStyleId.value ?? 'null',
      effectiveDesignId.value ?? 'null',
      effectiveLogos.value.map(l => l.id).join(',')
    ].join(':')
    const groupsPart = (effectiveSvgGroups.value || [])
      .map(g => `${g.id}:${g.color}`)
      .join(',')
    return `${idPart}|${groupsPart}`
  })

  // ===== RETURN =====
  return {
    // Store Refs
    activeProductDetails,
    activeStyleDetails,
    activeDesignDetails,
    // Computed IDs
    effectiveProductId,
    effectiveStyleId,
    effectiveDesignId,
    // Computed Derived
    effectiveSvgGroups,
    effectiveLogos,
    renderVersion
  }
}
