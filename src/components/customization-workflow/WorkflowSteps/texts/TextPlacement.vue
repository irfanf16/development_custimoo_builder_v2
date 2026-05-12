<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    nav_text,
    logos_choose_placement,
    texts_no_product_placements
  } from '@/paraglide/messages'

  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import type { OutputProductText, OutputDesignDetails } from '@/services/products/types'
  import { useTextPlacements, type TextItemPlacement } from './useTextPlacements'

  // ===== STORES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const emit = defineEmits<{
    back: []
  }>()

  // ===== COMPOSABLES =====
  const { buildEntryFromTemplate, updateEntryWithPlacement, availableTextPlacements } =
    useTextPlacements()

  // ===== STATE =====
  const { activeProductDetails, activeStyleDetails, activeDesignDetails } =
    storeToRefs(productsStore)
  const { activeProductId } = storeToRefs(customizationStore)
  const { activeTextId, pendingTextTemplateId } = storeToRefs(workflowStore)

  // ===== COMPUTED =====

  const designBase = computed<OutputDesignDetails | null>(() => activeDesignDetails.value ?? null)

  /**
   * Returns design (file_url, safe_zone, boundary) for the given placement's side.
   * Used by TwoDScene to show the product design with the text placement overlay.
   */
  function getPlacementDesign(placement: TextItemPlacement) {
    if (!designBase.value) return undefined
    const side = placement.side === 'back' ? 'back' : 'front'
    const design = side === 'back' ? designBase.value.back_design : designBase.value.front_design
    if (!design?.file_url) return undefined
    const safeZone =
      side === 'back'
        ? designBase.value.backsafezone_design?.file_url
        : designBase.value.frontsafezone_design?.file_url
    const boundary =
      side === 'back'
        ? designBase.value.backboundary_design?.file_url
        : designBase.value.frontboundary_design?.file_url
    return {
      file_url: design.file_url,
      file_extension: design.file_extension || 'svg',
      safe_zone_url: safeZone,
      boundary_url: boundary
    }
  }

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

  const headerConfig = computed(() => ({
    breadcrumbs: [
      { label: nav_text({}, { locale: locale.value }), action: () => emit('back') },
      { label: logos_choose_placement({}, { locale: locale.value }) }
    ]
  }))
  void headerConfig.value

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
      existingEntry?.manually_added === true ||
      (existingEntry?.id != null && Number(existingEntry.id) < 0)

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
      workflowStore.setTextsSubStep('single')
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
        workflowStore.setTextsSubStep('single')
      }
    }

    // Update workflow state
    workflowStore.setActiveTextItemIndex(placement.id)
    workflowStore.setPendingTextTemplateId(null)
  }
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="workflow-texts-placement">
    <div v-if="availableTextPlacements.length" class="grid grid-cols-2">
      <div
        v-for="placement in availableTextPlacements"
        :key="placement.id"
        :data-testid="`workflow-texts-placement-item-${placement.id}`"
        class="flex flex-col gap-4 items-center cursor-pointer w-full p-4"
        @click="handleSelectPlacement(placement)"
      >
        <div
          class="flex-start w-full text-base font-semibold truncate leading-none overflow-visible"
        >
          {{ placement.name_of_placement }}
        </div>
        <TwoDScene
          v-if="
            activeProductDetails &&
            activeStyleDetails &&
            designBase &&
            getPlacementDesign(placement)
          "
          :design="getPlacementDesign(placement)"
          :side="(placement.side as 'front' | 'back') || 'front'"
          :canvas-width="150"
          :canvas-height="150"
          :main-canvas-width="600"
          :main-canvas-height="600"
          :main-preview="false"
          :text-placement="{
            x_axis: placement.x_axis,
            y_axis: placement.y_axis,
            width: placement.width ?? undefined,
            height: placement.height,
            side: placement.side
          }"
        />
      </div>
    </div>
    <div
      v-else
      class="flex min-h-[9rem] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
    >
      {{ texts_no_product_placements({}, { locale }) }}
    </div>
  </div>
</template>

<style scoped></style>
