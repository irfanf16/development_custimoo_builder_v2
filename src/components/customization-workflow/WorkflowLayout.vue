<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import WorkflowHeader from './WorkflowHeader.vue'
  import { useWorkflow } from '@/composables/useWorkflow'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import {
    ProductsEntry,
    DesignSelection,
    StyleSelection,
    LogoSelection,
    ColorSelection,
    PatternSelection,
    TextsSelection,
    TextPlacement,
    RosterEntry,
    RosterEdit,
    SummaryPanel
  } from '@/components/customization-workflow/WorkflowSteps'
  import WorkflowPanel from './WorkflowPanel.vue'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const { initializeEffects } = useWorkflow()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
  } | null>(null)

  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
  }

  const handleApplyOverridesChange = (val: boolean) => {
    workflowStore.currentHeaderConfig?.applyOverrides?.onInput?.(!!val)
  }

  const handleSearchChange = (val: string) => {
    workflowStore.currentHeaderConfig?.search?.onInput?.(val)
  }

  /**
   * Handles scroll-to-element events from child components
   * Delegates to the WorkflowPanel's scrollToElement method
   */
  const handleScrollToElement = (elementId: string, behavior: 'smooth' | 'auto' = 'auto') => {
    if (menuPanelRef.value) {
      menuPanelRef.value.scrollToElement(elementId, behavior)
    }
  }

  // Computed container classes based on mobile/desktop
  const containerClasses = computed(() => {
    if (uiStore.isMobile) {
      return 'fixed bottom-25 h-fit max-h-[65vh] w-[calc(100%-2rem)]'
    }
    return 'max-h-[100%]'
  })

  // Initialize effects for mobile
  onMounted(() => {
    if (uiStore.isMobile) {
      initializeEffects()
    }
  })
</script>

<template>
  <div id="workflow-panel-container" :class="containerClasses">
    <!-- Mobile: Wrap WorkflowPanel in transition -->
    <div v-if="uiStore.isMobile" class="relative w-full h-fit">
      <transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <WorkflowPanel
          v-show="workflowStore.isPanelOpen"
          ref="menuPanelRef"
          :content-key="workflowStore.contentKey || ''"
          :expandable="false"
          :is-expanded="true"
        >
          <template #header>
            <WorkflowHeader
              @update:apply-overrides-model-value="handleApplyOverridesChange"
              @update:search-model-value="handleSearchChange"
            />
          </template>

          <ProductsEntry v-if="workflowStore.currentStep === 'product'" />
          <DesignSelection
            v-else-if="workflowStore.currentStep === 'designs'"
            @scroll-to-element="handleScrollToElement"
          />
          <StyleSelection v-else-if="workflowStore.currentStep === 'styles'" />
          <LogoSelection v-else-if="workflowStore.currentStep === 'logos'" />
          <ColorSelection v-else-if="workflowStore.currentStep === 'colors'" />
          <PatternSelection v-else-if="workflowStore.currentStep === 'patterns'" />
          <TextsSelection
            v-else-if="
              workflowStore.currentStep === 'texts' && workflowStore.textsSubStep === 'list'
            "
          />
          <TextPlacement
            v-else-if="
              workflowStore.currentStep === 'texts' && workflowStore.textsSubStep === 'placement'
            "
          />
          <RosterEntry
            v-else-if="
              workflowStore.currentStep === 'roster' && workflowStore.rosterSubStep === 'list'
            "
          />
          <RosterEdit
            v-else-if="
              workflowStore.currentStep === 'roster' && workflowStore.rosterSubStep === 'edit'
            "
          />
          <SummaryPanel v-else-if="workflowStore.currentStep === 'summary'" />
        </WorkflowPanel>
      </transition>
    </div>

    <!-- Desktop: Direct WorkflowPanel with expand/collapse functionality -->
    <WorkflowPanel
      v-else
      ref="menuPanelRef"
      :content-key="workflowStore.contentKey || ''"
      :expandable="workflowStore.currentHeaderConfig?.isExpandable"
      :is-expanded="isExpanded"
      @update:is-expanded="isExpanded = $event"
    >
      <template #header>
        <WorkflowHeader
          :is-expanded="isExpanded"
          :show-expand-button="true"
          @toggle-expanded="toggleExpanded"
          @update:apply-overrides-model-value="handleApplyOverridesChange"
          @update:search-model-value="handleSearchChange"
        />
      </template>

      <ProductsEntry v-if="workflowStore.currentStep === 'product'" />
      <DesignSelection
        v-else-if="workflowStore.currentStep === 'designs'"
        @scroll-to-element="handleScrollToElement"
      />
      <StyleSelection v-else-if="workflowStore.currentStep === 'styles'" />
      <LogoSelection v-else-if="workflowStore.currentStep === 'logos'" />
      <ColorSelection v-else-if="workflowStore.currentStep === 'colors'" />
      <PatternSelection v-else-if="workflowStore.currentStep === 'patterns'" />
      <TextsSelection
        v-else-if="workflowStore.currentStep === 'texts' && workflowStore.textsSubStep === 'list'"
      />
      <TextPlacement
        v-else-if="
          workflowStore.currentStep === 'texts' && workflowStore.textsSubStep === 'placement'
        "
      />
      <RosterEntry
        v-else-if="workflowStore.currentStep === 'roster' && workflowStore.rosterSubStep === 'list'"
      />
      <RosterEdit
        v-else-if="workflowStore.currentStep === 'roster' && workflowStore.rosterSubStep === 'edit'"
      />
      <SummaryPanel v-else-if="workflowStore.currentStep === 'summary'" />
    </WorkflowPanel>
  </div>
</template>
