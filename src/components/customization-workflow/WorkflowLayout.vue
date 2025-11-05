<script setup lang="ts">
  import { computed, ref, onMounted, type Ref, isRef, type Ref as VueRef } from 'vue'
  import type { HeaderConfiguration, FooterConfiguration } from './types'
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
    RosterEntry,
    RosterEdit,
    SummaryPanel
  } from '@/components/customization-workflow/WorkflowSteps'
  import TextsEntry from '@/components/customization-workflow/WorkflowSteps/texts/index.vue'
  import WorkflowPanel from './WorkflowPanel.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import WorkflowFooter from './WorkflowFooter.vue'
  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const { initializeEffects } = useWorkflow()

  const isExpanded = ref(false)
  const currentStepRef: Ref<{ cancel?: () => void; saveChanges?: () => void } | null> = ref(null)
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

  // Import header/footer config creators from step config modules
  import { designHeaderConfig } from './WorkflowSteps/design/config'
  import { productHeaderConfig } from './WorkflowSteps/product/config'
  import { styleHeaderConfig } from './WorkflowSteps/style/config'
  import { logoHeaderConfig } from './WorkflowSteps/logo/config'
  import { colorsHeaderConfig } from './WorkflowSteps/colors/config'
  import { useTextsConfig } from './WorkflowSteps/texts/useTextsConfig'
  import { patternsHeaderConfig } from './WorkflowSteps/patterns/config'
  import { rosterHeaderConfig } from './WorkflowSteps/roster/config'
  import { summaryHeaderConfig } from './WorkflowSteps/summary/config'
  import { summaryFooterConfig } from './WorkflowSteps/summary/config'
  import { designFooterConfig } from './WorkflowSteps/design/config'
  import { productFooterConfig } from './WorkflowSteps/product/config'
  import { styleFooterConfig } from './WorkflowSteps/style/config'
  import { logoFooterConfig } from './WorkflowSteps/logo/config'
  import { colorsFooterConfig } from './WorkflowSteps/colors/config'
  import { patternsFooterConfig } from './WorkflowSteps/patterns/config'
  import { rosterFooterConfig } from './WorkflowSteps/roster/config'
  // Repeat for other steps as available ...

  // Instantiate step configs
  const productHeader = productHeaderConfig
  const designHeader = designHeaderConfig
  const styleHeader = styleHeaderConfig
  const logoHeader = logoHeaderConfig
  const colorsHeader = colorsHeaderConfig
  const { headerConfig: textsHeader, footerConfig: textsFooter } = useTextsConfig()
  const summaryHeader = summaryHeaderConfig

  // Map current step to configs (resolve refs to plain objects)
  function resolveHeader(
    h: HeaderConfiguration | VueRef<HeaderConfiguration>
  ): HeaderConfiguration {
    return isRef(h) ? h.value : h
  }

  const headerConfig = computed<HeaderConfiguration>(() => {
    switch (workflowStore.currentStep) {
      case 'product':
        return resolveHeader(productHeader)
      case 'designs':
        return resolveHeader(designHeader)
      case 'styles':
        return resolveHeader(styleHeader)
      case 'logos':
        return resolveHeader(logoHeader)
      case 'colors':
        return resolveHeader(colorsHeader)
      case 'patterns':
        return resolveHeader(patternsHeaderConfig)
      case 'texts':
        return resolveHeader(textsHeader)
      case 'summary':
        return resolveHeader(summaryHeader)
      case 'roster':
        return resolveHeader(rosterHeaderConfig)
      default:
        return { breadcrumbs: [] }
    }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    switch (workflowStore.currentStep) {
      case 'product':
        return productFooterConfig
      case 'designs':
        return designFooterConfig
      case 'styles':
        return styleFooterConfig
      case 'logos':
        return logoFooterConfig
      case 'colors':
        return colorsFooterConfig
      case 'patterns':
        return patternsFooterConfig
      case 'texts':
        return textsFooter.value
      case 'summary':
        return summaryFooterConfig
      case 'roster':
        return rosterFooterConfig
      default:
        return { buttons: [] } as FooterConfiguration
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
          :has-footer="footerConfig?.buttons?.length > 0"
          :has-search="!!headerConfig?.search"
        >
          <template #header>
            <WorkflowHeader
              :config="headerConfig"
              @update:apply-overrides-model-value="handleApplyOverridesChange"
              @update:search-model-value="handleSearchChange"
            />
          </template>
          <template v-if="footerConfig?.buttons?.length > 0" #footer>
            <WorkflowFooter :config="footerConfig" />
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
          <TextsEntry v-else-if="workflowStore.currentStep === 'texts'" ref="currentStepRef" />
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
      :has-footer="footerConfig?.buttons?.length > 0"
      :has-search="!!headerConfig?.search"
      @update:is-expanded="isExpanded = $event"
    >
      <template #header>
        <WorkflowHeader
          :config="headerConfig"
          :is-expanded="isExpanded"
          :show-expand-button="true"
          @toggle-expanded="toggleExpanded"
          @update:apply-overrides-model-value="handleApplyOverridesChange"
          @update:search-model-value="handleSearchChange"
        />
      </template>
      <template v-if="footerConfig?.buttons?.length > 0" #footer>
        <WorkflowFooter :config="footerConfig" />
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
      <TextsEntry v-else-if="workflowStore.currentStep === 'texts'" ref="currentStepRef" />
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
