<script setup lang="ts">
  import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useFabricPreview } from '@/composables/useFabricPreview'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { Card, CardContent } from '../ui/card'
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

  // Prevent overlapping renders in the small preview as well
  let renderInFlight = false
  let renderQueued = false

  const previousLogoState = ref(new Map<string, CustomLogo>())

  function getLogoDiffs(next: CustomLogo[]) {
    const added: CustomLogo[] = []
    const updated: CustomLogo[] = []
    const removed: string[] = []

    const previous = previousLogoState.value
    const nextMap = new Map<string, CustomLogo>()

    for (const logo of next) {
      const key = String(logo.id)
      nextMap.set(key, logo)
      const prev = previous.get(key)
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

  function getOppositeSideLogos(side: 'front' | 'back') {
    const target = side === 'front' ? 'back' : 'front'
    return effectiveLogos.value.filter(logo => logo.side === target)
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
        const design = effectiveDesignDetails.value
        const style = effectiveStyleDetails.value
        const side = workflowStore.activeCanvasSide
        const logos = getOppositeSideLogos(side)

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

          previousLogoState.value = new Map(logos.map(logo => [String(logo.id), logo]))
        } else {
          const { added, updated, removed } = getLogoDiffs(logos)

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

        requestRender()
      })
    } catch (error) {
      console.error('SmallPreview: render error', error)
    } finally {
      renderInFlight = false
      if (renderQueued) {
        renderQueued = false
        queueMicrotask(() => void renderPreview())
      }
    }
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
      previousLogoState.value = new Map()
      void renderPreview(true)
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
    () => workflowStore.activeCanvasSide,
    nextSide => {
      if (nextSide === previousSide.value) return
      previousSide.value = nextSide
      previousLogoState.value = new Map()
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
