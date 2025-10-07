<script setup lang="ts">
  import { ref, nextTick, onMounted, onUnmounted } from 'vue'
  import {
    Card,
    CardHeader,
    CardContent,
    CardFooter
  } from '@/components/ui/card'
  import { ScrollArea } from '@/components/ui/scroll-area'

  interface Props {
    expandable?: boolean
    isExpanded?: boolean
    contentKey?: string | number
  }

  const props = withDefaults(defineProps<Props>(), {
    expandable: false,
    isExpanded: false,
    contentKey: undefined
  })

  const cardContentRef = ref<HTMLElement | null>(null)

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
  <div class="h-full w-full" :class="[]">
    <!-- <Card
      class="rounded-2xl justify-start gap-0 md:gap-0 overflow-hidden flex flex-col py-0 max-h-full"
    > -->
    <Card
      class="justify-start gap-0 md:gap-0 overflow-hidden flex flex-col py-0 max-h-full"
    >
      <!-- Header slot - panels can provide their own header content -->
      <template v-if="$slots.header">
        <!-- <CardHeader
          class="pb-4 pt-0 px-4 md:pb-6 md:px-6 flex flex-row items-center justify-between gap-2 min-h-[4.5rem] max-h-[18rem] flex-shrink-0"
        > -->
        <CardHeader
          class="pb-4 pt-0 px-4 md:pb-6 md:px-6 flex flex-row items-center justify-between gap-2 min-h-[4.5rem] max-h-[18rem] flex-shrink-0"
        >
          <slot name="header" :is-expanded="false" />
        </CardHeader>
      </template>

      <!-- <CardContent class="h-full p-0 px-0 md:p-0 md:px-0 min-h-0"> -->
      <CardContent class="h-full p-0 px-0 md:p-0 md:px-0 min-h-0">
        <ScrollArea class="">
          <!-- <div class="max-h-full"> -->
          <div class="max-h-[calc(65vh-10rem)]">
            <!-- Content slot for different panel types -->
            <Transition name="panel-slide" mode="out-in" appear>
              <div
                ref="cardContentRef"
                :key="props.contentKey"
                class="overflow-y-auto"
              >
                <slot />
              </div>
            </Transition>
          </div>
        </ScrollArea>
      </CardContent>

      <!-- Footer actions -->
      <template v-if="$slots.footer">
        <!-- <CardFooter class="px-4 md:px-6 flex-shrink-0 py-4 md:py-6 border-t"> -->
        <CardFooter class="">
          <slot name="footer" />
        </CardFooter>
      </template>
    </Card>
  </div>
</template>
