<script setup lang="ts">
  import ProductPreviewCanvas from './ProductPreviewCanvas.vue'

  interface Props {
    product: any
    styleBase: any
    designBase: any
    class?: string
  }

  const props = defineProps<Props>()
</script>

<template>
  <div class="relative">
    <ProductPreviewCanvas
      :product="product"
      :style-base="styleBase"
      :design-base="designBase"
      :width="120"
      :height="120"
      :class="`rounded-lg border border-border/50 ${props.class || ''}`"
    />
  </div>
</template>
