<script setup lang="ts">
  import ProductPreviewCanvas from '@/components/customizer-panel/ProductPreviewCanvas.vue'
  import type {
    OutputProductBase,
    OutputProductStyleBase,
    OutputProductStyleDesignBase,
    OutputProductLogosSetting
  } from '@/services/products/types'
  import { computed } from 'vue'

  const props = defineProps<{
    product: OutputProductBase
    styleBase: OutputProductStyleBase
    designBase: OutputProductStyleDesignBase
    setting: OutputProductLogosSetting
    width?: number
    height?: number
  }>()

  const w = computed(() => props.width ?? 120)
  const h = computed(() => props.height ?? 120)

  // settings are relative to a 600x600 canvas; map to current size
  const scaleX = computed(() => w.value / 600)
  const scaleY = computed(() => h.value / 600)

  const overlayRect = computed(() => ({
    x: Math.round(props.setting.x_axis * scaleX.value),
    y: Math.round(props.setting.y_axis * scaleY.value),
    width: Math.round(
      (props.setting.width || 0) * scaleX.value ||
        Math.round((props.setting.height || 0) * scaleX.value)
    ),
    height: Math.round((props.setting.height || 0) * scaleY.value),
    color: 'rgba(107,114,128,0.35)'
  }))

  const side = computed(() => props.setting.side)
</script>

<template>
  <ProductPreviewCanvas
    :key="(designBase as any)?.id + '-' + (side as any) + '-' + w + 'x' + h"
    :product="product"
    :style-base="styleBase"
    :design-base="designBase"
    :width="w"
    :height="h"
    :side="side as any"
    :overlay-rect="overlayRect as any"
  />
</template>
