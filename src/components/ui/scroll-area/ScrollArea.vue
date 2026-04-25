<script setup lang="ts">
  import type { ScrollAreaRootProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit, useResizeObserver } from '@vueuse/core'
  import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import ScrollBar from './ScrollBar.vue'
  import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
  type Direction = 'vertical' | 'horizontal' | 'both'

  const props = withDefaults(
    defineProps<
      ScrollAreaRootProps & {
        class?: HTMLAttributes['class']
        direction?: Direction
      }
    >(),
    {
      type: 'scroll',
      class: undefined,
      direction: 'vertical'
    }
  )

  const delegatedProps = reactiveOmit(props, 'class', 'direction')

  const viewportRef = ref<InstanceType<typeof ScrollAreaViewport> | null>(null)
  const viewportEl = ref<HTMLElement | null>(null)
  const overflowY = ref(false)
  const overflowX = ref(false)

  function resolveViewportEl(): HTMLElement | null {
    const r = viewportRef.value as unknown
    if (!r) return null
    if (r instanceof HTMLElement) return r
    const el = (r as { $el?: unknown }).$el
    return el instanceof HTMLElement ? el : null
  }

  function updateOverflow() {
    const el = viewportEl.value
    if (!el) return
    const pad = 1
    overflowY.value = el.scrollHeight > el.clientHeight + pad
    overflowX.value = el.scrollWidth > el.clientWidth + pad
  }

  function syncViewportEl() {
    viewportEl.value = resolveViewportEl()
    updateOverflow()
  }

  /**
   * Scroll the nearest ancestor that can scroll (or the window). Embedded layouts often use
   * overflow on a div, not document.
   *
   * When the ScrollArea lives inside a dialog (e.g. the Locker Browser's product list) and
   * its own viewport has nothing to scroll — short locker, few products, etc. — this walker
   * used to happily climb out of the dialog subtree and scroll a page-level container behind
   * it, producing the "why does the background scroll?" bug. We now stop the walk at the
   * first `[role="dialog"]` ancestor so the forward is confined to the dialog, and swallow
   * the delta when nothing inside the dialog can consume it instead of chaining to window.
   */
  function scrollClosestScrollableAncestor(startFrom: HTMLElement, deltaY: number, deltaX: number) {
    let node: HTMLElement | null = startFrom.parentElement
    while (node) {
      if (node.getAttribute('role') === 'dialog') {
        return
      }
      const style = getComputedStyle(node)
      const oy = style.overflowY
      const ox = style.overflowX
      const canY =
        (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
        node.scrollHeight > node.clientHeight + 1
      const canX =
        (ox === 'auto' || ox === 'scroll' || ox === 'overlay') &&
        node.scrollWidth > node.clientWidth + 1
      if (canY || canX) {
        node.scrollTop += deltaY
        node.scrollLeft += deltaX
        return
      }
      node = node.parentElement
    }
    window.scrollBy({ top: deltaY, left: deltaX, behavior: 'auto' })
  }

  /** When the viewport is not scrollable, wheel events are otherwise captured by overflow:auto/scroll and never reach the page. */
  function onWheelForwardToPage(e: WheelEvent) {
    const el = e.currentTarget as HTMLElement
    const pad = 1
    const canScrollY = el.scrollHeight > el.clientHeight + pad
    const canScrollX = el.scrollWidth > el.clientWidth + pad

    if (props.direction === 'vertical' && !canScrollY) {
      scrollClosestScrollableAncestor(el, e.deltaY, e.deltaX)
      e.preventDefault()
      return
    }
    if (props.direction === 'horizontal' && !canScrollX) {
      scrollClosestScrollableAncestor(el, e.deltaY, e.deltaX)
      e.preventDefault()
      return
    }
    if (props.direction === 'both' && !canScrollY && !canScrollX) {
      scrollClosestScrollableAncestor(el, e.deltaY, e.deltaX)
      e.preventDefault()
    }
  }

  let mutationObserver: MutationObserver | null = null
  let wheelCleanup: (() => void) | null = null

  function attachWheelForward(el: HTMLElement) {
    wheelCleanup?.()
    wheelCleanup = null
    el.addEventListener('wheel', onWheelForwardToPage, { passive: false })
    wheelCleanup = () => {
      el.removeEventListener('wheel', onWheelForwardToPage)
      wheelCleanup = null
    }
  }

  watch(
    viewportRef,
    async () => {
      await nextTick()
      syncViewportEl()
    },
    { immediate: true }
  )

  watch(
    () => props.direction,
    () => {
      nextTick(() => updateOverflow())
    }
  )

  useResizeObserver(viewportEl, () => updateOverflow())

  watch(
    viewportEl,
    (el, prev) => {
      if (prev && prev !== el) {
        wheelCleanup?.()
        wheelCleanup = null
      }
      mutationObserver?.disconnect()
      mutationObserver = null
      if (el) {
        attachWheelForward(el)
        mutationObserver = new MutationObserver(() => updateOverflow())
        mutationObserver.observe(el, { childList: true, subtree: true, characterData: true })
      }
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    mutationObserver?.disconnect()
    mutationObserver = null
    wheelCleanup?.()
    wheelCleanup = null
  })

  /** Only advertise scroll for Reka/mobile CSS when there is real overflow (avoids trapping touch/wheel on empty regions). */
  const scrollableAttr = computed(() => {
    const d = props.direction
    if (d === 'vertical') return overflowY.value ? 'true' : undefined
    if (d === 'horizontal') return overflowX.value ? 'true' : undefined
    return overflowY.value || overflowX.value ? 'true' : undefined
  })

  const viewportOverscrollClass = computed(() => {
    const y = overflowY.value
    const x = overflowX.value
    switch (props.direction) {
      case 'vertical':
        return y ? 'overscroll-y-contain touch-pan-y' : 'overscroll-y-auto touch-auto'
      case 'horizontal':
        return x ? 'overscroll-x-contain touch-pan-x' : 'overscroll-x-auto touch-auto'
      case 'both':
        return cn(
          y ? 'overscroll-y-contain' : 'overscroll-y-auto',
          x ? 'overscroll-x-contain' : 'overscroll-x-auto',
          y && x ? 'touch-pan-x touch-pan-y' : y ? 'touch-pan-y' : x ? 'touch-pan-x' : 'touch-auto'
        )
      default:
        return 'overscroll-y-auto touch-auto'
    }
  })

  const viewportClass = computed(() => {
    switch (props.direction) {
      case 'horizontal':
        return 'overflow-x-auto overflow-y-hidden'
      case 'vertical':
        return 'overflow-y-auto overflow-x-hidden'
      case 'both':
        return 'overflow-auto'
      default:
        return 'overflow-y-auto overflow-x-hidden'
    }
  })
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative flex flex-col min-h-0', props.class)"
  >
    <ScrollAreaViewport
      ref="viewportRef"
      data-slot="scroll-area-viewport"
      :data-scrollable="scrollableAttr"
      :class="
        cn(
          'w-full flex-1 min-h-0 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px]',
          viewportOverscrollClass,
          viewportClass
        )
      "
      style="-webkit-overflow-scrolling: touch"
    >
      <slot />
    </ScrollAreaViewport>

    <!-- Keep scrollbar mounted to avoid DOM childList mutations on hover/scroll.
         In Shadow DOM, Reka's FocusScope may treat such mutations as "focused node removed"
         and focus the dialog container, which blurs inputs. -->
    <ScrollBar v-if="props.direction !== 'both'" :orientation="props.direction" force-mount />

    <!-- If both, show both scrollbars -->
    <template v-else>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </template>

    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

<!-- Only force overflow-y: scroll on mobile when there is scrollable content; otherwise wheel/touch stay trapped. -->
<style scoped>
  [data-slot='scroll-area'] [data-reka-scroll-area-viewport] {
    -webkit-overflow-scrolling: touch;
  }
  @media (max-width: 768px) {
    [data-slot='scroll-area'] [data-reka-scroll-area-viewport][data-scrollable='true'] {
      overflow-y: scroll !important;
    }
  }
</style>
