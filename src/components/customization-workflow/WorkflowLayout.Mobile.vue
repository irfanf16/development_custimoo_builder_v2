<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  // import { useUIStore } from '@/stores/ui'
  import { WorkflowPanel } from '@/components/customization-workflow'
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

  const props = defineProps<{
    currentStep:
      | 'product'
      | 'designs'
      | 'styles'
      | 'logos'
      | 'colors'
      | 'patterns'
      | 'texts'
      | 'texts-placement'
      | 'roster'
      | 'roster-edit'
      | 'summary'
    onNavigateBack: () => void
  }>()

  const workflow = useWorkflowStore()
  // const ui = useUIStore()

  const logosSubStepValue = computed(
    () => (workflow as { logosSubStep?: string }).logosSubStep
  )
  const isOpen = computed(() => workflow.panelOpen)

  const contentKey = computed(() => {
    if (props.currentStep === 'logos') {
      const sub = logosSubStepValue.value || 'list'
      return `logos-${sub}`
    }
    return props.currentStep
  })

  const panelEl = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="relative">
    <transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-show="isOpen"
        class="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3"
      >
        <WorkflowPanel
          ref="panelEl"
          :content-key="contentKey"
          :expandable="false"
          :is-expanded="true"
        >
          <ProductsEntry
            v-if="['product'].includes(currentStep)"
            :current-step="currentStep"
          />
          <DesignSelection v-else-if="currentStep === 'designs'" />
          <StyleSelection v-else-if="currentStep === 'styles'" />
          <LogoPlacement
            v-else-if="
              currentStep === 'logos' && logosSubStepValue === 'placement'
            "
          />
          <LogoCustomization
            v-else-if="
              currentStep === 'logos' && logosSubStepValue !== 'placement'
            "
          />
          <ColorSelection v-else-if="currentStep === 'colors'" />
          <PatternSelection v-else-if="currentStep === 'patterns'" />
          <TextsSelection v-else-if="currentStep === 'texts'" />
          <TextPlacement v-else-if="currentStep === 'texts-placement'" />
          <RosterEntry v-else-if="currentStep === 'roster'" />
          <RosterEdit v-else-if="currentStep === 'roster-edit'" />
          <SummaryPanel v-else-if="currentStep === 'summary'" />
        </WorkflowPanel>
      </div>
    </transition>
  </div>
</template>

<style scoped></style>
