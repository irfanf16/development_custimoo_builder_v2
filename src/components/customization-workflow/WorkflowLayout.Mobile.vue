<script setup lang="ts">
  import { onMounted } from 'vue'
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
  import { useWorkflow } from '@/composables/useWorkflow'

  const {
    currentStep,
    contentKey,
    isPanelOpen,
    logosSubStep,
    textsSubStep,
    rosterSubStep,
    initializeEffects
  } = useWorkflow()

  onMounted(() => {
    initializeEffects()
  })
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
        v-show="isPanelOpen"
        class="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3"
      >
        <WorkflowPanel
          :content-key="contentKey"
          :expandable="false"
          :is-expanded="true"
        >
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
        </WorkflowPanel>
      </div>
    </transition>
  </div>
</template>

<style scoped></style>
