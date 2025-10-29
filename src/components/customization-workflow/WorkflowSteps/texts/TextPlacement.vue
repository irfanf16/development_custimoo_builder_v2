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
  import type {
    OutputProductName,
    OutputProductText,
    OutputProductTextItem
  } from '@/services/products/types'

  // no props/emits

  // Breadcrumb logic for text placement
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()

  const { activeProductDetails, activeStyleDetails, activeDesignDetails } =
    storeToRefs(productsStore)
  const { activeProductId } = storeToRefs(customizationStore)
  const { activeTextIndex, pendingTextTemplateId } = storeToRefs(workflowStore)

  const breadcrumbs = computed(() => [
    { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
    { label: 'Placement' }
  ])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })

  const PREVIEW_SIZE = 176
  const CANVAS_BASE = 600

  // Get available text templates for lookup
  const textTemplates = computed(() => activeProductDetails.value?.product_texts ?? [])

  const availablePlacements = computed(() => {
    return activeProductDetails.value?.productnames ?? []
  })
  const textEntries = computed(() => customizationStore.activeProductTexts)

  const placementsWithOverlay = computed(() => {
    const scale = PREVIEW_SIZE / CANVAS_BASE
    return availablePlacements.value.map((placement: OutputProductName) => {
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

  const clone = <T,>(value: T): T =>
    typeof structuredClone === 'function'
      ? structuredClone(value)
      : (JSON.parse(JSON.stringify(value)) as T)

  const getActiveItem = (text: OutputProductText | null) => {
    if (!text) return null
    const idx = text.active_item_index ?? 0
    return text.items?.[idx] ?? text.items?.[0] ?? null
  }

  const buildItemFromPlacement = (
    placement: OutputProductName,
    templateItem?: OutputProductTextItem | null
  ): OutputProductTextItem => {
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

  const buildEntryFromTemplate = (
    template: OutputProductText | undefined,
    placement: OutputProductName,
    productIdValue: number
  ): OutputProductText => {
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

  const updateEntryWithPlacement = (
    current: OutputProductText,
    placement: OutputProductName,
    template?: OutputProductText
  ) => {
    const next = clone(current)
    const templateItem = template?.items?.[template.active_item_index ?? 0] ?? getActiveItem(next)
    const item = buildItemFromPlacement(placement, templateItem)
    next.items = [item]
    next.active_item_index = 0
    return next
  }

  const handleSelectPlacement = async (placement: OutputProductName) => {
    if (activeProductId.value == null || activeTextIndex.value == null) return
    const key = String(activeProductId.value)
    const targetIndex = activeTextIndex.value
    const template = pendingTextTemplateId.value
      ? textTemplates.value.find(p => p?.id === pendingTextTemplateId.value)
      : undefined
    const existing = textEntries.value[targetIndex]

    if (existing) {
      const next = updateEntryWithPlacement(existing, placement, template ?? undefined)
      await historyStore.execute('text.update-entry', {
        key,
        index: targetIndex,
        prev: existing,
        next
      })
    } else {
      const entry = buildEntryFromTemplate(template, placement, activeProductId.value)
      const insertAt = Math.min(targetIndex, textEntries.value.length)
      await historyStore.execute('text.add-entry', {
        key,
        index: insertAt,
        entry
      })
      workflowStore.setActiveTextIndex(insertAt)
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
