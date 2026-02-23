import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useProfileStore } from '../profile/profile.store'

export const useUIStore = defineStore('uiStore', () => {
  // State
  const isMobileMenuOpen = ref(false)
  const isLoginDialogOpen = ref(false)
  const isRegisterDialogOpen = ref(false)
  const isLoading = ref(false)
  const allowColorModeSwitch = ref(false)
  const defaultColorMode = ref<'light' | 'dark'>('light')
  const widgetRoot = ref<HTMLElement>()
  const containerWidth = ref<number>(0)
  const containerHeight = ref<number>(0)
  const isFullscreen = ref(false)
  // Shared dialog states - managed centrally to avoid duplication
  const showSaveDesignDialog = ref(false)
  const showLockerBrowser = ref(false)
  const initialLockerIdToOpen = ref<number | null>(null)
  // Order product data for save design dialog
  const orderProductData = ref<{
    product: import('@/services/orders/types').FactoryProduct
    item: import('@/services/orders/types').Item
    order: import('@/services/orders/types').Order
  } | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let fullscreenRestore: (() => void) | null = null
  let lastViewportScroll = 0
  // Configurable mobile breakpoint to determine layout behavior
  const mobileBreakpoint = ref<number>(768)

  // ===== Theme Management =====
  // Get theme from profileStore (source of truth)
  const profileStore = useProfileStore()
  const currentTheme = computed<'light' | 'dark'>(() => profileStore.effectiveTheme)

  // Apply theme to widget root when it changes
  // This is the single point of theme application for Shadow DOM context
  watch(
    currentTheme,
    newTheme => {
      if (widgetRoot.value) {
        profileStore.applyTheme(newTheme, widgetRoot.value)
      }
    },
    { immediate: true }
  )

  // Watch for widgetRoot unmount/change to cleanup fullscreen
  watch(widgetRoot, newRoot => {
    if (!newRoot && isFullscreen.value) {
      exitFullscreenMode()
    }
  })

  // Derived state
  const isMobile = computed(() => containerWidth.value < mobileBreakpoint.value)
  const minWidgetHeight = computed(() => (isMobile.value ? 700 : 800))

  // Actions

  function setWidgetRoot(root: HTMLElement, skipInitialMeasure = false) {
    const previousRoot = widgetRoot.value

    if (previousRoot && previousRoot !== root) {
      previousRoot.classList.remove('light', 'dark')
    }

    widgetRoot.value = root

    // Apply current theme to widget root
    profileStore.applyTheme(currentTheme.value, root)

    // Disconnect any previous observer
    if (resizeObserver) {
      try {
        resizeObserver.disconnect()
      } catch (_) {}
      resizeObserver = null
    }

    // Measure immediately (unless skipped)
    const measure = () => {
      try {
        const rect = root.getBoundingClientRect()

        // Don't override with 0 dimensions if we already have valid dimensions
        if (
          rect.width === 0 &&
          rect.height === 0 &&
          containerWidth.value > 0 &&
          containerHeight.value > 0
        ) {
          return
        }

        // Don't override with small heights if we already have proper minimum height
        const minHeight = containerHeight.value >= 700 ? 700 : 800
        if (rect.height < minHeight && containerHeight.value >= minHeight) {
          return
        }

        setContainerSize(Math.round(rect.width), Math.round(rect.height))
      } catch (_) {}
    }

    if (!skipInitialMeasure) {
      measure()
    }

    // Observe size changes
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        // Add a small delay to ensure CSS has been applied
        requestAnimationFrame(() => {
          measure()
        })
      })
      try {
        resizeObserver.observe(root)
      } catch (_) {}
    }
  }

  function setContainerSize(width: number, height: number) {
    containerWidth.value = width
    containerHeight.value = height
  }

  function openMobileMenu() {
    isMobileMenuOpen.value = true
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function openLoginDialog() {
    isLoginDialogOpen.value = true
    isRegisterDialogOpen.value = false
  }

  function closeLoginDialog() {
    isLoginDialogOpen.value = false
  }

  function openRegisterDialog() {
    isRegisterDialogOpen.value = true
    isLoginDialogOpen.value = false
  }

  function closeRegisterDialog() {
    isRegisterDialogOpen.value = false
  }

  function closeAllDialogs() {
    isLoginDialogOpen.value = false
    isRegisterDialogOpen.value = false
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  // Theme methods now delegate to profileStore
  function toggleTheme() {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    profileStore.setPreferences({ display: newTheme })
  }

  function setTheme(theme: 'light' | 'dark') {
    profileStore.setPreferences({ display: theme })
  }

  function setDefaultColorMode(mode: 'light' | 'dark') {
    defaultColorMode.value = mode
  }

  function setAllowColorModeSwitch(allow: boolean) {
    allowColorModeSwitch.value = allow
  }

  async function toggleFullscreen(force?: boolean) {
    const targetState = typeof force === 'boolean' ? force : !isFullscreen.value

    if (targetState) {
      const entered = await enterFullscreenMode()
      isFullscreen.value = entered
      return
    }

    exitFullscreenMode()
  }

  function enterFullscreenMode(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return Promise.resolve(false)
    }

    const root = widgetRoot.value

    if (!root) {
      return Promise.resolve(false)
    }

    // If we already have a restore handler, ensure a clean slate first
    if (fullscreenRestore) {
      fullscreenRestore()
      fullscreenRestore = null
    }

    const attemptNativeFullscreen = async () => {
      // Force pseudo-fullscreen on mobile devices (including Android) to ensure consistent UX
      // The native fullscreen API on Android often hides system UI in ways that can be disorienting
      // or inconsistent with our overlay design.
      const isMobileDevice =
        isIOSDevice() || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (
        typeof root.requestFullscreen === 'function' &&
        typeof document !== 'undefined' &&
        document.fullscreenEnabled &&
        !isMobileDevice
      ) {
        try {
          await root.requestFullscreen()
          const handleFullscreenExit = () => {
            if (!document.fullscreenElement) {
              exitFullscreenMode()
            }
          }
          document.addEventListener('fullscreenchange', handleFullscreenExit, { once: true })
          return true
        } catch (_) {
          // Native fullscreen failed; fall back to pseudo fullscreen.
        }
      }

      return false
    }

    const applyPseudoFullscreen = () => {
      const restoreFns: Array<() => void> = []
      const pushRestore = (fn: () => void) => {
        restoreFns.push(fn)
      }

      const applyStyles = (
        element: HTMLElement,
        styles: Record<string, { value: string; priority?: string }>
      ) => {
        const style = element.style
        const localRestore: Array<() => void> = []

        for (const [property, { value, priority }] of Object.entries(styles)) {
          const previousValue = style.getPropertyValue(property)
          const previousPriority = style.getPropertyPriority(property)
          style.setProperty(property, value, priority)
          localRestore.push(() => {
            if (previousValue) {
              style.setProperty(property, previousValue, previousPriority)
            } else {
              style.removeProperty(property)
            }
          })
        }

        return () => {
          for (let i = localRestore.length - 1; i >= 0; i -= 1) {
            const restore = localRestore[i]
            if (restore) {
              restore()
            }
          }
        }
      }

      const body = document.body
      const html = document.documentElement

      if (!body || !html) {
        return false
      }

      lastViewportScroll = window.scrollY || html.scrollTop || body.scrollTop || 0

      const preferredViewportHeight =
        typeof window.CSS !== 'undefined' && typeof CSS.supports === 'function'
          ? CSS.supports('height', '100dvh')
            ? '100dvh'
            : '100vh'
          : '100vh'

      pushRestore(
        applyStyles(root, {
          position: { value: 'fixed', priority: 'important' },
          top: { value: '0', priority: 'important' },
          right: { value: '0', priority: 'important' },
          bottom: { value: '0', priority: 'important' },
          left: { value: '0', priority: 'important' },
          width: { value: '100vw', priority: 'important' },
          height: { value: preferredViewportHeight, priority: 'important' },
          'max-height': { value: preferredViewportHeight, priority: 'important' },
          'min-height': { value: preferredViewportHeight, priority: 'important' },
          overflow: { value: 'auto', priority: 'important' },
          'overscroll-behavior': { value: 'contain', priority: 'important' },
          'touch-action': { value: 'manipulation', priority: 'important' },
          '-webkit-overflow-scrolling': { value: 'touch' },
          'z-index': { value: '2147483646', priority: 'important' },
          'background-color': { value: 'var(--background, #fff)', priority: 'important' },
          'padding-top': { value: 'env(safe-area-inset-top)', priority: 'important' },
          'padding-bottom': { value: 'env(safe-area-inset-bottom)', priority: 'important' },
          'padding-left': { value: 'env(safe-area-inset-left)', priority: 'important' },
          'padding-right': { value: 'env(safe-area-inset-right)', priority: 'important' }
        })
      )

      pushRestore(
        applyStyles(body, {
          overflow: { value: 'hidden', priority: 'important' },
          position: { value: 'fixed', priority: 'important' },
          width: { value: '100%', priority: 'important' },
          top: { value: `-${lastViewportScroll}px`, priority: 'important' },
          left: { value: '0', priority: 'important' },
          right: { value: '0', priority: 'important' }
        })
      )

      pushRestore(
        applyStyles(html, {
          overflow: { value: 'hidden', priority: 'important' },
          height: { value: '100%', priority: 'important' }
        })
      )

      const hadTabIndex = root.hasAttribute('tabindex')
      if (!hadTabIndex) {
        root.setAttribute('tabindex', '-1')
        pushRestore(() => {
          root.removeAttribute('tabindex')
        })
      }

      root.scrollTop = 0

      // Focus inside the widget so the virtual keyboard / screen readers stay scoped
      requestAnimationFrame(() => {
        if (isFullscreen.value && document.activeElement !== root) {
          try {
            root.focus({ preventScroll: true })
          } catch (_) {
            // Fallback for browsers that do not support focus options
            root.focus()
          }
        }
      })

      fullscreenRestore = () => {
        for (let i = restoreFns.length - 1; i >= 0; i -= 1) {
          const restore = restoreFns[i]
          if (restore) {
            restore()
          }
        }

        const targetScroll = lastViewportScroll
        fullscreenRestore = null
        lastViewportScroll = 0

        window.scrollTo({ top: targetScroll, behavior: 'auto' })
      }

      return true
    }

    return attemptNativeFullscreen().then(nativeSucceeded => {
      if (nativeSucceeded) {
        return true
      }

      return applyPseudoFullscreen()
    })
  }

  function exitFullscreenMode() {
    if (typeof window === 'undefined') {
      return
    }

    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      void document.exitFullscreen().catch(() => {
        // If exitFullscreen fails, continue with manual cleanup.
      })
    }

    if (fullscreenRestore) {
      fullscreenRestore()
      fullscreenRestore = null
    }

    isFullscreen.value = false
  }

  function isIOSDevice() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false
    }

    const ua = navigator.userAgent || ''
    const platform = navigator.platform || ''
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      /iPhone|iOS/.test(platform)
    )
  }

  // Shared dialog management methods
  function openSaveDesignDialog(
    orderProductDataParams?: {
      product: import('@/services/orders/types').FactoryProduct
      item: import('@/services/orders/types').Item
      order: import('@/services/orders/types').Order
    } | null
  ) {
    if (orderProductDataParams) {
      orderProductData.value = orderProductDataParams
    }
    showSaveDesignDialog.value = true
  }

  function closeSaveDesignDialog() {
    showSaveDesignDialog.value = false
    orderProductData.value = null
  }

  function openLockerBrowser(lockerId?: number | null) {
    if (lockerId !== undefined) {
      initialLockerIdToOpen.value = lockerId
    }
    showLockerBrowser.value = true
  }

  function closeLockerBrowser() {
    showLockerBrowser.value = false
    initialLockerIdToOpen.value = null
  }

  function handleSavedToLocker(lockerId: number) {
    closeSaveDesignDialog()
    openLockerBrowser(lockerId)
  }

  return {
    isMobileMenuOpen,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    isLoading,
    containerWidth,
    containerHeight,
    isMobile,
    minWidgetHeight,
    currentTheme,
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    openLoginDialog,
    closeLoginDialog,
    openRegisterDialog,
    closeRegisterDialog,
    closeAllDialogs,
    setLoading,
    toggleTheme,
    setTheme,
    setAllowColorModeSwitch,
    setDefaultColorMode,
    allowColorModeSwitch,
    defaultColorMode,
    setWidgetRoot,
    widgetRoot,
    setContainerSize,
    mobileBreakpoint,
    isFullscreen,
    toggleFullscreen,
    // Shared dialog states
    showSaveDesignDialog,
    showLockerBrowser,
    initialLockerIdToOpen,
    orderProductData,
    openSaveDesignDialog,
    closeSaveDesignDialog,
    openLockerBrowser,
    closeLockerBrowser,
    handleSavedToLocker
  }
})
