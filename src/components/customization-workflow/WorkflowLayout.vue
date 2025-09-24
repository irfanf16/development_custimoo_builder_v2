<script setup lang="ts">
  import { computed, ref, isRef, type Ref, type ComputedRef } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { Maximize2, Minimize2, Search } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import { useWorkflowNavigation } from '@/composables/useWorkflowNavigation'
  import {
    CategorySelection,
    SubcategorySelection,
    ProductSelection,
    DesignSelection,
    StyleSelection,
    LogoCustomization,
    LogoPlacement,
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
  import type { HeaderAndFooterConfiguration, BreadcrumbItem } from './types'

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
    onSubcategorySelect: (subcategoryId: number) => void
  }

  const props = defineProps<Props>()

  const workflowStore = useWorkflowStore()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
  } | null>(null)

  // Navigation fallback derived from workflow state
  const routeStepRef = computed(() => props.currentStep) as unknown as Ref<any>
  const { navigationItems } = useWorkflowNavigation(
    routeStepRef,
    props.onNavigateBack
  )

  // Computed properties for workflow step configuration
  const logosSubStepValue = computed(() => {
    const sub = (workflowStore as any).logosSubStep
    return sub && typeof sub === 'object' && 'value' in sub ? sub.value : sub
  })

  const contentKey = computed(() => {
    if (props.currentStep === 'logos') {
      const sub = logosSubStepValue.value || 'list'
      return `logos-${sub}`
    }
    return props.currentStep
  })

  // Get header and footer configuration from current step component

  const currentStepRef = ref<HeaderAndFooterConfiguration | null>(null)

  const isExpandable = computed(() => {
    return currentStepRef.value?.headerExtras?.isExpandable
  })

  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    const exposed = currentStepRef.value?.headerExtras?.breadcrumbs
    if (exposed) {
      return isRef(exposed)
        ? (exposed as unknown as ComputedRef<BreadcrumbItem[]>).value
        : (exposed as BreadcrumbItem[])
    }
    // Fallback to centralized navigation when panel doesn't expose breadcrumbs
    return navigationItems.value
  })

  const headerApplyOverrides = computed(() => {
    return currentStepRef.value?.headerExtras?.applyOverrides
  })

  // Bridge nested refs from child steps to primitives for props expecting non-Ref
  const applyOverridesModelValue = computed({
    get: (): boolean => {
      const model = currentStepRef.value?.headerExtras?.applyOverrides
        ?.model as Ref<boolean> | undefined
      return model?.value ?? false
    },
    set: (val: boolean) => {
      currentStepRef.value?.headerExtras?.applyOverrides?.onInput?.(!!val)
    }
  })

  const searchModelValue = computed({
    get: (): string => {
      const model = currentStepRef.value?.headerExtras?.search?.model as
        | Ref<string>
        | undefined
      return model?.value ?? ''
    },
    set: (val: string) => {
      currentStepRef.value?.headerExtras?.search?.onInput?.(val)
    }
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
  <div id="workflow-panel-container" class="flex-col h-fit">
    <WorkflowPanel
      ref="menuPanelRef"
      :content-key="contentKey"
      :expandable="isExpandable"
      :is-expanded="isExpanded"
      @update:is-expanded="isExpanded = $event"
    >
      <!-- Header slot -->
      <template #header="{ isExpanded }">
        <div class="w-full flex flex-col gap-5">
          <div class="flex items-center gap-3 h-9 justify-center">
            <div
              class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden"
            >
              <WorkflowBreadcrumbs :breadcrumbs="currentBreadcrumbs" />
            </div>

            <div
              v-if="headerApplyOverrides !== undefined"
              class="flex items-center gap-3"
            >
              <Switch
                :model-value="applyOverridesModelValue"
                @update:model-value="val => (applyOverridesModelValue = !!val)"
              />
              <Label class="text-sm font-normal text-muted-foreground">{{
                headerApplyOverrides.label
              }}</Label>
            </div>

            <Button
              v-if="isExpandable"
              variant="outline"
              size="icon"
              class="rounded-lg"
              @click="toggleExpanded"
            >
              <component
                :is="isExpanded ? Minimize2 : Maximize2"
                class="size-4"
              />
            </Button>
          </div>

          <div
            v-if="currentStepRef?.headerExtras?.search"
            class="flex items-center flex-1"
          >
            <div class="relative w-full">
              <Search
                class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              />
              <Input
                :model-value="searchModelValue"
                :placeholder="
                  currentStepRef?.headerExtras?.search?.placeholder ||
                  'Search...'
                "
                class="pl-8"
                @update:model-value="val => (searchModelValue = String(val))"
              />
            </div>
          </div>
        </div>
      </template>
      <!-- Category Selection Step -->
      <CategorySelection
        v-if="currentStep === 'category'"
        ref="currentStepRef"
        @select-category="onCategorySelect"
      />

      <!-- Subcategory Selection Step -->
      <SubcategorySelection
        v-else-if="currentStep === 'subcategory'"
        ref="currentStepRef"
        @select-subcategory="onSubcategorySelect"
      />

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
      <LogoPlacement
        v-else-if="currentStep === 'logos' && logosSubStepValue === 'placement'"
        ref="currentStepRef"
      />
      <LogoCustomization
        v-else-if="currentStep === 'logos' && logosSubStepValue !== 'placement'"
        ref="currentStepRef"
      />

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
      <TextsSelection
        v-else-if="currentStep === 'texts'"
        ref="currentStepRef"
      />
      <TextPlacement
        v-else-if="currentStep === 'texts-placement'"
        ref="currentStepRef"
      />

      <!-- Roster -->
      <RosterEntry v-else-if="currentStep === 'roster'" ref="currentStepRef" />
      <RosterEdit v-else-if="currentStep === 'roster-edit'" />

      <!-- Summary -->
      <SummaryPanel
        v-else-if="currentStep === 'summary'"
        ref="currentStepRef"
      />
    </WorkflowPanel>
  </div>
</template>
