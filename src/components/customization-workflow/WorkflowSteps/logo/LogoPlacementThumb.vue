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

  const CANVAS_SIZE = 176

  const props = defineProps<Props>()

  // Convert product placement coordinates to canvas overlay rect
  // Original coordinates assume a 600x600px canvas, need to scale to actual canvas size (120x120)
  const overlayRect = computed(() => {
    const s = props.setting
    if (!s) return undefined

    const originalCanvasSize = 600
    const actualCanvasSize = CANVAS_SIZE
    const scale = actualCanvasSize / originalCanvasSize

    const scaledRect = {
      x: s.x_axis * scale - (s.height * scale) / 2,
      y: s.y_axis * scale - (s.height * scale) / 2,
      width: s.height * scale,
      height: s.height * scale,
      color: 'rgba(55,65,81,0.45)'
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
      :width="CANVAS_SIZE"
      :height="CANVAS_SIZE"
      :side="props.setting.side"
      :class="`rounded-lg border border-border/50 ${props.class || ''}`"
      :overlay-rect="overlayRect"
    />
  </div>
</template>
