<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useUIStore } from '@/stores/ui/ui.store'

  const workflowStore = useWorkflowStore()
  const uiStore = useUIStore()
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

    // await fadeOut(150)

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

      // fadeIn()
      requestRender()
    })

    renderInFlight = false
    if (renderQueued) {
      renderQueued = false
      // schedule next frame to collapse bursts of updates
      queueMicrotask(() => void renderPreview())
    }
  }

  function updateCanvasSize() {
    const w = props.width || uiStore.containerWidth
    const h = props.height || uiStore.containerHeight

    // Don't set canvas size if dimensions are 0 - wait for proper dimensions
    if (w === 0 || h === 0) {
      return
    }

    setCanvasSize({ width: w, height: h })
  }

  function handleResize() {
    updateCanvasSize()
    renderPreview()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    initCanvas({
      selection: false,
      enableRetinaScaling: true,
      // moveCursor: 'grab',
      // defaultCursor: 'grab',
      enablePointerEvents: false
    })
    updateCanvasSize()
    window.addEventListener('resize', handleResize)
    renderPreview()
  })

  onBeforeUnmount(() => {
    disposeCanvas()
    window.removeEventListener('resize', handleResize)
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

  // Watch for container dimensions changes and update canvas when valid dimensions are available
  watch(
    () => [uiStore.containerWidth, uiStore.containerHeight],
    () => {
      updateCanvasSize()
    }
  )
</script>

<template>
  <div class="relative">
    <div class="inset-0 max-w-full max-h-full">
      <div class="w-full h-full grid place-items-end">
        <canvas
          ref="canvasEl"
          class="rounded-[32px] transition-opacity duration-300 z-10"
        />
      </div>
    </div>
  </div>
</template>
