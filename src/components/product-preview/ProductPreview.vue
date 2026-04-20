<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { Spinner } from '@/components/ui/spinner'
  import ThreeDScene from '@/components/scene/ThreeDScene.vue'
  const productsStore = useProductsStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const workflowStore = useWorkflowStore()
</script>

<template>
  <div
    id="3d-or-2d-preview"
    ref="previewContainer"
    class="relative h-full w-full"
    :aria-busy="!productsStore.mainPreviewLoadComplete"
  >
    <ThreeDScene v-if="activeProductDetails?.is_3d_product" class="h-full" :main-preview="true" />
    <TwoDScene
      v-else
      :side="workflowStore.activeCanvasSide"
      :main-preview="true"
      :enable-zoom="true"
    />

    <Transition name="preview-scene-loading">
      <div
        v-if="!productsStore.mainPreviewLoadComplete"
        class="absolute inset-0 w-full h-full z-[1] flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-md ring-1 ring-border/50 cursor-wait"
      >
        <Spinner class="size-7 text-primary" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .preview-scene-loading-enter-active,
  .preview-scene-loading-leave-active {
    transition: opacity 0.2s ease;
  }
  .preview-scene-loading-enter-from,
  .preview-scene-loading-leave-to {
    opacity: 0;
  }
</style>
