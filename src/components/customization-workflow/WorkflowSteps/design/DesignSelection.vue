<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useDesignConfig } from './useDesignConfig'
  import type { DesignCategoriesConfig } from '../../types'
  import type { OutputDesignPreviewFront } from '@/services/products/types'
  import LazyTwoDScene from '../LazyTwoDScene.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { design_categories_default_label } from '@/paraglide/messages'
  import { Checkbox } from '@/components/ui/checkbox'
  import { SkeletonBox } from '@/components/skeleton'
  import axios from 'axios'

  const uiStore = useUIStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const profileStore = useProfileStore()

  const { isMobile } = storeToRefs(uiStore)
  const { activeDesignName: selectedDesignName } = storeToRefs(customizationStore)
  const { selectedDesignCategoryId, pendingDesignId } = storeToRefs(workflowStore)
  const { designSearchModel, designCategoriesConfig, selectedDesigns, toggleDesignSelection } =
    useDesignConfig()

  interface Emits {
    (e: 'scroll-to-element', elementId: string, behavior?: 'smooth' | 'auto'): void
  }

  defineProps<{
    isExpanded?: boolean
  }>()
  const emit = defineEmits<Emits>()
  const previews = computed(() => productsStore.designPreviews || [])
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
        const activeDesignName = customizationStore.customization?.design_name
        if (activeDesignName) {
          setTimeout(() => {
            emit('scroll-to-element', `design-${activeDesignName}`, 'auto')
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
      const activeDesignName = customizationStore.customization?.design_name
      if (activeDesignName) {
        // Small delay to ensure WorkflowPanel is fully mounted
        setTimeout(() => {
          emit('scroll-to-element', `design-${activeDesignName}`, 'auto')
        }, 100)
      }
    })
  })

  async function selectDesign(item: OutputDesignPreviewFront) {
    // if (pendingDesignId.value != null) {
    //   return
    // }

    const designId = item.id
    const alreadyApplied =
      customizationStore.customization?.design_id === designId &&
      productsStore.activeDesignDetails?.id === designId

    if (alreadyApplied) {
      setTimeout(() => {
        emit('scroll-to-element', `design-${item.design_name}`, 'smooth')
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
      // Only clear if this design is still the pending one.
      // If the user clicked another design while this was loading, that
      // design now owns pendingDesignId — don't steal its spinner.
      if (workflowStore.pendingDesignId === designId) {
        workflowStore.setPendingDesignId(null)
      }
    }

    setTimeout(() => {
      emit('scroll-to-element', `design-${item.design_name}`, 'smooth')
    }, 100)
  }

  const filteredPreviews = computed(() => {
    let filtered = previews.value

    // Filter by design category
    if (selectedDesignCategoryId.value !== null) {
      filtered = filtered.filter(design => {
        const categories = design.front_design.design_categories_pivot || []
        return categories.some(pivot => pivot.design_category_id === selectedDesignCategoryId.value)
      })
    }

    // Filter by search query
    const q = designSearchModel.value
    if (q) {
      filtered = filtered.filter(d => d.front_design.design_name.toLowerCase().includes(q))
    }

    return filtered
  })

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
  void filteredPreviews.value
  void selectedDesignName.value
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
    class="mb-4 md:mb-6 gap-4"
    :class="
      isExpanded
        ? 'grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]'
        : 'flex flex-wrap gap-2'
    "
  >
    <div
      v-for="item in filteredPreviews"
      :id="`design-${item.design_name}`"
      :key="item.id"
      class="group relative flex flex-col items-center flex-1 gap-4 md:gap-6 p-2 md:p-2"
      :class="[
        'relative rounded-sm transition-colors cursor-pointer',
        'hover:border-border hover:bg-primary/10 hover:outline-ring',
        selectedDesignName === item.design_name ? 'bg-primary/20' : ''
      ]"
      @click="selectDesign(item)"
    >
      <div
        class="text-base font-medium text-left w-full text-foreground truncate max-w-[160px] overflow-ellipsis leading-none"
      >
        {{ item.front_design.design_name }}
      </div>
      <div class="px-2">
        <div class="relative inline-flex rounded-xl">
          <div class="rounded-xl">
            <LazyTwoDScene
              :design="item.front_design"
              :svg-parts="item.svg_parts"
              :canvas-width="isMobile ? 130 : 176"
              :canvas-height="isMobile ? 130 : 176"
              :canvas-class="'rounded-xl'"
            />
          </div>
        </div>
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
</template>

<style scoped></style>
