<script setup lang="ts">
import { computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { Button } from '@/components/ui/button'
import {
  CategorySelection,
  ProductSelection,
  DesignSelection,
  StyleSelection,
  LogoCustomization
} from '@/components/customization-workflow/WorkflowSteps'
import MenuPanel from './MenuPanel.vue'

interface Props {
  currentStep: 'category' | 'product' | 'designs' | 'styles' | 'logos'
  navigationItems: Array<{ label: string; action?: () => void; isActive?: boolean }>
  onNavigateBack: () => void
  onCategorySelect: (categoryId: number) => void
}

const props = defineProps<Props>()

const productsStore = useProductsStore()

// Computed properties for workflow step configuration
const contentKey = computed(() => {
  return props.currentStep === 'logos'
    ? `logos-${(productsStore as any).logosSubStep || 'list'}`
    : props.currentStep
})

const isExpandable = computed(() => {
  return (
    props.currentStep !== 'category' &&
    props.currentStep !== 'styles' &&
    props.currentStep !== 'logos'
  )
})

const showBackButton = computed(() => {
  return props.currentStep !== 'category'
})
</script>

<template>
  <div id="workflow-panel-container" class="flex-col">
    <MenuPanel
      :content-key="contentKey"
      :breadcrumbs="navigationItems"
      :expandable="isExpandable"
      :show-back-button="showBackButton"
      :on-back="onNavigateBack"
    >
      <!-- Category Selection Step -->
      <CategorySelection
        v-if="currentStep === 'category'"
        @select-category="onCategorySelect"
      />

      <!-- Product Selection Step -->
      <ProductSelection v-else-if="currentStep === 'product'" />

      <!-- Design Selection Step -->
      <DesignSelection v-else-if="currentStep === 'designs'" />

      <!-- Style Selection Step -->
      <StyleSelection v-else-if="currentStep === 'styles'" />

      <!-- Logo Customization Step -->
      <LogoCustomization v-else-if="currentStep === 'logos'" />

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
