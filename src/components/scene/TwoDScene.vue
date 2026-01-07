<script setup lang="ts">
  import {
    onMounted,
    onBeforeUnmount,
    computed,
    watch,
    nextTick,
    getCurrentInstance,
    type Ref,
    type ComponentPublicInstance,
    shallowRef
  } from 'vue'
  import { FabricImage, Canvas, Group, type FabricObject } from 'fabric'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import { filterFields } from '@/lib/utils'
  import { toRef } from 'vue'
  import {
    useSceneCommon,
    useSvgGroups,
    useColorCustomization,
    useColorGrouping,
    addLogoToCanvas,
    setupFabricControls,
    deleteLogoFromCanvas,
    syncLogosOnCanvas,
    getLogoSignature,
    getLogoSignatureUrlSide
  } from '@/composables/scene'
  import type { CustomLogo } from '@/services/logos/types'
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
  const canvasEl = shallowRef<HTMLCanvasElement | null>(null)
  const designObject = shallowRef<FabricObject | FabricImage | null>(null)
  const modelObjects = shallowRef<(FabricObject | FabricImage)[]>([])
  const customLogoObjects = shallowRef<Map<number, FabricImage>>(new Map())
  const safeZone = shallowRef<Group | null>(null)
  const boundary = shallowRef<Group | null>(null)

  // Model type based on style preview structure
  type ModelData = {
    composition: 'multiply' | 'screen'
    file_url: string
    thumb_sm_url: string
  }

  type DesignData = {
    file_url: string
    file_extension: string
    safe_zone_url?: string
    boundary_url?: string
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

  // ===== CUSTOM LOGOS =====
  // Get custom_logos from customization store by product_id
  const customLogos = computed<CustomLogo[]>(() => {
    const productId = effectiveProductId.value
    if (!productId || !customizationStore.customization) return []
    const key = String(productId)
    const all = customizationStore.customization.custom_logos?.[key] || []
    // Filter by current side (front/back)
    const currentSideLogos = all.filter((logo: CustomLogo) => logo.side === props.side)
    return currentSideLogos
      ? (filterFields(currentSideLogos, [
          'url',
          'side',
          'x_axis',
          'y_axis',
          'height',
          'rotation',
          'scaleX',
          'scaleY'
        ]) as CustomLogo[])
      : []
  })

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

        await addBoundary(newDesign.safe_zone_url, newDesign.boundary_url)

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

    // Setup custom Fabric controls with icons (scale/rotate/delete)
    setupFabricControls({
      onRemoveLogo: (logoIndex: number, canvasInstance: Canvas) => {
        deleteLogoFromCanvas(logoIndex, canvasInstance, customLogoObjects)
      }
      // Text removal can be added here if needed
    })

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

    if (effectiveDesign.value?.safe_zone_url || effectiveDesign.value?.boundary_url) {
      await addBoundary(effectiveDesign.value?.safe_zone_url, effectiveDesign.value?.boundary_url)
    }

    canvas.value.requestRenderAll()

    // Load logos after scene is loaded
    await resetAndAddLogos()
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

  // ===== LOGO UTILITIES =====
  function calculatePosition2D(logoData: CustomLogo): { x: number; y: number } {
    return {
      x: (props.canvasWidth / (props.mainCanvasWidth || 600)) * logoData.x_axis,
      y: (props.canvasHeight / (props.mainCanvasHeight || 600)) * logoData.y_axis
    }
  }

  function calculateRotation2D(rotation: number): number {
    if (rotation < 0) {
      return 360 - rotation
    }
    return rotation
  }

  function calculateScaleRatios2D() {
    return {
      widthRatio: props.canvasWidth / (props.mainCanvasWidth || 600),
      heightRatio: props.canvasHeight / (props.mainCanvasHeight || 600)
    }
  }

  async function cloneFabricObject(obj: FabricObject): Promise<FabricObject> {
    // Fabric 6 clone: clone(propertiesToInclude?) returns object; clone(cb, props?) also supported
    const anyObj = obj as unknown as { clone: (...args: unknown[]) => unknown }
    try {
      const direct = anyObj.clone()
      if (direct) return direct as FabricObject
    } catch {
      // fallback to callback form below
    }
    return await new Promise(resolve => {
      anyObj.clone((cloned: FabricObject) => resolve(cloned))
    })
  }

  async function findClippedParts(
    logoOrText: FabricImage,
    boundaries: FabricObject[],
    canvasInstance: Canvas,
    checkPointX: number,
    checkPointY: number,
    maxCall = 60
  ): Promise<FabricObject[]> {
    const applyBoundary: FabricObject[] = []
    let foundExcluded = false
    const objects = boundaries ?? []

    for (const boundary of objects) {
      // fabric.Canvas#isTargetTransparent exists on Canvas
      const isTransparent = canvasInstance.isTargetTransparent(
        boundary as unknown as FabricObject,
        checkPointX,
        checkPointY
      )
      if (foundExcluded || isTransparent) {
        applyBoundary.push(await cloneFabricObject(boundary))
      } else {
        const id = (boundary as unknown as { id?: string }).id || ''
        const boundaryId = id.includes('_') ? id.substring(0, id.indexOf('_')) : id
        ;(logoOrText as unknown as { excluded_clip_id?: string }).excluded_clip_id = boundaryId
        foundExcluded = true
      }
    }

    if (!foundExcluded && maxCall) {
      // ensure at least one excluded piece; shift point and retry
      const nextX = checkPointX < props.canvasWidth / 2 ? checkPointX + 1 : checkPointX - 1
      return await findClippedParts(
        logoOrText,
        boundaries,
        canvasInstance,
        nextX,
        checkPointY,
        maxCall - 1
      )
    }

    return applyBoundary
  }

  async function buildClipGroup(target: FabricImage): Promise<Group | null> {
    if (!canvas.value) return null

    // start with safe zone objects
    const safeObjects = (safeZone.value?._objects as FabricObject[] | undefined) ?? []
    const parts: FabricObject[] = []
    for (const o of safeObjects) {
      parts.push(await cloneFabricObject(o))
    }

    // handle boundaries with exclusion logic
    const boundaryObjects = (boundary.value?._objects as FabricObject[] | undefined) ?? []
    if (boundaryObjects.length) {
      const checkPointX = target.left ?? 0
      const checkPointY = target.top ?? 0
      const clippedParts = await findClippedParts(
        target,
        boundaryObjects,
        canvas.value,
        checkPointX,
        checkPointY
      )
      parts.push(...clippedParts)
    }

    if (!parts.length) return null

    const clip = new Group(parts, {
      hasControls: false,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      lockMovementX: true,
      lockMovementY: true,
      absolutePositioned: true,
      inverted: true,
      scaleX: designObject.value?.scaleX ?? 1,
      scaleY: designObject.value?.scaleY ?? 1,
      left: props.canvasWidth / 2,
      top: props.canvasHeight / 2
    })

    canvas.value.viewportCenterObject(clip)
    return clip
  }

  async function applyClipPath(target: FabricImage): Promise<void> {
    if (!canvas.value) return
    const clip = await buildClipGroup(target)
    if (clip) {
      // @ts-expect-error clipPath accepts any fabric object; Group works at runtime
      target.clipPath = clip
    }
  }

  async function loadClipGroup(url: string, target: 'safe' | 'boundary'): Promise<Group | null> {
    if (!url) return null
    const clip = (await loadImageFromURLCommon(url, 'svg', {
      hasControls: false,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      lockMovementX: true,
      lockMovementY: true,
      absolutePositioned: true,
      inverted: true
    })) as Group

    // Scale to canvas and center
    clip.scaleToHeight(props.canvasHeight)
    clip.set({
      left: props.canvasWidth / 2,
      top: props.canvasHeight / 2
    })
    clip.setCoords()
    if (canvas.value) {
      canvas.value.viewportCenterObject(clip)
    }

    if (target === 'safe') {
      safeZone.value = clip
    } else {
      boundary.value = clip
    }

    return clip
  }

  async function addBoundary(safeZoneUrl?: string, boundaryUrl?: string): Promise<void> {
    if (!canvas.value) return
    if (safeZoneUrl) {
      await loadClipGroup(safeZoneUrl, 'safe')
    }
    if (boundaryUrl) {
      await loadClipGroup(boundaryUrl, 'boundary')
    }

    // Re-apply clipping to existing logos
    for (const logo of customLogoObjects.value.values()) {
      await applyClipPath(logo)
    }
  }

  /**
   * Add logo to canvas (2D scene)
   * Uses the shared composable with 2D-specific configuration
   */
  async function addLogo(logo: CustomLogo, logoIndex: number): Promise<void> {
    if (!canvas.value) return

    if (!logo || !logo.url) return

    // Check if logo side matches current side
    if (logo.side !== props.side) return

    // Render canvas
    const renderCanvas = () => {
      if (canvas.value) {
        canvas.value.requestRenderAll()
      }
    }

    // Update store (placeholder for now - can be extended)
    const updateStore = (
      _logoIndex: number,
      _data: {
        x_axis_3d?: number
        y_axis_3d?: number
        originalWidth?: number
        originalHeight?: number
        actualWidth?: number
        actualHeight?: number
      }
    ) => {
      // TODO: Update customization store with logo position/size
      // This can be implemented when store methods are available
    }

    try {
      await addLogoToCanvas({
        logo,
        logoIndex: logoIndex,
        signature: getLogoSignature(logo),
        signatureUrlSide: getLogoSignatureUrlSide(logo),
        mainPreview: props.mainPreview,
        productId: effectiveProductId.value,
        canvas: canvas.value as Canvas,
        logoObjects: customLogoObjects,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        calculateScaleRatios: calculateScaleRatios2D,
        applyClipPath,
        renderCanvas,
        updateStore,
        canvasSelection: true,
        flipX: false
      })

      // Re-apply clip when user moves/scales/rotates
      const reclip = async () => {
        const added = customLogoObjects.value.get(logoIndex)
        if (added) {
          await applyClipPath(added)
          if (canvas.value) canvas.value.requestRenderAll()
        }
      }
      const added = customLogoObjects.value.get(logoIndex)
      added?.on('moving', reclip)
      added?.on('scaling', reclip)
      added?.on('rotating', reclip)
    } catch (error) {
      console.error('Failed to add logo:', error)
    }
  }

  /**
   * Reset and add all logos
   * Clears existing logos and adds all logos from custom_logos
   */
  async function resetAndAddLogos(): Promise<void> {
    if (!canvas.value) return

    // Reset existing logos
    customLogoObjects.value.forEach(logo => {
      if (canvas.value) {
        canvas.value.remove(logo as unknown as FabricObject)
      }
    })
    customLogoObjects.value.clear()

    // Add logos from custom_logos (filter by side)
    if (customLogos.value.length > 0) {
      let logoIndex = 0
      for (const logo of customLogos.value) {
        if (logo && logo.url && logo.side === props.side) {
          await addLogo(logo, logoIndex)
          logoIndex++
        }
      }
    }

    if (canvas.value) {
      canvas.value.requestRenderAll()
    }
  }

  // Expose functions for external use
  defineExpose({
    getImageFromCanvas,
    addLogo,
    resetAndAddLogos
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

  // Watch for changes in customLogos from customization store
  // Compare by checking what's in the Map vs what's in the array
  watch(
    customLogos,
    async (newLogos = []) => {
      await syncLogosOnCanvas({
        newLogos,
        canvas: canvas.value,
        logoObjects: customLogoObjects,
        applyClipPath,
        addLogo,
        calculatePosition: calculatePosition2D,
        calculateRotation: calculateRotation2D,
        calculateScaleRatios: calculateScaleRatios2D,
        getSignature: getLogoSignature,
        getSignatureUrlSide: getLogoSignatureUrlSide,
        filterLogo: (logo: CustomLogo) => logo.side === props.side,
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
        }
      })
    },
    { deep: true }
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
      class="w-full! aspect-square! h-auto!"
      :class="canvasClass"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ maxHeight: `${canvasHeight}px !important` }"
    />
  </div>
</template>
