<script setup lang="ts">
  import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
  import {
    Card,
    CardHeader,
    CardContent,
    CardFooter
  } from '@/components/ui/card'
  import { useUIStore } from '@/stores/ui/ui.store'

  interface Props {
    expandable?: boolean
    isExpanded?: boolean
    contentKey?: string | number
  }

  interface Emits {
    (e: 'update:isExpanded', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    expandable: false,
    isExpanded: false,
    contentKey: undefined
  })

  const emit = defineEmits<Emits>()

  // Use computed to get the current expanded state from props
  const isExpanded = computed(() => props.isExpanded)

  // Get UI store for container height
  const uiStore = useUIStore()

  // Compute 90% of container height
  const maxHeight = computed(() => {
    const height = uiStore.containerHeight
    return height > 0 ? `${Math.round(height * 0.95)}px` : '90vh'
  })

  const cardContentRef = ref<HTMLElement | null>(null)

  // Collapse panel when switching to a different content key (panel)
  watch(
    () => props.contentKey,
    () => {
      emit('update:isExpanded', false)
    }
  )

  /**
   * Scrolls to a specific element within the scrollable container
   * @param elementId - The ID of the element to scroll to
   * @param behavior - Scroll behavior: 'auto' for instant, 'smooth' for animated
   */
  function scrollToElement(
    elementId: string,
    behavior: 'smooth' | 'auto' = 'auto'
  ) {
    if (!cardContentRef.value) return

    nextTick(() => {
      if (!cardContentRef.value) return

      const container = cardContentRef.value
      const targetElement = container.querySelector(`#${elementId}`)

      if (!targetElement) return

      const containerHeight = container.clientHeight
      const elementHeight = (targetElement as HTMLElement).offsetHeight

      // Calculate element position relative to container's scrollable content
      const elementRect = targetElement.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const elementTop =
        elementRect.top - containerRect.top + container.scrollTop
      const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2

      if (behavior === 'auto') {
        // Instant scroll to center the element
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'auto'
        })
      } else {
        // Smooth scroll with visibility optimization
        const isElementVisible =
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom

        if (!isElementVisible) {
          // Element not visible: scroll to bring it into view
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
        } else {
          // Element visible: just center it smoothly
          const elementCenter = elementRect.top + elementHeight / 2
          const containerCenter = containerRect.top + containerHeight / 2
          const scrollAdjustment = elementCenter - containerCenter

          container.scrollBy({
            top: scrollAdjustment,
            behavior: 'smooth'
          })
        }
      }
    })
  }

  /**
   * Prevents scroll events from bubbling up to parent containers
   */
  function handleScroll(event: Event) {
    if (cardContentRef.value && event.target === cardContentRef.value) {
      event.stopPropagation()
    }
  }

  onMounted(() => {
    // Add scroll event listener to prevent bubbling
    nextTick(() => {
      if (cardContentRef.value) {
        cardContentRef.value.addEventListener('scroll', handleScroll, {
          passive: true
        })
      }
    })
  })

  onUnmounted(() => {
    // Clean up event listener
    if (cardContentRef.value) {
      cardContentRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  // Expose scroll function to parent components
  defineExpose({
    scrollToElement: (
      elementId: string,
      behavior: 'smooth' | 'auto' = 'auto'
    ) => scrollToElement(elementId, behavior)
  })
</script>

<template>
  <div
    :class="['relative w-[28rem]', isExpanded ? 'z-20 max-w-none' : '']"
    :style="{ maxHeight }"
  >
    <Card
      class="h-full rounded-2xl justify-start transition-all duration-300 ease-in-out gap-0 md:gap-0 overflow-hidden flex flex-col py-0"
      :class="isExpanded ? 'w-[75vw]' : 'w-[470px]'"
      :style="{ maxHeight }"
    >
      <!-- Header slot - panels can provide their own header content -->
      <template v-if="$slots.header">
        <CardHeader
          class="pb-4 pt-0 px-4 md:pb-6 md:px-6 flex flex-row items-center justify-between gap-2 min-h-[4.5rem] max-h-[18rem] flex-shrink-0"
        >
          <slot name="header" :is-expanded="isExpanded" />
        </CardHeader>
      </template>

      <CardContent class="p-0 px-0 md:p-0 md:px-0 flex-1 min-h-0">
        <!-- Content slot for different panel types -->
        <Transition name="panel-slide" mode="out-in" appear>
          <div
            ref="cardContentRef"
            :key="props.contentKey"
            class="h-full overflow-y-auto max-h-[70vh]"
          >
            <!-- class="h-full overflow-y-auto [scrollbar-gutter:stable] max-h-[60vh]"
          > -->
            <slot :is-expanded="isExpanded" />
          </div>
        </Transition>
      </CardContent>

      <!-- Footer actions -->
      <template v-if="$slots.footer">
        <CardFooter class="px-4 md:px-6 flex-shrink-0 py-4 md:py-6 border-t">
          <slot name="footer" :is-expanded="isExpanded" />
        </CardFooter>
      </template>
    </Card>
  </div>
</template>

<style scoped>
  /* Content slide/fade transitions */
  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }

  .panel-slide-enter-from {
    opacity: 0;
    transform: translateX(12px);
  }

  .panel-slide-leave-to {
    opacity: 0;
    transform: translateX(-12px);
  }
</style>
