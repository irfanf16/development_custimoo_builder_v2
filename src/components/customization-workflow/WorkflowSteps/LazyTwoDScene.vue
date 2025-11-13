<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref } from 'vue'
  import TwoDScene from '@/components/scene/TwoDScene.vue'
  import type { PropType } from 'vue'

  // Forward all TwoDScene props
  defineProps({
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
    canvasWidth: { type: Number, default: 176 },
    canvasHeight: { type: Number, default: 176 },
    canvasClass: { type: String, default: 'rounded-xl' },
    productId: { type: Number, default: undefined }
  })

  const containerEl = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  let io: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && containerEl.value) {
      io = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          const nowVisible = !!entry?.isIntersecting
          isVisible.value = nowVisible
        },
        { root: null, rootMargin: '100px 0px', threshold: 0.01 }
      )
      io.observe(containerEl.value)
    } else {
      // Fallback: assume visible immediately
      isVisible.value = true
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
      v-if="isVisible"
      :models="models"
      :design="design"
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      :canvas-class="canvasClass"
      :product-id="productId"
    />

    <!-- Skeleton loader matching canvas dimensions -->
    <div v-if="!isVisible" class="absolute inset-0 rounded-xl overflow-hidden bg-muted/50">
      <!-- Main product silhouette skeleton -->
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div
          class="relative bg-muted/60 rounded-lg"
          :style="{
            width: '70%',
            height: '85%'
          }"
        >
          <!-- Subtle shimmer effect -->
          <div
            class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"
          />
        </div>
      </div>

      <!-- Pulsing overlay for additional loading effect -->
      <div class="absolute inset-0 bg-muted/20 animate-pulse" />
    </div>
  </div>
</template>
