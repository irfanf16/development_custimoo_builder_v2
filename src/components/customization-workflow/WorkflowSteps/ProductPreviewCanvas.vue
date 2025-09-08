<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, ref, type PropType } from 'vue'
  import { Rect } from 'fabric'
  import type {
    OutputProductPreview,
    OutputStylePreview,
    OutputDesignPreview
  } from '@/services/products/types'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective'

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

  const { renderVersion } = useEffectiveSelectors()

  const containerEl = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  const isRendering = ref(false)
  let io: IntersectionObserver | null = null

  async function renderPreview() {
    if (!canvas.value) return
    isRendering.value = true
    clearCanvas()

    // if (props.side === 'back' && props.designBase.back_design) {
    //   const back = props.designBase.back_design
    //   await addDesignLayer(back.file_url, back.file_extension)
    //   const backModels = props.styleBase.back_models || []
    //   for (const m of backModels) {
    //     const comp =
    //       (m.composition as 'multiply' | 'screen') === 'multiply'
    //         ? 'multiply'
    //         : 'screen'
    //     await addModelLayer(m.file_url, comp as GlobalCompositeOperation)
    //   }
    // } else {
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
    //}

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
    isRendering.value = false
  }

  function ensureInitializedAndRender() {
    if (!isVisible.value) return
    if (!canvas.value && canvasEl.value) {
      initCanvas({
        enableRetinaScaling: true,
        selection: false,
        hoverCursor: 'pointer',
        defaultCursor: 'pointer'
      })
      setCanvasSize({ width: props.width, height: props.height })
    }
    if (canvas.value) renderPreview()
  }

  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      'IntersectionObserver' in window &&
      containerEl.value
    ) {
      io = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          const nowVisible = !!entry?.isIntersecting
          isVisible.value = nowVisible
          if (nowVisible) {
            ensureInitializedAndRender()
          }
        },
        { root: null, rootMargin: '100px 0px', threshold: 0.01 }
      )
      io.observe(containerEl.value)
    } else {
      // Fallback: assume visible and render immediately
      isVisible.value = true
      ensureInitializedAndRender()
    }
  })

  // Watch own props and global render version for effective design/style changes
  watch(
    [
      () => props.product?.id,
      () => props.styleBase?.id,
      () => props.designBase?.id,
      () => props.side,
      () =>
        props.overlayRect &&
        `${props.overlayRect.x}-${props.overlayRect.y}-${props.overlayRect.width}-${props.overlayRect.height}`,
      () => renderVersion.value
    ],
    () => {
      if (isVisible.value && canvas.value) {
        renderPreview()
      }
    }
  )

  watch([() => props.width, () => props.height], ([w, h]) => {
    if (canvas.value) setCanvasSize({ width: w, height: h })
    if (isVisible.value && canvas.value) renderPreview()
  })

  onBeforeUnmount(() => {
    if (io && containerEl.value) io.unobserve(containerEl.value)
    if (io) io.disconnect()
    disposeCanvas()
  })
</script>

<template>
  <div
    ref="containerEl"
    :class="['relative rounded-xl', props.class || '']"
    :style="{ width: `${width / 16}rem`, height: `${height / 16}rem` }"
  >
    <canvas
      ref="canvasEl"
      v-show="isVisible"
      :width="width"
      :height="height"
      class="rounded-xl"
      style="width: 100%; height: 100%"
    />

    <div
      v-if="!isVisible || isRendering"
      class="absolute inset-0 rounded-xl animate-pulse bg-secondary/30"
    />
  </div>
</template>
