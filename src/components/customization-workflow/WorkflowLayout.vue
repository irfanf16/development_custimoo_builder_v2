<script setup lang="ts">
  import {
    computed,
    ref,
    onMounted,
    onUnmounted,
    watch,
    nextTick,
    isRef,
    type Ref as VueRef
  } from 'vue'
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
  import { ui_close } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import './workflow-compact-typography.css'

  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
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
      const base =
        'absolute bottom-25 inset-x-4 z-widget-workflow w-auto max-w-full transition-[max-height] duration-200 ease-out'
      if (workflowStore.mobileSheetSnap === 'peek') {
        return `${base} h-[40dvh] max-h-[40dvh]`
      }
      return `${base} h-fit max-h-[88dvh]`
    }
    const base = 'flex h-full max-h-full min-h-0 min-w-0 w-full max-w-full flex-col'
    if (isExpanded.value) {
      return `${base} z-widget-workflow-layout-expanded`
    }
    return `${base} z-widget-workflow`
  })

  /** Drives workflow-compact-typography.css (type + color swatches) for narrow desktop panel. */
  const workflowCompactTypography = computed(
    () => !uiStore.isMobile && uiStore.desktopPreviewCompact
  )

  const sheetHandleRef = ref<HTMLElement | null>(null)
  const sheetDragOffset = ref(0)
  let sheetTouchStartY = 0

  const closePanelAriaLabel = computed(() =>
    ui_close({}, { locale: profileStore.currentLocale })
  )

  const mobileSheetInnerStyle = computed(() =>
    sheetDragOffset.value > 0 ? { transform: `translateY(${sheetDragOffset.value}px)` } : {}
  )

  function closeMobilePanel() {
    workflowStore.setPanelOpen(false)
    sheetDragOffset.value = 0
  }

  const SNAP_DRAG_THRESHOLD = 72

  function onMobileSheetHandleActivate() {
    if (workflowStore.mobileSheetSnap === 'full') {
      workflowStore.setMobileSheetSnap('peek')
    } else {
      closeMobilePanel()
    }
  }

  let removeSheetTouchListeners: (() => void) | undefined

  function attachSheetHandleTouch() {
    removeSheetTouchListeners?.()
    removeSheetTouchListeners = undefined
    const el = sheetHandleRef.value
    if (!el || !uiStore.isMobile) return

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      sheetTouchStartY = t.clientY
    }
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const dy = t.clientY - sheetTouchStartY
      if (dy > 0) {
        sheetDragOffset.value = dy
        e.preventDefault()
      }
    }
    const onEnd = () => {
      const dy = sheetDragOffset.value
      if (workflowStore.mobileSheetSnap === 'full') {
        if (dy >= SNAP_DRAG_THRESHOLD) {
          workflowStore.setMobileSheetSnap('peek')
        }
      } else if (workflowStore.mobileSheetSnap === 'peek') {
        if (dy >= SNAP_DRAG_THRESHOLD) {
          workflowStore.setPanelOpen(false)
        }
      }
      sheetDragOffset.value = 0
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })

    removeSheetTouchListeners = () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }

  watch(
    () => [workflowStore.isPanelOpen, uiStore.isMobile] as const,
    async ([open, mobile]) => {
      removeSheetTouchListeners?.()
      removeSheetTouchListeners = undefined
      sheetDragOffset.value = 0
      if (!open || !mobile) return
      await nextTick()
      attachSheetHandleTouch()
    },
    { flush: 'post', immediate: true }
  )

  onUnmounted(() => {
    removeSheetTouchListeners?.()
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
  <div
    id="workflow-panel-container"
    :class="containerClasses"
    :data-workflow-compact-typography="workflowCompactTypography ? '' : undefined"
  >
    <!-- Mobile: Wrap WorkflowPanel in transition -->
    <div v-if="uiStore.isMobile" class="relative w-full h-fit">
      <transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-4 opacity-0"
      >
        <div
          v-show="workflowStore.isPanelOpen"
          class="w-full opacity-100"
        >
          <div
            class="overflow-hidden rounded-t-2xl border border-border bg-background opacity-100 shadow-lg"
            :style="mobileSheetInnerStyle"
          >
            <div
              ref="sheetHandleRef"
              role="button"
              tabindex="0"
              class="flex min-h-11 shrink-0 cursor-pointer touch-none select-none flex-col items-center justify-center gap-2 px-4 py-2"
              :aria-label="closePanelAriaLabel"
              @click="onMobileSheetHandleActivate"
              @keydown.enter.prevent="onMobileSheetHandleActivate"
              @keydown.space.prevent="onMobileSheetHandleActivate"
            >
              <div
                class="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/35"
                aria-hidden="true"
              />
            </div>
            <WorkflowPanel
              ref="menuPanelRef"
              :content-key="workflowStore.contentKey || ''"
              :header-config="headerConfig"
              :is-expanded="true"
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

              <ProductsEntry
                v-if="workflowStore.currentStep === 'product'"
                :is-expanded="isExpanded"
              />
              <DesignSelection
                v-else-if="workflowStore.currentStep === 'designs'"
                :is-expanded="isExpanded"
                @scroll-to-element="handleScrollToElement"
              />
              <StyleSelection v-else-if="workflowStore.currentStep === 'styles'" />
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
              <TextsEntry
                v-else-if="workflowStore.currentStep === 'texts'"
                :is-expanded="isExpanded"
              />
              <RosterEntry
                v-else-if="workflowStore.currentStep === 'roster'"
                :is-expanded="isExpanded"
              />
              <SummaryPanel
                v-else-if="workflowStore.currentStep === 'summary'"
                :key="JSON.stringify(customization)"
                :is-expanded="isExpanded"
              />
            </WorkflowPanel>
          </div>
        </div>
      </transition>
    </div>

    <!-- Desktop: in-flow panel beside the nav (pre–dock/overlay layout) -->
    <WorkflowPanel
      v-else
      ref="menuPanelRef"
      :content-key="workflowStore.contentKey || ''"
      :header-config="headerConfig"
      :is-expanded="isExpanded"
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
        :is-expanded="isExpanded"
      />
      <RosterEntry v-else-if="workflowStore.currentStep === 'roster'" :is-expanded="isExpanded" />
      <SummaryPanel v-else-if="workflowStore.currentStep === 'summary'" :is-expanded="isExpanded" />
    </WorkflowPanel>
  </div>
</template>
