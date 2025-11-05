<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import TextsSelection from './TextsSelection.vue'
  import TextEdit from './TextEdit.vue'
  import TextPlacement from './TextPlacement.vue'
  import TextNumberFontSelection from './TextNumberFontSelection.vue'

  const workflowStore = useWorkflowStore()
  const { textsSubStep } = storeToRefs(workflowStore)
  console.log('TextsEntry component mounted')
  console.log('workflowStore.textsSubStep:', textsSubStep.value)
</script>

<template>
  <TextsSelection v-if="textsSubStep === 'list'" />
  <TextPlacement v-else-if="workflowStore.textsSubStep === 'placement'" />
  <TextEdit v-else-if="textsSubStep === 'edit'" />
  <TextNumberFontSelection v-else-if="textsSubStep === 'number-font'" />
</template>
