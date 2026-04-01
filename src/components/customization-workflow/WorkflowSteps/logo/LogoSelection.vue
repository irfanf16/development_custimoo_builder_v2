<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import LogoCustomization from './LogoCustomization.vue'
  import LogoPlacement from './LogoPlacement.vue'
  import LogoEdit from './LogoEdit.vue'

  const workflowStore = useWorkflowStore()

  // Use workflow store state
  const {
    logosSubStep: currentSubStep,
    activeLogoId: selectedLogoId,
    activeLogoIndex
  } = storeToRefs(workflowStore)

  function handleSelectLogo(logoId: string, logoIndex: number) {
    workflowStore.setActiveLogoId(logoId)
    workflowStore.setActiveLogoIndex(logoIndex)
    workflowStore.setLogosSubStep('edit')
  }

  function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    workflowStore.setActiveLogoId(null)
    workflowStore.setActiveLogoIndex(null)
  }

  function handleGoToPlacement() {
    workflowStore.setLogosSubStep('placement')
  }

  function handleBackFromPlacement() {
    workflowStore.setLogosSubStep('list')
  }

  // header/footer config moved to config.ts
</script>

<template>
  <!-- Three-step workflow with transitions -->
  <Transition name="panel-slide" mode="out-in" appear>
    <LogoCustomization
      v-if="currentSubStep === 'list'"
      :key="'logos-list'"
      @select-logo="handleSelectLogo"
      @go-to-placement="handleGoToPlacement"
    />

    <LogoPlacement
      v-else-if="currentSubStep === 'placement'"
      :key="'logos-placement'"
      @back="handleBackFromPlacement"
    />
    <LogoEdit
      v-else-if="currentSubStep === 'edit' && selectedLogoId"
      :key="`logos-edit-${activeLogoIndex ?? selectedLogoId}`"
      :logo-id="selectedLogoId"
      :logo-index="activeLogoIndex"
      @back="handleBackToLogos"
    />
  </Transition>
</template>
