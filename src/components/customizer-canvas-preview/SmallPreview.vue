<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective'
  import { Card, CardContent } from '../ui/card'

  const workflowStore = useWorkflowStore()
  const {
    canvasEl,
    canvas,
    initCanvas,
    setCanvasSize,
    disposeCanvas,
    clearCanvas,
    requestRender,
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
    const design = effectiveDesignDetails.value
    const style = effectiveStyleDetails.value
    const side = (
      workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'
    ) as 'front' | 'back'
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
    } else if (design.front_design) {
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

    fadeIn()
    requestRender()
  }

  function handleClick() {
    workflowStore.toggleActiveCanvasSide()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    initCanvas({
      selection: false,
      enableRetinaScaling: true,
      hoverCursor: 'pointer'
    })
    setCanvasSize({ width: 132, height: 132 })
    renderPreview()
  })

  onBeforeUnmount(() => {
    disposeCanvas()
  })

  watch(
    () => [workflowStore.activeCanvasSide, renderVersion.value],
    () => renderPreview()
  )
</script>

<template>
  <Card class="w-fit h-fit p-0 cursor-pointer" @click="handleClick">
    <CardContent class="p-3">
      <canvas
        ref="canvasEl"
        class="w-[8.25rem] h-[8.25rem] rounded-lg transition-opacity duration-300 cursor-pointer"
      />
    </CardContent>
  </Card>
</template>
