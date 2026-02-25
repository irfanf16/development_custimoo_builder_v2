<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import TextsSelection from './TextsSelection.vue'
  import TextEdit from './TextEdit.vue'
  import TextPlacement from './TextPlacement.vue'
  import TextNumberFontSelection from './TextNumberFontSelection.vue'

  const workflowStore = useWorkflowStore()
  const { textsSubStep } = storeToRefs(workflowStore)
</script>

<template>
  <TextsSelection v-if="textsSubStep === 'list'" />
  <TextPlacement v-else-if="textsSubStep === 'placement'" />
  <TextEdit v-else-if="textsSubStep === 'single'" />
  <TextNumberFontSelection v-else-if="textsSubStep === 'multipleitems'" />
</template>
