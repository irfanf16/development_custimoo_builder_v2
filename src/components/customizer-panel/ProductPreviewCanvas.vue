<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, watch, type PropType } from 'vue'
  import {
    Canvas,
    FabricImage,
    Group,
    loadSVGFromURL,
    util,
    type FabricObject
  } from 'fabric'
  import type {
    OutputProductBase,
    OutputProductStyleBase,
    OutputProductStyleDesignBase
  } from '@/services/products/types'

  const props = defineProps({
    product: { type: Object as PropType<OutputProductBase>, required: true },
    styleBase: {
      type: Object as PropType<OutputProductStyleBase>,
      required: true
    },
    designBase: {
      type: Object as PropType<OutputProductStyleDesignBase>,
      required: true
    },
    width: { type: Number, default: 176 },
    height: { type: Number, default: 176 }
  })

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  let canvas: Canvas | null = null

  const storageBase =
    (import.meta.env.VITE_APP_STORAGE_URL as string) ||
    'https://custimoo-development.s3.us-east-1.amazonaws.com/'

  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path.startsWith('/') ? path.slice(1) : path
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
    if ((img.width || 0) > (img.height || 0)) {
      img.scaleToWidth(props.width - 8)
    } else {
      img.scaleToHeight(props.height - 8)
    }
    img.set({
      hasControls: false,
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

  async function addDesignLayer(url: string, ext: string) {
    if (!canvas) return
    if (ext.toLowerCase() === 'svg') {
      const { objects } = await loadSVGFromURL(fromStorage(url))
      const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
      const group = util.groupSVGElements(safeObjects) as Group
      if ((group.width || 0) > (group.height || 0)) {
        group.scaleToWidth(props.width - 8)
      } else {
        group.scaleToHeight(props.height - 8)
      }
      group.set({
        hasControls: false,
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
      if ((img.width || 0) > (img.height || 0)) {
        img.scaleToWidth(props.width - 8)
      } else {
        img.scaleToHeight(props.height - 8)
      }
      img.set({
        hasControls: false,
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
    canvas.clear()

    await addDesignLayer(
      props.designBase.front_design.file_url,
      props.designBase.front_design.file_extension
    )

    for (const m of props.styleBase.front_models || []) {
      const comp =
        (m.composition as 'multiply' | 'screen') === 'multiply'
          ? 'multiply'
          : 'screen'
      await addModelLayer(m.file_url, comp as GlobalCompositeOperation)
    }

    canvas.requestRenderAll()
  }

  onMounted(() => {
    if (!canvasEl.value) return
    canvas = new Canvas(canvasEl.value, {
      enableRetinaScaling: true,
      selection: false
    })
    canvas.setWidth(props.width)
    canvas.setHeight(props.height)
    renderPreview()
  })

  watch(
    () => [props.product.id, props.styleBase.id, props.designBase.id],
    () => {
      renderPreview()
    }
  )

  onBeforeUnmount(() => {
    if (canvas) {
      canvas.dispose()
      canvas = null
    }
  })
</script>

<template>
  <canvas ref="canvasEl" :width="width" :height="height" class="rounded-xl" />
</template>
