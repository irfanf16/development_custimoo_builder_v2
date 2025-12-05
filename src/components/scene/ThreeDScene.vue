<script setup lang="ts">
  import {
    onMounted,
    onBeforeUnmount,
    ref,
    shallowRef,
    toRef,
    computed,
    watch,
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
  import { Canvas, FabricImage, Group, type FabricObject } from 'fabric'
  import { useSceneCommon } from '@/composables/scene'
  import { useSvgGroups } from '@/composables/scene'
  import { useColorCustomization } from '@/composables/scene'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
  import type { DesignData } from '@/composables/scene'
  import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

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
    svgParts: undefined
  })

  // Convert imageData to DesignData format for useSceneCommon
  const designFromImageData = computed<DesignData | undefined>(() => {
    if (!props.imageData) return undefined
    return {
      file_url: props.imageData.design_url,
      file_extension: props.imageData.file_extension
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
    fromStorage,
    productsStore
  } = useSceneCommon(toRef(props, 'productId'), toRef(props, 'side'), designFromImageData)

  // ===== STORES =====
  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()

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
    props.side
  )

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

  // ===== LIFECYCLE =====
  onMounted(() => {
    initThreeJS()
  })

  onBeforeUnmount(() => {
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
  function initThreeJS() {
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
      antialias: false,
      logarithmicDepthBuffer: true
    })
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
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
    }

    // Create texture from canvas
    if (renderer.value && canvasEl.value && canvasEl.value instanceof HTMLCanvasElement) {
      texture.value = new THREE.CanvasTexture(canvasEl.value)
      texture.value.anisotropy = 1
    }

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

    const directionalLight1 = new THREE.RectAreaLight(0xffffff, 6, 10, 10)
    directionalLight1.lookAt(0, 0, -60)
    directionalLight1.position.set(10, 0, 6)
    scene.value.add(directionalLight1)

    const directionalLight2 = new THREE.RectAreaLight(0xffffff, 6, 10, 10)
    directionalLight2.lookAt(0, 0, -60)
    directionalLight2.position.set(-10, 0, 6)
    scene.value.add(directionalLight2)

    const directionalLight3 = new THREE.RectAreaLight(0xffffff, 6, 10, 10)
    directionalLight3.lookAt(0, 0, 180)
    directionalLight3.position.set(0, 0, -13.5)
    scene.value.add(directionalLight3)

    const directionalLight4 = new THREE.RectAreaLight(0xffffff, 11, 20, 20)
    directionalLight4.lookAt(-45, 0, 180)
    directionalLight4.position.set(0, 28.75, -21)
    scene.value.add(directionalLight4)

    const directionalLight5 = new THREE.RectAreaLight(0xffffff, 11, 20, 20)
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

  // ===== MODEL LOADING =====
  async function loadScene() {
    const modelData = effectiveModels.value
    const designData = effectiveDesign.value

    if (!modelData || !designData) {
      console.warn('Missing model or design data')
      return
    }

    try {
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
            // Design is automatically stored in design ref from useSceneCommon
            // SVG groups are automatically extracted if it's an SVG design
            // Customization is automatically applied if colorCustomization is provided
            // Apply anchor differences to balance the view
            if (designObject.value && designObject.value instanceof Group) {
              await applyAnchorDifferences(designObject.value)
              if (canvas.value) {
                canvas.value.requestRenderAll()
              }
            }
          }
        })
      ])

      mounted.value = true
    } catch (error) {
      console.error('Failed to load scene:', error)
    }
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

      const brightnessContrastPass = new ShaderPass(BrightnessContrastShader)
      const uniforms = brightnessContrastPass.uniforms as
        | Record<string, { value: number }>
        | undefined
      if (uniforms && uniforms['brightness'] && uniforms['contrast'] && uniforms['saturation']) {
        // Adjust brightness to make it lighter - increase from original -0.05
        // Positive values make it lighter, negative values make it darker
        uniforms['brightness'].value = 0.05 // Increased to make it lighter than original
        uniforms['contrast'].value = 0.3
        uniforms['saturation'].value = -0.12
      }
      composer.value.addPass(brightnessContrastPass)
      if (smaaPass.value) {
        composer.value.addPass(smaaPass.value)
      }
    } else {
      // Ensure the RenderPass uses the active camera when switching views
      if (renderPass.value && renderPass.value.camera !== cam) {
        renderPass.value.camera = cam
      }
    }
  }

  // ===== ANIMATION =====
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

  // ===== WATCHERS =====
  // Watch for changes in effectiveDesign and reload design
  watch(
    effectiveDesign,
    async (newDesign, oldDesign) => {
      if (!canvas.value || !scene.value || !mounted.value) return

      // Only reload if design actually changed
      if (newDesign && (!oldDesign || newDesign.file_url !== oldDesign.file_url)) {
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
              // Design is automatically stored in design ref from useSceneCommon
              // SVG groups are automatically extracted if it's an SVG design
              // Customization is automatically applied if colorCustomization is provided
              // Apply anchor differences to balance the view
              if (designObject.value && designObject.value instanceof Group) {
                await applyAnchorDifferences(designObject.value)
                if (canvas.value) {
                  canvas.value.requestRenderAll()
                }
              }
            }
          })

          // Update texture if it exists
          if (texture.value) {
            texture.value.needsUpdate = true
          }
        } catch (error) {
          console.error('Failed to reload design:', error)
        }
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
        try {
          // Remove canvas render handler if exists
          if (canvas.value && canvasRenderHandler.value) {
            canvas.value.off('after:render', canvasRenderHandler.value)
            canvasRenderHandler.value = null
          }

          // Remove front mesh from scene
          if (frontMesh.value && scene.value) {
            scene.value.remove(frontMesh.value)
          }

          // Remove back mesh from scene
          if (backMesh.value && scene.value) {
            scene.value.remove(backMesh.value)
          }

          // Remove old model from scene
          if (model.value && scene.value) {
            scene.value.remove(model.value)
          }

          // Dispose of outer material and all its textures
          if (outerMaterial.value) {
            const mat = outerMaterial.value

            // Dispose all textures
            if (mat.map) mat.map.dispose()
            if (mat.normalMap) mat.normalMap.dispose()
            if (mat.roughnessMap) mat.roughnessMap.dispose()
            if (mat.metalnessMap) mat.metalnessMap.dispose()
            if (mat.aoMap) mat.aoMap.dispose()
            if (mat.alphaMap) mat.alphaMap.dispose()
            if (mat.envMap) mat.envMap.dispose()

            // Dispose material
            mat.dispose()
            outerMaterial.value = null
          }

          // Dispose of inner material
          if (innerMaterial.value) {
            innerMaterial.value.dispose()
            innerMaterial.value = null
          }

          // Dispose of old model geometry and materials
          if (model.value) {
            model.value.traverse(obj => {
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
            model.value = null
          }

          // Clear mesh refs
          frontMesh.value = null
          backMesh.value = null

          // Load new model (loaders are created inside addModel)
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
        } catch (error) {
          console.error('Failed to reload model:', error)
        }
      }
    },
    { immediate: false }
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
