<template>
  <div
    class="relative inline-block overflow-hidden rounded-lg shadow-lg cursor-zoom-in"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
  >
    <!-- Zoomable Image -->
    <img
      ref="imageRef"
      :src="imageSrc"
      :alt="imageAlt"
      class="block max-w-full h-auto will-change-transform object-cover w-full"
      :class="{ 'cursor-zoom-out': showZoom }"
      :style="imageStyles"
      @load="handleImageLoad"
    />

    <!-- Zoom indicator in corner -->
    <div
      v-if="showZoom && imageLoaded"
      class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full pointer-events-none transition-opacity duration-200"
      :style="{ opacity: showZoom ? 1 : 0 }"
    >
      {{ zoomFactor }}x
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'

  interface Props {
    imageSrc: string
    imageAlt?: string
    zoomFactor?: number
    lensSize?: number
    showLens?: boolean
    transitionDuration?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    imageAlt: 'Zoomable image',
    zoomFactor: 2,
    lensSize: 80,
    showLens: true,
    transitionDuration: 300
  })

  // Refs
  const imageRef = ref<HTMLImageElement>()

  // State
  const showZoom = ref(false)
  const imageLoaded = ref(false)
  const isTransitioning = ref(false)

  // Mouse position - using non-reactive for performance
  let mouseX = 0
  let mouseY = 0
  let imageRect = { width: 0, height: 0, left: 0, top: 0 }

  // Animation frame ID for cleanup
  let animationFrameId: number | null = null
  let updateScheduled = false

  // Reactive styles that get updated via RAF
  const currentTransform = ref({
    scale: 1,
    originX: 50,
    originY: 50
  })

  const currentLensPosition = ref({
    x: 0,
    y: 0,
    opacity: 0
  })

  // Computed styles
  const imageStyles = computed(() => ({
    transform: `scale3d(${currentTransform.value.scale}, ${currentTransform.value.scale}, 1)`,
    transformOrigin: `${currentTransform.value.originX}% ${currentTransform.value.originY}%`,
    transition: isTransitioning.value
      ? `transform ${props.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : 'none'
  }))

  // Optimized update function using RAF
  const scheduleUpdate = () => {
    if (updateScheduled) return

    updateScheduled = true
    animationFrameId = requestAnimationFrame(() => {
      updateScheduled = false

      if (showZoom.value && imageLoaded.value) {
        // Calculate lens position
        const halfLens = props.lensSize / 2
        let lensX = mouseX - imageRect.left
        let lensY = mouseY - imageRect.top

        // Keep lens within boundaries
        lensX = Math.max(halfLens, Math.min(lensX, imageRect.width - halfLens))
        lensY = Math.max(halfLens, Math.min(lensY, imageRect.height - halfLens))

        // Calculate transform origin
        const originX = Math.max(0, Math.min(100, (lensX / imageRect.width) * 100))
        const originY = Math.max(0, Math.min(100, (lensY / imageRect.height) * 100))

        // Update reactive values
        currentTransform.value = {
          scale: props.zoomFactor,
          originX,
          originY
        }

        currentLensPosition.value = {
          x: lensX,
          y: lensY,
          opacity: 1
        }
      }
    })
  }

  // Event handlers
  const handleMouseMove = (event: MouseEvent) => {
    mouseX = event.clientX
    mouseY = event.clientY

    if (showZoom.value && imageLoaded.value) {
      scheduleUpdate()
    }
  }

  const handleMouseEnter = () => {
    showZoom.value = true
    isTransitioning.value = true

    // Remove transition after animation completes
    setTimeout(() => {
      isTransitioning.value = false
    }, props.transitionDuration)

    scheduleUpdate()
  }

  const handleMouseLeave = () => {
    showZoom.value = false
    isTransitioning.value = true

    // Cancel any pending updates
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
      updateScheduled = false
    }

    // Reset to default state
    currentTransform.value = {
      scale: 1,
      originX: 50,
      originY: 50
    }

    currentLensPosition.value = {
      x: 0,
      y: 0,
      opacity: 0
    }

    // Remove transition after animation completes
    setTimeout(() => {
      isTransitioning.value = false
    }, props.transitionDuration)
  }

  const handleImageLoad = () => {
    imageLoaded.value = true
    updateImageRect()
  }

  const updateImageRect = () => {
    if (imageRef.value) {
      const rect = imageRef.value.getBoundingClientRect()
      imageRect = {
        width: rect.width,
        height: rect.height,
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
      }
    }
  }

  // Throttled resize handler
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateImageRect, 100)
  }

  // Lifecycle
  onMounted(() => {
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', updateImageRect, { passive: true })

    if (imageRef.value?.complete) {
      handleImageLoad()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', updateImageRect)

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  })
</script>

<style scoped>
  .cursor-zoom-in {
    cursor: zoom-in;
  }

  .cursor-zoom-out {
    cursor: zoom-out;
  }

  /* Optimize for animations */
  img {
    backface-visibility: hidden;
    perspective: 1000px;
  }
</style>
