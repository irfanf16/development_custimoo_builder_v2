<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
  import * as THREE from 'three'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProductsStore } from '@/stores/products/products.store'

  const ui = useUIStore()
  const products = useProductsStore()
  const containerEl = ref<HTMLDivElement | null>(null)

  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let animationId: number | null = null
  let currentRoot: THREE.Object3D | null = null
  const loadedTextures: THREE.Texture[] = []

  const storageBase =
    (import.meta as { env?: { VITE_APP_STORAGE_URL?: string } }).env
      ?.VITE_APP_STORAGE_URL || ''
  function fromStorage(path?: string | null): string | null {
    if (!path) return null
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  function disposeObject3D(obj: THREE.Object3D) {
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const materials = Array.isArray(child.material)
          ? child.material
          : child.material
            ? [child.material]
            : []
        materials.forEach((material: THREE.Material) => {
          const mat = material as THREE.MeshStandardMaterial
          mat.map?.dispose()
          mat.aoMap?.dispose()
          mat.roughnessMap?.dispose()
          mat.metalnessMap?.dispose()
          mat.alphaMap?.dispose()
          material.dispose()
        })
      }
    })
  }

  function clearSceneContent() {
    if (!scene) return
    if (currentRoot) {
      disposeObject3D(currentRoot)
      scene.remove(currentRoot)
      currentRoot = null
    }
    while (loadedTextures.length) {
      const t = loadedTextures.pop()
      if (t) t.dispose()
    }
  }

  function ensureRenderer() {
    if (!containerEl.value) return
    const width = ui.containerWidth || 800
    const height = ui.containerHeight || 600

    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(width, height)
      containerEl.value.appendChild(renderer.domElement)
    } else {
      renderer.setSize(width, height)
    }

    if (!scene) scene = new THREE.Scene()
    if (!camera) {
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(0, 0, 5)
    }

    const hasLights = scene.children.some(
      (child: THREE.Object3D) => child instanceof THREE.Light
    )
    if (!hasLights) {
      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
      hemi.position.set(0, 1, 0)
      scene.add(hemi)

      const dir = new THREE.DirectionalLight(0xffffff, 1)
      dir.position.set(3, 3, 5)
      scene.add(dir)
    }
  }

  function renderFrame() {
    if (!renderer || !scene || !camera) return
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(renderFrame)
  }

  function resize() {
    if (!renderer || !camera) return
    const width = ui.containerWidth || 800
    const height = ui.containerHeight || 600
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function addPlaceholder() {
    if (!scene) return
    clearSceneContent()
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const mesh = new THREE.Mesh(geometry, material)
    currentRoot = mesh
    scene.add(mesh)
  }

  async function loadGLBAndTextures() {
    ensureRenderer()
    if (!scene) return

    const style = products.activeStyleDetails
    if (!style) {
      addPlaceholder()
      return
    }

    const modelUrl = fromStorage(style._3d_model?.file_url)
    const baseTexUrl = fromStorage(style._3d_texture?.file_url)
    const alphaUrl = fromStorage(style._3d_alpha_map?.file_url)
    const aoUrl = fromStorage(style._3d_ao_map?.file_url)
    const roughnessUrl = fromStorage(style._3d_roughness_map?.file_url)
    const metalnessUrl = fromStorage(style._3d_metalness_map?.file_url)

    if (!modelUrl) {
      addPlaceholder()
      return
    }

    clearSceneContent()

    const gltfLoader = new GLTFLoader()
    const texLoader = new THREE.TextureLoader()

    try {
      const [gltf, colorTex, alphaTex, aoTex, roughTex, metalTex] =
        await Promise.all([
          gltfLoader.loadAsync(modelUrl),
          baseTexUrl
            ? texLoader.loadAsync(baseTexUrl).catch((err: unknown) => {
                console.log('[3D] base texture load error', err)
                return null
              })
            : Promise.resolve<THREE.Texture | null>(null),
          alphaUrl
            ? texLoader.loadAsync(alphaUrl).catch((err: unknown) => {
                console.log('[3D] alpha map load error', err)
                return null
              })
            : Promise.resolve<THREE.Texture | null>(null),
          aoUrl
            ? texLoader.loadAsync(aoUrl).catch((err: unknown) => {
                console.log('[3D] ao map load error', err)
                return null
              })
            : Promise.resolve<THREE.Texture | null>(null),
          roughnessUrl
            ? texLoader.loadAsync(roughnessUrl).catch((err: unknown) => {
                console.log('[3D] roughness map load error', err)
                return null
              })
            : Promise.resolve<THREE.Texture | null>(null),
          metalnessUrl
            ? texLoader.loadAsync(metalnessUrl).catch((err: unknown) => {
                console.log('[3D] metalness map load error', err)
                return null
              })
            : Promise.resolve<THREE.Texture | null>(null)
        ])

      ;[colorTex, alphaTex, aoTex, roughTex, metalTex].forEach(texture => {
        if (texture) loadedTextures.push(texture)
      })

      currentRoot = gltf.scene

      if (currentRoot) {
        const box = new THREE.Box3().setFromObject(currentRoot)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        currentRoot.position.sub(center)
        const maxAxis = Math.max(size.x, size.y, size.z)
        if (maxAxis > 0) currentRoot.scale.multiplyScalar(2.2 / maxAxis)

        currentRoot.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh) {
            const mat = obj.material as THREE.MeshStandardMaterial
            if (colorTex) {
              mat.map = colorTex
              mat.map.colorSpace = THREE.SRGBColorSpace
            }
            if (alphaTex) {
              mat.alphaMap = alphaTex
              mat.transparent = true
            }
            if (aoTex) mat.aoMap = aoTex
            if (roughTex) mat.roughnessMap = roughTex
            if (metalTex) mat.metalnessMap = metalTex
            mat.needsUpdate = true
          }
        })

        scene.add(currentRoot)
      }
      resize()
    } catch (err) {
      console.error('[ThreePreview] failed to load assets', err)
      addPlaceholder()
    }
  }

  onMounted(() => {
    ensureRenderer()
    resize()
    renderFrame()
    void loadGLBAndTextures()
  })

  watch(
    () => products.activeStyleDetails,
    () => {
      void loadGLBAndTextures()
    }
  )

  onBeforeUnmount(() => {
    if (animationId != null) cancelAnimationFrame(animationId)
    if (renderer) {
      renderer.dispose()
      renderer = null
    }
    if (scene) {
      clearSceneContent()
    }
    scene = null
    camera = null
  })
</script>

<template>
  <div ref="containerEl" class="relative w-full h-full grid place-items-end" />
</template>

<style scoped></style>
