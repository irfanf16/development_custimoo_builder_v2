<script setup lang="ts">
  import {
    onMounted,
    onBeforeUnmount,
    computed,
    ref,
    watch,
    nextTick,
    getCurrentInstance,
    type Ref,
    type ComponentPublicInstance
  } from 'vue'
  import { FabricImage, Canvas, type FabricObject } from 'fabric'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import { filterFields } from '@/lib/utils'
  import { toRef } from 'vue'
  import {
    useSceneCommon,
    useSvgGroups,
    useColorCustomization,
    useColorGrouping
  } from '@/composables/scene'
  import {
    getImageFrom2DCanvas,
    type GetImageFromCanvasOptions
  } from '@/composables/scene/useCanvasImage'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()
  const sceneStore = useSceneStore()

  // Canvas refs
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const designObject = ref<FabricObject | FabricImage | null>(null)
  const modelObjects = ref<(FabricObject | FabricImage)[]>([])

  // Model type based on style preview structure
  type ModelData = {
    composition: 'multiply' | 'screen'
    file_url: string
    thumb_sm_url: string
  }

  type DesignData = {
    file_url: string
    file_extension: string
  }

  interface Props {
    models?: ModelData[]
    design?: DesignData
    // Product ID - defaults to active product from store
    productId?: number | null
    // Canvas dimensions
    canvasWidth?: number
    canvasHeight?: number
    mainCanvasWidth?: number
    mainCanvasHeight?: number
    mainPreview?: boolean
    // Canvas side
    side?: CanvasSide
    // Canvas class
    canvasClass?: string
    // SVG parts array for color permutation (can be string JSON or array)
    svgParts?: string[] | string
    // Color grouping - can be string (JSON) or object
    colorGrouping?: Record<string, string[]> | string | null
  }

  const props = withDefaults(defineProps<Props>(), {
    models: undefined,
    design: undefined,
    // Product ID - will default to active product from store via computed
    productId: undefined,
    // Canvas dimensions
    canvasWidth: 600,
    canvasHeight: 600,
    mainCanvasWidth: 600,
    mainCanvasHeight: 600,
    mainPreview: false,
    // Canvas side
    side: 'front',
    // Canvas class
    canvasClass: 'rounded-[32px] transition-opacity duration-300 z-10',
    // SVG parts - defaults to undefined (will be initialized from svgGroups if not provided)
    svgParts: undefined,
    // Color grouping - defaults to undefined (will be extracted from design if not provided)
    colorGrouping: undefined
  })

  // get current instance at mounted
  const instance = getCurrentInstance()

  // ===== SHARED COMPOSABLE =====
  const {
    canvas,
    design: _sharedDesign,
    effectiveProductId,
    effectiveDesign,
    productsStore,
    initCanvas,
    addDesign,
    loadImageFromURL: loadImageFromURLCommon,
    disposeCanvas
  } = useSceneCommon(toRef(props, 'productId'), toRef(props, 'side'), toRef(props, 'design'))

  // ===== SVG GROUPS COMPOSABLE =====
  const svgGroupsComposable = useSvgGroups(
    effectiveProductId,
    props.side,
    props.mainPreview,
    toRef(props, 'svgParts')
  )
  const { svgGroups, initialSvgGroups, parts } = svgGroupsComposable

  // ===== COLOR GROUPING =====
  const colorGrouping = useColorGrouping(toRef(props, 'colorGrouping'))

  // ===== COLOR CUSTOMIZATION COMPOSABLE =====
  const colorCustomization = useColorCustomization(
    canvas as Ref<Canvas | null>,
    designObject as Ref<FabricObject | null>,
    svgGroups,
    initialSvgGroups,
    parts,
    effectiveProductId,
    productsStore,
    props.mainPreview,
    props.side,
    colorGrouping as Ref<Record<string, string[]> | null>
  )

  // Extract customization functions from composable
  const { applyCustomization, changeDefaultColors, changeGroupColors, resetToInitialColors } =
    colorCustomization

  // Computed properties that react to store changes
  // Use prop if provided, otherwise fall back to store value
  const effectiveModels = computed<ModelData[]>(() => {
    if (props.models) {
      // Filter props.models to only include ModelData fields
      const filtered = filterFields(props.models, ['composition', 'file_url', 'thumb_sm_url'])
      if (Array.isArray(filtered)) {
        return filtered
      }
    }

    const styleDetails = productsStore.activeStyleDetails
    if (!styleDetails) return []

    const side = props.side
    const storeModels =
      side === 'back' && styleDetails.back_models
        ? styleDetails.back_models
        : styleDetails.front_models || []

    // Map to only include ModelData properties, excluding any extra attributes
    const filtered = filterFields(storeModels, ['composition', 'file_url', 'thumb_sm_url'])
    return Array.isArray(filtered) ? filtered : []
  })

  // Watch for changes in effectiveDesign and reload design
  watch(
    effectiveDesign,
    async (newDesign, oldDesign) => {
      if (!canvas.value) return

      // Only reload if design actually changed
      if (newDesign && (!oldDesign || newDesign.file_url !== oldDesign.file_url)) {
        await addDesign(newDesign, {
          scaleMode: 'fit',
          canvasWidth: props.canvasWidth,
          canvasHeight: props.canvasHeight,
          padding: 10,
          centerInViewport: true,
          svgGroupsComposable,
          designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
          colorCustomization,
          mainPreview: props.mainPreview
        })

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
  )

  // Watch for changes in effectiveModels and reload models
  watch(
    effectiveModels,
    async (newModels, oldModels) => {
      if (!canvas.value) return

      // Check if models actually changed by comparing file URLs
      const newModelUrls = newModels
        .map(m => m.file_url || m.thumb_sm_url)
        .sort()
        .join(',')
      const oldModelUrls =
        oldModels
          ?.map(m => m.file_url || m.thumb_sm_url)
          .sort()
          .join(',') || ''

      if (newModelUrls !== oldModelUrls) {
        // Remove all existing models
        removeModels()

        // Add new models
        if (newModels.length > 0) {
          await Promise.all(newModels.map(model => addModel(model)))
          bringModelToFront()
        }

        canvas.value.requestRenderAll()
      }
    },
    { immediate: false }
  )

  onMounted(async () => {
    // Parts are now initialized in useSvgGroups composable from props
    // If not provided as props, they will be set from active design (svgGroups) after extraction

    // Wait for next tick to ensure canvas element is available
    await nextTick()

    if (!canvasEl.value) {
      console.warn('Canvas element not available')
      return
    }

    initCanvas(canvasEl.value, props.canvasWidth, props.canvasHeight)

    // Ensure canvas is initialized before loading scene
    if (canvas.value) {
      loadScene()
    }
  })

  onBeforeUnmount(() => {
    disposeCanvas()
  })

  /**
   * Remove all model objects from canvas
   */
  function removeModels(): void {
    if (!canvas.value || !modelObjects.value.length) return

    const c = canvas.value
    modelObjects.value.forEach(model => {
      const modelObj = model as unknown as FabricObject
      c.remove(modelObj)
    })
    modelObjects.value = []
  }

  /**
   * Add model image to the canvas
   */
  async function addModel(modelData: ModelData): Promise<void> {
    if (!canvas.value || !modelData) return

    // Use file_url for main preview, thumb_sm_url for thumbnails
    const modelUrl = modelData.file_url || modelData.thumb_sm_url

    // Load image with default options, override with composition mode
    const img = (await loadImageFromURLCommon(modelUrl + '?nocache=2', '', {
      globalCompositeOperation: modelData.composition || 'multiply'
      // Options already set by default, but we can add additional ones here if needed
    })) as FabricImage

    // Check canvas again after async operation (it might have been disposed)
    if (!canvas.value) return

    // Scale to fit canvas with padding
    const padding = 10
    if (img.width && img.height) {
      if (img.width > img.height) {
        img.scaleToWidth(props.canvasWidth - padding)
      } else {
        img.scaleToHeight(props.canvasHeight - padding)
      }
    }

    img.setCoords()

    // Add to canvas
    canvas.value.add(img as FabricObject)
    canvas.value.viewportCenterObject(img as FabricObject)
    modelObjects.value.push(img as FabricObject)
  }

  function bringModelToFront(): void {
    if (!canvas.value || !modelObjects.value.length) return

    modelObjects.value.forEach(model => {
      canvas.value?.bringObjectToFront(model as FabricObject)
    })
  }

  /**
   * Load the complete scene with design and models
   */
  async function loadScene(): Promise<void> {
    if (!canvas.value) return

    const promises: Promise<void>[] = []

    // Load design
    if (effectiveDesign.value) {
      await addDesign(effectiveDesign.value, {
        scaleMode: 'fit',
        canvasWidth: props.canvasWidth,
        canvasHeight: props.canvasHeight,
        padding: 10,
        centerInViewport: true,
        svgGroupsComposable,
        designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
        colorCustomization,
        mainPreview: props.mainPreview
      })
    }

    // Load models
    if (effectiveModels.value.length > 0) {
      effectiveModels.value.forEach(model => {
        promises.push(addModel(model))
      })
    }

    await Promise.all(promises)

    // Ensure models are on top of design
    bringModelToFront()

    canvas.value.requestRenderAll()
  }

  // All customization functions are now provided by useColorCustomization composable
  // Functions removed: getGroupColorBySvgGroup, getSvgGroupColors, getDefaultColorBySvgGroup,
  // findClosestColorIndex, changeDefaultColors, changeGroupColors, resetToInitialColors, applyCustomization

  /**
   * Get image from canvas
   * TwoDScene only handles single side, so no side parameter needed
   * Adapted from old Helpers.ts getImageFromCanvas function
   */
  function getImageFromCanvas(options: GetImageFromCanvasOptions = {}): string {
    if (!canvas.value) return ''
    // Type assertion needed because canvas.value is typed as Canvas but may have additional properties
    return getImageFrom2DCanvas(canvas.value as unknown as Canvas, options)
  }

  // Store component reference in global store if mainPreview
  function updateSceneRef() {
    if (!props.mainPreview || !props.side) return
    const componentInstance = instance?.proxy as ComponentPublicInstance | null
    if (componentInstance) {
      sceneStore.setTwoDSceneRef({ getImageFromCanvas }, props.side as 'front' | 'back')
    }
  }

  onMounted(() => {
    if (props.mainPreview && props.side) {
      // Get component instance from template ref
      nextTick(() => {
        updateSceneRef()
      })
    }
  })

  // Watch for side prop changes and update reference
  watch(
    () => props.side,
    (newSide, oldSide) => {
      if (!props.mainPreview) return

      // Clear old reference if side changed
      if (oldSide && oldSide !== newSide) {
        sceneStore.setTwoDSceneRef(null, oldSide as 'front' | 'back')
      }

      // Set new reference
      if (newSide) {
        nextTick(() => {
          updateSceneRef()
        })
      }
    }
  )

  onBeforeUnmount(() => {
    // Clear reference when component unmounts
    if (props.mainPreview && props.side) {
      sceneStore.setTwoDSceneRef(null, props.side as 'front' | 'back')
    }
  })

  // Expose function for external use
  defineExpose({
    getImageFromCanvas
  })

  // Watch for changes in default colors from customization store
  watch(
    () => customizationStore.customization?.default_colors,
    () => {
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          changeDefaultColors(0)
        }
      } else if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        if (applyCustomizationOverrides.value || props.mainPreview) {
          resetToInitialColors(0)
        }
      }
    },
    { deep: true }
  )

  // Watch for changes in shuffle_color_number
  // When it changes, reapply default colors with new permutation
  watch(
    () => customizationStore.customization?.shuffle_color_number,
    async () => {
      const defaultColors = customizationStore.customization?.default_colors || []
      const hasDefaultColors =
        defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
      // Only apply if there are default colors set
      if (hasDefaultColors) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          await changeDefaultColors(0)
        }
      }
    }
  )

  // Watch for changes in group colors from customization store
  watch(
    () => customizationStore.customization?.group_colors,
    () => {
      // Only apply if there are group colors set
      if (Object.keys(customizationStore.customization?.group_colors || {}).length > 0) {
        // If applyCustomizationOverrides is enabled, apply to all canvases
        // Otherwise, only apply to mainPreview
        if (applyCustomizationOverrides.value || props.mainPreview) {
          changeGroupColors(0)
        }
      } else {
        const defaultColors = customizationStore.customization?.default_colors || []
        const hasDefaultColors =
          defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
        if (!hasDefaultColors) {
          // If group colors are undefined, reset to initial colors
          if (applyCustomizationOverrides.value || props.mainPreview) {
            resetToInitialColors(0)
          }
        }
      }
    },
    { deep: true }
  )

  // Watch for changes in applyCustomizationOverrides checkbox
  // When enabled, apply customization to all canvases
  watch(
    () => applyCustomizationOverrides.value,
    async () => {
      // If not mainPreview and applyCustomizationOverrides is set to disabled, reset to initial colors
      if (!applyCustomizationOverrides.value && !props.mainPreview) {
        await resetToInitialColors(0)
      } else {
        if (!props.mainPreview) {
          // only apply to other canvases as main canvas is already applied
          const defaultColors = customizationStore.customization?.default_colors || []
          const hasDefaultColors =
            defaultColors.filter((color: { color?: string | null }) => color.color).length > 0
          const groupColors = customizationStore.customization?.group_colors || {}
          const hasGroupColors = Object.keys(groupColors).length > 0

          // Only apply if there are customizations set
          if (hasDefaultColors || hasGroupColors) {
            await applyCustomization(0)
          }
        }
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="relative">
    <canvas
      ref="canvasEl"
      class="!w-full !aspect-square !h-auto"
      :class="canvasClass"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ maxHeight: `${canvasHeight}px !important` }"
    />
  </div>
</template>
