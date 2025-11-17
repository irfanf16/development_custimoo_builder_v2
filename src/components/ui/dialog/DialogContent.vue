<script setup lang="ts">
  import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
  import { X } from 'lucide-vue-next'
  import {
    DialogClose,
    DialogContent,
    DialogOverlay,
    DialogPortal,
    useForwardPropsEmits
  } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import { useUIStore } from '@/stores/ui/ui.store'

  const props = defineProps<
    DialogContentProps & { class?: HTMLAttributes['class']; style?: HTMLAttributes['style'] }
  >()
  const emits = defineEmits<DialogContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)

  // Ensure style is properly forwarded
  const styleProps = computed(() => props.style)

  const uiStore = useUIStore()

  /**
   * Find the first scrollable ancestor from the event's composed path.
   * ScrollArea viewports are prioritized, but any element with overflow scroll counts.
   */
  function getScrollableFromPath(path: EventTarget[]) {
    for (const node of path) {
      if (!(node instanceof HTMLElement)) {
        continue
      }

      if (
        node.dataset?.slot === 'scroll-area-viewport' ||
        node.hasAttribute('data-reka-scroll-area-viewport')
      ) {
        return node
      }

      const closestViewport = node.closest<HTMLElement>(
        '[data-slot="scroll-area-viewport"], [data-reka-scroll-area-viewport]'
      )
      if (closestViewport) {
        return closestViewport
      }

      const style = window.getComputedStyle(node)
      const canScrollY =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      const canScrollX =
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        node.scrollWidth > node.clientWidth

      if (canScrollX || canScrollY) {
        return node
      }
    }

    return undefined
  }

  /**
   * Install a capture-phase touchmove handler on the owning document so we can
   * stop propagation before Reka's body-lock cancels the gesture.
   * Also keeps document.body pointer-events enabled while the dialog is open.
   */
  function createTouchUnlock(widgetRootEl: HTMLElement) {
    const rootNode = widgetRootEl.getRootNode()
    const hostElement =
      rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement
        ? rootNode.host
        : undefined

    const ownerDocument =
      widgetRootEl.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined)
    if (!ownerDocument) {
      return
    }

    const relevantNodes = [widgetRootEl, hostElement].filter(
      (node): node is HTMLElement => node !== undefined
    )

    if (relevantNodes.length === 0) {
      return
    }

    /**
     * Force pointer-events back to auto on the host document body to avoid Reka's lock.
     * Returns a cleanup function that restores original inline styles.
     */
    const ensureBodyPointerEvents = () => {
      const body = ownerDocument.body
      if (!body) {
        return () => {}
      }

      const previousPointerEvents = body.style.pointerEvents

      const apply = () => {
        body.style.pointerEvents = 'auto'
      }

      apply()
      void nextTick(apply)
      const rafId =
        typeof requestAnimationFrame !== 'undefined'
          ? requestAnimationFrame(() => {
              apply()
            })
          : undefined

      const observer =
        typeof MutationObserver !== 'undefined'
          ? new MutationObserver(mutList => {
              for (const mutation of mutList) {
                if (
                  mutation.type === 'attributes' &&
                  mutation.attributeName === 'style' &&
                  body.style.pointerEvents !== 'auto'
                ) {
                  apply()
                }
              }
            })
          : undefined

      observer?.observe(body, { attributes: true, attributeFilter: ['style'] })

      return () => {
        if (typeof cancelAnimationFrame !== 'undefined' && rafId !== undefined) {
          cancelAnimationFrame(rafId)
        }
        observer?.disconnect()
        body.style.pointerEvents = previousPointerEvents
      }
    }

    /**
     * Allow the touch gesture to bubble if it targets a scrollable area inside the widget.
     * Otherwise let the event continue so outside overlays still block background scrolling.
     */
    const allowTouchScroll = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return
      }

      const path = event.composedPath()

      if (!relevantNodes.some(node => path.includes(node))) {
        return
      }

      const scrollable = getScrollableFromPath(path)
      if (!scrollable) {
        return
      }

      const style = window.getComputedStyle(scrollable)
      const allowsVertical =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        scrollable.scrollHeight > scrollable.clientHeight
      const allowsHorizontal =
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        scrollable.scrollWidth > scrollable.clientWidth

      if (!allowsVertical && !allowsHorizontal) {
        return
      }

      event.stopImmediatePropagation()
    }

    const listenerOptions = { capture: true, passive: false } as const
    ownerDocument.addEventListener('touchmove', allowTouchScroll, listenerOptions)

    const cleanupPointerEvents = ensureBodyPointerEvents()

    return () => {
      ownerDocument.removeEventListener('touchmove', allowTouchScroll, listenerOptions)
      cleanupPointerEvents()
    }
  }

  const cleanupHandlers: Array<() => void> = []
  let stopWidgetWatch: (() => void) | undefined

  onMounted(() => {
    stopWidgetWatch = watch(
      () => uiStore.widgetRoot,
      root => {
        cleanupHandlers.splice(0).forEach(cleanup => cleanup())

        if (!root) {
          return
        }

        const cleanup = createTouchUnlock(root)
        if (cleanup) {
          cleanupHandlers.push(cleanup)
        }
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    cleanupHandlers.splice(0).forEach(cleanup => cleanup())
    stopWidgetWatch?.()
  })
</script>

<template>
  <DialogPortal :to="uiStore.widgetRoot">
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :style="styleProps"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg text-foreground',
          props.class
        )
      "
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X class="w-4 h-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
