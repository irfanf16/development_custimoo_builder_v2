<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import ProductPreviewCanvas from '../ProductPreviewCanvas.vue'
  import type {
    OutputProductPreview,
    OutputStylePreviewFront,
    OutputStylePreviewBack,
    OutputDesignPreviewFront,
    OutputDesignPreviewBack
  } from '@/services/products/types'
  import { useUIStore } from '@/stores/ui/ui.store'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  interface Props {
    product: OutputProductPreview
    styleBase: OutputStylePreviewFront & OutputStylePreviewBack
    designBase: OutputDesignPreviewFront | (OutputDesignPreviewFront & OutputDesignPreviewBack)
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
    const actualCanvasSize = isMobile.value ? 130 : 176
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
      :width="isMobile ? 130 : 176"
      :height="isMobile ? 130 : 176"
      :side="props.setting.side"
      :class="`${props.class || ''}`"
      :overlay-rect="overlayRect"
    />
  </div>
</template>
