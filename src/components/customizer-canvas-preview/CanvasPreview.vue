<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useDebounceFn } from '@vueuse/core'
  import {
    useRenderQueue,
    usePreviousLogoState,
    usePreviousTextState,
    parseRenderVersion,
    filterLogosBySide,
    applyIncrementalLogoUpdates,
    applyIncrementalTextUpdates
  } from '@/composables'
  import { useCustomizationStore } from '@/stores/customization/customization.store'

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
    addLogoLayer,
    removeLogoLayer,
    replaceLogoTexture,
    updateLogoLayerGeometry,
    addTextLayer,
    removeTextLayer,
    replaceTextContent,
    updateTextLayerGeometry
  } = useFabricPreview()
  const customizationStore = useCustomizationStore()
  const {
    activeDesignDetails: effectiveDesignDetails,
    activeStyleDetails: effectiveStyleDetails,
    renderVersion,
    effectiveLogos,
    groupsVersion
  } = useEffectiveSelectors()

  const props = defineProps<{
    width: number
    height: number
  }>()

  // Use composables for render queue and logo/text state management
  const { queuedRender } = useRenderQueue()
  const { previousLogoState, reset: resetLogoState, setFromLogos } = usePreviousLogoState()
  const { previousTextState, reset: resetTextState, setFromTexts } = usePreviousTextState()
  const previousSide = ref(workflowStore.activeCanvasSide)
  const previousRenderParts = ref(parseRenderVersion(renderVersion.value))
  const previousGroupsVersion = ref(groupsVersion.value)

  async function renderPreview(full = false) {
    if (!canvas.value) return

    await queuedRender(
      async () => {
        await withCanvasBatch(async () => {
          const side = workflowStore.activeCanvasSide
          const design = effectiveDesignDetails.value
          const style = effectiveStyleDetails.value
          if (!design || !style) return

          if (full) {
            clearCanvas({ silent: true })
            const fitOptions = {
              scaleBy: 'auto' as const,
              widthPercent: 0.95,
              heightPercent: 0.95
            }

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
            }

            const logos = filterLogosBySide(effectiveLogos.value, side)
            for (const logo of logos) {
              await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
            }

            setFromLogos(logos)

            // Add text layers
            const texts = customizationStore.activeProductTexts
            const sideStr = side === 'front' ? 'Front' : 'Back'
            for (const entry of texts) {
              if (!entry.items || entry.items.length === 0) continue
              for (let i = 0; i < entry.items.length; i++) {
                const item = entry.items[i]
                if (!item) continue
                if (item.placement === sideStr) {
                  await addTextLayer(entry, item, i).catch(err =>
                    console.warn('Failed to add text layer:', err)
                  )
                }
              }
            }
            setFromTexts(texts, side)
          } else {
            const allRelevantLogos = filterLogosBySide(effectiveLogos.value, side)

            await applyIncrementalLogoUpdates({
              previousLogoState,
              logos: allRelevantLogos,
              addLogoLayer,
              removeLogoLayer,
              replaceLogoTexture,
              updateLogoLayerGeometry
            })

            // Apply incremental text updates
            const texts = customizationStore.activeProductTexts
            await applyIncrementalTextUpdates({
              previousTextState,
              texts,
              side,
              addTextLayer,
              removeTextLayer,
              replaceTextContent,
              updateTextLayerGeometry
            })
          }

          setZoom(workflowStore.canvasZoom)
          requestRender()
        })
      },
      error => console.error('CanvasPreview: render error', error)
    )
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
    const smallerDimension = Math.min(props.width, props.height)
    setCanvasSize({ width: smallerDimension, height: smallerDimension })
    resetLogoState()
    resetTextState()
    void renderPreview(true)
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
    () => workflowStore.activeCanvasSide,
    nextSide => {
      if (nextSide === previousSide.value) return
      previousSide.value = nextSide
      resetLogoState()
      resetTextState()
      void renderPreview(true)
    }
  )

  watch(
    () => renderVersion.value,
    nextVersion => {
      const parts = parseRenderVersion(nextVersion)
      const prev = previousRenderParts.value
      previousRenderParts.value = parts

      const designChanged = parts.id !== prev.id
      const logosChanged =
        parts.logosMeta !== prev.logosMeta || parts.logosGeometry !== prev.logosGeometry

      if (designChanged) {
        resetLogoState()
        resetTextState()
        void renderPreview(true)
      } else if (logosChanged) {
        void renderPreview(false)
      }
    }
  )

  watch(
    () => groupsVersion.value,
    nextVersion => {
      if (nextVersion === previousGroupsVersion.value) return
      previousGroupsVersion.value = nextVersion
      resetLogoState()
      resetTextState()
      void renderPreview(true)
    }
  )

  watch(
    () => workflowStore.canvasZoom,
    z => {
      if (!canvas.value) return
      animateZoom(z, { duration: 150, center: 'asset' })
      requestRender()
    }
  )

  watch(
    () => effectiveLogos.value,
    () => {
      void renderPreview(false)
    },
    { deep: true }
  )

  watch(
    () => customizationStore.activeProductTexts,
    () => {
      void renderPreview(false)
    },
    { deep: true }
  )

  const handleResizeDebounced = useDebounceFn(() => {
    handleInitCanvas()
  }, 200)

  watch(
    () => [props.width, props.height],
    () => {
      // handleResizeDebounced()
    }
  )
</script>

<template>
  <div class="flex items-center justify-center">
    <canvas ref="canvasEl" class="rounded-[32px] transition-opacity duration-300 z-10" />
  </div>
</template>
