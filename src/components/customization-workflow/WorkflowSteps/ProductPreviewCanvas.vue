<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, type PropType } from 'vue'
  import { Rect } from 'fabric'
  import type {
    OutputProductPreview,
    OutputStylePreview,
    OutputDesignPreview
  } from '@/services/products/types'
  import { useFabricPreview } from '@/composables/useFabricPreview'

  const props = defineProps({
    product: { type: Object as PropType<OutputProductPreview>, required: true },
    styleBase: {
      type: Object as PropType<OutputStylePreview>,
      required: true
    },
    designBase: {
      type: Object as PropType<OutputDesignPreview>,
      required: true
    },
    width: { type: Number, default: 176 },
    height: { type: Number, default: 176 },
    side: { type: String as PropType<'front' | 'back'>, default: 'front' },
    class: { type: String, default: '' },
    overlayRect: {
      type: Object as PropType<
        | {
            x: number
            y: number
            width: number
            height: number
            color?: string
          }
        | undefined
      >,
      default: undefined
    }
  })

  const {
    canvasEl,
    canvas,
    initCanvas,
    setCanvasSize,
    disposeCanvas,
    clearCanvas,
    requestRender,
    addModelLayer,
    addDesignLayer
  } = useFabricPreview()

  async function renderPreview() {
    if (!canvas.value) return
    clearCanvas()

    if (props.side === 'back' && (props.designBase as any).back_design) {
      const back = (props.designBase as any).back_design
      await addDesignLayer(back.file_url, back.file_extension)
      const backModels = (props.styleBase as any).back_models || []
      for (const m of backModels) {
        const comp =
          (m.composition as 'multiply' | 'screen') === 'multiply'
            ? 'multiply'
            : 'screen'
        await addModelLayer(m.file_url, comp as GlobalCompositeOperation)
      }
    } else {
      await addDesignLayer(
        props.designBase.front_design.file_url,
        props.designBase.front_design.file_extension
      )
      for (const m of props.styleBase.front_models || []) {
        const comp =
          (m.composition as 'multiply' | 'screen') === 'multiply'
            ? 'multiply'
            : 'screen'
        await addModelLayer(m.file_url, comp as GlobalCompositeOperation)
      }
    }

    // Overlay rectangle for logo placement preview
    if (props.overlayRect) {
      const { x, y, width, height, color } = props.overlayRect
      const rect = new Rect({
        left: x,
        top: y,
        width,
        height,
        fill: color || 'rgba(107,114,128,0.35)',
        stroke: 'rgba(107,114,128,0.6)',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top'
      })
      canvas.value.add(rect)
      rect.setCoords()
    }
    requestRender()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    initCanvas({ enableRetinaScaling: true, selection: false })
    setCanvasSize({ width: props.width, height: props.height })
    renderPreview()
  })

  watch(
    () => [
      props.product.id,
      props.styleBase.id,
      props.designBase.id,
      props.side,
      props.overlayRect &&
        props.overlayRect.x +
          '-' +
          props.overlayRect.y +
          '-' +
          props.overlayRect.width +
          '-' +
          props.overlayRect.height
    ],
    () => {
      renderPreview()
    }
  )

  onBeforeUnmount(() => {
    disposeCanvas()
  })
</script>

<template>
  <canvas
    ref="canvasEl"
    :width="width"
    :height="height"
    :class="['rounded-xl', props.class || '']"
    :style="{
      width: `${width / 16}rem`,
      height: `${height / 16}rem`
    }"
  />
</template>
