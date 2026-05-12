<script setup lang="ts">
  import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
  import { Card, CardHeader, CardFooter } from '@/components/ui/card'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useScrollAreaFill } from '@/composables/useScrollAreaFill'
  import { useUIStore } from '@/stores/ui/ui.store'
  import type { HeaderConfiguration } from './types'
  // import { usePricing } from '@/composables/usePricing'

  interface Props {
    headerConfig?: HeaderConfiguration
    isExpanded?: boolean
    contentKey?: string | number
  }

  interface Emits {
    (e: 'update:isExpanded', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    headerConfig: undefined,
    isExpanded: false,
    contentKey: undefined
  })

  const emit = defineEmits<Emits>()

  const uiStore = useUIStore()
  // const { showPricing } = usePricing()
  // Use computed to get the current expanded state from props
  const isExpanded = computed(() => !uiStore.isMobile && props.isExpanded)

  const cardContentRef = ref<HTMLElement | null>(null)
  const panelShellRef = ref<HTMLElement | null>(null)
  const panelHeaderMeasureRef = ref<HTMLElement | null>(null)
  const panelFooterMeasureRef = ref<HTMLElement | null>(null)

  const { scrollAreaStyle } = useScrollAreaFill({
    shellRef: panelShellRef,
    headerRef: panelHeaderMeasureRef,
    footerRef: panelFooterMeasureRef
  })

  function getScrollContainer(): HTMLElement | null {
    const inner = cardContentRef.value
    if (!inner) return null
    const viewport = inner.closest<HTMLElement>('[data-reka-scroll-area-viewport]')
    return viewport ?? inner
  }

  const desktopPreviewCompact = computed(() => uiStore.desktopPreviewCompact)

  // Computed classes for responsive styling
  const containerClasses = computed(() => {
    if (uiStore.isMobile) {
      return 'h-full w-full'
    }
    const compact = desktopPreviewCompact.value
    if (compact) {
      // Fixed widths (min = max): avoids `w-full` + `shrink` collapsing the panel when content is short.
      if (isExpanded.value) {
        // Same flex footprint as collapsed; wide surface comes from the Card (`w-[75vw]`) so we overlay
        // ProductPreview like non-compact expanded — do not widen this shell or the row pushes the canvas.
        return [
          'h-full max-h-full shrink-0 z-widget-workflow-expanded max-w-none min-w-0 overflow-visible',
          'w-[14rem] min-w-[14rem] max-w-[14rem]',
          'md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]',
          'lg:w-[21rem] lg:min-w-[21rem] lg:max-w-[21rem]'
        ].join(' ')
      }
      return [
        'h-full max-h-full',
        'w-[14rem] min-w-[14rem] max-w-[14rem] shrink-0',
        'md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]',
        'lg:w-[21rem] lg:min-w-[21rem] lg:max-w-[21rem]'
      ].join(' ')
    }
    const parts = ['h-full max-h-full min-w-0', 'md:w-[20rem] lg:w-[29rem]']
    if (isExpanded.value) {
      parts.push('z-widget-workflow-expanded max-w-none')
    }
    return parts.join(' ')
  })

  const cardClasses = computed(() => {
    if (uiStore.isMobile) {
      return 'justify-start gap-0 overflow-hidden flex flex-col h-full max-h-full min-h-0 rounded-t-none rounded-b-2xl bg-background text-card-foreground opacity-100'
    }
    const baseClasses =
      'rounded-2xl justify-start gap-0 md:gap-0 overflow-hidden flex flex-col max-h-full! h-full! min-h-0 min-w-0 transition-width duration-200 md:py-3!'
    const compact = desktopPreviewCompact.value
    const widthRule = isExpanded.value
      ? compact
        ? 'w-[75vw] min-w-0'
        : 'w-[75vw]'
      : compact
        ? 'w-full max-w-full'
        : 'max-w-[29rem] w-full'
    return [baseClasses, widthRule]
  })

  const footerClasses = computed(() => {
    if (uiStore.isMobile) {
      return 'border-t pt-2!'
    }
    return 'px-2 md:px-2 flex-shrink-0 pt-2! md:pt-2! border-t'
  })

  /**
   * Scrolls to a specific element within the scrollable container
   * @param elementId - The ID of the element to scroll to
   * @param behavior - Scroll behavior: 'auto' for instant, 'smooth' for animated
   */
  function scrollToElement(elementId: string, behavior: 'smooth' | 'auto' = 'auto') {
    if (!cardContentRef.value) return

    nextTick(() => {
      if (!cardContentRef.value) return

      const container = getScrollContainer()
      if (!container) return
      const targetElement = container.querySelector(`#${elementId}`)

      if (!targetElement) return

      const containerHeight = container.clientHeight
      const elementHeight = (targetElement as HTMLElement).offsetHeight

      // Calculate element position relative to container's scrollable content
      const elementRect = targetElement.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const elementTop = elementRect.top - containerRect.top + container.scrollTop
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
          elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom

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
    const el = getScrollContainer()
    if (el && event.target === el) {
      event.stopPropagation()
    }
  }

  let scrollCleanup: (() => void) | undefined

  function attachScrollListener() {
    scrollCleanup?.()
    scrollCleanup = undefined
    nextTick(() => {
      const el = getScrollContainer()
      if (el) {
        el.addEventListener('scroll', handleScroll, { passive: true })
        scrollCleanup = () => el.removeEventListener('scroll', handleScroll)
      }
    })
  }

  watch(
    () => props.contentKey,
    () => {
      if (!uiStore.isMobile) {
        emit('update:isExpanded', false)
      }
      attachScrollListener()
    }
  )

  onMounted(() => {
    attachScrollListener()
  })

  onUnmounted(() => {
    scrollCleanup?.()
  })

  // Expose scroll function to parent components
  defineExpose({
    scrollToElement: (elementId: string, behavior: 'smooth' | 'auto' = 'auto') =>
      scrollToElement(elementId, behavior)
  })
</script>

<template>
  <div data-testid="workflow-panel-root" :class="containerClasses">
    <Card data-testid="workflow-panel-card" :class="cardClasses">
      <div ref="panelShellRef" class="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <template v-if="$slots.header">
          <div ref="panelHeaderMeasureRef" class="shrink-0">
            <CardHeader
              class="pb-2 pt-0 px-2 md:pb-2 md:px-2 flex flex-row items-center justify-between gap-2"
            >
              <slot name="header" :is-expanded="isExpanded" />
            </CardHeader>
          </div>
        </template>

        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <ScrollArea
            data-testid="workflow-panel-scroll"
            :style="scrollAreaStyle"
            class="min-h-0 min-w-0 flex-1"
          >
            <Transition name="panel-slide" mode="out-in" appear>
              <div ref="cardContentRef" :key="props.contentKey" class="min-h-0 w-full">
                <slot :is-expanded="isExpanded" />
              </div>
            </Transition>
          </ScrollArea>
        </div>

        <template v-if="$slots.footer">
          <div ref="panelFooterMeasureRef" class="mt-auto shrink-0">
            <Transition name="fade" mode="out-in" appear>
              <CardFooter :class="footerClasses">
                <slot name="footer" :is-expanded="isExpanded" />
              </CardFooter>
            </Transition>
          </div>
        </template>
      </div>
    </Card>
  </div>
</template>
