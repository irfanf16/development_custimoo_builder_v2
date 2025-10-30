<script setup lang="ts">
  import { shallowRef } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import TextsSelection from './TextsSelection.vue'
  import TextEdit from './TextEdit.vue'
  import TextPlacement from './TextPlacement.vue'
  import TextNumberFontSelection from './TextNumberFontSelection.vue'

  const workflowStore = useWorkflowStore()
  const currentRef = shallowRef<any>(null)
  defineExpose({
    saveChanges: () => currentRef.value?.saveChanges?.(),
    cancel: () => currentRef.value?.cancel?.()
  })
</script>

<template>
  <TextsSelection v-if="workflowStore.textsSubStep === 'list'" ref="currentRef" />
  <TextPlacement v-else-if="workflowStore.textsSubStep === 'placement'" ref="currentRef" />
  <TextEdit v-else-if="workflowStore.textsSubStep === 'edit'" ref="currentRef" />
  <TextNumberFontSelection
    v-else-if="workflowStore.textsSubStep === 'number-font'"
    ref="currentRef"
  />
</template>
