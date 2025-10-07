<script setup lang="ts">
  import { onMounted, ref, computed, isRef } from 'vue'
  import type { Ref, ComputedRef } from 'vue'
  import { WorkflowPanelMobile } from '@/components/customization-workflow'
  import {
    ProductsEntry,
    DesignSelection,
    StyleSelection,
    LogoCustomization,
    LogoPlacement,
    ColorSelection,
    PatternSelection,
    TextsSelection,
    TextPlacement,
    RosterEntry,
    RosterEdit,
    SummaryPanel
  } from '@/components/customization-workflow/WorkflowSteps'
  import WorkflowBreadcrumbs from './WorkflowBreadcrumbs.vue'
  import { useWorkflow } from '@/composables/useWorkflow'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import type { HeaderAndFooterConfiguration, BreadcrumbItem } from './types'

  const {
    currentStep,
    contentKey,
    isPanelOpen,
    logosSubStep,
    textsSubStep,
    rosterSubStep,
    initializeEffects,
    navigationItems
  } = useWorkflow()

  // Computed properties for workflow step configuration
  const currentStepRef = ref<HeaderAndFooterConfiguration | null>(null)

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

  onMounted(() => {
    initializeEffects()
  })
</script>

<template>
  <div class="fixed bottom-25 h-fit max-h-[65vh] w-[calc(100%-2rem)]">
    <div class="relative w-full h-fit">
      <transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <!-- <div
        v-show="isPanelOpen"
        class="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3"
      > -->
        <WorkflowPanelMobile
          v-show="isPanelOpen"
          :content-key="contentKey"
          :expandable="false"
          :is-expanded="true"
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
                    @update:model-value="
                      val => (applyOverridesModelValue = !!val)
                    "
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
                    @update:model-value="
                      val => (searchModelValue = String(val))
                    "
                  />
                </div>
              </div>
            </div>
          </template>
          <ProductsEntry v-if="currentStep === 'product'" />
          <DesignSelection v-else-if="currentStep === 'designs'" />
          <StyleSelection v-else-if="currentStep === 'styles'" />
          <LogoPlacement
            v-else-if="currentStep === 'logos' && logosSubStep === 'placement'"
          />
          <LogoCustomization
            v-else-if="currentStep === 'logos' && logosSubStep === 'edit'"
          />
          <ColorSelection v-else-if="currentStep === 'colors'" />
          <PatternSelection v-else-if="currentStep === 'patterns'" />
          <TextsSelection
            v-else-if="currentStep === 'texts' && textsSubStep === 'list'"
          />
          <TextPlacement v-else-if="textsSubStep === 'placement'" />
          <RosterEntry
            v-else-if="currentStep === 'roster' && rosterSubStep === 'list'"
          />
          <RosterEdit v-else-if="rosterSubStep === 'edit'" />
          <SummaryPanel v-else-if="currentStep === 'summary'" />
        </WorkflowPanelMobile>
      </transition>
    </div>
  </div>
</template>

<style scoped></style>
