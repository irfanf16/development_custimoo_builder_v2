<script setup lang="ts">
  import { computed, ref, onMounted, watch, isRef, type Ref as VueRef } from 'vue'
  import type { HeaderConfiguration, FooterConfiguration } from './types'
  import WorkflowHeader from './WorkflowHeader.vue'
  import { useWorkflow } from '@/composables/useWorkflow'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import {
    ProductsEntry,
    DesignSelection,
    StyleSelection,
    LogoSelection,
    ColorSelection,
    PatternSelection,
    RosterEntry,
    SummaryPanel
  } from '@/components/customization-workflow/WorkflowSteps'
  import { Separator } from '@/components/ui/separator'
  import TextsEntry from '@/components/customization-workflow/WorkflowSteps/texts/index.vue'
  import WorkflowPanel from './WorkflowPanel.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import WorkflowFooterButtons from './WorkflowFooterButtons.vue'
  import WorkflowFooterPricing from './WorkflowFooterPricing.vue'
  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const productsStore = useProductsStore()
  const { goTo, menuItems, pickStepOrNextAvailable } = useCustomizerMenu()
  const { initializeEffects } = useWorkflow()
  // When active step is not in visible tabs (e.g. product changed and logos tab hidden), redirect to a visible step.
  // Only redirect once scene load is complete (extractSvgGroups has run) so we don't kick user off color tab on refresh.
  watch(
    () => [workflowStore.activeStep, menuItems.value, productsStore.sceneLoadComplete] as const,
    ([activeStep, items, sceneLoadComplete]) => {
      const visibleSteps = items.map(i => i.step)
      const step = activeStep ?? 'product'
      if (visibleSteps.length && !visibleSteps.includes(step) && sceneLoadComplete) {
        void goTo(pickStepOrNextAvailable(step, visibleSteps))
      }
    },
    { immediate: true }
  )

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

  // Mobile: when the sheet is open it must stack above the topbar (z-40); otherwise topbar stays on top.
  const containerClasses = computed(() => {
    if (uiStore.isMobile) {
      const zSheet = workflowStore.isPanelOpen ? 'z-50' : 'z-30'
      return [
        'fixed bottom-25 h-fit max-h-[65vh] w-[calc(100%-2rem)]',
        'flex flex-col min-h-0 overflow-hidden',
        zSheet
      ].join(' ')
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
  import { useDesignConfig } from './WorkflowSteps/design/useDesignConfig'
  import { useProductConfig } from './WorkflowSteps/product/useProductConfig'
  import { useStyleConfig } from './WorkflowSteps/style/useStyleConfig'
  import { useLogoConfig } from './WorkflowSteps/logo/useLogoConfig'
  import { useColorsConfig } from './WorkflowSteps/colors/useColorsConfig'
  import { useTextsConfig } from './WorkflowSteps/texts/useTextsConfig'
  import { usePatternsConfig } from './WorkflowSteps/patterns/usePatternsConfig'
  import { useRosterConfig } from './WorkflowSteps/roster/useRosterConfig'
  import { useSummaryConfig } from './WorkflowSteps/summary/useSummaryConfig'
  // Repeat for other steps as available ...

  // Instantiate step configs
  const { headerConfig: productHeader, footerConfig: productFooter } = useProductConfig()
  const { headerConfig: designHeader, footerConfig: designFooter } = useDesignConfig()
  const { headerConfig: styleHeader, footerConfig: styleFooter } = useStyleConfig()
  const { headerConfig: logoHeader, footerConfig: logoFooter } = useLogoConfig()
  const { headerConfig: colorsHeader, footerConfig: colorsFooter } = useColorsConfig()
  const { headerConfig: textsHeader, footerConfig: textsFooter } = useTextsConfig()
  const { headerConfig: patternsHeader, footerConfig: patternsFooter } = usePatternsConfig()
  const { headerConfig: rosterHeader, footerConfig: rosterFooter } = useRosterConfig()
  const { headerConfig: summaryHeader, footerConfig: summaryFooter } = useSummaryConfig()

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
        return resolveHeader(patternsHeader)
      case 'texts':
        return resolveHeader(textsHeader)
      case 'summary':
        return resolveHeader(summaryHeader)
      case 'roster':
        return resolveHeader(rosterHeader)
      default:
        return { breadcrumbs: [] }
    }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    switch (workflowStore.currentStep) {
      case 'product':
        return productFooter.value
      case 'designs':
        return designFooter.value
      case 'styles':
        return styleFooter.value
      case 'logos':
        return logoFooter.value
      case 'colors':
        return colorsFooter.value
      case 'patterns':
        return patternsFooter.value
      case 'texts':
        return textsFooter.value
      case 'summary':
        return summaryFooter.value
      case 'roster':
        return rosterFooter.value
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
          :header-config="headerConfig"
          :is-expanded="true"
          :has-footer-buttons="footerConfig?.buttons?.length > 0"
        >
          <template #header>
            <WorkflowHeader
              :config="headerConfig"
              @update:apply-overrides-model-value="handleApplyOverridesChange"
              @update:search-model-value="handleSearchChange"
            />
          </template>
          <template #footer>
            <div :class="['flex flex-col w-full', { 'justify-end': isExpanded }]">
              <WorkflowFooterButtons
                v-if="footerConfig?.buttons?.length > 0"
                :config="footerConfig"
                :is-expanded="isExpanded"
              />
              <Separator v-if="footerConfig?.buttons?.length > 0" class="my-2 md:my-4" />
              <WorkflowFooterPricing :is-expanded="isExpanded" />
            </div>
          </template>

          <ProductsEntry v-if="workflowStore.currentStep === 'product'" :is-expanded="isExpanded" />
          <DesignSelection
            v-else-if="workflowStore.currentStep === 'designs'"
            :is-expanded="isExpanded"
            @scroll-to-element="handleScrollToElement"
          />
          <StyleSelection
            v-else-if="workflowStore.currentStep === 'styles'"
            :is-expanded="isExpanded"
          />
          <LogoSelection
            v-else-if="workflowStore.currentStep === 'logos'"
            :is-expanded="isExpanded"
          />
          <ColorSelection
            v-else-if="workflowStore.currentStep === 'colors'"
            :is-expanded="isExpanded"
          />
          <PatternSelection
            v-else-if="workflowStore.currentStep === 'patterns'"
            :is-expanded="isExpanded"
          />
          <TextsEntry v-else-if="workflowStore.currentStep === 'texts'" :is-expanded="isExpanded" />
          <RosterEntry
            v-else-if="workflowStore.currentStep === 'roster'"
            :is-expanded="isExpanded"
          />
          <SummaryPanel
            v-else-if="workflowStore.currentStep === 'summary'"
            :is-expanded="isExpanded"
          />
        </WorkflowPanel>
      </transition>
    </div>

    <!-- Desktop: Direct WorkflowPanel with expand/collapse functionality -->
    <WorkflowPanel
      v-else
      ref="menuPanelRef"
      :content-key="workflowStore.contentKey || ''"
      :header-config="headerConfig"
      :is-expanded="isExpanded"
      :has-footer="footerConfig?.buttons?.length > 0"
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
      <template #footer>
        <div :class="['flex flex-col w-full', { 'items-end justify-end': isExpanded }]">
          <WorkflowFooterButtons
            v-if="footerConfig?.buttons?.length > 0"
            :config="footerConfig"
            :is-expanded="isExpanded"
          />
          <Separator v-if="footerConfig?.buttons?.length > 0" class="my-2 md:my-4" />
          <WorkflowFooterPricing :is-expanded="isExpanded" />
        </div>
      </template>

      <ProductsEntry v-if="workflowStore.currentStep === 'product'" :is-expanded="isExpanded" />
      <DesignSelection
        v-else-if="workflowStore.currentStep === 'designs'"
        :is-expanded="isExpanded"
        @scroll-to-element="handleScrollToElement"
      />
      <StyleSelection v-else-if="workflowStore.currentStep === 'styles'" />
      <LogoSelection v-else-if="workflowStore.currentStep === 'logos'" :is-expanded="isExpanded" />
      <ColorSelection
        v-else-if="workflowStore.currentStep === 'colors'"
        :is-expanded="isExpanded"
      />
      <PatternSelection
        v-else-if="workflowStore.currentStep === 'patterns'"
        :is-expanded="isExpanded"
      />
      <TextsEntry
        v-else-if="workflowStore.currentStep === 'texts'"
        ref="currentStepRef"
        :is-expanded="isExpanded"
      />
      <RosterEntry v-else-if="workflowStore.currentStep === 'roster'" :is-expanded="isExpanded" />
      <SummaryPanel v-else-if="workflowStore.currentStep === 'summary'" :is-expanded="isExpanded" />
    </WorkflowPanel>
  </div>
</template>
