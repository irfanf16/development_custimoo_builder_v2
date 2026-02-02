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
    const optionByKey = logo?.placement
      ? placementOptions.value.find(item => item.placementKey === logo.placement)
      : null
    // Check if logo has placement_id property (it might not be in the type definition)
    const logoPlacementId = (logo as { placement_id?: number })?.placement_id
    const optionById = logoPlacementId
      ? placementOptions.value.find(item => String(item.placementId) === String(logoPlacementId))
      : null
    const option = optionByKey ?? optionById ?? placementOptions.value[0] ?? null

    positionForm.placementOption = option
    previousPlacementOption.value = option

    if (!logo) {
      positionForm.height = option?.height ? option.height.toFixed(1) : ''
      return
    }

    const resolvedWidth = Number(logo.width || option?.width || 0)
    const resolvedHeight = Number(logo.height || option?.height || 0)
    currentWidth.value = resolvedWidth
    positionForm.height = resolvedHeight ? resolvedHeight.toFixed(1) : ''
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
