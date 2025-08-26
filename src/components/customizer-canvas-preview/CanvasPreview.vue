<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import {
    Canvas,
    FabricImage,
    Group,
    loadSVGFromURL,
    util,
    type FabricObject
  } from 'fabric'

  const productsStore = useProductsStore()

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  let canvas: Canvas | null = null

  const storageBase = import.meta.env.VITE_APP_STORAGE_URL
  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  async function addModelLayer(
    url: string,
    composition: GlobalCompositeOperation
  ) {
    if (!canvas) return
    const img = await FabricImage.fromURL(fromStorage(url), {
      crossOrigin: 'anonymous'
    })
    fitObject(img)
    img.set({
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
      globalCompositeOperation: composition
    })
    canvas.add(img)
    canvas.viewportCenterObject(img)
    img.setCoords()
  }

  function fitObject(obj: any) {
    if (!canvas) return
    const targetW = (canvas.getWidth?.() || 800) - 8
    const targetH = (canvas.getHeight?.() || 800) - 8
    if ((obj.width || 0) > (obj.height || 0)) obj.scaleToWidth(targetW)
    else obj.scaleToHeight(targetH)
  }

  async function addDesignLayer(url: string, ext: string) {
    if (!canvas) return
    if (!url) return
    if (ext?.toLowerCase() === 'svg') {
      const { objects } = await loadSVGFromURL(fromStorage(url))
      const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
      const group = util.groupSVGElements(safeObjects) as Group
      fitObject(group)
      group.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.add(group)
      canvas.viewportCenterObject(group)
      group.setCoords()
    } else {
      const img = await FabricImage.fromURL(fromStorage(url), {
        crossOrigin: 'anonymous'
      })
      fitObject(img)
      img.set({
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      })
      canvas.add(img)
      canvas.viewportCenterObject(img)
      img.setCoords()
    }
  }

  async function renderPreview() {
    if (!canvas) return

    // Fade out canvas element
    if (canvasEl.value) {
      canvasEl.value.style.opacity = '0'
    }

    // Wait for fade out
    await new Promise(resolve => setTimeout(resolve, 150))

    canvas.clear()
    const side = productsStore.activeCanvasSide
    const design: any = productsStore.design
    const style: any = productsStore.style
    if (!design || !style) return

    if (side === 'back' && design.back_design) {
      await addDesignLayer(
        design.back_design.file_url,
        design.back_design.file_extension
      )
      for (const m of style.back_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp)
      }
    } else {
      await addDesignLayer(
        design.front_design.file_url,
        design.front_design.file_extension
      )
      for (const m of style.front_models || []) {
        const comp = (
          m.composition === 'multiply' ? 'multiply' : 'screen'
        ) as GlobalCompositeOperation
        await addModelLayer(m.file_url, comp)
      }
    }

    canvas.setZoom(productsStore.canvasZoom)

    // Fade in canvas element
    if (canvasEl.value) {
      canvasEl.value.style.opacity = '1'
    }

    canvas.requestRenderAll()
  }

  function updateCanvasSize() {
    if (!canvas) return
    const w = window.innerWidth || 1200
    const h = window.innerHeight || 800
    canvas.setWidth(w)
    canvas.setHeight(h)
  }

  function handleResize() {
    updateCanvasSize()
    renderPreview()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    canvas = new Canvas(canvasEl.value, {
      selection: false,
      enableRetinaScaling: true
    })
    updateCanvasSize()
    window.addEventListener('resize', handleResize)
    renderPreview()
  })

  onBeforeUnmount(() => {
    if (canvas) {
      canvas.dispose()
      canvas = null
    }
    window.removeEventListener('resize', handleResize)
  })

  watch(
    () => [
      productsStore.activeCanvasSide,
      (productsStore.design as any)?.id,
      (productsStore.style as any)?.id
    ],
    () => renderPreview()
  )

  watch(
    () => productsStore.canvasZoom,
    z => {
      if (!canvas) return
      canvas.setZoom(z)
      canvas.requestRenderAll()
    }
  )
</script>

<template>
  <div class="relative z-0">
    <div class="absolute inset-0 z-0 pointer-events-none max-w-full max-h-full">
      <div class="w-full h-full grid place-items-center">
        <canvas
          ref="canvasEl"
          class="rounded-[32px] transition-opacity duration-300"
        />
      </div>
    </div>
  </div>
</template>
