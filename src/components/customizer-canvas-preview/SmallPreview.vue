<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { Card, CardContent } from '../ui/card'
  import {
    useRenderQueue,
    usePreviousLogoState,
    filterLogosByOppositeSide,
    applyIncrementalLogoUpdates
  } from '@/composables'

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
    addModelLayer,
    addDesignLayer,
    addLogoLayer,
    removeLogoLayer,
    replaceLogoTexture,
    updateLogoLayerGeometry
  } = useFabricPreview()
  const {
    activeDesignDetails: effectiveDesignDetails,
    activeStyleDetails: effectiveStyleDetails,
    renderVersion,
    effectiveLogos,
    groupsVersion
  } = useEffectiveSelectors()

  // Use composables for render queue and logo state management
  const { queuedRender } = useRenderQueue()
  const { previousLogoState, reset: resetLogoState, setFromLogos } = usePreviousLogoState()

  async function renderPreview(full = false) {
    if (!canvas.value) return

    await queuedRender(
      async () => {
        await withCanvasBatch(async () => {
          const design = effectiveDesignDetails.value
          const style = effectiveStyleDetails.value
          const side = workflowStore.activeCanvasSide
          const logos = filterLogosByOppositeSide(effectiveLogos.value, side)

          if (!design || !style) return

          if (full) {
            clearCanvas({ silent: true })
            if (side === 'front' && design.back_design) {
              await addDesignLayer(design.back_design.file_url, design.back_design.file_extension)
              for (const m of (
                style as {
                  back_models?: Array<{ composition?: string; file_url: string }>
                }
              ).back_models || []) {
                const comp = (
                  m.composition === 'multiply' ? 'multiply' : 'screen'
                ) as GlobalCompositeOperation
                await addModelLayer(m.file_url, comp)
              }
            } else if (design.front_design) {
              await addDesignLayer(design.front_design.file_url, design.front_design.file_extension)
              for (const m of (
                style as {
                  front_models?: Array<{ composition?: string; file_url: string }>
                }
              ).front_models || []) {
                const comp = (
                  m.composition === 'multiply' ? 'multiply' : 'screen'
                ) as GlobalCompositeOperation
                await addModelLayer(m.file_url, comp)
              }
            }

            for (const logo of logos) {
              await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
            }

            setFromLogos(logos)
          } else {
            await applyIncrementalLogoUpdates({
              previousLogoState,
              logos,
              addLogoLayer,
              removeLogoLayer,
              replaceLogoTexture,
              updateLogoLayerGeometry
            })
          }

          requestRender()
        })
      },
      error => console.error('SmallPreview: render error', error)
    )
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
    void renderPreview(true)
  })

  onBeforeUnmount(() => {
    disposeCanvas()
  })

  const previousSide = ref(workflowStore.activeCanvasSide)
  const previousRenderVersion = ref(renderVersion.value)
  const previousGroupsVersion = ref(groupsVersion.value)

  watch(
    () => renderVersion.value,
    nextVersion => {
      if (nextVersion === previousRenderVersion.value) return
      previousRenderVersion.value = nextVersion
      resetLogoState()
      void renderPreview(true)
    }
  )

  watch(
    () => groupsVersion.value,
    nextVersion => {
      if (nextVersion === previousGroupsVersion.value) return
      previousGroupsVersion.value = nextVersion
      resetLogoState()
      void renderPreview(true)
    }
  )

  watch(
    () => workflowStore.activeCanvasSide,
    nextSide => {
      if (nextSide === previousSide.value) return
      previousSide.value = nextSide
      resetLogoState()
      void renderPreview(true)
    }
  )

  watch(
    () => effectiveLogos.value,
    () => {
      void renderPreview(false)
    },
    { deep: true }
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
