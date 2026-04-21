<script setup lang="ts">
  import { computed, inject } from 'vue'
  import { CUSTOMIZER_MAIN_CANVAS_PX } from '@/lib/customizerCanvasInjectKeys'
  import { storeToRefs } from 'pinia'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { Spinner } from '@/components/ui/spinner'
  import { useUIStore } from '@/stores/ui/ui.store'
  import ThreeDScene from '@/components/scene/ThreeDScene.vue'

  const productsStore = useProductsStore()
  const { activeProductDetails, activeDesignCustomTexts } = storeToRefs(productsStore)
  const workflowStore = useWorkflowStore()
  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  const mainTwoDCanvasPx = inject(
    CUSTOMIZER_MAIN_CANVAS_PX,
    computed(() => 600)
  )

  /** 3D column tracks the same row sizing as 2D, capped for layout. */
  const mainThreeDContainerSize = computed(() => Math.min(600, mainTwoDCanvasPx.value))

  const is3dProduct = computed(() => !!activeProductDetails.value?.is_3d_product)
</script>

<template>
  <div
    id="3d-or-2d-preview"
    ref="previewContainer"
    :aria-busy="!productsStore.mainPreviewLoadComplete"
    :class="[
      'relative flex min-h-0 min-w-0 flex-col overflow-hidden',
      /* Mobile: full width, vertically centred. Desktop: shrink to canvas bitmap so the loader matches it exactly. */
      isMobile
        ? 'h-full w-full items-center justify-center'
        : 'h-fit w-fit max-w-full shrink-0 items-start justify-start'
    ]"
    :style="
      !isMobile
        ? {
            maxWidth: `${mainTwoDCanvasPx}px`,
            maxHeight: `${mainTwoDCanvasPx}px`
          }
        : undefined
    "
  >
    <ThreeDScene
      v-if="activeProductDetails?.is_3d_product"
      :main-preview="true"
      :container-width="mainThreeDContainerSize"
      :container-height="mainThreeDContainerSize"
      :preview-custom-texts="activeDesignCustomTexts"
    />
    <TwoDScene
      v-else
      :side="workflowStore.activeCanvasSide"
      :main-preview="true"
      :enable-zoom="true"
      :canvas-width="mainTwoDCanvasPx"
      :canvas-height="mainTwoDCanvasPx"
      lock-display-to-canvas-pixels
    />

    <Transition name="preview-scene-loading">
      <div
        v-if="!productsStore.mainPreviewLoadComplete"
        class="absolute inset-0 w-full h-full z-[1] flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-md ring-1 ring-border/50 cursor-wait"
        :class="{ 'max-h-[700px]': is3dProduct }"
      >
        <Spinner class="size-7 text-primary" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .preview-scene-loading-enter-active,
  .preview-scene-loading-leave-active {
    transition: opacity 0.2s ease;
  }
  .preview-scene-loading-enter-from,
  .preview-scene-loading-leave-to {
    opacity: 0;
  }
</style>
