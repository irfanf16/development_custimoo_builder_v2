<script setup lang="ts">
  import { computed, ref } from 'vue'
  import CanvasPreview from '@/components/customizer-canvas-preview/CanvasPreview.vue'
  import ThreePreview from './ThreePreview.vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useElementSize } from '@vueuse/core'

  const products = useProductsStore()
  const mode = computed(() => products.activeRenderMode)
  const previewContainer = ref<HTMLElement>()
  const elementSize = useElementSize(previewContainer)
</script>

<template>
  <div id="3d-or-2d-preview" ref="previewContainer" class="w-full h-full">
    <component
      :is="mode === '3d' ? ThreePreview : CanvasPreview"
      v-if="elementSize.width.value > 0 && elementSize.height.value > 0"
      :width="elementSize.width.value"
      :height="elementSize.height.value"
    />
  </div>

  <!-- If needed, we can add a light fade cross-fade here later -->
  <!-- <Transition name="fade"><component :is="..."/></Transition> -->
</template>

<style scoped></style>
