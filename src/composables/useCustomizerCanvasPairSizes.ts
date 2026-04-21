import { ref, watch, type Ref } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'

/** Main preview Fabric/layout cap (px). */
export const CUSTOMIZER_MAIN_CANVAS_MAX_PX = 600
/** Desktop flip chip Fabric buffer edge (px); display size may shrink via resize. */
export const CUSTOMIZER_FLIP_CANVAS_BITMAP_PX = 156

const MAIN_MAX = CUSTOMIZER_MAIN_CANVAS_MAX_PX
/** Secondary bitmap edge (px). */
const FLIP_MAX = CUSTOMIZER_FLIP_CANVAS_BITMAP_PX
/**
 * Reserve horizontal space for the right column: RightToolbar (w-12 + padding) + gap-9 + flip
 * chip chrome (~4.5rem box + borders). Underestimating caused main+gap+toolbar to overflow the
 * canvas row on ~1470px viewports.
 */
const RIGHT_COLUMN_RESERVE = 280
const RATIO = FLIP_MAX / MAIN_MAX
const MAIN_MIN = 220
const FLIP_MIN = 64

/**
 * Observes the canvas row and keeps main + flip sizes in ratio (600:156),
 * reserving RIGHT_COLUMN_RESERVE for toolbar + flip column so the row fits the viewport.
 */
export function useCustomizerCanvasPairSizes(elRef: Ref<HTMLElement | null>) {
  const mainCanvasPx = ref(MAIN_MAX)
  const flipCanvasPx = ref(FLIP_MAX)

  function compute() {
    const el = elRef.value
    if (!el || el.clientWidth <= 0) return

    const W = el.clientWidth
    const H = Math.max(el.clientHeight, 200)

    const gap = (() => {
      const g = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap)
      return Number.isFinite(g) && g > 0 ? g : 16
    })()

    const mainFromWidth = Math.floor(W - gap - RIGHT_COLUMN_RESERVE)
    const mainFromHeight = Math.floor(H * 0.92)

    let main = Math.min(MAIN_MAX, mainFromWidth, mainFromHeight)
    main = Math.max(MAIN_MIN, main)

    let flip = Math.round(Math.min(FLIP_MAX, main * RATIO))
    flip = Math.max(FLIP_MIN, flip)

    if (main + gap + RIGHT_COLUMN_RESERVE > W) {
      main = Math.max(MAIN_MIN, Math.floor(W - gap - RIGHT_COLUMN_RESERVE))
      main = Math.min(MAIN_MAX, main)
      flip = Math.round(
        Math.min(FLIP_MAX, Math.max(FLIP_MIN, main * RATIO))
      )
    }

    mainCanvasPx.value = main
    flipCanvasPx.value = flip
  }

  const debounced = useDebounceFn(compute, 120)

  useResizeObserver(elRef, () => debounced())

  watch(
    elRef,
    (el) => {
      if (el) debounced()
    },
    { flush: 'post', immediate: true }
  )

  return { mainCanvasPx, flipCanvasPx }
}
