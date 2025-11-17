<script setup lang="ts">
  import { ref } from 'vue'
  // import { storeToRefs } from 'pinia'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  // import ThreePreview from './ThreePreview.vue'
  // import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'

  const workflowStore = useWorkflowStore()
  // const products = useProductsStore()
  //const { activeRenderMode: mode } = storeToRefs(products)
  const previewContainer = ref<HTMLElement>()
</script>

<template>
  <div id="3d-or-2d-preview" ref="previewContainer" class="ml-24">
    <TwoDScene :side="workflowStore.activeCanvasSide" :main-preview="true" />
  </div>

  <!-- If needed, we can add a light fade cross-fade here later -->
  <!-- <Transition name="fade"><component :is="..."/></Transition> -->
</template>

<style scoped></style>
