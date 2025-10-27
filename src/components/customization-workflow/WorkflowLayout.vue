<script setup lang="ts">
  import { computed, ref, isRef, type Ref, type ComputedRef, onMounted } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { Maximize2, Minimize2 } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
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
  import type { BreadcrumbItem } from './types'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  const workflowStore = useWorkflowStore()
  const { initializeEffects } = useWorkflow()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
  } | null>(null)

  const isExpandable = computed(() => {
    return workflowStore.currentHeaderConfig?.isExpandable
  })

  // Get breadcrumbs from current step component
  const currentBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    const exposed = workflowStore.currentHeaderConfig?.breadcrumbs
    if (exposed) {
      return isRef(exposed)
        ? (exposed as unknown as ComputedRef<BreadcrumbItem[]>).value
        : (exposed as BreadcrumbItem[])
    }
    // Fallback to centralized navigation when panel doesn't expose breadcrumbs
    return workflowStore.navigationItems
  })

  const headerApplyOverrides = computed(() => {
    return workflowStore.currentHeaderConfig?.applyOverrides
  })

  const headerActionButton = computed(() => {
    return workflowStore.currentHeaderConfig?.actionButton
  })

  const toggleExpanded = () => {
    if (isExpandable.value) {
      isExpanded.value = !isExpanded.value
    }
  }

  // Bridge nested refs from child steps to primitives for props expecting non-Ref
  const applyOverridesModelValue = computed({
    get: (): boolean => {
      const model = workflowStore.currentHeaderConfig?.applyOverrides?.model as
        | Ref<boolean>
        | undefined
      return model?.value ?? false
    },
    set: (val: boolean) => {
      workflowStore.currentHeaderConfig?.applyOverrides?.onInput?.(!!val)
    }
  })

  const searchModelValue = computed({
    get: (): string => {
      const model = workflowStore.currentHeaderConfig?.search?.model as Ref<string> | undefined
      return model?.value ?? ''
    },
    set: (val: string) => {
      workflowStore.currentHeaderConfig?.search?.onInput?.(val)
    }
  })

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
            <div class="w-full flex flex-col gap-5">
              <div class="flex items-center gap-3 h-9 justify-center">
                <div
                  class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden"
                >
                  <WorkflowBreadcrumbs :breadcrumbs="currentBreadcrumbs" />
                </div>

                <div v-if="headerApplyOverrides !== undefined" class="flex items-center gap-3">
                  <Switch
                    :model-value="applyOverridesModelValue"
                    @update:model-value="val => (applyOverridesModelValue = !!val)"
                  />
                  <Label class="text-sm font-normal text-muted-foreground">{{
                    headerApplyOverrides.label
                  }}</Label>
                </div>

                <TooltipProvider v-if="headerActionButton">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="default" size="sm" @click="headerActionButton.callback">
                        {{ headerActionButton.label }}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent v-if="headerActionButton.tooltip">
                      <p>{{ headerActionButton.tooltip }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div
                v-if="workflowStore.currentHeaderConfig?.search"
                class="flex items-center flex-1"
              >
                <div class="relative w-full">
                  <InputSearchGroup
                    v-model="searchModelValue"
                    :placeholder="
                      workflowStore.currentHeaderConfig?.search?.placeholder || 'Search...'
                    "
                    :on-input="workflowStore.currentHeaderConfig?.search?.onInput"
                  />
                </div>
              </div>
            </div>
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
      :expandable="isExpandable"
      :is-expanded="isExpanded"
      @update:is-expanded="isExpanded = $event"
    >
      <template #header>
        <div class="w-full flex flex-col gap-5">
          <div class="flex items-center gap-3 h-9 justify-center">
            <div class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden">
              <WorkflowBreadcrumbs :breadcrumbs="currentBreadcrumbs" />
            </div>

            <div v-if="headerApplyOverrides !== undefined" class="flex items-center gap-3">
              <Switch
                :model-value="applyOverridesModelValue"
                @update:model-value="val => (applyOverridesModelValue = !!val)"
              />
              <Label class="text-sm font-normal text-muted-foreground">{{
                headerApplyOverrides.label
              }}</Label>
            </div>

            <TooltipProvider v-if="headerActionButton">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="default" size="sm" @click="headerActionButton.callback">
                    {{ headerActionButton.label }}
                  </Button>
                </TooltipTrigger>
                <TooltipContent v-if="headerActionButton.tooltip">
                  <p>{{ headerActionButton.tooltip }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              v-if="isExpandable"
              variant="default"
              size="icon"
              class="rounded-lg"
              @click="toggleExpanded"
            >
              <component :is="isExpanded ? Minimize2 : Maximize2" class="size-4" />
            </Button>
          </div>

          <div v-if="workflowStore.currentHeaderConfig?.search" class="flex items-center flex-1">
            <div class="relative w-full">
              <InputSearchGroup
                v-model="searchModelValue"
                :placeholder="workflowStore.currentHeaderConfig?.search?.placeholder || 'Search...'"
                :on-input="workflowStore.currentHeaderConfig?.search?.onInput"
              />
            </div>
          </div>
        </div>
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
