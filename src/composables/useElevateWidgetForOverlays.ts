import { onUnmounted, watch } from 'vue'
import { useUIStore } from '@/stores/ui/ui.store'
import { useVueSonner } from 'vue-sonner'

const ELEVATION_Z_INDEX = 2147483647

/**
 * Elevates the widget so dialogs and toasts sit above the host storefront:
 * - Shadow DOM: raises the shadow host element.
 * - Light DOM embed: raises `widgetRoot` (same stacking effect for siblings like site headers).
 */
export function useElevateWidgetForOverlays() {
  const uiStore = useUIStore()
  const { activeToasts } = useVueSonner()

  let mutationObserver: MutationObserver | undefined
  let elevatedElement: HTMLElement | undefined
  let previousPosition: string | undefined
  let previousZIndex: string | undefined

  let scrollLockActive = false
  let savedHtmlOverflow = ''
  let savedBodyOverflow = ''
  let wheelHandler: ((e: WheelEvent) => void) | undefined
  let touchMoveHandler: ((e: TouchEvent) => void) | undefined

  function hasOpenDialog(root: HTMLElement): boolean {
    if (root.querySelector('[role="dialog"][data-state="open"]')) {
      return true
    }
    const openOverlay = root.querySelector('[data-state="open"]')
    if (openOverlay instanceof HTMLElement) {
      const style = window.getComputedStyle(openOverlay)
      if (style.position === 'fixed') {
        return true
      }
    }
    return false
  }

  function applyHostScrollLock() {
    if (scrollLockActive) return
    scrollLockActive = true
    savedHtmlOverflow = document.documentElement.style.overflow
    savedBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    wheelHandler = (e: WheelEvent) => {
      const r = uiStore.widgetRoot
      if (!r?.isConnected || !hasOpenDialog(r)) return
      const t = e.target
      if (t instanceof Node && !r.contains(t)) {
        e.preventDefault()
      }
    }
    touchMoveHandler = (e: TouchEvent) => {
      const r = uiStore.widgetRoot
      if (!r?.isConnected || !hasOpenDialog(r)) return
      const t = e.target
      if (t instanceof Node && !r.contains(t)) {
        e.preventDefault()
      }
    }
    document.addEventListener('wheel', wheelHandler, { capture: true, passive: false })
    document.addEventListener('touchmove', touchMoveHandler, { capture: true, passive: false })
  }

  function releaseHostScrollLock() {
    if (!scrollLockActive) return
    scrollLockActive = false
    document.documentElement.style.overflow = savedHtmlOverflow
    document.body.style.overflow = savedBodyOverflow
    if (wheelHandler) {
      document.removeEventListener('wheel', wheelHandler, { capture: true })
      wheelHandler = undefined
    }
    if (touchMoveHandler) {
      document.removeEventListener('touchmove', touchMoveHandler, { capture: true })
      touchMoveHandler = undefined
    }
  }

  function hasVisibleToasts(): boolean {
    return activeToasts.value.length > 0
  }

  function getElevationTarget(root: HTMLElement): HTMLElement | undefined {
    const rootNode = root.getRootNode()
    if (rootNode instanceof ShadowRoot) {
      const host = rootNode.host
      return host instanceof HTMLElement ? host : undefined
    }
    return root
  }

  function checkAndApplyElevation(root: HTMLElement) {
    const dialogOpen = hasOpenDialog(root)
    if (dialogOpen) {
      applyHostScrollLock()
    } else {
      releaseHostScrollLock()
    }

    const target = getElevationTarget(root)
    if (!target) {
      return
    }

    const needsElevation = dialogOpen || hasVisibleToasts()

    if (needsElevation) {
      if (!elevatedElement) {
        previousPosition = target.style.position
        previousZIndex = target.style.zIndex
      }
      elevatedElement = target
      target.style.position = 'relative'
      target.style.zIndex = String(ELEVATION_Z_INDEX)
    } else if (elevatedElement === target) {
      target.style.position = previousPosition ?? ''
      target.style.zIndex = previousZIndex ?? ''
      elevatedElement = undefined
      previousPosition = undefined
      previousZIndex = undefined
    }
  }

  function setupForRoot(root: HTMLElement) {
    const runCheck = () => checkAndApplyElevation(root)

    mutationObserver = new MutationObserver(runCheck)
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state']
    })

    runCheck()
  }

  function teardown() {
    mutationObserver?.disconnect()
    mutationObserver = undefined
    releaseHostScrollLock()
    if (elevatedElement) {
      elevatedElement.style.position = previousPosition ?? ''
      elevatedElement.style.zIndex = previousZIndex ?? ''
      elevatedElement = undefined
      previousPosition = undefined
      previousZIndex = undefined
    }
  }

  const stopWatch = watch(
    () => uiStore.widgetRoot,
    root => {
      teardown()
      if (!root || !root.isConnected) {
        return
      }
      setupForRoot(root)
    },
    { immediate: true }
  )

  const stopToastWatch = watch(activeToasts, () => {
    const root = uiStore.widgetRoot
    if (root && root.isConnected) {
      checkAndApplyElevation(root)
    }
  })

  onUnmounted(() => {
    stopWatch()
    stopToastWatch()
    teardown()
  })
}
