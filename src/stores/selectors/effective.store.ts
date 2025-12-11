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
  const { activeProductDetails, activeStyleDetails, activeDesignDetails, svgGroups } =
    storeToRefs(productsStore)

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
        // If customized has gradient_colors, preserve them and merge with base percentage if missing
        if (customized.gradient_colors) {
          // Merge customized gradient_colors with base to preserve percentage
          const baseGradientColors = svgGroup.gradient_colors || []
          const mergedGradientColors = customized.gradient_colors.map((customGc, index) => {
            const baseGc = baseGradientColors[index]
            return {
              ...customGc,
              // Preserve percentage from base if not in customized
              percentage: (customGc as { percentage?: number }).percentage ?? baseGc?.percentage
            }
          })

          return {
            id: svgGroup.id,
            name: customized.name ?? '',
            color: customized.color ?? svgGroup.color,
            pantone: '',
            count: svgGroup.count ?? 0,
            gradient_colors: mergedGradientColors
          }
        }
        // Regular color override
        return {
          id: svgGroup.id,
          name: customized.name ?? '',
          color: customized.color ?? '',
          pantone: '',
          count: svgGroup.count ?? 0
        }
      }
      return svgGroup
    })
  })

  const effectiveLogos = computed<CustomLogo[]>(() => {
    if (!effectiveProductId.value) return []
    const effectiveLogos =
      customizationStore.customization?.custom_logos[effectiveProductId.value.toString()] || []
    return effectiveLogos
  })

  const groupsVersion = computed<string>(() => {
    return (effectiveSvgGroups.value || []).map(g => `${g.id}:${g.color}`).join(',')
  })

  const renderVersion = computed<string>(() => {
    const idPart = [
      effectiveProductId.value ?? 'null',
      effectiveStyleId.value ?? 'null',
      effectiveDesignId.value ?? 'null'
    ].join(':')

    const logosMetaPart = effectiveLogos.value.map(logo => `${logo.id}:${logo.url}`).join(',')

    const logosGeometryPart = effectiveLogos.value
      .map(logo =>
        [
          logo.id,
          logo.width,
          logo.height,
          logo.rotation,
          logo.x_axis,
          logo.y_axis,
          logo.scaleX ?? '',
          logo.scaleY ?? '',
          logo.name_of_placement ?? ''
        ].join(':')
      )
      .join(',')

    return `${idPart}|${logosMetaPart}|${logosGeometryPart}`
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
    renderVersion,
    groupsVersion
  }
}
