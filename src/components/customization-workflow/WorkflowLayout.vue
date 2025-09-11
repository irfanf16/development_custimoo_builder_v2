<script setup lang="ts">
  import { computed, ref, isRef } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { Button } from '@/components/ui/button'
  import { Maximize2, Minimize2 } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import {
    CategorySelection,
    SubcategorySelection,
    ProductSelection,
    DesignSelection,
    StyleSelection,
    LogoCustomization,
    ColorSelection,
    PatternSelection,
    PatternGroupSelection,
    TextsSelection,
    TextPlacement,
    RosterEntry,
    RosterEdit,
    SummaryPanel
  } from '@/components/customization-workflow/WorkflowSteps'
  import WorkflowPanel from './WorkflowPanel.vue'

  interface Props {
    currentStep:
      | 'category'
      | 'subcategory'
      | 'product'
      | 'designs'
      | 'styles'
      | 'logos'
      | 'colors'
      | 'patterns'
      | 'patterns-group'
      | 'texts'
      | 'texts-placement'
      | 'roster'
      | 'roster-edit'
      | 'summary'
    onNavigateBack: () => void
    onCategorySelect: (categoryId: number) => void
  }

  const props = defineProps<Props>()

  const productsStore = useProductsStore()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
  } | null>(null)
  import type { ComputedRef } from 'vue'
  type BreadcrumbItem = { label: string; action?: () => void }

  const currentStepRef = ref<{
    breadcrumbs?: ComputedRef<BreadcrumbItem[]>
  } | null>(null)

  // Computed properties for workflow step configuration
  const contentKey = computed(() => {
    return props.currentStep === 'logos'
      ? `logos-${(productsStore as any).logosSubStep || 'list'}`
      : props.currentStep
  })

  const isExpandable = computed(() => {
    return props.currentStep === 'product' || props.currentStep === 'designs'
  })

  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    const exposed = currentStepRef.value?.breadcrumbs as unknown
    if (!exposed) return [{ label: 'Category' }]
    return isRef(exposed)
      ? (exposed as ComputedRef<BreadcrumbItem[]>).value
      : (exposed as BreadcrumbItem[])
  })

  const toggleExpanded = () => {
    if (isExpandable.value) {
      isExpanded.value = !isExpanded.value
    }
  }

  /**
   * Handles scroll-to-element events from child components
   * Delegates to the WorkflowPanel's scrollToElement method
   */
  const handleScrollToElement = (
    elementId: string,
    behavior: 'smooth' | 'auto' = 'auto'
  ) => {
    if (menuPanelRef.value) {
      menuPanelRef.value.scrollToElement(elementId, behavior)
    }
  }
</script>

<template>
  <div id="workflow-panel-container" class="flex-col">
    <WorkflowPanel
      ref="menuPanelRef"
      :content-key="contentKey"
      :expandable="isExpandable"
      :is-expanded="isExpanded"
      @update:is-expanded="isExpanded = $event"
    >
      <!-- Header slot -->
      <template #header="{ isExpanded }">
        <div
          class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden"
        >
          <WorkflowBreadcrumbs :breadcrumbs="currentBreadcrumbs" />
        </div>

        <Button
          v-if="isExpandable"
          variant="outline"
          size="icon"
          class="rounded-lg"
          @click="toggleExpanded"
        >
          <component :is="isExpanded ? Minimize2 : Maximize2" class="size-4" />
        </Button>
      </template>
      <!-- Category Selection Step -->
      <CategorySelection
        v-if="currentStep === 'category'"
        ref="currentStepRef"
        @select-category="onCategorySelect"
      />

      <!-- Subcategory Selection Step -->
      <SubcategorySelection v-else-if="currentStep === 'subcategory'" />

      <!-- Product Selection Step -->
      <ProductSelection
        v-else-if="currentStep === 'product'"
        ref="currentStepRef"
        @scroll-to-element="handleScrollToElement"
      />

      <!-- Design Selection Step -->
      <DesignSelection
        v-else-if="currentStep === 'designs'"
        ref="currentStepRef"
        @scroll-to-element="handleScrollToElement"
      />

      <!-- Style Selection Step -->
      <StyleSelection
        v-else-if="currentStep === 'styles'"
        ref="currentStepRef"
      />

      <!-- Logo Customization Step -->
      <LogoCustomization v-else-if="currentStep === 'logos'" />

      <!-- Colors -->
      <ColorSelection
        v-else-if="currentStep === 'colors'"
        ref="currentStepRef"
      />

      <!-- Patterns -->
      <PatternSelection
        v-else-if="currentStep === 'patterns'"
        ref="currentStepRef"
      />
      <PatternGroupSelection v-else-if="currentStep === 'patterns-group'" />

      <!-- Texts -->
      <TextsSelection v-else-if="currentStep === 'texts'" />
      <TextPlacement
        v-else-if="currentStep === 'texts-placement'"
        ref="currentStepRef"
      />

      <!-- Roster -->
      <RosterEntry v-else-if="currentStep === 'roster'" />
      <RosterEdit v-else-if="currentStep === 'roster-edit'" />

      <!-- Summary -->
      <SummaryPanel v-else-if="currentStep === 'summary'" />
    </WorkflowPanel>
  </div>
</template>
