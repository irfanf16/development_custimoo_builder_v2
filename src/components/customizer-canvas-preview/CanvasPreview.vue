<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useDebounceFn } from '@vueuse/core'
  import type { CustomLogo } from '@/services/logos/types'

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
    updateLogoLayerGeometry
  } = useFabricPreview()
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

  // Prevent overlapping renders when colors change rapidly
  let renderInFlight = false
  let renderQueued = false

  const previousLogoState = ref(new Map<string, CustomLogo>())
  const previousSide = ref(workflowStore.activeCanvasSide)

  function parseRenderVersion(version: string) {
    const [id = '', logosMeta = '', logosGeometry = '', groups = ''] = version.split('|')
    return {
      id,
      logosMeta,
      logosGeometry,
      groups
    }
  }

  const previousRenderParts = ref(parseRenderVersion(renderVersion.value))
  const previousGroupsVersion = ref(groupsVersion.value)

  function getLogoDiffs(next: CustomLogo[]) {
    const added: CustomLogo[] = []
    const updated: CustomLogo[] = []
    const removed: string[] = []

    const previous = previousLogoState.value
    const nextMap = new Map<string, CustomLogo>()

    for (const logo of next) {
      nextMap.set(String(logo.id), logo)
      const prev = previous.get(String(logo.id))
      if (!prev) {
        added.push(logo)
        continue
      }
      if (
        prev.url !== logo.url ||
        prev.rotation !== logo.rotation ||
        prev.width !== logo.width ||
        prev.height !== logo.height ||
        prev.x_axis !== logo.x_axis ||
        prev.y_axis !== logo.y_axis ||
        prev.scaleX !== logo.scaleX ||
        prev.scaleY !== logo.scaleY ||
        prev.side !== logo.side ||
        prev.name_of_placement !== logo.name_of_placement
      ) {
        updated.push(logo)
      }
    }

    for (const [id] of previous) {
      if (!nextMap.has(id)) {
        removed.push(id)
      }
    }

    previousLogoState.value = nextMap
    return { added, updated, removed }
  }

  function getLogosForSide(side: 'front' | 'back', logos: CustomLogo[]) {
    return logos.filter(logo => logo.side === side)
  }

  async function renderPreview(full = false) {
    if (!canvas.value) return
    if (renderInFlight) {
      renderQueued = true
      return
    }
    renderInFlight = true

    try {
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

          const logos = getLogosForSide(side, effectiveLogos.value)
          for (const logo of logos) {
            await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
          }

          previousLogoState.value = new Map(logos.map(logo => [String(logo.id), logo]))
        } else {
          const allRelevantLogos = getLogosForSide(side, effectiveLogos.value)
          const { added, updated, removed } = getLogoDiffs(allRelevantLogos)

          for (const id of removed) {
            removeLogoLayer(id)
          }

          for (const logo of added) {
            await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
          }

          for (const logo of updated) {
            const prev = previousLogoState.value.get(String(logo.id))
            if (prev && prev.url !== logo.url) {
              await replaceLogoTexture(String(logo.id), logo.url)
            }
            updateLogoLayerGeometry(logo)
          }
        }

        setZoom(workflowStore.canvasZoom)
        requestRender()
      })
    } catch (error) {
      console.error('CanvasPreview: render error', error)
    } finally {
      renderInFlight = false
      if (renderQueued) {
        renderQueued = false
        queueMicrotask(() => void renderPreview())
      }
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
    previousLogoState.value = new Map()
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
      previousLogoState.value = new Map()
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
        previousLogoState.value = new Map()
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
      previousLogoState.value = new Map()
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
  <div class="relative">
    <canvas ref="canvasEl" class="rounded-[32px] transition-opacity duration-300 z-10" />
  </div>
</template>
