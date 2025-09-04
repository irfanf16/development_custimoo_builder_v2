<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { Button } from '@/components/ui/button'
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
  import MenuPanel from './MenuPanel.vue'

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
    navigationItems: Array<{
      label: string
      action?: () => void
      isActive?: boolean
    }>
    onNavigateBack: () => void
    onCategorySelect: (categoryId: number) => void
  }

  const props = defineProps<Props>()

  const productsStore = useProductsStore()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
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

  const showBackButton = computed(() => {
    return props.currentStep !== 'category'
  })

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
    <MenuPanel
      ref="menuPanelRef"
      :content-key="contentKey"
      :breadcrumbs="navigationItems"
      :expandable="isExpandable"
      :is-expanded="isExpanded"
      :show-back-button="showBackButton"
      :on-back="onNavigateBack"
      @update:is-expanded="isExpanded = $event"
    >
      <!-- Category Selection Step -->
      <CategorySelection
        v-if="currentStep === 'category'"
        @select-category="onCategorySelect"
      />

      <!-- Subcategory Selection Step -->
      <SubcategorySelection v-else-if="currentStep === 'subcategory'" />

      <!-- Product Selection Step -->
      <ProductSelection
        v-else-if="currentStep === 'product'"
        @scroll-to-element="handleScrollToElement"
      />

      <!-- Design Selection Step -->
      <DesignSelection
        v-else-if="currentStep === 'designs'"
        @scroll-to-element="handleScrollToElement"
        @update:is-expanded="isExpanded = $event"
      />

      <!-- Style Selection Step -->
      <StyleSelection v-else-if="currentStep === 'styles'" />

      <!-- Logo Customization Step -->
      <LogoCustomization v-else-if="currentStep === 'logos'" />

      <!-- Colors -->
      <ColorSelection v-else-if="currentStep === 'colors'" />

      <!-- Patterns -->
      <PatternSelection v-else-if="currentStep === 'patterns'" />
      <PatternGroupSelection v-else-if="currentStep === 'patterns-group'" />

      <!-- Texts -->
      <TextsSelection v-else-if="currentStep === 'texts'" />
      <TextPlacement v-else-if="currentStep === 'texts-placement'" />

      <!-- Roster -->
      <RosterEntry v-else-if="currentStep === 'roster'" />
      <RosterEdit v-else-if="currentStep === 'roster-edit'" />

      <!-- Summary -->
      <SummaryPanel v-else-if="currentStep === 'summary'" />

      <template #footer="{ isExpanded }">
        <div
          class="flex gap-3 w-full"
          :class="isExpanded ? 'justify-end' : 'justify-between'"
        >
          <Button
            variant="outline"
            size="default"
            class="rounded-lg w-[12.5rem]"
          >
            Previous
          </Button>
          <Button
            variant="default"
            size="default"
            class="rounded-lg w-[12.5rem]"
          >
            Next
          </Button>
        </div>
      </template>
    </MenuPanel>
  </div>
</template>
