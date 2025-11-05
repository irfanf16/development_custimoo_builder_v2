import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import type {
  OutputProductText,
  OutputProductTextItem,
  OutputProductName
} from '@/services/products/types'
import { clone } from './useTextUtils'

// Extended type for text items that may have additional properties
type ExtendedTextItem = OutputProductTextItem & {
  width?: string
  placement_id?: number
}

// ===== SHARED STATE =====
// Shared placement selection state
export const selectedPlacementId = ref<number | null>(null)

export function useTextPlacements() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()

  // ===== STATE =====
  const { activeProductDetails } = storeToRefs(productsStore)

  // ===== COMPUTED =====

  const placementMap = computed<Record<number, OutputProductName>>(() => {
    const map: Record<number, OutputProductName> = {}
    for (const placement of activeProductDetails.value?.productnames ?? []) {
      map[placement.id] = placement
    }
    return map
  })

  const currentPlacement = computed<OutputProductName | null>(() => {
    return selectedPlacementId.value
      ? (placementMap.value[selectedPlacementId.value] ?? null)
      : null
  })

  const placementOptions = computed(() => activeProductDetails.value?.productnames ?? [])

  const availablePlacements = computed(() => {
    return activeProductDetails.value?.productnames ?? []
  })

  // ===== UTILITIES =====
  function getActiveItem(text: OutputProductText | null) {
    if (!text) return null
    const idx = text.active_item_index ?? 0
    return text.items?.[idx] ?? text.items?.[0] ?? null
  }

  function buildItemFromPlacement(
    placement: OutputProductName,
    templateItem?: OutputProductTextItem | null
  ): OutputProductTextItem {
    const base = templateItem ? clone(templateItem) : ({} as OutputProductTextItem)
    base.label = placement.name_of_placement
    base.height = String(placement.height ?? Number(base.height ?? 0))
    base.x_axis = String(placement.x_axis ?? Number(base.x_axis ?? 0))
    base.y_axis = String(placement.y_axis ?? Number(base.y_axis ?? 0))
    base.rotation = String(placement.rotation ?? Number(base.rotation ?? 0))
    base.is_locked = Boolean(placement.is_locked ?? base.is_locked ?? false)
    base.arc_text_allowed = Boolean(placement.arc_text_allowed ?? base.arc_text_allowed ?? false)
    base.outline_enabled = Boolean(base.outline_enabled ?? true)
    base.outline_width = base.outline_width ?? 0
    base.outline_width_converted = base.outline_width_converted ?? 0
    base.color = base.color || '#000000'
    base.color_pantone = base.color_pantone || ''
    base.outline_color = base.outline_color || '#FFFFFF'
    base.outline_color_pantone = base.outline_color_pantone || ''
    base.color_tab_index = base.color_tab_index ?? 0
    base.selected = true
    base.scaleX = base.scaleX ?? 1
    base.scaleY = base.scaleY ?? 1
    ;(base as Record<string, unknown>).placement_id = placement.id
    return base
  }

  function buildEntryFromTemplate(
    template: OutputProductText | undefined,
    placement: OutputProductName,
    productIdValue: number
  ): OutputProductText {
    const entry = template ? clone(template) : ({} as OutputProductText)
    entry.id = entry.id ?? 0
    entry.product_id = productIdValue
    entry.type = template?.type ?? 'name'
    entry.label = template?.label ?? placement.name_of_placement
    entry.placeholder = template?.placeholder ?? ''
    entry.value = template?.value ?? ''
    entry.following_products = template?.following_products ?? []
    entry.created_at = template?.created_at ?? null
    entry.updated_at = template?.updated_at ?? null
    entry.deleted_at = template?.deleted_at ?? null
    entry.manually_added = true
    entry.font_family = template?.font_family ?? ''
    entry.following_product_ids = template?.following_product_ids ?? []
    entry.active_item_index = 0
    entry.is_first_name = template?.is_first_name
    entry.is_first_number = template?.is_first_number
    const templateItem = template?.items?.[template.active_item_index ?? 0]
    const item = buildItemFromPlacement(placement, templateItem)
    entry.items = [item]
    return entry
  }

  function updateEntryWithPlacement(
    current: OutputProductText,
    placement: OutputProductName,
    template?: OutputProductText
  ): OutputProductText {
    const next = clone(current)
    const templateItem = template?.items?.[template.active_item_index ?? 0] ?? getActiveItem(next)
    const item = buildItemFromPlacement(placement, templateItem)
    next.items = [item]
    next.active_item_index = 0
    return next
  }

  function getPlacementItem(
    entry: OutputProductText | null,
    placementId: number
  ): ExtendedTextItem | null {
    if (!entry || !entry.items) return null
    return (
      (entry.items.find(item => (item as ExtendedTextItem).placement_id === placementId) as
        | ExtendedTextItem
        | undefined) ?? null
    )
  }

  function isPlacementEnabled(entry: OutputProductText | null, placementId: number): boolean {
    return getPlacementItem(entry, placementId) !== null
  }

  // ===== RETURN =====
  return {
    // State
    selectedPlacementId,
    // Computed
    placementMap,
    currentPlacement,
    placementOptions,
    availablePlacements,
    // Utilities
    getActiveItem,
    buildItemFromPlacement,
    buildEntryFromTemplate,
    updateEntryWithPlacement,
    getPlacementItem,
    isPlacementEnabled
  }
}
