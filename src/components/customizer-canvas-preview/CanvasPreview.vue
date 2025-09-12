<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'

  const workflowStore = useWorkflowStore()
  const {
    canvasEl,
    canvas,
    initCanvas,
    setCanvasSize,
    disposeCanvas,
    clearCanvas,
    requestRender,
    setZoom,
    animateZoom,
    addModelLayer,
    addDesignLayer,
    fadeOut,
    fadeIn
  } = useFabricPreview()
  const {
    activeDesignDetails: effectiveDesignDetails,
    activeStyleDetails: effectiveStyleDetails,
    renderVersion
  } = useEffectiveSelectors()

  async function renderPreview() {
    if (!canvas.value) return

    await fadeOut(150)

    clearCanvas()
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
      for (const m of (style as any).back_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp, fitOptions)
      }
    } else {
      await addDesignLayer(
        design.front_design.file_url,
        design.front_design.file_extension,
        fitOptions
      )
      for (const m of (style as any).front_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp, fitOptions)
      }
    }

    setZoom(workflowStore.canvasZoom)

    fadeIn()
    requestRender()
  }

  function updateCanvasSize() {
    const w = window.innerWidth - 65 || 1200
    const h = window.innerHeight || 800
    setCanvasSize({ width: w, height: h })
  }

  function handleResize() {
    updateCanvasSize()
    renderPreview()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    initCanvas({ selection: false, enableRetinaScaling: true })
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
      animateZoom(z, { duration: 250, center: 'asset' })
      requestRender()
    }
  )
</script>

<template>
  <div class="relative">
    <div class="inset-0 max-w-full max-h-full">
      <div class="w-full h-full grid place-items-center">
        <canvas
          ref="canvasEl"
          class="rounded-[32px] transition-opacity duration-300 z-10"
        />
      </div>
    </div>
  </div>
</template>
