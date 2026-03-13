import { onUnmounted, watch } from 'vue'
import { useUIStore } from '@/stores/ui/ui.store'
import { useVueSonner } from 'vue-sonner'

const ELEVATION_Z_INDEX = 2147483647

/**
 * Composable that elevates the Shadow DOM host element when dialogs or toasts are visible,
 * so overlays appear above the host site's header/footer (Shopify, WordPress, etc.).
 * No-ops when not in widget/Shadow DOM context.
 */
export function useElevateWidgetForOverlays() {
  const uiStore = useUIStore()
  const { activeToasts } = useVueSonner()

  let mutationObserver: MutationObserver | undefined
  let shadowHost: HTMLElement | undefined
  let previousPosition: string | undefined
  let previousZIndex: string | undefined

  function hasOpenDialog(root: HTMLElement): boolean {
    // Primary: Reka/Radix dialog content has role="dialog" and data-state
    if (root.querySelector('[role="dialog"][data-state="open"]')) {
      return true
    }
    // Fallback: overlay or content may have data-state="open" (Reka varies by version)
    const openOverlay = root.querySelector('[data-state="open"]')
    if (openOverlay instanceof HTMLElement) {
      const style = window.getComputedStyle(openOverlay)
      if (style.position === 'fixed') {
        return true
      }
    }
    return false
  }

  function hasVisibleToasts(): boolean {
    return activeToasts.value.length > 0
  }

  function checkAndApplyElevation(root: HTMLElement) {
    const rootNode = root.getRootNode()
    if (!(rootNode instanceof ShadowRoot)) {
      return
    }

    const host = rootNode.host
    if (!(host instanceof HTMLElement)) {
      return
    }

    const needsElevation = hasOpenDialog(root) || hasVisibleToasts()

    if (needsElevation) {
      if (!shadowHost) {
        previousPosition = host.style.position
        previousZIndex = host.style.zIndex
      }
      shadowHost = host
      host.style.position = 'relative'
      host.style.zIndex = String(ELEVATION_Z_INDEX)
    } else {
      if (shadowHost === host) {
        host.style.position = previousPosition ?? ''
        host.style.zIndex = previousZIndex ?? ''
        shadowHost = undefined
        previousPosition = undefined
        previousZIndex = undefined
      }
    }
  }

  function setupForRoot(root: HTMLElement) {
    const rootNode = root.getRootNode()
    if (!(rootNode instanceof ShadowRoot)) {
      return
    }

    const host = rootNode.host
    if (!(host instanceof HTMLElement)) {
      return
    }

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
    if (shadowHost) {
      shadowHost.style.position = previousPosition ?? ''
      shadowHost.style.zIndex = previousZIndex ?? ''
      shadowHost = undefined
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
