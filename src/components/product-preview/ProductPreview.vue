<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  // import ThreePreview from './ThreePreview.vue'
  // import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import ThreeDScene from '@/components/scene/ThreeDScene.vue'
  const productsStore = useProductsStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const workflowStore = useWorkflowStore()
</script>

<template>
  <div id="3d-or-2d-preview" ref="previewContainer" class="h-full">
    <ThreeDScene v-if="activeProductDetails?.is_3d_product" :main-preview="true" />
    <TwoDScene
      v-else
      :side="workflowStore.activeCanvasSide"
      :main-preview="true"
      :enable-zoom="true"
    />
  </div>

  <!-- If needed, we can add a light fade cross-fade here later -->
  <!-- <Transition name="fade"><component :is="..."/></Transition> -->
</template>

<style scoped></style>
