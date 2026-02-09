import { computed, reactive, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import type { OutputProductLogosSetting } from '@/services/products/types'
import type { CustomLogo } from '@/services/logos/types'

export interface PlacementOption {
  label: string
  value: string
  placementId: number
  placementKey: string
  x_axis: number | null
  y_axis: number | null
  width: number | null
  height: number | null
  side: 'front' | 'back'
}

export function useLogoPlacements() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()

  // ===== STATE =====
  const { activeProductDetails } = storeToRefs(productsStore)

  const positionForm = reactive({
    placementOption: null as PlacementOption | null,
    height: '',
    angle: [0]
  })

  const currentWidth = ref<number>(0)
  const previousPlacementOption = ref<PlacementOption | null>(null)
  const isSyncingAngle = ref(false)
  const rotationChangeStart = ref<number | null>(null)
  const heightChangeStart = ref<number | null>(null)

  // ===== COMPUTED =====
  const placements = computed<OutputProductLogosSetting[]>(
    () => activeProductDetails.value?.logos_setting || []
  )

  const placementOptions = computed<PlacementOption[]>(() =>
    placements.value
      .map(placement => ({
        label: placement.name_of_placement,
        value: String(placement.id),
        placementId: placement.id,
        x_axis: placement.x_axis,
        y_axis: placement.y_axis,
        placementKey: `${placement.name_of_placement}_${placement.id}_${placement.x_axis}_${placement.y_axis}_${placement.width}_${placement.height}_${placement.side}`,
        width: placement.width ?? null,
        height: placement.height ?? null,
        side: placement.side
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )

  // ===== UTILITIES =====
  function resolvePlacementByValue(value: string | null): PlacementOption | null {
    if (!value) return null
    return placementOptions.value.find(option => option.value === value) ?? null
  }

  function syncFormWithLogo(logo: CustomLogo | null) {
    if (!logo) {
      const option = placementOptions.value[0] ?? null
      positionForm.placementOption = option
      previousPlacementOption.value = option
      positionForm.height = option?.height ? option.height.toFixed(1) : ''
      return
    }

    // Find the placement option that matches this logo
    // Priority: match by name_of_placement → match by x_axis/y_axis → match by placement_id → use first
    let option: PlacementOption | null = null

    // Try to match by name_of_placement
    if (logo.name_of_placement) {
      option = placementOptions.value.find(item => item.label === logo.name_of_placement) ?? null
    }

    // Try to match by position coordinates
    if (!option && logo.x_axis !== undefined && logo.y_axis !== undefined) {
      option =
        placementOptions.value.find(
          item =>
            item.x_axis === logo.x_axis &&
            item.y_axis === logo.y_axis &&
            item.side === (logo.side || 'front')
        ) ?? null
    }

    // Try to match by placement_id
    const logoPlacementId = (logo as { placement_id?: number })?.placement_id
    if (!option && logoPlacementId) {
      option =
        placementOptions.value.find(item => String(item.placementId) === String(logoPlacementId)) ??
        null
    }

    // Fallback to first option
    if (!option) {
      option = placementOptions.value[0] ?? null
    }

    positionForm.placementOption = option
    previousPlacementOption.value = option

    // Use logo's actual values, not fallback to placement defaults
    const logoWidth = Number(logo.width)
    const logoHeight = Number(logo.height)
    currentWidth.value = logoWidth || 0
    positionForm.height = logoHeight ? logoHeight.toFixed(1) : ''
    isSyncingAngle.value = true
    positionForm.angle = [Number(logo.rotation || 0)]
    rotationChangeStart.value = null
    void nextTick(() => {
      isSyncingAngle.value = false
    })
  }

  // ===== RETURN =====
  return {
    // State
    positionForm,
    currentWidth,
    previousPlacementOption,
    isSyncingAngle,
    rotationChangeStart,
    heightChangeStart,
    // Computed
    placements,
    placementOptions,
    // Utilities
    resolvePlacementByValue,
    syncFormWithLogo
  }
}
