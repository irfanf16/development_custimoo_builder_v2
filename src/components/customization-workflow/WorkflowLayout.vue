<script setup lang="ts">
  import { computed, ref, isRef, type Ref, type ComputedRef } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
  } from '@/components/ui/tooltip'
  import { Maximize2, Minimize2, Search } from 'lucide-vue-next'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import { useWorkflowNavigation } from '@/composables/useWorkflowNavigation'
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
  import type { HeaderAndFooterConfiguration, BreadcrumbItem } from './types'

  interface Props {
    onNavigateBack: () => void
  }

  const props = defineProps<Props>()

  const workflowStore = useWorkflowStore()

  const isExpanded = ref(false)
  const menuPanelRef = ref<{
    scrollToElement: (elementId: string, behavior?: 'smooth' | 'auto') => void
  } | null>(null)

  const { navigationItems } = useWorkflowNavigation(props.onNavigateBack)

  // Computed properties for workflow step configuration
  const logosSubStepValue = computed(() => {
    const sub = (workflowStore as { logosSubStep?: string | { value: string } })
      .logosSubStep
    return sub && typeof sub === 'object' && 'value' in sub ? sub.value : sub
  })

  const contentKey = computed(() => {
    if (workflowStore.activeStep === 'logos') {
      const sub = logosSubStepValue.value || 'list'
      return `logos-${sub}`
    }
    return workflowStore.activeStep
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

  const headerActionButton = computed(() => {
    return currentStepRef.value?.headerExtras?.actionButton
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
  <div id="workflow-panel-container" class="max-h-[100%]">
    <WorkflowPanel
      ref="menuPanelRef"
      :content-key="contentKey || ''"
      :expandable="isExpandable"
      :is-expanded="isExpanded"
      @update:is-expanded="isExpanded = $event"
    >
      <!-- Header slot -->
      <template #header>
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

            <TooltipProvider v-if="headerActionButton">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    @click="headerActionButton.callback"
                  >
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
      <ProductsEntry
        v-if="workflowStore.activeStep === 'product'"
        ref="currentStepRef"
      />

      <!-- Design Selection Step -->
      <DesignSelection
        v-else-if="workflowStore.activeStep === 'designs'"
        ref="currentStepRef"
        @scroll-to-element="handleScrollToElement"
      />

      <!-- Style Selection Step -->
      <StyleSelection
        v-else-if="workflowStore.activeStep === 'styles'"
        ref="currentStepRef"
      />

      <!-- Logo Selection Step -->
      <LogoSelection
        v-else-if="workflowStore.activeStep === 'logos'"
        ref="currentStepRef"
      />

      <!-- Colors -->
      <ColorSelection
        v-else-if="workflowStore.activeStep === 'colors'"
        ref="currentStepRef"
      />

      <!-- Patterns -->
      <PatternSelection
        v-else-if="workflowStore.activeStep === 'patterns'"
        ref="currentStepRef"
      />
      <!-- Texts -->
      <TextsSelection
        v-else-if="workflowStore.activeStep === 'texts'"
        ref="currentStepRef"
      />
      <TextPlacement
        v-else-if="workflowStore.activeStep === 'texts-placement'"
        ref="currentStepRef"
      />

      <!-- Roster -->
      <RosterEntry
        v-else-if="workflowStore.activeStep === 'roster'"
        ref="currentStepRef"
      />
      <RosterEdit
        v-else-if="workflowStore.activeStep === 'roster-edit'"
        ref="currentStepRef"
      />

      <!-- Summary -->
      <SummaryPanel
        v-else-if="workflowStore.activeStep === 'summary'"
        ref="currentStepRef"
      />
    </WorkflowPanel>
  </div>
</template>
