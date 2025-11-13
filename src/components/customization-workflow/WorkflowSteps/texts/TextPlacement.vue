<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useUIStore } from '@/stores/ui/ui.store'

  import ProductPreviewCanvas from '@/components/customization-workflow/WorkflowSteps/ProductPreviewCanvas.vue'
  import type { OutputProductText } from '@/services/products/types'
  import { useTextPlacements, type TextItemPlacement } from './useTextPlacements'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  // ===== STORES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()

  // ===== COMPOSABLES =====
  const { buildEntryFromTemplate, updateEntryWithPlacement, availableTextPlacements } =
    useTextPlacements()

  // ===== STATE =====
  const { activeProductDetails, activeStyleDetails, activeDesignDetails } =
    storeToRefs(productsStore)
  const { activeProductId } = storeToRefs(customizationStore)
  const { activeTextId, pendingTextTemplateId } = storeToRefs(workflowStore)

  // ===== CONSTANTS =====

  /** Preview canvas size in pixels (for overlay calculations) */
  const PREVIEW_SIZE = 176
  /** Base canvas size in pixels (actual product canvas size) */
  const CANVAS_BASE = 600

  // ===== COMPUTED =====

  /**
   * Available text templates from product details
   * Used to inherit styling properties when creating new entries
   */
  const textTemplates = computed(() => activeProductDetails.value?.product_texts ?? [])

  /**
   * Current custom text entries from customization store
   * These are user-added or customized texts
   */
  const textEntries = computed(() => customizationStore.activeProductTexts)

  /**
   * Placements with calculated overlay rectangles for preview display
   *
   * This computed property:
   * 1. Gets all available placements from product_texts items
   * 2. Calculates overlay rectangles scaled to preview size
   * 3. Centers the overlay on the placement coordinates
   *
   * The overlay is used to highlight where text will be placed on the product preview.
   */
  const placementsWithOverlay = computed(() => {
    const placements = availableTextPlacements.value
    if (!placements || placements.length === 0) return []

    // Calculate scale factor to convert from canvas coordinates to preview coordinates
    const scale = PREVIEW_SIZE / CANVAS_BASE

    return placements.map(placement => {
      // Get dimensions: use width if available, otherwise use height, fallback to 300
      const width = Number(placement.width ?? placement.height ?? 300)
      const height = Number(placement.height ?? width)

      // Calculate overlay rectangle:
      // - Position: center the overlay on placement coordinates (subtract half width/height)
      // - Size: scale dimensions to preview size
      // - Color: semi-transparent blue for visibility
      const overlay = {
        x: (Number(placement.x_axis) - width / 2) * scale,
        y: (Number(placement.y_axis) - height / 2) * scale,
        width: width * scale,
        height: height * scale,
        color: 'rgba(59,130,246,0.35)'
      }

      return { placement, overlay }
    })
  })

  // ===== ACTIONS =====

  /**
   * Handles placement selection from the placement grid
   *
   * When a user clicks on a placement:
   * 1. If an existing manually-added entry is active, update it with new placement coordinates
   * 2. Otherwise, create a new text entry with the selected placement coordinates
   *
   * Important: Preset texts (from product defaults) are never updated.
   * If a preset text is active, a new entry is created instead.
   *
   * @param placement - The selected placement with coordinates and properties
   */
  const handleSelectPlacement = async (placement: TextItemPlacement) => {
    if (activeProductId.value == null) return

    const key = String(activeProductId.value)

    // Determine which template to use for styling properties
    // Priority: pendingTextTemplateId > first name template > undefined
    const nameTemplate = textTemplates.value.find(text => text.type === 'name')
    const template = pendingTextTemplateId.value
      ? textTemplates.value.find(p => p?.id === pendingTextTemplateId.value)
      : nameTemplate

    // Check if there's an existing entry to update
    let existingEntry: OutputProductText | undefined
    let targetIndex: number | undefined

    if (activeTextId.value != null) {
      const index = textEntries.value.findIndex(e => e.id === activeTextId.value)
      if (index !== -1) {
        existingEntry = textEntries.value[index]
        targetIndex = index
      }
    }

    // Determine if existing entry is manually added (can be updated)
    // Preset texts have positive IDs and manually_added = false/undefined
    // Manually added texts have negative IDs OR manually_added = true
    const isManuallyAdded =
      existingEntry?.manually_added === true || (existingEntry?.id != null && existingEntry.id < 0)

    if (existingEntry?.id && isManuallyAdded) {
      // Update existing manually-added entry with new placement coordinates
      const updatedEntry = updateEntryWithPlacement(existingEntry, placement, template ?? undefined)
      await historyStore.execute('text.update-entry', {
        key,
        textId: existingEntry.id,
        prev: existingEntry,
        next: updatedEntry
      })
      workflowStore.setActiveTextId(existingEntry.id)
      workflowStore.setTextsSubStep('edit')
    } else {
      // Create new entry (applies when: no existing entry OR existing is a preset)
      // Preset texts should never be overridden - always create new entry instead
      const newEntry = buildEntryFromTemplate(template, placement, activeProductId.value)
      const insertAt =
        targetIndex !== undefined
          ? Math.min(targetIndex, textEntries.value.length)
          : textEntries.value.length

      await historyStore.execute('text.add-entry', {
        key,
        index: insertAt,
        entry: newEntry
      })

      if (newEntry.id) {
        workflowStore.setActiveTextId(newEntry.id)
        workflowStore.setTextsSubStep('edit')
      }
    }

    // Update workflow state
    workflowStore.setActiveTextItemIndex(placement.id)
    workflowStore.setPendingTextTemplateId(null)
  }
</script>

<template>
  <!-- Content -->
  <div class="flex flex-col gap-4">
    <div v-if="placementsWithOverlay.length" class="grid grid-cols-2">
      <div
        v-for="item in placementsWithOverlay"
        :key="item.placement.id"
        class="flex flex-col gap-4 items-center cursor-pointer w-full p-4 group"
        @click="handleSelectPlacement(item.placement)"
      >
        <div
          class="flex-start w-full text-base font-semibold truncate leading-none overflow-visible"
        >
          {{ item.placement.name_of_placement }}
        </div>
        <div class="relative" width="112" height="112">
          <ProductPreviewCanvas
            v-if="activeProductDetails && activeStyleDetails && activeDesignDetails"
            :product="activeProductDetails"
            :style-base="activeStyleDetails"
            :design-base="activeDesignDetails"
            :width="isMobile ? 130 : 176"
            :height="isMobile ? 130 : 176"
            :side="item.placement.side === 'back' ? 'back' : 'front'"
            :overlay-rect="item.overlay"
          />
        </div>
      </div>
    </div>
    <div
      v-else
      class="flex min-h-[9rem] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
    >
      No placements available for this product.
    </div>
  </div>
</template>

<style scoped></style>
