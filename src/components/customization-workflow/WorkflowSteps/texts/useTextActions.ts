import { reactive, ref, computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useHistoryStore } from '@/stores/history/history.store'
import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
import { clone, toNumber } from './useTextUtils'
import { selectedPlacementId } from './useTextPlacements'

// Extended type for text items that may have additional properties
type ExtendedTextItem = OutputProductTextItem & {
  width?: string
  placement_id?: number
}

// ===== SHARED STATE =====
// These refs are shared across all component instances
export const onSaveChanges = ref<() => void>(() => {
  console.log('onSaveChanges')
})
export const onCancel = ref<() => void>(() => {
  console.log('onCancel')
})
export const currentTextEditRef = ref<OutputProductText | null>(null)

export function useTextActions() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()

  // ===== STATE =====
  const { activeTextIndex } = storeToRefs(workflowStore)
  const { activeProductDetails } = storeToRefs(productsStore)

  // Form state
  const form = reactive({
    text: '',
    font: '',
    fill: '#000000',
    outline: '#ffffff',
    height: 0,
    width: 0,
    angle: 0
  })

  // ===== COMPUTED =====
  const textEntries = computed(() => customizationStore.activeProductTexts)
  const productId = computed(
    () => customizationStore.activeProductId ?? activeProductDetails.value?.id ?? null
  )

  const currentEntry = computed<OutputProductText | null>(() => {
    if (activeTextIndex.value == null) return null
    return textEntries.value[activeTextIndex.value] ?? null
  })

  const currentItem = computed<OutputProductTextItem | null>(() => {
    const entry = currentEntry.value
    if (!entry) return null
    const idx = entry.active_item_index ?? 0
    return entry.items?.[idx] ?? entry.items?.[0] ?? null
  })

  // ===== ACTIONS =====
  function buildUpdatedEntry(entry: OutputProductText): OutputProductText {
    const next = clone(entry)
    next.value = form.text
    next.font_family = form.font
    const idx = next.active_item_index ?? 0
    if (!next.items) next.items = []
    if (!next.items[idx]) next.items[idx] = {} as OutputProductTextItem
    const target = next.items[idx]
    const extendedTarget = target as ExtendedTextItem
    extendedTarget.label = extendedTarget.label || next.label
    extendedTarget.height = String(form.height)
    extendedTarget.width = String(form.width)
    extendedTarget.color = form.fill
    extendedTarget.outline_color = form.outline
    extendedTarget.rotation = String(form.angle)
    extendedTarget.scaleX = extendedTarget.scaleX ?? 1
    extendedTarget.scaleY = extendedTarget.scaleY ?? 1
    extendedTarget.selected = true

    // Update placement if selected
    if (selectedPlacementId.value) {
      extendedTarget.placement_id = selectedPlacementId.value
    }

    return next
  }

  async function saveChanges() {
    if (!currentEntry.value || productId.value == null || activeTextIndex.value == null) return
    const key = String(productId.value)
    const prev = currentEntry.value
    const next = buildUpdatedEntry(prev)
    await historyStore.execute('text.update-entry', {
      key,
      index: activeTextIndex.value,
      prev,
      next
    })
    workflowStore.setTextsSubStep('list')
  }

  function cancel() {
    workflowStore.setTextsSubStep('list')
  }

  // Sync form with current entry
  function syncFormWithEntry() {
    const entry = currentEntry.value
    const item = currentItem.value
    if (!entry || !item) return

    form.text = entry.value || ''
    form.font = entry.font_family || ''
    form.fill = item.color || '#000000'
    form.outline = item.outline_color || '#ffffff'
    form.height = toNumber(item.height, 10)
    form.width = toNumber((item as ExtendedTextItem).width ?? item.height, form.height)
    form.angle = toNumber(item.rotation, 0)

    // Set selected placement if available
    const placementId = (item as ExtendedTextItem)?.placement_id
    if (typeof placementId === 'number') {
      selectedPlacementId.value = placementId
    }
  }

  // ===== WATCHERS =====
  watchEffect(() => {
    syncFormWithEntry()
  })

  // Set up save/cancel handlers
  onSaveChanges.value = () => {
    void saveChanges()
  }
  onCancel.value = cancel

  // ===== RETURN =====
  return {
    // State
    form,
    currentEntry,
    currentItem,
    currentTextEditRef,
    // Actions
    buildUpdatedEntry,
    saveChanges,
    cancel,
    syncFormWithEntry
  }
}
