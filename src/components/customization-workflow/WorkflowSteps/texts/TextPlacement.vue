<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import ProductPreviewCanvas from '@/components/customization-workflow/WorkflowSteps/ProductPreviewCanvas.vue'
  import type { OutputProductName, OutputProductText } from '@/services/products/types'
  import { useTextPlacements } from './useTextPlacements'

  // ===== STORES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()

  // ===== COMPOSABLES =====
  const { buildEntryFromTemplate, updateEntryWithPlacement, availablePlacements } =
    useTextPlacements()

  // ===== STATE =====
  const { activeProductDetails, activeStyleDetails, activeDesignDetails } =
    storeToRefs(productsStore)
  const { activeProductId } = storeToRefs(customizationStore)
  const { activeTextId, pendingTextTemplateId } = storeToRefs(workflowStore)

  // ===== COMPUTED =====
  const PREVIEW_SIZE = 176
  const CANVAS_BASE = 600

  // Get available text templates for lookup
  const textTemplates = computed(() => activeProductDetails.value?.product_texts ?? [])
  const textEntries = computed(() => customizationStore.activeProductTexts)

  const placementsWithOverlay = computed(() => {
    const placements = availablePlacements.value
    if (!placements || placements.length === 0) return []
    const scale = PREVIEW_SIZE / CANVAS_BASE
    return placements.map((placement: OutputProductName) => {
      const width = placement.width ?? placement.height ?? 300
      const height = placement.height ?? width
      const overlay = {
        x: (placement.x_axis - width / 2) * scale,
        y: (placement.y_axis - height / 2) * scale,
        width: width * scale,
        height: height * scale,
        color: 'rgba(59,130,246,0.35)'
      }
      return { placement, overlay }
    })
  })

  // ===== ACTIONS =====
  const handleSelectPlacement = async (placement: OutputProductName) => {
    if (activeProductId.value == null) return
    const key = String(activeProductId.value)
    const template = pendingTextTemplateId.value
      ? textTemplates.value.find(p => p?.id === pendingTextTemplateId.value)
      : undefined

    // Find existing entry by ID if activeTextId is set
    let existing: OutputProductText | undefined
    let targetIndex: number | undefined

    if (activeTextId.value != null) {
      const index = textEntries.value.findIndex(e => e.id === activeTextId.value)
      if (index !== -1) {
        existing = textEntries.value[index]
        targetIndex = index
      }
    }

    if (existing && existing.id) {
      // Update existing entry with new placement coordinates
      const next = updateEntryWithPlacement(existing, placement, template ?? undefined)
      await historyStore.execute('text.update-entry', {
        key,
        textId: existing.id,
        prev: existing,
        next
      })
    } else {
      // Create a new custom text entry with placement coordinates initialized
      // buildEntryFromTemplate will use buildItemFromPlacement to set:
      // - x_axis, y_axis, rotation, height, width from the placement
      // - All other properties from template or defaults
      const entry = buildEntryFromTemplate(template, placement, activeProductId.value)
      const insertAt =
        targetIndex !== undefined
          ? Math.min(targetIndex, textEntries.value.length)
          : textEntries.value.length
      await historyStore.execute('text.add-entry', {
        key,
        index: insertAt,
        entry
      })
      if (entry.id) {
        workflowStore.setActiveTextId(entry.id)
      }
    }

    workflowStore.setActiveTextItemIndex(placement.id)
    workflowStore.setPendingTextTemplateId(null)
    workflowStore.setTextsSubStep('edit')
  }
</script>

<template>
  <!-- Content -->
  <div class="p-4 md:p-6 space-y-4">
    <div v-if="placementsWithOverlay.length" class="grid gap-4 md:grid-cols-2">
      <div
        v-for="item in placementsWithOverlay"
        :key="item.placement.id"
        class="group flex flex-col gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
      >
        <div class="relative rounded-lg border border-dashed border-border bg-muted/40 p-3">
          <ProductPreviewCanvas
            v-if="activeProductDetails && activeStyleDetails && activeDesignDetails"
            :product="activeProductDetails"
            :style-base="activeStyleDetails"
            :design-base="activeDesignDetails"
            :width="PREVIEW_SIZE"
            :height="PREVIEW_SIZE"
            :side="item.placement.side === 'back' ? 'back' : 'front'"
            :overlay-rect="item.overlay"
          />
        </div>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-foreground">
              {{ item.placement.name_of_placement }}
            </span>
            <span class="text-xs text-muted-foreground capitalize"
              >{{ item.placement.side }} • {{ item.placement.type }}</span
            >
          </div>
          <Badge variant="secondary">
            {{ item.placement.width ?? item.placement.height ?? '-' }} cm
          </Badge>
        </div>
        <Button variant="default" class="mt-1" @click="handleSelectPlacement(item.placement)">
          Use this placement
        </Button>
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
