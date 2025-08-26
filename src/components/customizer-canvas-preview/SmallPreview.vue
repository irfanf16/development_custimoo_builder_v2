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
  import { Card, CardContent } from '../ui/card'

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
    const targetW = (canvas.getWidth?.() || 132) - 4
    const targetH = (canvas.getHeight?.() || 132) - 4
    if ((obj.width || 0) > (obj.height || 0)) obj.scaleToWidth(targetW)
    else obj.scaleToHeight(targetH)
  }

  async function addDesignLayer(url: string, ext: string) {
    if (!canvas) return
    if (ext?.toLowerCase() === 'svg') {
      const { objects } = await loadSVGFromURL(fromStorage(url))
      const safe = (objects || []).filter(Boolean) as FabricObject[]
      const group = util.groupSVGElements(safe) as Group
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
    const design: any = productsStore.design
    const style: any = productsStore.style
    const side = productsStore.activeCanvasSide === 'front' ? 'back' : 'front'
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
    } else if (design.front_design) {
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

    // Fade in canvas element
    if (canvasEl.value) {
      canvasEl.value.style.opacity = '1'
    }

    canvas.requestRenderAll()
  }

  function handleClick() {
    productsStore.toggleActiveCanvasSide()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    canvas = new Canvas(canvasEl.value, {
      selection: false,
      enableRetinaScaling: true,
      hoverCursor: 'pointer'
    })
    canvas.setWidth(132)
    canvas.setHeight(132)
    renderPreview()
  })

  onBeforeUnmount(() => {
    if (canvas) {
      canvas.dispose()
      canvas = null
    }
  })

  watch(
    () => [
      productsStore.activeCanvasSide,
      (productsStore.design as any)?.id,
      (productsStore.style as any)?.id
    ],
    () => renderPreview()
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
