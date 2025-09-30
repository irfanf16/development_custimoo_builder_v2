<script setup lang="ts">
  import { computed } from 'vue'
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import ThreePreview from './ThreePreview.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  const products = useProductsStore()
  const mode = computed(() => products.activeRenderMode)
</script>

<template>
  <component
    :is="mode === '3d' ? ThreePreview : CanvasPreview"
    :width="
      uiStore.isMobile ? uiStore.containerWidth : uiStore.containerWidth / 2
    "
    :height="uiStore.containerHeight"
  />
  <!-- If needed, we can add a light fade cross-fade here later -->
  <!-- <Transition name="fade"><component :is="..."/></Transition> -->
</template>

<style scoped></style>
