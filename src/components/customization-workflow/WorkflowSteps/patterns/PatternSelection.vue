<script setup lang="ts">
  import { computed } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import PatternLayerSelection from './PatternLayerSelection.vue'
  import PatternEdit from './PatternEdit.vue'

  const workflowStore = useWorkflowStore()

  // Use workflow store state
  const currentSubStep = computed(() => workflowStore.patternsSubStep)
  const selectedLayerId = computed(() => workflowStore.activePatternGroupName)

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
      return [
        { label: 'Pattern', action: handleBackToLayers },
        { label: selectedLayerId.value }
      ]
    }
    return [{ label: 'Pattern' }]
  })
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <!-- Two-step workflow with transitions -->
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
</template>

<style scoped></style>
