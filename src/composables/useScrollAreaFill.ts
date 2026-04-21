import { nextTick, ref, watch, type Ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

/**
 * Sets an explicit pixel height on ScrollArea from shell clientHeight minus optional header/footer.
 * Reka ScrollArea needs a definite height to show scrollbars reliably in flex/dialog layouts.
 */
export function useScrollAreaFill(params: {
  shellRef: Ref<HTMLElement | null | undefined>
  headerRef?: Ref<HTMLElement | null | undefined>
  footerRef?: Ref<HTMLElement | null | undefined>
}) {
  const scrollAreaHeightPx = ref(0)

  function updateScrollAreaHeight() {
    const shell = params.shellRef.value
    if (!shell) {
      scrollAreaHeightPx.value = 0
      return
    }
    const headerH = params.headerRef?.value?.offsetHeight ?? 0
    const footerH = params.footerRef?.value?.offsetHeight ?? 0
    scrollAreaHeightPx.value = Math.max(0, shell.clientHeight - headerH - footerH)
  }

  useResizeObserver(
    () => params.shellRef.value ?? null,
    () => nextTick(updateScrollAreaHeight)
  )

  watch(
    () => [params.shellRef.value, params.headerRef?.value, params.footerRef?.value] as const,
    () => nextTick(updateScrollAreaHeight),
    { flush: 'post' }
  )

  const scrollAreaStyle = ref<Record<string, string>>({})

  watch(
    scrollAreaHeightPx,
    h => {
      if (h <= 0) {
        scrollAreaStyle.value = {}
        return
      }
      scrollAreaStyle.value = {
        height: `${h}px`,
        maxHeight: `${h}px`,
        minHeight: '0px'
      }
    },
    { immediate: true }
  )

  return { scrollAreaStyle, updateScrollAreaHeight }
}
