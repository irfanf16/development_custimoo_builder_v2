<script setup lang="ts">
  import { computed } from 'vue'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'

  interface Props {
    product: any
    styleBase: any
    designBase: any
    class?: string
    setting: {
      x_axis: number
      y_axis: number
      width: number
      height: number
      side?: 'front' | 'back'
    }
  }

  const props = defineProps<Props>()

  // Convert product placement coordinates to canvas overlay rect
  // Original coordinates assume a 600x600px canvas, need to scale to actual canvas size (120x120)
  const overlayRect = computed(() => {
    const s = props.setting
    if (!s) return undefined

    const originalCanvasSize = 600
    const actualCanvasSize = 120
    const scale = actualCanvasSize / originalCanvasSize

    const scaledRect = {
      x: s.x_axis * scale - (s.height * scale) / 2,
      y: s.y_axis * scale - (s.height * scale) / 2,
      width: s.height * scale,
      height: s.height * scale,
      color: 'rgba(107,114,128,0.35)'
    }

    return scaledRect
  })
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
      :overlay-rect="overlayRect"
    />
  </div>
</template>
