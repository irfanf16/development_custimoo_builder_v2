<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import PatternLayerSelection from './PatternLayerSelection.vue'
  import PatternEdit from './PatternEdit.vue'
  import { computed } from 'vue'

  const workflowStore = useWorkflowStore()

  // Use workflow store state
  const { patternsSubStep: currentSubStep, activePatternGroupName: selectedLayerId } =
    storeToRefs(workflowStore)

  function handleSelectLayer(layerId: string) {
    workflowStore.setActivePatternSubStep(layerId)
    workflowStore.setPatternsSubStep('edit')
  }

  function handleBackToLayers() {
    workflowStore.setPatternsSubStep('list')
    workflowStore.setActivePatternSubStep(null)
  }

  // Breadcrumb logic for pattern selection and edit substep
  const breadcrumbs = computed(() => {
    if (currentSubStep.value === 'edit' && selectedLayerId.value) {
      return [{ label: 'Pattern', action: handleBackToLayers }, { label: selectedLayerId.value }]
    }
    return [{ label: 'Pattern' }]
  })
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <!-- Two-step workflow with transitions -->
  <div data-testid="workflow-patterns-selection">
    <Transition name="panel-slide" mode="out-in" appear>
      <PatternLayerSelection
        v-if="currentSubStep === 'list'"
        :key="'layers'"
        @select-layer="handleSelectLayer"
      />

      <PatternEdit
        v-else-if="currentSubStep === 'edit' && selectedLayerId"
        :key="`edit-${selectedLayerId}`"
        :layer-id="selectedLayerId"
        @back="handleBackToLayers"
      />
    </Transition>
  </div>
</template>

<style scoped></style>
