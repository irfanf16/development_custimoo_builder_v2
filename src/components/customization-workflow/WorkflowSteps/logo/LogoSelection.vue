<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import LogoCustomization from './LogoCustomization.vue'
  import LogoPlacement from './LogoPlacement.vue'
  import LogoEdit from './LogoEdit.vue'
  import { useWorkflowHeaderConfig } from '@/composables/useWorkflowHeaderConfig'

  const workflowStore = useWorkflowStore()

  // Use workflow store state
  const { logosSubStep: currentSubStep, activeLogoId: selectedLogoId } = storeToRefs(workflowStore)

  function handleSelectLogo(logoId: string) {
    workflowStore.setActiveLogoId(logoId)
    workflowStore.setLogosSubStep('edit')
  }

  function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    workflowStore.setActiveLogoId(null)
  }

  function handleGoToPlacement() {
    workflowStore.setLogosSubStep('placement')
  }

  function handleBackFromPlacement() {
    workflowStore.setLogosSubStep('list')
  }

  // Breadcrumb logic for logo selection and edit substep
  // Note: breadcrumbs need to be computed dynamically based on sub-step
  // So we pass a function that returns breadcrumbs
  useWorkflowHeaderConfig(() => ({
    breadcrumbs: (() => {
      if (currentSubStep.value === 'edit' && selectedLogoId.value) {
        return [{ label: 'Logos', action: handleBackToLogos }, { label: 'Controls' }]
      }
      if (currentSubStep.value === 'placement') {
        return [{ label: 'Logos', action: handleBackFromPlacement }, { label: 'Placement' }]
      }
      return [{ label: 'Logos' }]
    })()
  }))
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
      :key="`logos-edit-${selectedLogoId}`"
      :logo-id="selectedLogoId"
      @back="handleBackToLogos"
    />
  </Transition>
</template>
