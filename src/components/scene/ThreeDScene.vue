<script setup lang="ts">
  import {
    onMounted,
    onBeforeUnmount,
    ref,
    shallowRef,
    toRef,
    computed,
    watch,
    nextTick,
    getCurrentInstance,
    type Ref
  } from 'vue'
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
  import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
  import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
  import { Canvas, FabricImage, Group, type FabricObject } from 'fabric'
  import * as fabric from 'fabric'
  import type { CustomLogo } from '@/services/logos/types'
  import {
    useSceneCommon,
    useSvgGroups,
    useColorCustomization,
    useColorGrouping,
    addLogoToCanvas,
    addTextToCanvas,
    useDimensionDisplayComputed,
    setupFabricControls,
    deleteLogoFromCanvas,
    syncLogosOnCanvas,
    syncTextsOnCanvas,
    FABRIC_CONTROL_VISIBILITY
  } from '@/composables/scene'
  import {
    getImageFrom3DCanvas,
    type GetImageFromCanvasOptions
  } from '@/composables/scene/useCanvasImage'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useProductsFontsStore } from '@/stores/products-fonts/products-fonts.store'
  import type { DesignData } from '@/composables/scene'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'
  import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
  import { filterFields } from '@/lib/utils'

  // 3D Model data type matching imageData structure
  type Model3DData = {
    model_url: string
    texture_url: string | null
    roughness_map_url?: string | null
    metalness_map_url?: string | null
    ao_map_url?: string | null
    alpha_map_url?: string | null
    roughness?: number | null
    metalness?: number | null
  }

  // ===== PROPS =====
  interface Props {
    // Product ID - defaults to active product from store
    productId?: number | null
    // Canvas dimensions
    containerWidth?: number
    containerHeight?: number
    canvasResolution?: number
    mainCanvasResolution?: number
    mainPreview?: boolean
    // Canvas side
    side?: CanvasSide
    // Models prop - 3D model data object
    models?: Model3DData
    // Image data for loading scene
    imageData?: {
      model_url: string
      texture_url: string
      design_url: string
      file_extension: string
      safe_zone_url?: string
      roughness_map_url?: string | null
      metalness_map_url?: string | null
      ao_map_url?: string | null
      alpha_map_url?: string | null
      roughness?: number | null
      metalness?: number | null
    }
    // SVG parts array for color permutation (can be string JSON or array)
    svgParts?: string[] | string
    // Color grouping - can be string (JSON) or object
    colorGrouping?: Record<string, string[]> | string | null
  }

  const props = withDefaults(defineProps<Props>(), {
    productId: undefined,
    containerWidth: 700,
    containerHeight: 700,
    canvasResolution: 2048,
    mainCanvasResolution: 2048,
    mainPreview: false,
    side: '3d',
    models: undefined,
    imageData: undefined,
    svgParts: undefined,
    colorGrouping: undefined
  })

  // Convert imageData to DesignData format for useSceneCommon
  const designFromImageData = computed<DesignData | undefined>(() => {
    if (!props.imageData) return undefined
    return {
      file_url: props.imageData.design_url,
      file_extension: props.imageData.file_extension,
      safe_zone_url: props.imageData.safe_zone_url
    }
  })

  // ===== SHARED COMPOSABLE =====
  const {
    canvas,
    design: _design,
    effectiveProductId,
    effectiveDesign,
    initCanvas,
    addDesign,
    disposeCanvas,
    loadImageFromURL: loadImageFromURLCommon,
    fromStorage,
    productsStore
  } = useSceneCommon(toRef(props, 'productId'), toRef(props, 'side'), designFromImageData)

  // ===== STORES =====
  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()
  const sceneStore = useSceneStore()
  const companyStore = useCompanyStore()

  // ===== LOGOS COMPOSABLE =====
  // Note: fromStorage is already available from useSceneCommon

  // ===== CUSTOM LOGOS =====
  // Map: key = index in custom_logos array, value = logo (3D: all logos, with x_axis_3d/y_axis_3d)
  const customLogos = computed<Map<number, CustomLogo>>(() => {
    const productId = effectiveProductId.value
    if (!productId || !customizationStore.customization) return new Map()
    const key = String(productId)
    const all = customizationStore.customization.custom_logos?.[key] || []
    const map = new Map<number, CustomLogo>()
    const fields = [
      'url',
      'side',
      'x_axis',
      'y_axis',
      'x_axis_3d',
      'y_axis_3d',
      'height',
      'width',
      'placement',
      'name_of_placement',
      'rotation',
      'scaleX',
      'scaleY'
    ] as const
    all.forEach((logo: CustomLogo, index: number) => {
      map.set(index, filterFields(logo, [...fields]) as CustomLogo)
    })
    return map
  })

  // ===== CUSTOM TEXTS =====
  // Map: key = index in product_custom_texts, value = entry + items (3D: all items, no side filter)
  const customTexts = computed<
    Map<
      number,
      {
        entry: OutputProductText
        itemsForSide: { itemIndex: number; item: OutputProductTextItem }[]
      }
    >
  >(() => {
    const productId = effectiveProductId.value
    if (!productId || !customizationStore.customization) return new Map()
    const key = String(productId)
    const all = customizationStore.customization.product_custom_texts?.[key] || []
    const map = new Map<
      number,
      {
        entry: OutputProductText
        itemsForSide: { itemIndex: number; item: OutputProductTextItem }[]
      }
    >()
    all.forEach((text: OutputProductText, index: number) => {
      const itemsForSide = (text.items ?? []).map((item, itemIndex) => ({ itemIndex, item }))
      if (itemsForSide.length > 0) {
        map.set(index, { entry: text, itemsForSide })
      }
    })
    return map
  })

  // ===== SVG GROUPS COMPOSABLE =====
  const svgGroupsComposable = useSvgGroups(
    effectiveProductId,
    props.side,
    props.mainPreview,
    toRef(props, 'svgParts')
  )
  const { svgGroups, initialSvgGroups, parts } = svgGroupsComposable

  // ===== DESIGN OBJECT REF =====
  const designObject = ref<FabricObject | null>(null)

  // ===== COLOR GROUPING =====
  const colorGrouping = useColorGrouping(toRef(props, 'colorGrouping'))

  // ===== COLOR CUSTOMIZATION COMPOSABLE =====
  const colorCustomization = useColorCustomization(
    canvas as Ref<Canvas | null>,
    designObject as Ref<FabricObject | FabricImage | null>,
    svgGroups,
    initialSvgGroups,
    parts,
    effectiveProductId,
    productsStore,
    props.mainPreview,
    props.side,
    colorGrouping as Ref<Record<string, string[]> | null>
  )

  const componentInstance = getCurrentInstance()
  // Extract customization functions from composable
  const { applyCustomization, changeDefaultColors, changeGroupColors, resetToInitialColors } =
    colorCustomization

  /**
   * Computed properties that react to store changes
   * Use prop if provided, otherwise fall back to store value
   * Returns an object with 3D model data properties
   */
  const effectiveModels = computed<Model3DData | undefined>(() => {
    // Use prop if provided
    if (props.models) {
      return props.models
    }

    // Fallback to store
    const styleDetails = productsStore.activeStyleDetails
    if (!styleDetails) return undefined

    // Ensure model_url exists
    const model3d = styleDetails._3d_model
    if (!model3d || !model3d.file_url) return undefined

    return {
      model_url: model3d.file_url,
      texture_url: styleDetails._3d_texture?.file_url || null,
      roughness_map_url: styleDetails._3d_roughness_map?.file_url || null,
      metalness_map_url: styleDetails._3d_metalness_map?.file_url || null,
      ao_map_url: styleDetails._3d_ao_map?.file_url || null,
      alpha_map_url: styleDetails._3d_alpha_map?.file_url || null,
      roughness: styleDetails.roughness ?? null,
      metalness: styleDetails.metalness ?? null
    }
  })

  // ===== STATE =====
  const rendererEl = ref<HTMLDivElement | null>(null)
  const canvasEl = ref<HTMLCanvasElement | null>(null)

  // Three.js objects - use shallowRef to avoid Vue reactivity issues with Three.js read-only properties
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const frontCamera = shallowRef<THREE.OrthographicCamera | null>(null)
  const backCamera = shallowRef<THREE.OrthographicCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)
  const texture = shallowRef<THREE.CanvasTexture | null>(null)
  const model = shallowRef<THREE.Mesh | null>(null)
  const frontMesh = shallowRef<THREE.Mesh | null>(null)
  const backMesh = shallowRef<THREE.Mesh | null>(null)
  const innerMaterial = shallowRef<THREE.MeshStandardMaterial | null>(null)
  const animationId = ref<number | null>(null)
  const mounted = ref(false)
  const maxModelSizeValue = ref<number>(0)
  const originalCameraPosition = shallowRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const outerMaterial = shallowRef<THREE.MeshPhysicalMaterial | null>(null)
  const canvasRenderHandler = ref<(() => void) | null>(null)
  const composer = shallowRef<EffectComposer | null>(null)
  const renderPass = shallowRef<RenderPass | null>(null)
  const smaaPass = shallowRef<SMAAPass | null>(null)
  const outputPass = shallowRef<OutputPass | null>(null)
  const safeZone = shallowRef<Group | null>(null)
  const customLogoObjects = shallowRef<Map<number, FabricImage>>(new Map())
  const customTextObjects = shallowRef<Map<string, FabricObject>>(new Map())
  const raycaster = shallowRef<THREE.Raycaster | null>(null)
  const onClickPosition = shallowRef<THREE.Vector2>(new THREE.Vector2())
  const mouse = shallowRef<THREE.Vector2>(new THREE.Vector2())
  const sceneLoadPromise = shallowRef<Promise<void> | null>(null)
  const pointerPatched = ref(false)
  const pointerBridgeHandlers = shallowRef<{
    mousedown?: (e: MouseEvent) => void
    mouseup?: (e: MouseEvent) => void
    touchstart?: (e: TouchEvent) => void
    touchend?: (e: TouchEvent) => void
  }>({})
  const isFabricDrag = ref(false)
  const suppressCustomLogosWatch = ref(false)
  const suppressCustomTextsWatch = ref(false)
  const lastKnownObjectPos = ref<{ left: number; top: number } | null>(null)
  const dimText = shallowRef<fabric.IText | null>(null)
  const dimensionTargetRef = shallowRef<FabricObject | FabricImage | null>(null)

  // ===== LIFECYCLE =====
  onMounted(async () => {
    if (props.mainPreview && productsStore.activeProductDetails) {
      const productsFontsStore = useProductsFontsStore()
      const storageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''
      await productsFontsStore.initFromProducts([productsStore.activeProductDetails], storageUrl)
    }

    await initThreeJS()
    addGetPointerToFabricPrototype()
  })

  onBeforeUnmount(() => {
    removeGetPointerFromFabricPrototype()
    cleanup()
  })

  // ===== UTILITIES =====
  /**
   * Clone fabric objects
   */
  async function cloneFabricObjects(objects: FabricObject[]): Promise<FabricObject[]> {
    return await Promise.all(objects.map(o => o.clone()))
  }

  /**
   * Patch Fabric's getPointer to keep compatibility with legacy behavior (touch/mouse normalization)
   * Stores the original implementation and restores it on unmount.
   * Also maps pointer coords via the 3D scene (matches old ThreeDScene.vue logic).
   */
  function addGetPointerToFabricPrototype() {
    if (pointerPatched.value) return
    if (!Canvas || !(Canvas as unknown as { prototype?: unknown }).prototype) return
    const proto = (Canvas as unknown as { prototype: { getPointer: unknown } }).prototype
    if (!proto.getPointer) return
    const getPointerPositionFromScene = (evt: Event) => {
      if (!rendererEl.value || !scene.value || !camera.value) return null
      const touch = (evt as TouchEvent).changedTouches?.[0]
      const cx = touch?.clientX ?? (evt as MouseEvent).clientX
      const cy = touch?.clientY ?? (evt as MouseEvent).clientY
      if (typeof cx !== 'number' || typeof cy !== 'number') return null
      const array = getMousePosition(rendererEl.value, cx, cy, true)
      onClickPosition.value.fromArray(array)
      const intersects = getIntersects(onClickPosition.value, scene.value.children, camera.value)
      if (intersects.length > 0 && intersects[0]?.uv) {
        const uv = intersects[0].uv
        const mesh = intersects[0]?.object as THREE.Mesh | undefined
        if (mesh) {
          const material = mesh.material
          if (material && !Array.isArray(material) && 'map' in material && material.map) {
            if (typeof (material.map as THREE.Texture).transformUv === 'function') {
              ;(material.map as THREE.Texture).transformUv(uv)
            }
          }
        }
        return {
          x: getRealPosition('x', uv.x),
          y: getRealPosition('y', uv.y)
        }
      }
      return null
    }

    proto.getPointer = function (this: Canvas, e: Event, ignoreZoom?: boolean) {
      // return cached values if we are in the event processing chain
      if (this._absolutePointer && !ignoreZoom) {
        return this._absolutePointer
      }
      if (this._pointer && ignoreZoom) {
        return this._pointer
      }

      const upperCanvasEl = (this as unknown as { upperCanvasEl?: HTMLCanvasElement }).upperCanvasEl
      const getPointerFn = fabric.util.getPointer as unknown as (
        evt: MouseEvent,
        target?: HTMLElement
      ) => { x: number; y: number }
      let pointerObj = getPointerFn(
        e as unknown as MouseEvent,
        upperCanvasEl as unknown as HTMLElement
      )
      let pointer = new fabric.Point(pointerObj.x, pointerObj.y)

      const posOnScene = getPointerPositionFromScene(e)
      if (posOnScene) {
        pointer = new fabric.Point(posOnScene.x, posOnScene.y)
      }

      // mimic legacy scaling logic
      const bounds = upperCanvasEl?.getBoundingClientRect()
      let boundsWidth = bounds?.width || 0
      let boundsHeight = bounds?.height || 0
      if (!boundsWidth || !boundsHeight) {
        if (bounds && 'top' in bounds && 'bottom' in bounds) {
          boundsHeight = Math.abs(bounds.top - bounds.bottom)
        }
        if (bounds && 'right' in bounds && 'left' in bounds) {
          boundsWidth = Math.abs(bounds.right - bounds.left)
        }
      }

      // this.calcOffset() // seems to be not needed
      // pointer.x = pointer.x - this._offset.left
      // pointer.y = pointer.y - this._offset.top

      if (!ignoreZoom) {
        const restored = (
          this as unknown as { restorePointerVpt?: (p: fabric.Point) => fabric.Point }
        ).restorePointerVpt?.(pointer)
        if (restored) {
          pointer = restored
        }
      }

      let cssScale
      if (boundsWidth === 0 || boundsHeight === 0) {
        cssScale = { width: 1, height: 1 }
      } else {
        cssScale = {
          width: upperCanvasEl ? upperCanvasEl.width / boundsWidth : 1,
          height: upperCanvasEl ? upperCanvasEl.height / boundsHeight : 1
        }
      }

      return new fabric.Point(pointer.x * cssScale.width, pointer.y * cssScale.height)
    }

    // Bridge events from Three.js renderer to Fabric upper canvas (legacy behavior)
    if (rendererEl.value && canvas.value && !pointerBridgeHandlers.value.mousedown) {
      const upperCanvas = (canvas.value as unknown as { upperCanvasEl?: HTMLCanvasElement })
        .upperCanvasEl
      if (upperCanvas) {
        const cloneMouseEvent = (type: string, source: MouseEvent) =>
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: source.clientX,
            clientY: source.clientY,
            screenX: source.screenX,
            screenY: source.screenY,
            button: source.button,
            buttons: source.buttons,
            ctrlKey: source.ctrlKey,
            shiftKey: source.shiftKey,
            altKey: source.altKey,
            metaKey: source.metaKey
          })

        const forwardMouse = (type: 'mousedown' | 'mouseup', ev: MouseEvent) => {
          const fabricCanvas = canvas.value as unknown as Canvas
          // use event-based target search (Fabric v6)
          const target = fabricCanvas.findTarget(ev as unknown as PointerEvent)
          if (target) {
            isFabricDrag.value = type === 'mousedown'
            if (controls.value) controls.value.enabled = false
            ev.preventDefault()
            ev.stopPropagation()
          } else if (type === 'mousedown') {
            isFabricDrag.value = false
            if (controls.value) controls.value.enabled = true
          }

          const evt = cloneMouseEvent(type, ev)
          upperCanvas.dispatchEvent(evt)
          const handler =
            type === 'mousedown'
              ? (
                  fabricCanvas as unknown as { _onMouseDown?: (e: MouseEvent) => void }
                )?._onMouseDown?.bind(fabricCanvas)
              : (
                  fabricCanvas as unknown as { _onMouseUp?: (e: MouseEvent) => void }
                )?._onMouseUp?.bind(fabricCanvas)
          handler?.(evt)

          if (type === 'mouseup' && controls.value) {
            controls.value.enabled = true
            isFabricDrag.value = false
          }
        }

        const forwardTouch = (type: 'touchstart' | 'touchend', ev: TouchEvent) => {
          const touch = ev.changedTouches?.[0]
          if (!touch) return
          const evt = new MouseEvent(type === 'touchstart' ? 'mousedown' : 'mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
            screenX: touch.screenX ?? touch.clientX,
            screenY: touch.screenY ?? touch.clientY,
            button: 0,
            buttons: 1
          })

          const fabricCanvas = canvas.value as unknown as Canvas
          // use event-based target search (Fabric v6)
          const target = fabricCanvas.findTarget(evt as unknown as TouchEvent)
          if (target) {
            isFabricDrag.value = type === 'touchstart'
            if (controls.value) controls.value.enabled = false
            ev.preventDefault()
            ev.stopPropagation()
          } else if (type === 'touchstart') {
            isFabricDrag.value = false
            if (controls.value) controls.value.enabled = true
          }

          upperCanvas.dispatchEvent(evt)
          const handler =
            type === 'touchstart'
              ? (
                  fabricCanvas as unknown as { _onMouseDown?: (e: MouseEvent) => void }
                )?._onMouseDown?.bind(fabricCanvas)
              : (
                  fabricCanvas as unknown as { _onMouseUp?: (e: MouseEvent) => void }
                )?._onMouseUp?.bind(fabricCanvas)
          handler?.(evt)

          if (type === 'touchend' && controls.value) {
            controls.value.enabled = true
            isFabricDrag.value = false
          }
        }

        const handlers = {
          mousedown: (ev: MouseEvent) => forwardMouse('mousedown', ev),
          mouseup: (ev: MouseEvent) => forwardMouse('mouseup', ev),
          touchstart: (ev: TouchEvent) => forwardTouch('touchstart', ev),
          touchend: (ev: TouchEvent) => forwardTouch('touchend', ev)
        }

        rendererEl.value.addEventListener('mousedown', handlers.mousedown)
        rendererEl.value.addEventListener('mouseup', handlers.mouseup)
        rendererEl.value.addEventListener('touchstart', handlers.touchstart, { passive: false })
        rendererEl.value.addEventListener('touchend', handlers.touchend, { passive: false })

        pointerBridgeHandlers.value = handlers
      }
    }

    pointerPatched.value = true
  }

  function removeGetPointerFromFabricPrototype() {
    // also tear down bridge listeners
    removePointerBridge()

    // Restore Fabric's getPointer similar to legacy implementation
    const canvasCtor = Canvas as unknown as { prototype?: unknown }
    if (canvasCtor?.prototype) {
      const proto = canvasCtor.prototype as unknown as {
        getPointer: (this: Canvas, e: Event, ignoreZoom?: boolean) => { x: number; y: number }
      }

      proto.getPointer = function (this: Canvas, e: Event, ignoreZoom?: boolean) {
        // return cached values if we are in the event processing chain
        if (
          (this as unknown as { _absolutePointer?: fabric.Point })._absolutePointer &&
          !ignoreZoom
        ) {
          return (this as unknown as { _absolutePointer: fabric.Point })._absolutePointer
        }
        if ((this as unknown as { _pointer?: fabric.Point })._pointer && ignoreZoom) {
          return (this as unknown as { _pointer: fabric.Point })._pointer
        }

        const upperCanvasEl = (this as unknown as { upperCanvasEl: HTMLCanvasElement })
          .upperCanvasEl
        let pointer = (
          fabric.util.getPointer as unknown as (
            evt: Event,
            target?: HTMLElement
          ) => { x: number; y: number }
        )(e, upperCanvasEl)
        const bounds = upperCanvasEl.getBoundingClientRect()
        let boundsWidth = bounds.width || 0
        let boundsHeight = bounds.height || 0
        let cssScale

        if (!boundsWidth || !boundsHeight) {
          if ('top' in bounds && 'bottom' in bounds) {
            boundsHeight = Math.abs(bounds.top - bounds.bottom)
          }
          if ('right' in bounds && 'left' in bounds) {
            boundsWidth = Math.abs(bounds.right - bounds.left)
          }
        }

        ;(this as unknown as { calcOffset?: () => void }).calcOffset?.()
        pointer = {
          x: pointer.x - (this as unknown as { _offset: { left: number } })._offset.left,
          y: pointer.y - (this as unknown as { _offset: { top: number } })._offset.top
        }

        if (!ignoreZoom) {
          const restored = (
            this as unknown as {
              restorePointerVpt?: (p: { x: number; y: number }) => { x: number; y: number }
            }
          ).restorePointerVpt?.(pointer)
          if (restored) {
            pointer = restored
          }
        }

        const retinaScaling =
          (this as unknown as { getRetinaScaling?: () => number }).getRetinaScaling?.() ?? 1
        if (retinaScaling !== 1) {
          pointer = { x: pointer.x / retinaScaling, y: pointer.y / retinaScaling }
        }

        if (boundsWidth === 0 || boundsHeight === 0) {
          // If bounds are not available (i.e. not visible), do not apply scale.
          cssScale = { width: 1, height: 1 }
        } else {
          cssScale = {
            width: upperCanvasEl.width / boundsWidth,
            height: upperCanvasEl.height / boundsHeight
          }
        }

        return new fabric.Point(pointer.x * cssScale.width, pointer.y * cssScale.height)
      }
    }

    pointerPatched.value = false
  }

  function removePointerBridge() {
    if (!rendererEl.value) return
    const handlers = pointerBridgeHandlers.value
    if (handlers.mousedown) rendererEl.value.removeEventListener('mousedown', handlers.mousedown)
    if (handlers.mouseup) rendererEl.value.removeEventListener('mouseup', handlers.mouseup)
    if (handlers.touchstart)
      rendererEl.value.removeEventListener('touchstart', handlers.touchstart as EventListener)
    if (handlers.touchend)
      rendererEl.value.removeEventListener('touchend', handlers.touchend as EventListener)
    if (controls.value) controls.value.enabled = true
    isFabricDrag.value = false
    pointerBridgeHandlers.value = {}
  }

  /**
   * Find the most left and top elements in a design group
   * Adapted from old ThreeDScene.vue
   */
  function findMostLeftAndTopElements(design: Group): { maxLeft: number; maxTop: number } {
    if (!design || !design._objects) {
      return { maxLeft: 0, maxTop: 0 }
    }

    let maxLeft = Infinity
    let maxTop = Infinity

    design._objects.forEach((obj: FabricObject) => {
      const left = obj.left ?? 0
      const top = obj.top ?? 0

      if (left < maxLeft) {
        maxLeft = left
      }
      if (top < maxTop) {
        maxTop = top
      }
    })

    return {
      maxLeft: maxLeft === Infinity ? 0 : maxLeft,
      maxTop: maxTop === Infinity ? 0 : maxTop
    }
  }

  /**
   * Apply anchor differences to balance the view
   * Adapted from old ThreeDScene.vue
   */
  async function applyAnchorDifferences(design: Group): Promise<void> {
    if (!canvas.value) return

    // Find all objects with ID containing 'anchor' and group them
    const anchorObjects = design._objects?.filter(obj => {
      const objWithId = obj as FabricObject & { id?: string }
      return objWithId.id?.toLowerCase().includes('anchor')
    }) as FabricImage[]

    if (anchorObjects && anchorObjects.length > 0) {
      const anchorGroup = new Group(
        await cloneFabricObjects(anchorObjects as unknown as FabricObject[]),
        {
          hasControls: false,
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          flipY: true
        }
      )

      // Scale the anchor group to match the canvas resolution
      anchorGroup.scaleToHeight(props.canvasResolution)
      anchorGroup.set({
        left: 0x0,
        top: 0x0
      })
      anchorGroup.setCoords()

      // Apply the anchor group's scale to the design (matching old codebase)
      design
        .set({
          scaleX: anchorGroup.scaleX,
          scaleY: anchorGroup.scaleY
        })
        .setCoords()

      // Get the most left and top elements AFTER scaling the design
      const { maxLeft, maxTop } = findMostLeftAndTopElements(design)
      let diffX = 0
      let diffY = 0
      const anchorLeft = anchorObjects[0]?.left ?? 0
      const anchorTop = anchorObjects[0]?.top ?? 0

      // Calculate difference ensuring maxLeft/maxTop is treated as the smaller number
      if (maxLeft < 0 && anchorLeft < 0) {
        diffX = Math.abs(maxLeft - anchorLeft) * (anchorGroup.scaleX ?? 1)
      } else {
        diffX = Math.abs(anchorLeft - maxLeft) * (anchorGroup.scaleX ?? 1)
      }

      if (maxTop < 0 && anchorTop < 0) {
        diffY = Math.abs(maxTop - anchorTop) * (anchorGroup.scaleY ?? 1)
      } else {
        diffY = Math.abs(anchorTop - maxTop) * (anchorGroup.scaleY ?? 1)
      }

      // Adjust the design position to center it relative to the anchor
      const currentLeft = design.left ?? 0
      const currentTop = design.top ?? 0
      const designAndCanvasHeightDiff = design.getScaledHeight() - props.canvasResolution

      design
        .set({
          left: currentLeft - diffX,
          top: currentTop - (designAndCanvasHeightDiff - diffY)
        })
        .setCoords()
    }
  }

  function cleanup() {
    // Cancel animation
    if (animationId.value !== null) {
      cancelAnimationFrame(animationId.value)
      animationId.value = null
    }

    // Dispose shared canvas
    disposeCanvas()

    // Remove canvas render handler if exists
    if (canvas.value && canvasRenderHandler.value) {
      canvas.value.off('after:render', canvasRenderHandler.value)
      canvasRenderHandler.value = null
    }

    // Dispose outer material and all its textures
    if (outerMaterial.value) {
      const mat = outerMaterial.value
      if (mat.map) mat.map.dispose()
      if (mat.normalMap) mat.normalMap.dispose()
      if (mat.roughnessMap) mat.roughnessMap.dispose()
      if (mat.metalnessMap) mat.metalnessMap.dispose()
      if (mat.aoMap) mat.aoMap.dispose()
      if (mat.alphaMap) mat.alphaMap.dispose()
      if (mat.envMap) mat.envMap.dispose()
      mat.dispose()
      outerMaterial.value = null
    }

    // Dispose inner material
    if (innerMaterial.value) {
      innerMaterial.value.dispose()
      innerMaterial.value = null
    }

    // Dispose Three.js objects
    if (scene.value) {
      scene.value.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => {
                // Dispose textures in material
                if (m.map) m.map.dispose()
                if (m.normalMap) m.normalMap.dispose()
                if (m.roughnessMap) m.roughnessMap.dispose()
                if (m.metalnessMap) m.metalnessMap.dispose()
                if (m.aoMap) m.aoMap.dispose()
                if (m.alphaMap) m.alphaMap.dispose()
                if (m.envMap) m.envMap.dispose()
                if (m.dispose) m.dispose()
              })
            } else {
              // Dispose textures in material
              if (obj.material.map) obj.material.map.dispose()
              if (obj.material.normalMap) obj.material.normalMap.dispose()
              if (obj.material.roughnessMap) obj.material.roughnessMap.dispose()
              if (obj.material.metalnessMap) obj.material.metalnessMap.dispose()
              if (obj.material.aoMap) obj.material.aoMap.dispose()
              if (obj.material.alphaMap) obj.material.alphaMap.dispose()
              if (obj.material.envMap) obj.material.envMap.dispose()
              if (obj.material.dispose) obj.material.dispose()
            }
          }
        }
      })
      scene.value.clear()
      scene.value = null
    }

    if (renderer.value) {
      renderer.value.dispose()
      renderer.value.forceContextLoss()
      // Note: domElement is read-only in Three.js, we just dispose
      renderer.value = null
    }

    mounted.value = false
  }

  // ===== THREE.JS SETUP =====
  async function initThreeJS() {
    if (!rendererEl.value || !canvasEl.value) return

    // Create scene
    scene.value = new THREE.Scene()

    // Create camera
    const width = props.containerWidth
    const height = props.containerHeight

    camera.value = new THREE.PerspectiveCamera(20, width / height, 0.25, 10)
    // camera.value = new THREE.PerspectiveCamera(20, 1, 0.25, 10)
    camera.value.position.set(0, 0.5, 11.5)

    // Create renderer
    renderer.value = new THREE.WebGLRenderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      logarithmicDepthBuffer: true
    })
    renderer.value.setSize(width, height)
    renderer.value.setPixelRatio(window.devicePixelRatio)
    rendererEl.value.appendChild(renderer.value.domElement)

    // Create controls
    if (camera.value && renderer.value) {
      controls.value = new OrbitControls(camera.value, renderer.value.domElement)
      controls.value.enableDamping = true
      controls.value.maxDistance = 500
      controls.value.maxPolarAngle = THREE.MathUtils.degToRad(120)
      controls.value.minPolarAngle = THREE.MathUtils.degToRad(30)
      controls.value.target.set(0, 0, 0)
      controls.value.update()

      if (!props.mainPreview) {
        controls.value.enableZoom = false
      }
    }

    // Initialize Fabric.js canvas
    if (canvasEl.value) {
      initCanvas(canvasEl.value, props.canvasResolution, props.canvasResolution)

      // Setup custom Fabric controls (scale/rotate/delete icons)
      setupFabricControls({
        onRemoveLogo: (logoIndex: number, canvasInstance: Canvas) => {
          deleteLogoFromCanvas(logoIndex, canvasInstance, customLogoObjects)
        }
        // Text removal can be added here if needed
      })

      ensureDimText(true)
      canvas.value?.on('selection:cleared', hideDimensions)

      // Prevent objects from moving outside the model by reverting to last valid position
      const fabricCanvas = canvas.value as Canvas
      fabricCanvas.on('object:moving', evt => {
        if (!rendererEl.value || !scene.value || !camera.value) return
        const moveEvt = evt as unknown as { e?: MouseEvent; target?: FabricObject }
        const clientX = moveEvt.e?.clientX
        const clientY = moveEvt.e?.clientY
        if (typeof clientX !== 'number' || typeof clientY !== 'number') return

        const array = getMousePosition(rendererEl.value, clientX, clientY, true)
        onClickPosition.value.fromArray(array)
        const intersects = getIntersects(onClickPosition.value, scene.value.children, camera.value)

        const target = moveEvt.target
        if (!intersects.length) {
          if (target && lastKnownObjectPos.value) {
            target.left = lastKnownObjectPos.value.left
            target.top = lastKnownObjectPos.value.top
            target.setCoords()
            fabricCanvas.requestRenderAll()
          }
        } else if (target) {
          lastKnownObjectPos.value = {
            left: target.left ?? 0,
            top: target.top ?? 0
          }
        }
      })
    }

    // Create texture from canvas
    if (renderer.value && canvasEl.value && canvasEl.value instanceof HTMLCanvasElement) {
      texture.value = new THREE.CanvasTexture(canvasEl.value)
      texture.value.anisotropy = 1
    }

    // Initialize raycaster for 3D positioning
    raycaster.value = new THREE.Raycaster()

    // Setup lights
    setupLights()

    // Setup environment
    setupEnvironment()

    // Load model and design
    loadScene()

    // Initialize shader passes (will be called again in loadScene after model loads)
    addShaderPasses()

    // Start animation
    animate()
  }

  function setupLights() {
    if (!scene.value) return

    const intensity = 0.68
    const directionalLight1 = new THREE.RectAreaLight(0xffffff, 6 * intensity, 10, 10)
    directionalLight1.lookAt(0, 0, -60)
    directionalLight1.position.set(10, 0, 6)
    scene.value.add(directionalLight1)

    const directionalLight2 = new THREE.RectAreaLight(0xffffff, 6 * intensity, 10, 10)
    directionalLight2.lookAt(0, 0, -60)
    directionalLight2.position.set(-10, 0, 6)
    scene.value.add(directionalLight2)

    const directionalLight3 = new THREE.RectAreaLight(0xffffff, 6 * intensity, 10, 10)
    directionalLight3.lookAt(0, 0, 180)
    directionalLight3.position.set(0, 0, -13.5)
    scene.value.add(directionalLight3)

    const directionalLight4 = new THREE.RectAreaLight(0xffffff, 11 * intensity, 20, 20)
    directionalLight4.lookAt(-45, 0, 180)
    directionalLight4.position.set(0, 28.75, -21)
    scene.value.add(directionalLight4)

    const directionalLight5 = new THREE.RectAreaLight(0xffffff, 11 * intensity, 20, 20)
    directionalLight5.lookAt(-45, 0, -180)
    directionalLight5.position.set(0, 28.75, 21)
    scene.value.add(directionalLight5)
  }

  function setupEnvironment() {
    if (!scene.value) return

    const hdrLoader = new HDRLoader()
    const hdrPath = fromStorage('super_admin/files/product/env_map/Custom_studio_small.hdr')
    hdrLoader.load(
      hdrPath,
      texture => {
        if (!scene.value) return
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.value.environment = texture
        scene.value.background = null
      },
      undefined,
      error => {
        console.error('Failed to load HDR environment map:', error)
      }
    )
  }

  // ===== LOGO UTILITIES =====
  /**
   * Calculate canvas width ratio for 3D scene
   * Used for scaling logos from 2D coordinates to 3D canvas
   */
  const canvasWidthRatio = computed(() => {
    return props.containerWidth / 600 // twoDCanvasWidth default is 600
  })

  /**
   * Calculate canvas height ratio for 3D scene
   * Used for scaling logos from 2D coordinates to 3D canvas
   */
  const canvasHeightRatio = computed(() => {
    return props.containerHeight / 600 // twoDCanvasHeight default is 600
  })

  // Calculate rotation (opposite angle for 3D)
  function calculateRotation(rotation: number): number {
    if (rotation < 0) {
      return oppositeAngle(360 - rotation)
    }
    return oppositeAngle(rotation)
  }

  /**
   * Calculate position for logo or text (use 3D position if available, otherwise from 2D + findPositionOn3D).
   * Accepts CustomLogo (has x_axis_3d, y_axis_3d, side) or text item (has x_axis, y_axis, placement).
   */
  function calculatePosition(
    data: (CustomLogo | OutputProductTextItem) & {
      x_axis_3d?: number
      y_axis_3d?: number
      side?: string
    }
  ): { x: number; y: number } {
    const has3d = 'x_axis_3d' in data && 'y_axis_3d' in data && data.x_axis_3d && data.y_axis_3d
    if (has3d) {
      return { x: data.x_axis_3d!, y: data.y_axis_3d! }
    }
    const threeDXPosition = canvasWidthRatio.value * Number(data.x_axis)
    const threeDYPosition = canvasHeightRatio.value * Number(data.y_axis)
    const side = (data.side ??
      (data as OutputProductTextItem).placement?.toLowerCase() ??
      'front') as 'front' | 'back'
    return findPositionOn3D(threeDXPosition, threeDYPosition, side)
  }

  // Calculate scale ratios
  function calculateScaleRatios(): { widthRatio: number; heightRatio: number } {
    return {
      widthRatio: canvasWidthRatio.value,
      heightRatio: canvasHeightRatio.value
    }
  }

  /**
   * Calculate opposite angle for 3D rotation
   * Adapted from old ThreeDScene.vue
   */
  function oppositeAngle(angle: number): number {
    return (180 - angle + 360) % 360
  }

  /**
   * Get mouse position relative to container
   * Adapted from old ThreeDScene.vue
   */
  function getMousePosition(
    dom: HTMLElement,
    x: number,
    y: number,
    byScreen = false
  ): [number, number] {
    const rect = dom.getBoundingClientRect()
    let screenLeft = 0
    let screenTop = 0
    if (byScreen) {
      screenLeft = rect.left
      screenTop = rect.top
    }
    return [(x - screenLeft) / rect.width, (y - screenTop) / rect.height]
  }

  /**
   * Get intersection points with scene objects
   * Adapted from old ThreeDScene.vue
   */
  function getIntersects(
    point: THREE.Vector2,
    objects: THREE.Object3D[],
    camera: THREE.OrthographicCamera | THREE.PerspectiveCamera
  ): THREE.Intersection[] {
    if (!raycaster.value) return []
    mouse.value.set(point.x * 2 - 1, -(point.y * 2) + 1)
    raycaster.value.setFromCamera(mouse.value, camera)
    return raycaster.value.intersectObjects(objects, false)
  }

  /**
   * Get real position from normalized UV coordinates
   * Adapted from old ThreeDScene.vue
   */
  function getRealPosition(axis: 'x' | 'y', value: number): number {
    const CORRECTION_VALUE = axis === 'x' ? 4.5 : 5.5
    return Math.round(value * props.canvasResolution) - CORRECTION_VALUE
  }

  /**
   * Map a 3D intersection back to 2D screen coordinates and detect side changes.
   * Adapted from legacy ThreeDScene.vue findPositionOn2D.
   */
  function findPositionOn2D(
    x: number,
    y: number,
    fabricObject: FabricImage & { side?: string; type?: string }
  ): { vector: THREE.Vector3; sideChanged: boolean } {
    if (
      !rendererEl.value ||
      !scene.value ||
      !camera.value ||
      !frontCamera.value ||
      !backCamera.value
    ) {
      return { vector: new THREE.Vector3(), sideChanged: false }
    }

    const frontCam = frontCamera.value as THREE.OrthographicCamera
    const backCam = backCamera.value as THREE.OrthographicCamera

    let sideChanged = false
    const vector = new THREE.Vector3()

    const array = getMousePosition(rendererEl.value, x, y, true)
    onClickPosition.value.fromArray(array)
    const intersects = getIntersects(onClickPosition.value, scene.value.children, camera.value)

    let side: 'front' | 'back' = 'front'
    if (intersects.length > 0) {
      const hit = intersects[0]
      if (hit?.point) {
        vector.copy(hit.point)
      }

      if (vector.z < 0) {
        vector.project(backCam)
        side = 'back'
      } else {
        vector.project(frontCam)
      }

      const currentSide = (fabricObject.side || 'front').toLowerCase()
      if (currentSide !== side) {
        fabricObject.side = side
        sideChanged = true
      }

      vector.x = Math.round(((vector.x + 1) * props.containerWidth) / 2)
      vector.y = Math.round(((-vector.y + 1) * props.containerHeight) / 2)
      vector.z = 0

      let divideBy = fabricObject.type === 'logo' ? 1 : 3
      const width = fabricObject.width ?? 0
      const height = fabricObject.height ?? 0
      const scaleX = fabricObject.scaleX ?? 1
      const scaleY = fabricObject.scaleY ?? 1
      vector.x += (width * scaleX) / divideBy
      vector.y += (height * scaleY) / divideBy
    }

    return { vector, sideChanged }
  }

  /**
   * Find position on 3D model surface from 2D coordinates
   * Adapted from old ThreeDScene.vue
   */
  function findPositionOn3D(
    x: number,
    y: number,
    side: 'front' | 'back'
  ): { x: number; y: number } {
    if (!rendererEl.value || !scene.value) {
      return { x: 0, y: 0 }
    }

    const camera = side.toLowerCase() === 'back' ? backCamera.value : frontCamera.value
    if (!camera) {
      return { x: 0, y: 0 }
    }

    const point = getMousePosition(rendererEl.value, x, y)
    onClickPosition.value.fromArray(point)

    const intersects = getIntersects(onClickPosition.value, scene.value.children, camera)

    if (intersects.length > 0 && intersects[0]?.uv) {
      const uv = intersects[0].uv
      const mesh = intersects[0]?.object as THREE.Mesh | undefined
      if (mesh) {
        const material = mesh.material
        if (material && !Array.isArray(material) && 'map' in material && material.map) {
          // transformUv is available on Texture
          if (material.map && typeof (material.map as THREE.Texture).transformUv === 'function') {
            ;(material.map as THREE.Texture).transformUv(uv)
          }
        }
      }
      return {
        x: getRealPosition('x', uv.x),
        y: getRealPosition('y', uv.y)
      }
    }

    return { x: 0, y: 0 }
  }

  /**
   * Measurement helpers and dimension overlay (legacy 3D logic).
   * Uses design scale plus company measurement unit (cm/in/px).
   */
  function convertSizeToMeasurement(value: number): number {
    const unit = companyStore.settings?.settings?.measurement_unit?.unit
    const designScale = designObject.value?.scaleX ?? 1
    const pxScaled = designScale ? value / designScale : value

    let converted = pxScaled
    if (unit === 'cm') {
      converted = pxScaled / 28.3464567
    } else if (unit === 'in') {
      converted = pxScaled / 72
    }
    return Number(converted.toFixed(1))
  }

  function ensureDimText(flipY = false) {
    if (!canvas.value || dimText.value) return
    dimText.value = new fabric.IText('', {
      fontSize: 14,
      backgroundColor: '#fff',
      hasControls: false,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      lockMovementX: true,
      lockMovementY: true,
      visible: false,
      fontFamily: 'Ubuntu',
      flipY
    })
    canvas.value.add(dimText.value as unknown as FabricObject)
  }

  const dimensionDisplayComputed = useDimensionDisplayComputed(dimensionTargetRef, {
    getProductId: () => effectiveProductId.value ?? null,
    getCustomization: () => customizationStore.customization,
    getUnit: () => companyStore.settings?.settings?.measurement_unit?.unit ?? 'px',
    convertSizeToMeasurement
  })

  watch(dimensionDisplayComputed, val => {
    if (val && dimText.value?.visible) {
      dimText.value.set({
        text: `Size (W)${val.displayW}${val.unit} x (H)${val.displayH}${val.unit}`
      })
      canvas.value?.requestRenderAll()
      composer.value?.render()
    }
  })

  function hideDimensions() {
    dimensionTargetRef.value = null
    if (!dimText.value || !canvas.value) return
    dimText.value.set({ visible: false })
    canvas.value.requestRenderAll()
    composer.value?.render()
  }

  function showDimensions(target: FabricObject | FabricImage) {
    if (!canvas.value) return
    ensureDimText(true)
    if (!dimText.value) return

    dimensionTargetRef.value = target
    const dim = dimensionDisplayComputed.value
    const text =
      dim != null ? `Size (W)${dim.displayW}${dim.unit} x (H)${dim.displayH}${dim.unit}` : ''

    dimText.value.set({
      left: target.left,
      top:
        (target.top ?? 0) -
        ((target.height ?? 0) * (target.scaleY ?? 1)) / 2 -
        (dimText.value.height ?? 0) * (dimText.value.scaleY ?? 1) -
        20,
      text,
      visible: true
    })
    canvas.value.bringObjectToFront(dimText.value as unknown as FabricObject)
    canvas.value.requestRenderAll()
    composer.value?.render()
  }

  /**
   * Load safe zone SVG and set as clip path (same as old ThreeDScene: groupSVGElements, scaleToHeight, viewportCenter)
   */
  async function addSafeZone(safeZoneUrl?: string): Promise<void> {
    if (!canvas.value || !safeZoneUrl) return
    const clip = (await loadImageFromURLCommon(safeZoneUrl, 'svg', {
      hasControls: false,
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      absolutePositioned: true,
      inverted: true,
      flipY: true,
      originX: 'center',
      originY: 'center'
    })) as Group

    if (canvas.value) {
      canvas.value.viewportCenterObject(clip)
    }
    clip.set({
      hasControls: false,
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      absolutePositioned: true,
      inverted: true,
      flipY: true
    })
    clip.scaleToHeight(props.canvasResolution)
    clip.set({ left: 0, top: 0 })
    clip.setCoords()
    safeZone.value = clip
  }

  /**
   * Apply safe zone as clip path to an object (logo or text). Same as old ThreeDScene: obj.clipPath = this.safe_zone
   */
  function applyClipPath(target: FabricImage | FabricObject): void {
    if (safeZone.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(target as any).clipPath = safeZone.value
    }
  }

  /**
   * Add logo to canvas (3D scene)
   * Uses the shared composable with 3D-specific configuration
   */
  async function addLogo(logo: CustomLogo, logoIndex: number): Promise<void> {
    if (!canvas.value) return

    if (!logo || !logo.url) return

    // Render canvas
    const renderCanvas = () => {
      if (canvas.value) {
        canvas.value.requestRenderAll()
      }
      // Also render 3D scene
      if (composer.value) {
        composer.value.render()
      }
    }

    // Control visibility (3D specific)
    const controlVisibility = {
      tl: false,
      bl: false,
      tr: true,
      br: true,
      ml: false,
      mb: false,
      mr: false,
      mt: false,
      mtr: false,
      deleteControl: true
    }

    try {
      if (!canvas.value) return

      await addLogoToCanvas({
        logo,
        logoIndex: logoIndex,
        mainPreview: props.mainPreview,
        productId: effectiveProductId.value,
        canvas: canvas.value as Canvas,
        logoObjects: customLogoObjects,
        calculatePosition,
        calculateRotation,
        calculateScaleRatios,
        applyClipPath: (img: FabricImage) => applyClipPath(img),
        renderCanvas,
        controlVisibility,
        canvasSelection: true,
        flipX: true,
        findPositionOn2D,
        suppressWatchRef: suppressCustomLogosWatch,
        convertSize: convertSizeToMeasurement
      })

      const added = customLogoObjects.value.get(logoIndex)
      if (added) {
        added.on('selected', () => showDimensions(added))
        added.on('moving', () => showDimensions(added))
        added.on('scaling', () => showDimensions(added))
        added.on('rotating', () => showDimensions(added))
        added.on('modified', () => {
          showDimensions(added)
          customizationStore.pushHistoryState('Moved logo')
        })
      }
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

    // Add logos from custom_logos (map: key = index)
    if (customLogos.value.size > 0) {
      for (const [logoIndex, logo] of customLogos.value) {
        if (logo && logo.url) {
          await addLogo(logo, logoIndex)
        }
      }
    }

    if (canvas.value) {
      canvas.value.requestRenderAll()
    }
  }

  // ===== TEXT UTILITIES (sync from customTexts watch) =====
  async function addText(
    entry: OutputProductText,
    customTextIndex: number,
    itemIndex: number
  ): Promise<void> {
    if (!canvas.value) return
    const item = entry.items?.[itemIndex]
    if (!item) return

    const renderCanvas = () => {
      if (canvas.value) {
        canvas.value.requestRenderAll()
      }
      if (composer.value) {
        composer.value.render()
      }
    }

    const productsFontsStore = useProductsFontsStore()
    await addTextToCanvas({
      entry,
      customTextIndex,
      itemIndex,
      canvas: canvas.value,
      textObjects: customTextObjects,
      calculatePosition,
      calculateRotation,
      heightScale: canvasHeightRatio.value,
      renderCanvas,
      applyClipPath: (obj: FabricObject) => applyClipPath(obj),
      controlVisibility: FABRIC_CONTROL_VISIBILITY,
      canvasSelection: true,
      mainPreview: props.mainPreview,
      productId: effectiveProductId.value as number,
      suppressWatchRef: suppressCustomTextsWatch,
      getScaleRatios: calculateScaleRatios,
      is_3d: true,
      flipX: true,
      findPositionOn2D: findPositionOn2D as unknown as (
        x: number,
        y: number,
        fabricObject: FabricObject & { side?: string; type?: string }
      ) => { vector: { x: number; y: number; z?: number }; sideChanged: boolean },
      convertSize: convertSizeToMeasurement,
      ...(props.mainPreview ? { productsFonts: productsFontsStore.productsFonts } : {})
    })

    const key = `${customTextIndex}_${itemIndex}`
    const added = customTextObjects.value.get(key)
    if (added) {
      added.on('selected', () => showDimensions(added))
      added.on('moving', () => showDimensions(added))
      added.on('scaling', () => showDimensions(added))
      added.on('rotating', () => showDimensions(added))
      added.on('modified', () => {
        showDimensions(added)
        customizationStore.pushHistoryState('Moved text')
      })
    }
  }

  /**
   * Reset and add all texts
   * Clears existing text objects and adds all texts from customTexts (all visible items, no side filter in 3D)
   */
  async function resetAndAddTexts(): Promise<void> {
    if (!canvas.value) return

    customTextObjects.value.forEach(obj => {
      canvas.value?.remove(obj)
    })
    customTextObjects.value.clear()

    for (const [customTextIndex, { entry, itemsForSide }] of customTexts.value) {
      for (const { itemIndex, item } of itemsForSide) {
        if (!item?.selected) continue
        await addText(entry, customTextIndex, itemIndex)
      }
    }

    if (canvas.value) {
      canvas.value.requestRenderAll()
    }
    if (composer.value) {
      composer.value.render()
    }
  }

  // ===== MODEL LOADING =====
  async function loadScene() {
    const modelData = effectiveModels.value
    const designData = effectiveDesign.value

    if (!modelData || !designData) {
      console.warn('Missing model or design data')
      return
    }

    // Remove existing model, design, logos, and texts before adding new ones
    removeModel()
    if (canvas.value && designObject.value) {
      canvas.value.remove(designObject.value as FabricObject)
      designObject.value = null
    }
    customLogoObjects.value.forEach(logo => {
      if (canvas.value) canvas.value.remove(logo as unknown as FabricObject)
    })
    customLogoObjects.value.clear()
    customTextObjects.value.forEach(obj => {
      canvas.value?.remove(obj)
    })
    customTextObjects.value.clear()

    // Load model and design in parallel
    await Promise.all([
      addModel(
        modelData.model_url,
        modelData.texture_url || '',
        modelData.roughness_map_url || null,
        modelData.metalness_map_url || null,
        modelData.ao_map_url || null,
        modelData.alpha_map_url || null,
        modelData.roughness ?? null,
        modelData.metalness ?? null
      ),
      addDesign(designData, {
        scaleMode: 'resolution',
        canvasResolution: props.canvasResolution,
        centerInViewport: false,
        flipY: true,
        svgGroupsComposable,
        designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
        colorCustomization,
        mainPreview: props.mainPreview,
        onLoaded: async _loadedDesign => {
          if (designObject.value && designObject.value instanceof Group) {
            await applyAnchorDifferences(designObject.value)
            if (canvas.value) {
              canvas.value.requestRenderAll()
            }
          }
        }
      })
    ])

    if (designData.safe_zone_url) {
      await addSafeZone(designData.safe_zone_url)
    }

    // Load logos and texts after scene is loaded
    await resetAndAddLogos()
    await resetAndAddTexts()

    mounted.value = true
  }

  /**
   * Fit camera to centered object
   * Adapted from old ThreeDScene.vue
   */
  function fitCameraToCenteredObject(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    object: THREE.Object3D,
    offset: number,
    orbitControls?: OrbitControls | null,
    rendererInstance?: THREE.WebGLRenderer | null
  ) {
    const boundingBox = new THREE.Box3()
    boundingBox.setFromObject(object)

    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    const center = new THREE.Vector3()
    boundingBox.getCenter(center)

    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = camera.fov * (Math.PI / 180)
      const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect)

      let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2))
      let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2))
      let cameraZ = Math.max(dx, dy)

      if (offset !== undefined && offset !== 0) cameraZ *= offset

      camera.position.set(0, 0, cameraZ)

      const minZ = boundingBox.min.z
      const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ
      camera.far = cameraToFarEdge * 3
      camera.updateProjectionMatrix()

      if (orbitControls !== undefined && orbitControls !== null) {
        orbitControls.target = new THREE.Vector3(0, 0, 0)
        orbitControls.maxDistance = cameraToFarEdge
      }
    } else {
      const aspect = rendererInstance
        ? rendererInstance.domElement.width / rendererInstance.domElement.height
        : 1

      const boxSize = new THREE.Vector3()
      boundingBox.getSize(boxSize)

      const minDimensionThreshold = 0.1
      const effectiveBoxSize = new THREE.Vector3(
        Math.max(boxSize.x, minDimensionThreshold),
        Math.max(boxSize.y, minDimensionThreshold),
        Math.max(boxSize.z, minDimensionThreshold)
      )

      const maxDim = Math.max(effectiveBoxSize.x, effectiveBoxSize.y, effectiveBoxSize.z)
      const frustumHeight = maxDim
      const frustumWidth = frustumHeight * aspect

      camera.left = -frustumWidth / 2
      camera.right = frustumWidth / 2
      camera.top = frustumHeight / 2
      camera.bottom = -frustumHeight / 2

      camera.near = -maxDim * 2
      camera.far = maxDim * 2

      camera.position.set(center.x, center.y, maxDim)
      camera.lookAt(center)
      camera.updateProjectionMatrix()

      if (orbitControls) {
        orbitControls.target.copy(center)
        orbitControls.update()
      }
    }
  }

  /**
   * Add 3D model to scene
   * Adapted from old ThreeDScene.vue addModel function
   */
  async function addModel(
    modelUrl: string,
    textureUrl: string,
    roughnessMapUrl: string | null,
    metalnessMapUrl: string | null,
    aoMapUrl: string | null,
    alphaMapUrl: string | null,
    roughness: number | null,
    metalness: number | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!scene.value || !camera.value || !controls.value || !texture.value) {
        reject('Scene, camera, controls, or texture not initialized')
        return
      }

      // Create loaders with LoadingManager for tracking progress
      const manager = new THREE.LoadingManager()
      const gltfLoader = new GLTFLoader(manager)
      const textureLoader = new THREE.TextureLoader(manager)

      gltfLoader.load(
        fromStorage(modelUrl) || '',
        gltf => {
          const object = gltf.scene.children[0]
          if (!(object instanceof THREE.Mesh)) {
            reject('The loaded model is not a mesh.')
            return
          }

          model.value = object

          const box = new THREE.Box3().setFromObject(model.value)
          const size = new THREE.Vector3()
          box.getSize(size)

          if (size.y >= size.x) {
            maxModelSizeValue.value = size.y
          } else {
            maxModelSizeValue.value = size.x
          }

          if (controls.value) {
            controls.value.minDistance = 1.07 * maxModelSizeValue.value
          }

          // Fit main camera to model
          fitCameraToCenteredObject(
            camera.value!,
            model.value,
            0,
            controls.value,
            renderer.value || undefined
          )
          originalCameraPosition.value = camera.value!.position.clone()

          // Create front camera
          frontCamera.value = new THREE.OrthographicCamera(-3.6, 3.6, 3.6, -3.6, 1, 10)
          fitCameraToCenteredObject(
            frontCamera.value,
            model.value,
            0,
            controls.value,
            renderer.value || undefined
          )

          // Create back camera
          backCamera.value = frontCamera.value.clone()
          backCamera.value.position.z = -frontCamera.value.position.z

          const center = new THREE.Vector3()
          const boundingBox = new THREE.Box3().setFromObject(model.value)
          boundingBox.getCenter(center)
          backCamera.value.lookAt(center)

          if (scene.value) {
            scene.value.add(frontCamera.value)
            scene.value.add(backCamera.value)
          }

          // Create front side material
          const outerMat = new THREE.MeshPhysicalMaterial({
            map: texture.value,
            roughness: roughnessMapUrl && roughness !== null ? roughness : 1,
            metalness: metalnessMapUrl && metalness !== null ? metalness : 0,
            aoMapIntensity: 0.75,
            transparent: alphaMapUrl ? true : false,
            side: THREE.FrontSide,
            sheen: 2.2,
            sheenColor: new THREE.Color(0xd1d1d1),
            sheenRoughness: 0.8,
            envMapIntensity: 1.5
          })
          outerMat.needsUpdate = true
          outerMaterial.value = outerMat

          // Create back side material
          const innerMaterialInstance = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.BackSide
          })
          innerMaterial.value = innerMaterialInstance

          // Create front mesh
          const frontMeshInstance = new THREE.Mesh(model.value.geometry, outerMat)
          frontMeshInstance.position.copy(model.value.position)
          frontMeshInstance.rotation.copy(model.value.rotation)
          frontMeshInstance.scale.copy(model.value.scale)
          if (scene.value) {
            scene.value.add(frontMeshInstance)
          }
          frontMesh.value = frontMeshInstance

          // Create back mesh
          const backMeshInstance = new THREE.Mesh(model.value.geometry, innerMaterialInstance)
          backMeshInstance.position.copy(model.value.position)
          backMeshInstance.rotation.copy(model.value.rotation)
          backMeshInstance.scale.copy(model.value.scale)
          if (scene.value) {
            scene.value.add(backMeshInstance)
          }
          backMesh.value = backMeshInstance

          // Update materials after canvas render
          if (canvas.value) {
            const renderHandler = () => {
              outerMat.needsUpdate = true
              if (outerMat.map) {
                outerMat.map.needsUpdate = true
              }
            }
            canvas.value.on('after:render', renderHandler)
            canvasRenderHandler.value = renderHandler
          }

          // Load normal map (texture)
          if (textureUrl) {
            const normalMap = textureLoader.load(fromStorage(textureUrl) || '')
            normalMap.flipY = false
            outerMat.normalMap = normalMap
          }

          // Load roughness map
          if (roughnessMapUrl) {
            const roughnessMap = textureLoader.load(fromStorage(roughnessMapUrl) || '')
            roughnessMap.flipY = false
            outerMat.roughnessMap = roughnessMap
          }

          // Load metalness map
          if (metalnessMapUrl) {
            const metalnessMap = textureLoader.load(fromStorage(metalnessMapUrl) || '')
            metalnessMap.flipY = false
            metalnessMap.anisotropy = 1
            outerMat.metalnessMap = metalnessMap
          }

          // Load AO map
          if (aoMapUrl) {
            model.value.traverse(child => {
              if (child instanceof THREE.Mesh) {
                const geometry = child.geometry
                if (geometry.attributes.uv && !geometry.attributes.uv2) {
                  geometry.setAttribute('uv2', geometry.attributes.uv.clone())
                }
                const aoMap = textureLoader.load(fromStorage(aoMapUrl) || '')
                aoMap.flipY = false
                outerMat.aoMap = aoMap
              }
            })
          }

          // Load alpha map
          if (alphaMapUrl) {
            const alphaMap = textureLoader.load(fromStorage(alphaMapUrl) || '')
            alphaMap.flipY = false
            outerMat.alphaMap = alphaMap
          }

          outerMat.needsUpdate = true
          if (innerMaterial.value) {
            innerMaterial.value.needsUpdate = true
          }

          resolve()
        },
        undefined,
        error => {
          reject(error)
        }
      )
    })
  }

  /**
   * Remove current 3D model from scene and dispose all related resources.
   * Call before loading a new model so existing model, meshes, and materials are cleared.
   */
  function removeModel(): void {
    if (canvas.value && canvasRenderHandler.value) {
      canvas.value.off('after:render', canvasRenderHandler.value)
      canvasRenderHandler.value = null
    }

    if (frontMesh.value && scene.value) {
      scene.value.remove(frontMesh.value)
    }
    if (backMesh.value && scene.value) {
      scene.value.remove(backMesh.value)
    }
    if (model.value && scene.value) {
      scene.value.remove(model.value)
    }

    if (outerMaterial.value) {
      const mat = outerMaterial.value
      if (mat.map) mat.map.dispose()
      if (mat.normalMap) mat.normalMap.dispose()
      if (mat.roughnessMap) mat.roughnessMap.dispose()
      if (mat.metalnessMap) mat.metalnessMap.dispose()
      if (mat.aoMap) mat.aoMap.dispose()
      if (mat.alphaMap) mat.alphaMap.dispose()
      if (mat.envMap) mat.envMap.dispose()
      mat.dispose()
      outerMaterial.value = null
    }

    if (innerMaterial.value) {
      innerMaterial.value.dispose()
      innerMaterial.value = null
    }

    if (model.value) {
      model.value.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => {
                if (m.map) m.map.dispose()
                if (m.normalMap) m.normalMap.dispose()
                if (m.roughnessMap) m.roughnessMap.dispose()
                if (m.metalnessMap) m.metalnessMap.dispose()
                if (m.aoMap) m.aoMap.dispose()
                if (m.alphaMap) m.alphaMap.dispose()
                if (m.envMap) m.envMap.dispose()
                if (m.dispose) m.dispose()
              })
            } else {
              if (obj.material.map) obj.material.map.dispose()
              if (obj.material.normalMap) obj.material.normalMap.dispose()
              if (obj.material.roughnessMap) obj.material.roughnessMap.dispose()
              if (obj.material.metalnessMap) obj.material.metalnessMap.dispose()
              if (obj.material.aoMap) obj.material.aoMap.dispose()
              if (obj.material.alphaMap) obj.material.alphaMap.dispose()
              if (obj.material.envMap) obj.material.envMap.dispose()
              if (obj.material.dispose) obj.material.dispose()
            }
          }
        }
      })
      model.value = null
    }

    frontMesh.value = null
    backMesh.value = null
  }

  // ===== SHADER PASSES =====
  /**
   * Add shader passes for post-processing (brightness, contrast, saturation, SMAA)
   * Adapted from old ThreeDScene.vue
   */
  function addShaderPasses(
    activeCamera?: THREE.OrthographicCamera | THREE.PerspectiveCamera
  ): void {
    if (!renderer.value || !scene.value) return

    const cam = activeCamera || camera.value
    if (!cam) return

    renderer.value.toneMapping = THREE.NoToneMapping
    // renderer.value.toneMappingExposure = 1.0
    // renderer.value.outputColorSpace = THREE.SRGBColorSpace

    if (!composer.value) {
      composer.value = new EffectComposer(renderer.value)
      renderPass.value = new RenderPass(scene.value, cam)
      composer.value.addPass(renderPass.value)

      // SMAAPass constructor - in newer Three.js versions it takes no arguments
      smaaPass.value = new SMAAPass()

      const BrightnessContrastShader = {
        uniforms: {
          tDiffuse: { value: null },
          brightness: { value: 0 },
          contrast: { value: 0 },
          saturation: { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;

          uniform sampler2D tDiffuse;
          uniform float brightness;
          uniform float contrast;
          uniform float saturation;
          varying vec2 vUv;

          vec3 applySaturation(vec3 color, float sat) {
            float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
            return mix(vec3(gray), color, 1.0 + sat);
          }

          void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            color.rgb += brightness;

            if (contrast > 0.0) {
              color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;
            } else {
              color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;
            }

            color.rgb = applySaturation(color.rgb, saturation);

            gl_FragColor = color;
          }
        `
      }

      if (smaaPass.value) {
        composer.value.addPass(smaaPass.value)
      }

      const brightnessContrastPass = new ShaderPass(BrightnessContrastShader)
      const uniforms = brightnessContrastPass.uniforms as
        | Record<string, { value: number }>
        | undefined
      if (uniforms && uniforms['brightness'] && uniforms['contrast'] && uniforms['saturation']) {
        // Adjust brightness to make it lighter - increase from original -0.05
        // Positive values make it lighter, negative values make it darker
        uniforms['brightness'].value = -0.12
        uniforms['contrast'].value = 0
        uniforms['saturation'].value = -0.08
      }
      composer.value.addPass(brightnessContrastPass)

      // Add OutputPass LAST to apply tone mapping (required when using EffectComposer)
      // EffectComposer bypasses renderer's toneMapping, so we need OutputPass
      // OutputPass performs final tone mapping and gamma correction, so it must be last
      outputPass.value = new OutputPass()
      composer.value.addPass(outputPass.value)
    } else {
      // Ensure the RenderPass uses the active camera when switching views
      if (renderPass.value && renderPass.value.camera !== cam) {
        renderPass.value.camera = cam
      }
    }
  }

  // ===== ANIMATION =====
  const isAnimationRunning = ref(true)

  function animate() {
    if (!renderer.value || !scene.value || !camera.value || !controls.value) return

    animationId.value = requestAnimationFrame(animate)
    controls.value.update()
    if (texture.value) {
      texture.value.needsUpdate = true
    }

    // Use composer for rendering if available (with shader passes)
    if (composer.value) {
      // Ensure default perspective camera is used in the main loop
      if (renderPass.value && renderPass.value.camera !== camera.value) {
        renderPass.value.camera = camera.value
      }
      composer.value.render()
    } else {
      // Fallback to direct renderer if composer not initialized
      renderer.value.render(scene.value, camera.value)
    }
  }

  /**
   * Get image from canvas. Waits for render to complete before capturing (two rAF), then returns.
   * Handles side internally - renders with appropriate camera, gets image, then restores.
   */
  async function getImageFromCanvas(
    side: CanvasSide = 'front',
    options: GetImageFromCanvasOptions = {}
  ): Promise<string> {
    if (!renderer.value || !composer.value) return ''
    return getImageFrom3DCanvas(
      renderer.value,
      side,
      frontCamera.value,
      backCamera.value,
      camera.value,
      composer.value,
      renderPass.value,
      addShaderPasses,
      animate,
      animationId,
      isAnimationRunning,
      (canvas.value && typeof canvas.value !== 'boolean' ? canvas.value : null) as Canvas | null,
      options
    )
  }

  // Store component reference in global store if mainPreview
  onMounted(() => {
    if (props.mainPreview) {
      nextTick(() => {
        if (componentInstance) {
          sceneStore.setThreeDSceneRef({ getImageFromCanvas })
        }
      })
    }
  })

  onBeforeUnmount(() => {
    // Clear reference when component unmounts
    if (props.mainPreview) {
      sceneStore.setThreeDSceneRef(null)
    }
  })

  // Expose functions for external use
  defineExpose({
    getImageFromCanvas,
    addLogo,
    resetAndAddLogos,
    resetAndAddTexts,
    customTexts
  })

  // ===== WATCHERS =====
  // Watch for changes in effectiveDesign and reload design
  watch(
    effectiveDesign,
    async (newDesign, oldDesign) => {
      if (!canvas.value || !scene.value || !mounted.value) return

      // Only reload if design actually changed
      if (newDesign && (!oldDesign || newDesign.file_url !== oldDesign.file_url)) {
        const work = async () => {
          try {
            await addDesign(newDesign, {
              scaleMode: 'resolution',
              canvasResolution: props.canvasResolution,
              centerInViewport: false,
              flipY: true,
              svgGroupsComposable,
              designObjectRef: designObject as Ref<FabricObject | FabricImage | null>,
              colorCustomization,
              mainPreview: props.mainPreview,
              onLoaded: async _loadedDesign => {
                if (designObject.value && designObject.value instanceof Group) {
                  await applyAnchorDifferences(designObject.value)
                  if (canvas.value) {
                    canvas.value.requestRenderAll()
                  }
                }
              }
            })

            if (texture.value) {
              texture.value.needsUpdate = true
            }

            if (newDesign.safe_zone_url) {
              await addSafeZone(newDesign.safe_zone_url)
            }
          } catch (error) {
            console.error('Failed to reload design:', error)
          }
        }

        sceneLoadPromise.value = work()
        await sceneLoadPromise.value
        sceneLoadPromise.value = null
      }
    },
    { immediate: false }
  )

  // Watch for changes in effectiveModels and reload model
  watch(
    effectiveModels,
    async (newModel, oldModel) => {
      if (!scene.value || !camera.value || !controls.value || !texture.value || !mounted.value)
        return

      // Only proceed if we have a new model
      if (!newModel || !newModel.model_url) return

      // Check if model actually changed by comparing URLs
      const newModelUrl = newModel.model_url
      const oldModelUrl = oldModel?.model_url || ''

      if (newModelUrl !== oldModelUrl) {
        const work = async () => {
          removeModel()

          await addModel(
            newModel.model_url,
            newModel.texture_url || '',
            newModel.roughness_map_url || null,
            newModel.metalness_map_url || null,
            newModel.ao_map_url || null,
            newModel.alpha_map_url || null,
            newModel.roughness ?? null,
            newModel.metalness ?? null
          )

          // Update texture
          if (texture.value) {
            texture.value.needsUpdate = true
          }
        }
        sceneLoadPromise.value = work()
        await sceneLoadPromise.value
        sceneLoadPromise.value = null
      }
    },
    { immediate: false }
  )

  // Watch for changes in customLogos from customization store
  // Compare by checking what's in the Map vs what's in the array
  watch(
    customLogos,
    async (newLogos = new Map<number, CustomLogo>()) => {
      if (suppressCustomLogosWatch.value) {
        suppressCustomLogosWatch.value = false
        return
      }
      if (!mounted.value) return
      // Small delay to let design/model settles before syncing logos
      await new Promise(resolve => setTimeout(resolve, 200))
      // Wait for any in-flight scene/model/design loading to finish
      if (sceneLoadPromise.value) {
        await sceneLoadPromise.value
      }

      await syncLogosOnCanvas({
        productId: effectiveProductId.value as number,
        newLogos,
        canvas: canvas.value,
        logoObjects: customLogoObjects,
        addLogo,
        calculatePosition,
        calculateRotation,
        calculateScaleRatios,
        applyClipPath: (img: FabricImage) => applyClipPath(img),
        suppressWatchRef: suppressCustomLogosWatch,
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
          if (composer.value) {
            composer.value.render()
          }
        }
      })
    },
    { deep: true }
  )

  // Re-sync logos when undo/redo restores state so canvas reflects restored rotation/position
  watch(
    () => customizationStore.historyIndex,
    async () => {
      if (!mounted.value) return
      await new Promise(resolve => setTimeout(resolve, 200))
      if (sceneLoadPromise.value) {
        await sceneLoadPromise.value
      }
      await syncLogosOnCanvas({
        productId: effectiveProductId.value as number,
        newLogos: customLogos.value,
        canvas: canvas.value,
        logoObjects: customLogoObjects,
        addLogo,
        calculatePosition,
        calculateRotation,
        calculateScaleRatios,
        applyClipPath: (img: FabricImage) => applyClipPath(img),
        suppressWatchRef: suppressCustomLogosWatch,
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
          if (composer.value) {
            composer.value.render()
          }
        }
      })
    }
  )

  // Watch for changes in customTexts from customization store
  watch(
    customTexts,
    async newTexts => {
      if (suppressCustomTextsWatch.value) {
        suppressCustomTextsWatch.value = false
        return
      }
      if (!mounted.value) return
      await new Promise(resolve => setTimeout(resolve, 200))
      if (sceneLoadPromise.value) {
        await sceneLoadPromise.value
      }
      await syncTextsOnCanvas({
        productId: effectiveProductId.value ?? 0,
        newTexts: newTexts ?? new Map(),
        canvas: canvas.value,
        textObjects: customTextObjects,
        addText,
        calculatePosition,
        calculateRotation,
        heightScale: canvasHeightRatio.value,
        getScaleRatios: calculateScaleRatios,
        onAfterSync: () => {
          if (canvas.value) {
            canvas.value.requestRenderAll()
          }
          if (composer.value) {
            composer.value.render()
          }
        }
      })
    },
    { deep: true }
  )

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
    <!-- Three.js Renderer Container -->
    <div
      id="three-container"
      ref="rendererEl"
      class="w-full h-full"
      :style="`max-width: ${containerWidth}px; max-height: ${containerHeight}px;`"
    />

    <!-- Hidden Fabric.js Canvas -->
    <canvas ref="canvasEl" class="hidden" />
  </div>
</template>

<style scoped>
  #three-container {
    position: relative;
  }
  #three-container canvas {
    width: 100% !important;
    height: 100% !important;
  }
  /* Component-specific styles */
</style>
