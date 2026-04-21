<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref } from 'vue'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import type { PropType } from 'vue'
  import type { OutputProductText } from '@/services/products/types'

  defineProps({
    id: { type: Number, default: undefined },
    /** Fabric buffer when set; avoids clearing bitmap when `canvasWidth`/`canvasHeight` change (e.g. compact rail). */
    canvasBitmapWidth: { type: Number, default: undefined },
    canvasBitmapHeight: { type: Number, default: undefined },
    models: {
      type: Array as PropType<
        Array<{ composition: 'multiply' | 'screen'; file_url: string; thumb_sm_url: string }>
      >,
      default: undefined
    },
    design: {
      type: Object as PropType<{ file_url: string; file_extension: string }>,
      default: undefined
    },
    svgParts: {
      type: Array as PropType<string[] | string>,
      default: undefined
    },
    canvasWidth: { type: Number, default: 176 },
    canvasHeight: { type: Number, default: 176 },
    canvasClass: { type: String, default: 'rounded-xl' },
    productId: { type: Number, default: undefined },
    applyCustomizationColors: { type: Boolean, default: false },
    previewCustomTexts: {
      type: Array as PropType<OutputProductText[] | null>,
      default: undefined
    }
  })

  const containerEl = ref<HTMLElement | null>(null)
  /**
   * Once the tile has intersected, keep `TwoDScene` mounted. Toggling `v-if` on brief IO false
   * during compact↔main layout changes caused full remounts and empty previews.
   */
  const keepSceneMounted = ref(false)
  let io: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && containerEl.value) {
      io = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          if (entry?.isIntersecting) keepSceneMounted.value = true
        },
        { root: null, rootMargin: '200px', threshold: 0.01 }
      )
      io.observe(containerEl.value)
    } else {
      keepSceneMounted.value = true
    }
  })

  onBeforeUnmount(() => {
    if (io && containerEl.value) io.unobserve(containerEl.value)
    if (io) io.disconnect()
  })
</script>

<template>
  <div
    ref="containerEl"
    :class="['relative', canvasClass]"
    :style="{ width: `${canvasWidth / 16}rem`, height: `${canvasHeight / 16}rem` }"
  >
    <TwoDScene
      v-if="keepSceneMounted"
      :id="id"
      :models="models"
      :design="design"
      :svg-parts="svgParts"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      :canvas-bitmap-width="canvasBitmapWidth"
      :canvas-bitmap-height="canvasBitmapHeight"
      :canvas-class="canvasClass"
      :product-id="productId"
      :apply-customization-colors="applyCustomizationColors"
      :preview-custom-texts="previewCustomTexts"
    />

    <div v-if="!keepSceneMounted" class="absolute inset-0 rounded-xl overflow-hidden bg-muted/50">
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div
          class="relative bg-muted/60 rounded-lg"
          :style="{
            width: '70%',
            height: '85%'
          }"
        >
          <div
            class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"
          />
        </div>
      </div>
      <div class="absolute inset-0 bg-muted/20 animate-pulse" />
    </div>
  </div>
</template>
