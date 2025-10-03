<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
  import * as THREE from 'three'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProductsStore } from '@/stores/products/products.store'

  const ui = useUIStore()
  const products = useProductsStore()
  const containerEl = ref<HTMLDivElement | null>(null)

  let renderer: any = null
  let scene: any = null
  let camera: any = null
  let animationId: number | null = null
  let currentRoot: any = null
  const loadedTextures: any[] = []

  const storageBase =
    (import.meta as { env?: { VITE_APP_STORAGE_URL?: string } }).env
      ?.VITE_APP_STORAGE_URL || ''
  function fromStorage(path?: string | null): string | null {
    if (!path) return null
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  function disposeObject3D(obj: any) {
    obj.traverse((child: any) => {
      if (child.isMesh) {
        const mesh = child
        if (mesh.geometry) {
          mesh.geometry.dispose()
        }
        const material = mesh.material as any
        const list = Array.isArray(material)
          ? material
          : material
            ? [material]
            : []
        list.forEach(m => {
          const material = m
          if (material.map) material.map.dispose()
          if (material.aoMap) material.aoMap.dispose()
          if (material.roughnessMap) material.roughnessMap.dispose()
          if (material.metalnessMap) material.metalnessMap.dispose()
          if (material.alphaMap) material.alphaMap.dispose()
          m.dispose()
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
    const w = ui.containerWidth || 800
    const h = ui.containerHeight || 600
    if (!renderer) {
      renderer = new (THREE as any).WebGLRenderer({
        antialias: true,
        alpha: true
      })
      // @ts-ignore - supported in r179+
      renderer.outputColorSpace = (THREE as any).SRGBColorSpace
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(w, h)
      containerEl.value.appendChild(renderer.domElement)
    } else {
      renderer.setSize(w, h)
    }
    if (!scene) scene = new (THREE as any).Scene()
    if (!camera) {
      camera = new (THREE as any).PerspectiveCamera(45, w / h, 0.1, 1000)
      camera.position.set(0, 0, 5)
    }
    // basic lighting
    if (scene.children.filter((c: any) => c.isLight).length === 0) {
      const hemi = new (THREE as any).HemisphereLight(0xffffff, 0x444444, 1)
      hemi.position.set(0, 1, 0)
      scene.add(hemi)
      const dir = new (THREE as any).DirectionalLight(0xffffff, 1)
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
    const w = ui.containerWidth || 800
    const h = ui.containerHeight || 600
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function addPlaceholder() {
    if (!scene) return
    clearSceneContent()
    const geom = new (THREE as any).SphereGeometry(1, 32, 32)
    const mat = new (THREE as any).MeshStandardMaterial({ color: 0xffffff })
    const mesh = new (THREE as any).Mesh(geom, mat)
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
    const texLoader = new (THREE as any).TextureLoader()

    try {
      const [gltf, colorTex, alphaTex, aoTex, roughTex, metalTex] =
        await Promise.all([
          gltfLoader.loadAsync(modelUrl),
          baseTexUrl
            ? texLoader.loadAsync(baseTexUrl).catch((err: unknown) => {
                console.log('[3D] base texture load error', err)
                return null
              })
            : Promise.resolve(null),
          alphaUrl
            ? texLoader.loadAsync(alphaUrl).catch((err: unknown) => {
                console.log('[3D] alpha map load error', err)
                return null
              })
            : Promise.resolve(null),
          aoUrl
            ? texLoader.loadAsync(aoUrl).catch((err: unknown) => {
                console.log('[3D] ao map load error', err)
                return null
              })
            : Promise.resolve(null),
          roughnessUrl
            ? texLoader.loadAsync(roughnessUrl).catch((err: unknown) => {
                console.log('[3D] roughness map load error', err)
                return null
              })
            : Promise.resolve(null),
          metalnessUrl
            ? texLoader.loadAsync(metalnessUrl).catch((err: unknown) => {
                console.log('[3D] metalness map load error', err)
                return null
              })
            : Promise.resolve(null)
        ])

      ;[colorTex, alphaTex, aoTex, roughTex, metalTex].forEach(
        t => t && loadedTextures.push(t)
      )

      currentRoot = gltf.scene
      // Center and scale the model to fit a canonical view
      const box = new (THREE as any).Box3().setFromObject(currentRoot)
      const size = new (THREE as any).Vector3()
      const center = new (THREE as any).Vector3()
      box.getSize(size)
      box.getCenter(center)
      currentRoot.position.sub(center)
      const maxAxis = Math.max(size.x, size.y, size.z)
      if (maxAxis > 0) currentRoot.scale.multiplyScalar(2.2 / maxAxis)

      // Apply textures if available
      currentRoot.traverse((obj: any) => {
        if (obj.isMesh) {
          const mesh = obj
          const mat = mesh.material
          if (mat) {
            if (colorTex) {
              mat.map = colorTex
              // @ts-ignore - ensure correct color space
              mat.map.colorSpace = (THREE as any).SRGBColorSpace
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
        }
      })

      scene.add(currentRoot)
      resize()
    } catch (err) {
      console.log('[3D] GLB load error', err)
      addPlaceholder()
    }
  }

  onMounted(() => {
    ensureRenderer()
    resize()
    renderFrame()
    loadGLBAndTextures()
  })

  watch(
    () => products.activeStyleDetails,
    () => {
      loadGLBAndTextures()
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
