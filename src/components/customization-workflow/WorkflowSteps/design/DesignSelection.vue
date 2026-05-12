<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useDesignConfig } from './useDesignConfig'
  import type { DesignCategoriesConfig } from '../../types'
  import type { OutputDesignPreviewFront } from '@/services/products/types'
  import LazyTwoDScene from '../LazyTwoDScene.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    design_categories_default_label,
    design_custom_list_placeholder,
    design_section_my_designs,
    design_section_catalog,
    design_delete_custom_confirm_title,
    design_delete_custom_confirm_description,
    msg_design_removed_success,
    msg_no_designs_match_filters
  } from '@/paraglide/messages'
  import { Checkbox } from '@/components/ui/checkbox'
  import { SkeletonBox } from '@/components/skeleton'
  import axios from 'axios'
  import { FileImage, X } from 'lucide-vue-next'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import { toast } from 'vue-sonner'
  import { storeToRefs } from 'pinia'
  const uiStore = useUIStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const profileStore = useProfileStore()

  const { isMobile } = storeToRefs(uiStore)
  const { activeDesignId } = storeToRefs(customizationStore)
  const { selectedDesignCategoryId } = storeToRefs(workflowStore)
  const { previewTextsByDesignId } = storeToRefs(productsStore)
  const { designSearchModel, designCategoriesConfig, selectedDesigns, toggleDesignSelection } =
    useDesignConfig()

  function designDisplayName(item: OutputDesignPreviewFront) {
    return item.front_design?.design_name ?? item.design_name
  }

  function matchesDesignSearch(item: OutputDesignPreviewFront, q: string) {
    if (!q) return true
    return designDisplayName(item).toLowerCase().includes(q)
  }

  function matchesDesignCategory(
    item: OutputDesignPreviewFront,
    categoryId: number | null
  ): boolean {
    if (categoryId === null) return true
    const pivots = item.front_design?.design_categories_pivot ?? []
    return pivots.some(p => p.design_category_id === categoryId)
  }

  const catalogFilteredPreviews = computed(() => {
    let list = previews.value.filter(p => !p.customer_id)
    if (selectedDesignCategoryId.value !== null) {
      list = list.filter(d => matchesDesignCategory(d, selectedDesignCategoryId.value))
    }
    const q = designSearchModel.value.trim().toLowerCase()
    if (q) {
      list = list.filter(d => matchesDesignSearch(d, q))
    }
    return list
  })

  const myDesignsFilteredPreviews = computed(() => {
    let list = previews.value.filter(p => !!p.customer_id)
    const q = designSearchModel.value.trim().toLowerCase()
    if (q) {
      list = list.filter(d => matchesDesignSearch(d, q))
    }
    return list
  })

  async function handleDeleteCustomDesign(item: OutputDesignPreviewFront, ev: MouseEvent) {
    ev.stopPropagation()
    const ok = await confirmDialog({
      title: design_delete_custom_confirm_title({}, { locale: profileStore.currentLocale }),
      description: design_delete_custom_confirm_description(
        {},
        {
          locale: profileStore.currentLocale
        }
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    if (!ok) return
    const result = await productsStore.deleteCustomDesign(item.id)
    if (result.success) {
      toast.success(msg_design_removed_success({}, { locale: profileStore.currentLocale }))
      selectedDesigns.value = selectedDesigns.value.filter(id => id !== item.id)
    } else {
      toast.error(result.message ?? productsStore.error ?? 'Delete failed')
    }
  }

  interface Emits {
    (e: 'scroll-to-element', elementId: string, behavior?: 'smooth' | 'auto'): void
  }

  const props = defineProps<{
    isExpanded?: boolean
  }>()
  const emit = defineEmits<Emits>()

  //  const designGridClass = computed(() =>
  //    props.isExpanded
  //      ? 'grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-4'
  //      : 'flex flex-wrap gap-2'
  //  )
  const previews = computed(() => productsStore.designPreviews || [])

  /** Matches uiStore.desktopPreviewCompact (widget width-based, stable vs preview-slot measurement). */
  const compactDesktopTwoCol = computed(() => !uiStore.isMobile && uiStore.desktopPreviewCompact)

  /** Narrow rail: 2-col grid. Expanded (even on compact desktop) uses responsive multi-column grid. */
  const compactDesktopTwoColOnly = computed(() => compactDesktopTwoCol.value && !props.isExpanded)

  const designGridLayoutClass = computed(() => {
    if (props.isExpanded) {
      return 'grid min-w-0 gap-2 auto-rows-min [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'
    }
    return 'grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-min'
  })

  const designPreviewCanvasSize = computed(() => {
    if (isMobile.value) return 130
    if (compactDesktopTwoColOnly.value) return 120
    return 176
  })
  /** Stable Fabric resolution for grid tiles (max desktop edge 176 ≥ compact 120). */
  const designGridBitmapPx = computed(() => (isMobile.value ? 130 : 176))
  const designSelectionContainer = ref<HTMLElement | null>(null)
  const DESIGN_SKELETON_PLACEHOLDER_COUNT = 4

  const showDesignsLoading = computed(
    () =>
      workflowStore.pendingProductId != null ||
      ((productsStore.designPreviews == null || productsStore.designPreviews.length === 0) &&
        productsStore.isLoading)
  )

  onMounted(() => {
    // Reset to "All Categories" when entering design selection
    workflowStore.setSelectedDesignCategory(null)

    // Skip fetch when product details or preview pipeline is already loading previews
    if (workflowStore.pendingProductId != null) {
      nextTick(() => {
        const activeDesignId = customizationStore.customization?.design_id
        if (activeDesignId) {
          setTimeout(() => {
            emit('scroll-to-element', `design-${activeDesignId}`, 'auto')
          }, 100)
        }
      })
      return
    }
    // Fetch in background so we show spinner immediately instead of blocking
    if (!productsStore.designPreviews) {
      const styleId = productsStore.activeStyleDetails?.id
      if (styleId) {
        void productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    }
    // Scroll to active design when component mounts
    nextTick(() => {
      const activeDesignId = customizationStore.customization?.design_id
      if (activeDesignId) {
        setTimeout(() => {
          emit('scroll-to-element', `design-${activeDesignId}`, 'auto')
        }, 100)
      }
    })
  })

  async function selectDesign(item: OutputDesignPreviewFront) {
    const designId = item.id
    const alreadyApplied =
      customizationStore.customization?.design_id === designId &&
      productsStore.activeDesignDetails?.id === designId

    if (alreadyApplied) {
      setTimeout(() => {
        emit('scroll-to-element', `design-${designId}`, 'smooth')
      }, 100)
      return
    }

    workflowStore.setPendingDesignId(designId)
    productsStore.suspendCustomizationAutoSync()
    productsStore.setMainPreviewLoadComplete(false)
    try {
      productsStore.applyDesignPreview(item)
      const result = await productsStore.fetchDesignDetailsById(designId)
      if (axios.isCancel(result.axiosError)) {
        return
      }
      productsStore.setMainPreviewLoadComplete(true)
    } catch (error) {
      productsStore.setMainPreviewLoadComplete(true)
      console.error('Error selecting design:', error)
      return
    } finally {
      productsStore.resumeCustomizationAutoSync()
      if (workflowStore.pendingDesignId === designId) {
        workflowStore.setPendingDesignId(null)
      }
    }
    setTimeout(() => {
      emit('scroll-to-element', `design-${designId}`, 'smooth')
    }, 100)
  }

  designCategoriesConfig.value = computed<DesignCategoriesConfig | undefined>(() => {
    return {
      categories: productsStore.activeProductDetails?.design_categories || [],
      selectedId: selectedDesignCategoryId.value,
      onSelect: (id: number | null) => workflowStore.setSelectedDesignCategory(id ?? null),
      defaultLabel: design_categories_default_label({}, { locale: profileStore.currentLocale })
    }
  }).value

  // header/footer config moved to config.ts

  // Hint to TS that these are used via the template
  void catalogFilteredPreviews.value
  void myDesignsFilteredPreviews.value
  void activeDesignId.value
  void designSelectionContainer.value
  void selectDesign
</script>

<template>
  <!-- Content -->
  <div
    v-if="showDesignsLoading"
    :class="
      isExpanded
        ? 'grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'
        : 'flex flex-wrap gap-2'
    "
    class="mb-4 md:mb-6 w-full min-h-[200px]"
    aria-busy="true"
    aria-label="Loading designs"
  >
    <div
      v-for="n in DESIGN_SKELETON_PLACEHOLDER_COUNT"
      :key="`design-skeleton-${n}`"
      class="pointer-events-none relative flex flex-1 flex-col items-center gap-2 rounded-sm p-2 md:gap-3 md:p-2"
    >
      <div class="flex w-full min-w-0 flex-col self-stretch items-center">
        <SkeletonBox :width="isMobile ? 130 : 176" :height="16" radius="sm" />
      </div>
      <div class="flex flex-col items-center gap-3 px-2">
        <SkeletonBox
          class="shrink-0"
          :width="isMobile ? 130 : 176"
          :height="isMobile ? 130 : 176"
          radius="xl"
        />
      </div>
    </div>
  </div>
  <div
    v-else
    ref="designSelectionContainer"
    data-testid="workflow-design-selection"
    class="mb-4 md:mb-6 flex flex-col gap-4"
  >
    <div
      v-if="myDesignsFilteredPreviews.length"
      data-testid="workflow-design-my-designs"
      class="flex flex-col gap-2"
    >
      <div class="text-sm font-semibold text-muted-foreground">
        {{ design_section_my_designs({}, { locale: profileStore.currentLocale }) }}
      </div>
      <div :class="designGridLayoutClass">
        <div
          v-for="item in myDesignsFilteredPreviews"
          :id="`design-${item.id}`"
          :key="'my-' + item.id"
          :data-testid="`workflow-design-item-${item.id}`"
          class="group relative flex flex-col items-center gap-4 md:gap-6 p-2"
          :class="[
            'relative rounded-sm transition-colors cursor-pointer',
            'hover:border-border hover:bg-primary/10 hover:outline-ring',
            Number(activeDesignId) === Number(item.id) ? 'bg-primary/20' : ''
          ]"
          @click="selectDesign(item)"
        >
          <button
            type="button"
            class="absolute top-1 right-1 z-10 rounded-full bg-background/90 p-1 shadow-sm border border-border hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete custom design"
            @click="handleDeleteCustomDesign(item, $event)"
          >
            <X class="size-4" />
          </button>
          <div
            class="text-base font-medium text-left w-full text-foreground truncate max-w-[160px] overflow-ellipsis leading-none pr-6"
          >
            {{ designDisplayName(item) }}
          </div>
          <div>
            <div
              v-if="item.customer_id"
              class="flex items-center justify-center rounded-xl border border-dashed border-muted-foreground/35 bg-muted/40 text-muted-foreground shrink-0"
              :style="{
                width: designPreviewCanvasSize + 'px',
                height: designPreviewCanvasSize + 'px'
              }"
            >
              <div class="flex flex-col items-center gap-1.5 px-2 text-center">
                <FileImage class="size-9 opacity-80" aria-hidden="true" />
                <span class="text-[11px] font-medium leading-tight">{{
                  design_custom_list_placeholder({}, { locale: profileStore.currentLocale })
                }}</span>
              </div>
            </div>
            <LazyTwoDScene
              v-else-if="item.front_design"
              :id="item.id"
              :design="item.front_design"
              :svg-parts="item.svg_parts"
              :canvas-width="designPreviewCanvasSize"
              :canvas-height="designPreviewCanvasSize"
              :canvas-bitmap-width="designGridBitmapPx"
              :canvas-bitmap-height="designGridBitmapPx"
              :canvas-class="'rounded-xl'"
              :product-id="customizationStore.activeProductId ?? undefined"
              :preview-custom-texts="previewTextsByDesignId.get(item.id) ?? []"
            />
          </div>
          <Checkbox
            :id="`checkbox-design-${item.id}`"
            :class="'absolute bottom-2 right-2 size-6'"
            :model-value="!!selectedDesigns.find(id => id === item.id)"
            @click.stop
            @update:model-value="toggleDesignSelection(item.id)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="catalogFilteredPreviews.length"
      data-testid="workflow-design-catalog"
      class="flex flex-col gap-2"
    >
      <div
        v-if="myDesignsFilteredPreviews.length"
        class="text-sm font-semibold text-muted-foreground"
      >
        {{ design_section_catalog({}, { locale: profileStore.currentLocale }) }}
      </div>
      <div :class="designGridLayoutClass">
        <div
          v-for="item in catalogFilteredPreviews"
          :id="`design-${item.id}`"
          :key="item.id"
          :data-testid="`workflow-design-item-${item.id}`"
          class="group relative flex flex-col items-center gap-4 md:gap-6 p-2"
          :class="[
            'relative rounded-sm transition-colors cursor-pointer',
            'hover:border-border hover:bg-primary/10 hover:outline-ring',
            Number(activeDesignId) === Number(item.id) ? 'bg-primary/20' : ''
          ]"
          @click="selectDesign(item)"
        >
          <div
            class="text-base font-medium text-left w-full text-foreground truncate max-w-[160px] overflow-ellipsis leading-none"
          >
            {{ designDisplayName(item) }}
          </div>
          <div>
            <LazyTwoDScene
              :id="item.id"
              :design="item.front_design"
              :svg-parts="item.svg_parts"
              :canvas-width="designPreviewCanvasSize"
              :canvas-height="designPreviewCanvasSize"
              :canvas-bitmap-width="designGridBitmapPx"
              :canvas-bitmap-height="designGridBitmapPx"
              :canvas-class="'rounded-xl'"
              :product-id="customizationStore.activeProductId ?? undefined"
              :preview-custom-texts="previewTextsByDesignId.get(item.id) ?? []"
            />
          </div>
          <Checkbox
            :id="`checkbox-design-catalog-${item.id}`"
            :class="'absolute bottom-2 right-2 size-6'"
            :model-value="!!selectedDesigns.find(id => id === item.id)"
            @click.stop
            @update:model-value="toggleDesignSelection(item.id)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="!myDesignsFilteredPreviews.length && !catalogFilteredPreviews.length"
      class="text-sm text-muted-foreground"
    >
      {{ msg_no_designs_match_filters({}, { locale: profileStore.currentLocale }) }}
    </div>
  </div>
</template>

<style scoped></style>
