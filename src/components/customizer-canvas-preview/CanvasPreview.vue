<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveDetails } from '@/composables/useEffectiveDetails'

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
    addModelLayer,
    addDesignLayer,
    fadeOut,
    fadeIn
  } = useFabricPreview()
  const { effectiveDesignDetails, effectiveStyleDetails, effectiveSvgGroups } =
    useEffectiveDetails({ autoFetch: true })

  async function renderPreview() {
    if (!canvas.value) return

    await fadeOut(150)

    clearCanvas()
    const side = workflowStore.activeCanvasSide
    const design = effectiveDesignDetails.value
    const style = effectiveStyleDetails.value
    if (!design || !style) return

    if (side === 'back' && design.back_design) {
      await addDesignLayer(
        design.back_design.file_url,
        design.back_design.file_extension
      )
      for (const m of (style as any).back_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp)
      }
    } else {
      await addDesignLayer(
        design.front_design.file_url,
        design.front_design.file_extension
      )
      for (const m of (style as any).front_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp)
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
    () => [
      workflowStore.activeCanvasSide,
      effectiveDesignDetails.value?.id,
      effectiveStyleDetails.value?.id,
      effectiveSvgGroups.value
    ],
    () => renderPreview()
  )

  watch(
    () => workflowStore.canvasZoom,
    z => {
      if (!canvas.value) return
      setZoom(z)
      requestRender()
    }
  )
</script>

<template>
  <div class="relative z-0">
    <div class="absolute inset-0 z-0 pointer-events-none max-w-full max-h-full">
      <div class="w-full h-full grid place-items-center">
        <canvas
          ref="canvasEl"
          class="rounded-[32px] transition-opacity duration-300"
        />
      </div>
    </div>
  </div>
</template>
