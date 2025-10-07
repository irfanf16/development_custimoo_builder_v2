<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useDebounceFn } from '@vueuse/core'

  const workflowStore = useWorkflowStore()
  const {
    canvasEl,
    canvas,
    initCanvas,
    setCanvasSize,
    disposeCanvas,
    clearCanvas,
    requestRender,
    withCanvasBatch,
    setZoom,
    animateZoom,
    addModelLayer,
    addDesignLayer,
    addLogoLayer
  } = useFabricPreview()
  const {
    activeDesignDetails: effectiveDesignDetails,
    activeStyleDetails: effectiveStyleDetails,
    renderVersion,
    effectiveLogos
  } = useEffectiveSelectors()

  const props = defineProps<{
    width: number
    height: number
  }>()

  // Prevent overlapping renders when colors change rapidly
  let renderInFlight = false
  let renderQueued = false

  async function renderPreview() {
    if (!canvas.value) return
    if (renderInFlight) {
      renderQueued = true
      return
    }
    renderInFlight = true

    // Batch canvas mutations to avoid flicker
    await withCanvasBatch(async () => {
      clearCanvas({ silent: true })
      const side = workflowStore.activeCanvasSide
      const design = effectiveDesignDetails.value
      const style = effectiveStyleDetails.value
      if (!design || !style) return

      const fitOptions = { scaleBy: 'height', heightPercent: 0.75 } as const

      if (side === 'back' && design.back_design) {
        await addDesignLayer(
          design.back_design.file_url,
          design.back_design.file_extension,
          fitOptions
        )
        for (const m of (
          style as {
            back_models?: Array<{ composition?: string; file_url: string }>
          }
        ).back_models || []) {
          const comp = (
            m.composition === 'multiply' ? 'multiply' : 'screen'
          ) as GlobalCompositeOperation
          await addModelLayer(m.file_url, comp, fitOptions)
        }
        for (const logo of effectiveLogos.value.filter(
          l => l.side === 'back'
        )) {
          await addLogoLayer(logo)
        }
      } else {
        await addDesignLayer(
          design.front_design.file_url,
          design.front_design.file_extension,
          fitOptions
        )
        for (const m of (
          style as {
            front_models?: Array<{ composition?: string; file_url: string }>
          }
        ).front_models || []) {
          const comp = (
            m.composition === 'multiply' ? 'multiply' : 'screen'
          ) as GlobalCompositeOperation
          await addModelLayer(m.file_url, comp, fitOptions)
        }
        for (const logo of effectiveLogos.value.filter(
          l => l.side === 'front'
        )) {
          await addLogoLayer(logo)
        }
      }

      setZoom(workflowStore.canvasZoom)

      requestRender()
    })

    renderInFlight = false
    if (renderQueued) {
      renderQueued = false
      // schedule next frame to collapse bursts of updates
      queueMicrotask(() => void renderPreview())
    }
  }

  function handleInitCanvas() {
    disposeCanvas()
    if (!canvasEl.value) return
    initCanvas({
      selection: false,
      enableRetinaScaling: true,
      enablePointerEvents: false,
      allowTouchScrolling: true
    })
    setCanvasSize({ width: props.width, height: props.height })
    renderPreview()
  }

  onMounted(() => {
    handleInitCanvas()
    window.addEventListener('resize', handleResizeDebounced)
  })

  onBeforeUnmount(() => {
    disposeCanvas()
    window.removeEventListener('resize', handleResizeDebounced)
  })

  watch(
    () => [workflowStore.activeCanvasSide, renderVersion.value],
    () => renderPreview()
  )

  watch(
    () => workflowStore.canvasZoom,
    z => {
      if (!canvas.value) return
      animateZoom(z, { duration: 150, center: 'asset' })
      requestRender()
    }
  )

  const handleResizeDebounced = useDebounceFn(() => {
    handleInitCanvas()
  }, 200)

  watch(
    () => [props.width, props.height],
    () => {
      //console.log('width or height changed', props.width, props.height)
      // handleResizeDebounced()
    }
  )
</script>

<template>
  <div class="relative">
    <canvas
      ref="canvasEl"
      class="rounded-[32px] transition-opacity duration-300 z-10"
    />
  </div>
</template>
