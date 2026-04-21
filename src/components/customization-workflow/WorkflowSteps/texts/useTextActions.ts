import { reactive, ref, computed, watch, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useHistoryStore } from '@/stores/history/history.store'
import type {
  OutputProductText,
  OutputProductTextItem,
  APCustomizationRosterEntry
} from '@/services/products/types'
import { resolveFontToOptionValue } from '@/lib/fontKey'
import { clone, toNumber } from './useTextUtils'
import { selectedPlacementId } from './useTextPlacements'
import { useTexts } from './useTexts'

// Extended type for text items that may have additional properties
type ExtendedTextItem = OutputProductTextItem & {
  width?: string
  placement_id?: number
}

// ===== SHARED STATE =====
export const currentTextEditRef = ref<OutputProductText | null>(null)

export function useTextActions() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()
  const { fontOptions } = useTexts()

  // ===== STATE =====
  // Use toRef to create a properly typed ref from the store
  const activeTextId = toRef(workflowStore, 'activeTextId')
  const { activeProductDetails } = storeToRefs(productsStore)

  // Flag to prevent syncing during user input
  const isUserInput = ref(false)

  // Track previous state for all attributes to detect changes
  const previousState = ref<{
    text: string
    font: string
    fill: string
    outline: string
    // outline_enabled is read-only, not tracked
    outline_width: number
    height: number
    width: number
    angle: number
    placement: 'Front' | 'Back'
    scaleX: number
    scaleY: number
  } | null>(null)

  // Form state
  const form = reactive({
    text: '',
    font: '',
    fill: '#000000',
    outline: '#ffffff',
    outline_enabled: false,
    outline_width: 0,
    height: 0,
    width: 0,
    angle: 0,
    placement: 'Front' as 'Front' | 'Back',
    number: ''
  })

  // ===== COMPUTED =====
  const textEntries = computed(() => customizationStore.activeProductTexts)
  const productId = computed(
    () => customizationStore.activeProductId ?? activeProductDetails.value?.id ?? null
  )

  const currentEntry = computed<OutputProductText | null>(() => {
    const textId = activeTextId.value
    if (textId == null) return null
    // Use string coercion to handle both numeric IDs and UUID string IDs
    const textIdStr = String(textId)
    return textEntries.value.find(entry => String(entry.id) === textIdStr) ?? null
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
    next.value = entry.type === 'number' ? form.number : form.text
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
    // outline_enabled is read-only, not modified by user
    extendedTarget.outline_width = form.outline_width
    extendedTarget.rotation = String(form.angle)
    extendedTarget.scaleX = extendedTarget.scaleX ?? 1
    extendedTarget.scaleY = extendedTarget.scaleY ?? 1
    extendedTarget.selected = true
    extendedTarget.placement = form.placement

    return next
  }

  /**
   * Update the text entry in the customization store directly (without history)
   * This is called in real-time as the form changes to update the canvas immediately
   */
  /**
   * Debounced localStorage save for smooth slider interactions
   */
  const debouncedPushHistory = useDebounceFn(() => {
    customizationStore.pushHistoryState('Updated text')
  }, 300)

  /**
   * Optimized update that directly mutates properties for slider attributes
   * This avoids creating new objects and triggering unnecessary reactivity
   * Uses triggerRef to ensure Vue reactivity detects the change
   */
  function updateEntryInStoreOptimized(attribute: 'angle' | 'height' | 'outline_width') {
    const textId: number | string | null = activeTextId.value
    const prodId: number | null = productId.value
    const entry = currentEntry.value

    if (!entry || prodId == null || textId == null) return
    if (!customizationStore.customization) return

    const key = String(prodId)
    const texts = customizationStore.customization.product_custom_texts[key]
    if (!texts) return

    const entryIndex = texts.findIndex(e => String(e.id) === String(textId))
    if (entryIndex === -1) return

    const targetEntry = texts[entryIndex]
    if (!targetEntry) return

    const itemIndex = targetEntry.active_item_index ?? 0
    if (!targetEntry.items) targetEntry.items = []
    if (!targetEntry.items[itemIndex]) targetEntry.items[itemIndex] = {} as OutputProductTextItem
    const targetItem = targetEntry.items[itemIndex]

    // Update the property value
    let updatedValue: string | number
    switch (attribute) {
      case 'angle':
        updatedValue = String(form.angle)
        break
      case 'height':
        updatedValue = String(form.height)
        break
      case 'outline_width':
        updatedValue = form.outline_width
        break
    }

    // Force reactivity update by creating new object references
    // This ensures Vue's deep watcher detects the nested property changes
    // Create new item object with updated property
    const updatedItem = { ...targetItem }
    switch (attribute) {
      case 'angle':
        updatedItem.rotation = updatedValue as string
        break
      case 'height':
        updatedItem.height = updatedValue as string
        break
      case 'outline_width':
        updatedItem.outline_width = updatedValue as number
        break
    }

    // Create new items array with updated item
    const updatedItems = [...(targetEntry.items || [])]
    updatedItems[itemIndex] = updatedItem

    // Create new entry object with updated items array
    const updatedEntry = { ...targetEntry, items: updatedItems }

    // Update the array with new entry reference
    texts[entryIndex] = updatedEntry

    // Debounced localStorage save
    // void debouncedSaveToLocalStorage()
  }

  function updateEntryInStore() {
    const textId: number | string | null = activeTextId.value
    const prodId: number | null = productId.value
    const entry = currentEntry.value
    if (!entry || prodId == null || textId == null) return
    if (!customizationStore.customization) return

    const key = String(prodId)
    const texts = customizationStore.customization.product_custom_texts[key]
    if (!texts) return

    const entryIndex = texts.findIndex(e => String(e.id) === String(textId))
    if (entryIndex === -1) return

    // Set flag to prevent syncFormWithEntry from overwriting form values
    isUserInput.value = true

    // Build updated entry from current form state
    const updated = buildUpdatedEntry(entry)

    // Update the entry in place
    texts[entryIndex] = updated

    // Always debounce history push so typing does not create one entry per keystroke
    void debouncedPushHistory()

    // Reset flag after a short delay to allow store updates to propagate
    setTimeout(() => {
      isUserInput.value = false
    }, 0)
  }

  /**
   * Save individual attribute changes to history registry
   */
  async function saveAttributeToHistory(attribute: string) {
    const textId: number | string | null = activeTextId.value
    const prodId: number | null = productId.value

    if (prodId == null || textId == null) return
    const key = String(prodId)

    // Find the current entry in the store to get the actual current state
    const texts = customizationStore.customization?.product_custom_texts[key]
    if (!texts) return

    const entryIndex = texts.findIndex(e => String(e.id) === String(textId))
    if (entryIndex === -1) return

    const currentEntryState = texts[entryIndex]
    if (!currentEntryState) return

    const itemIndex = currentEntryState.active_item_index ?? 0
    const currentItemState = currentEntryState.items?.[itemIndex]

    if (!currentItemState) return

    // previousState should have been captured before updateEntryInStore() was called
    // If it's still null, something went wrong, but we'll use current state as fallback
    if (!previousState.value) {
      previousState.value = {
        text: currentEntryState.value || '',
        font: currentEntryState.font_family || '',
        fill: currentItemState.color || '#000000',
        outline: currentItemState.outline_color || '#ffffff',
        // outline_enabled is read-only, not tracked in previousState
        outline_width: currentItemState.outline_width || 0,
        height: toNumber(currentItemState.height, 10),
        width: toNumber(
          (currentItemState as ExtendedTextItem).width ?? currentItemState.height,
          toNumber(currentItemState.height, 10)
        ),
        angle: toNumber(currentItemState.rotation, 0),
        placement: currentItemState.placement || 'Front',
        scaleX: currentItemState.scaleX ?? 1,
        scaleY: currentItemState.scaleY ?? 1
      }
    }

    const prev = previousState.value

    switch (attribute) {
      case 'text':
        if (prev.text !== form.text) {
          await historyStore.execute('text.update-value', {
            key,
            textId,
            itemIndex,
            prevValue: prev.text,
            nextValue: form.text
          })
          prev.text = form.text
        }
        break
      case 'font':
        if (prev.font !== form.font) {
          await historyStore.execute('text.update-font', {
            key,
            textId,
            itemIndex,
            prevFont: prev.font,
            nextFont: form.font
          })
          prev.font = form.font
        }
        break
      case 'fill':
        if (prev.fill !== form.fill) {
          await historyStore.execute('text.update-color', {
            key,
            textId,
            itemIndex,
            prevColor: prev.fill,
            nextColor: form.fill
          })
          prev.fill = form.fill
        }
        break
      case 'outline':
        if (prev.outline !== form.outline) {
          await historyStore.execute('text.update-outline-color', {
            key,
            textId,
            itemIndex,
            prevColor: prev.outline,
            nextColor: form.outline
          })
          prev.outline = form.outline
        }
        break
      // outline_enabled is read-only, not saved to history
      case 'outline_width':
        if (prev.outline_width !== form.outline_width) {
          await historyStore.execute('text.update-outline-width', {
            key,
            textId,
            itemIndex,
            prevWidth: prev.outline_width,
            nextWidth: form.outline_width
          })
          prev.outline_width = form.outline_width
        }
        break
      case 'height':
        if (prev.height !== form.height) {
          await historyStore.execute('text.update-height', {
            key,
            textId,
            itemIndex,
            prevHeight: String(prev.height),
            nextHeight: String(form.height)
          })
          prev.height = form.height
        }
        break
      case 'width':
        if (prev.width !== form.width) {
          await historyStore.execute('text.update-width', {
            key,
            textId,
            itemIndex,
            prevWidth: String(prev.width),
            nextWidth: String(form.width)
          })
          prev.width = form.width
        }
        break
      case 'angle':
        if (prev.angle !== form.angle) {
          await historyStore.execute('text.update-rotation', {
            key,
            textId,
            itemIndex,
            prevRotation: String(prev.angle),
            nextRotation: String(form.angle)
          })
          prev.angle = form.angle
        }
        break
      case 'placement':
        if (prev.placement !== form.placement) {
          await historyStore.execute('text.update-placement', {
            key,
            textId,
            itemIndex,
            prevPlacement: prev.placement,
            nextPlacement: form.placement
          })
          prev.placement = form.placement
        }
        break
    }
  }

  /**
   * Track the initial value when a debounced attribute change starts
   * This ensures we capture the state before the first change in a sequence
   */
  const debouncedAttributeInitialValues = new Map<string, number>()

  /**
   * Debounced version for attributes that change frequently
   * Captures the initial value before the first change, then saves after debounce
   */
  const debouncedSaveAttributeToHistory = useDebounceFn(async (attribute: string) => {
    // Restore the initial previous state value before saving
    const initialValue = debouncedAttributeInitialValues.get(attribute)
    if (initialValue !== undefined && previousState.value) {
      // Temporarily restore the initial value for accurate history tracking
      if (attribute === 'angle') {
        previousState.value.angle = initialValue
      } else if (attribute === 'height') {
        previousState.value.height = initialValue
      } else if (attribute === 'outline_width') {
        previousState.value.outline_width = initialValue
      }
    }
    await saveAttributeToHistory(attribute)
    if (attribute === 'angle') {
      customizationStore.pushHistoryState('Changed text angle')
    } else if (attribute === 'height') {
      customizationStore.pushHistoryState('Changed text height')
    } else if (attribute === 'outline_width') {
      customizationStore.pushHistoryState('Changed text outline width')
    }
    // Clear the initial value after saving
    debouncedAttributeInitialValues.delete(attribute)
  }, 500)

  // Sync form with current entry (from store to form)
  function syncFormWithEntry() {
    const entry = currentEntry.value
    const item = currentItem.value
    if (!entry || !item) {
      return
    }

    // Only update form if not currently user input (to avoid circular updates)
    if (!isUserInput.value) {
      if (entry.type === 'number') {
        form.number = entry.value || ''
      } else {
        form.text = entry.value || ''
      }
      {
        const raw = entry.font_family || ''
        form.font = resolveFontToOptionValue(raw, fontOptions.value) ?? raw
      }
      form.fill = item.color || '#000000'
      form.outline = item.outline_color || '#ffffff'
      form.outline_enabled = item.outline_enabled || false
      form.outline_width = item.outline_width || 0
      form.height = toNumber(item.height, 10)
      form.width = toNumber((item as ExtendedTextItem).width ?? item.height, form.height)
      form.angle = toNumber(item.rotation, 0)
      form.placement = item.placement || 'Front'

      // Update previous state (outline_enabled is read-only, not tracked)
      previousState.value = {
        text: form.text,
        font: form.font,
        fill: form.fill,
        outline: form.outline,
        outline_width: form.outline_width,
        height: form.height,
        width: form.width,
        angle: form.angle,
        placement: form.placement,
        scaleX: item.scaleX ?? 1,
        scaleY: item.scaleY ?? 1
      }
    }
  }
  function ensureRosterRowExists() {
    const newproductId = productId.value
    if (!newproductId) return

    const rosterEntries = customizationStore.rosterEntries

    if (!rosterEntries || rosterEntries.length === 0) {
      customizationStore.addEmptyRosterRow(
        {
          text: form.text || '',
          size: '',
          quantity: 1
        },
        { skipHistory: true }
      )
      workflowStore.setRosterSubStep('edit')
    }
  }
  // from text fields
  function updateTextAndRoster() {
    const isPlayerNameEntry =
      currentEntry.value?.manually_added !== true && !currentEntry.value?.design_id
    if (isPlayerNameEntry) {
      ensureRosterRowExists()
      const rosterEntries = customizationStore.rosterEntries
      if (rosterEntries && rosterEntries.length > 0) {
        customizationStore.updateRosterRow(0, { text: form.text || '' }, { skipHistory: true })
      }
    }

    updateEntryInStore()
  }
  // from text number
  function syncTextToRosterAndEntry(formFromNumber: string) {
    const newProductId = productId.value
    if (!newProductId) return

    const rosterEntries = customizationStore.rosterEntries

    if (!rosterEntries || rosterEntries.length === 0) {
      customizationStore.addEmptyRosterRow(
        {
          number: formFromNumber || '',
          size: '',
          quantity: 1
        },
        { skipHistory: true }
      )

      workflowStore.setRosterSubStep('edit')
    } else {
      const firstEntry = rosterEntries[0]
      const updates: Partial<APCustomizationRosterEntry> = {
        text: firstEntry?.text || '',
        number: formFromNumber || ''
      }
      customizationStore.updateRosterRow(0, updates, { skipHistory: true })
    }

    updateEntryInStore()
  }

  watch(
    activeTextId,
    () => {
      syncFormWithEntry()
    },
    { immediate: true }
  )

  // Watch for entry content changes (e.g., from undo/redo) to sync form
  // Only sync when not currently user input to avoid overwriting user changes
  watch(
    () => currentEntry.value,
    () => {
      const isOnRosterEditTab =
        workflowStore.activeStep === 'roster' && workflowStore.rosterSubStep === 'edit'
      if (!isUserInput.value && !isOnRosterEditTab) {
        syncFormWithEntry()
      }
    },
    { deep: true }
  )

  // Watch text content: update store/roster immediately, push history once per pause (debounced)
  // Only sync to roster when editing the player name (preset name), not when editing additional/fixed text
  watch(
    () => form.text,
    newText => {
      if (!isUserInput.value) return
      if (currentEntry.value?.type === 'number') return

      const prodId = productId.value
      if (!prodId) return

      const isPlayerNameEntry =
        currentEntry.value?.manually_added !== true && !currentEntry.value?.design_id
      if (isPlayerNameEntry) {
        const roster = customizationStore.rosterEntries
        if (!roster || roster.length === 0) {
          customizationStore.addEmptyRosterRow(
            { text: newText, number: form.number || '' },
            { skipHistory: true }
          )
        } else {
          const firstEntry = roster[0]
          const updates: Partial<APCustomizationRosterEntry> = { text: newText }
          if (firstEntry?.number && !form.number) {
            updates.number = firstEntry.number
          } else if (form.number) {
            updates.number = form.number
          }
          customizationStore.updateRosterRow(0, updates, { skipHistory: true })
        }
      }

      const textId = activeTextId.value
      if (textId != null) {
        customizationStore.updateProductTextValueById(textId, newText, { persist: false })
      }
      void debouncedPushHistory()
    }
  )

  // When single number entry is edited in TextEdit, persist number to entry and roster
  watch(
    () => form.number,
    () => {
      const entry = currentEntry.value
      if (!entry || entry.type !== 'number') return
      isUserInput.value = true
      syncTextToRosterAndEntry(form.number)
      setTimeout(() => {
        isUserInput.value = false
      }, 0)
    }
  )

  watch(
    () => form.outline_width,
    () => {
      if (isUserInput.value && form.outline_enabled) {
        updateTextAndRoster()
      }
    }
  )

  watch(
    () => form.angle,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating (only if not already captured for this attribute)
      if (!debouncedAttributeInitialValues.has('angle')) {
        capturePreviousStateIfNeeded()
        // Store the initial angle value before any changes
        if (previousState.value) {
          debouncedAttributeInitialValues.set('angle', previousState.value.angle)
        }
      }
      // Use optimized update for smooth slider interaction
      updateEntryInStoreOptimized('angle')
      void debouncedSaveAttributeToHistory('angle')
    }
  )

  watch(
    () => form.height,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating (only if not already captured for this attribute)
      if (!debouncedAttributeInitialValues.has('height')) {
        capturePreviousStateIfNeeded()
        // Store the initial height value before any changes
        if (previousState.value) {
          debouncedAttributeInitialValues.set('height', previousState.value.height)
        }
      }
      // Use optimized update for smooth slider interaction
      updateEntryInStoreOptimized('height')
      void debouncedSaveAttributeToHistory('height')
    }
  )

  /**
   * Capture previous state from store before updating
   * This ensures we have the correct "before" state for history
   */
  function capturePreviousStateIfNeeded() {
    if (previousState.value) return // Already captured

    const textId: number | string | null = activeTextId.value
    const prodId: number | null = productId.value
    if (prodId == null || textId == null) return

    const key = String(prodId)
    const texts = customizationStore.customization?.product_custom_texts[key]
    if (!texts) return

    const entryIndex = texts.findIndex(e => String(e.id) === String(textId))
    if (entryIndex === -1) return

    const entry = texts[entryIndex]
    if (!entry) return

    const itemIndex = entry.active_item_index ?? 0
    const item = entry.items?.[itemIndex]
    if (!item) return

    previousState.value = {
      text: entry.value || '',
      font: entry.font_family || '',
      fill: item.color || '#000000',
      outline: item.outline_color || '#ffffff',
      // outline_enabled is read-only, not tracked in previousState
      outline_width: item.outline_width || 0,
      height: toNumber(item.height, 10),
      width: toNumber((item as ExtendedTextItem).width ?? item.height, toNumber(item.height, 10)),
      angle: toNumber(item.rotation, 0),
      placement: item.placement || 'Front',
      scaleX: item.scaleX ?? 1,
      scaleY: item.scaleY ?? 1
    }
  }

  // Watch immediate attributes - update canvas and save to history immediately
  watch(
    () => form.font,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating
      capturePreviousStateIfNeeded()
      updateEntryInStore()
      void saveAttributeToHistory('font')
    }
  )

  watch(
    () => form.fill,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating
      capturePreviousStateIfNeeded()
      updateEntryInStore()
      void saveAttributeToHistory('fill')
    }
  )

  watch(
    () => form.outline,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating
      capturePreviousStateIfNeeded()
      updateEntryInStore()
      void saveAttributeToHistory('outline')
    }
  )

  // outline_enabled is read-only, no watcher needed

  watch(
    () => form.outline_width,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating (only if not already captured for this attribute)
      if (!debouncedAttributeInitialValues.has('outline_width')) {
        capturePreviousStateIfNeeded()
        // Store the initial outline_width value before any changes
        if (previousState.value) {
          debouncedAttributeInitialValues.set('outline_width', previousState.value.outline_width)
        }
      }
      // Use optimized update for smooth slider interaction
      updateEntryInStoreOptimized('outline_width')
      void debouncedSaveAttributeToHistory('outline_width')
    }
  )

  watch(
    () => form.width,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating
      capturePreviousStateIfNeeded()
      updateEntryInStore()
      void saveAttributeToHistory('width')
    }
  )

  watch(
    () => form.placement,
    () => {
      const textId: number | string | null = activeTextId.value
      if (!currentEntry.value || textId == null) return

      // Capture previous state before updating
      capturePreviousStateIfNeeded()
      // Reset 3D coordinates when placement changes
      const prodId: number | null = productId.value
      if (prodId && customizationStore.customization) {
        const key = String(prodId)
        const texts = customizationStore.customization.product_custom_texts[key]
        if (texts) {
          const entryIndex = texts.findIndex(e => String(e.id) === String(textId))
          if (entryIndex !== -1) {
            const targetEntry = texts[entryIndex]
            if (!targetEntry) return // Early return if targetEntry is undefined
            const itemIndex = targetEntry.active_item_index ?? 0
            if (targetEntry.items?.[itemIndex]) {
              const item = targetEntry.items[itemIndex]
              if (item && typeof item === 'object') {
                ;(item as { x_axis_3d?: number }).x_axis_3d = 0
                ;(item as { y_axis_3d?: number }).y_axis_3d = 0
              }
            }
          }
        }
      }
      updateEntryInStore()
      void saveAttributeToHistory('placement')
    }
  )

  // Watch selectedPlacementId changes
  watch(selectedPlacementId, () => {
    const textId: number | string | null = activeTextId.value
    if (!currentEntry.value || textId == null) return
    updateEntryInStore()
    // Placement changes are handled by the placement watcher above
  })

  // ===== RETURN =====
  return {
    form,
    currentEntry,
    currentItem,
    textEntries,
    productId,
    updateEntryInStore,
    updateEntryInStoreOptimized,
    buildUpdatedEntry,
    // debouncedSaveToLocalStorage,
    isUserInput,
    previousState,
    ensureRosterRowExists,
    updateTextAndRoster,
    syncTextToRosterAndEntry
  }
}
