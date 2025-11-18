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
  let resizeObserver: ResizeObserver | null = null
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
    mobileBreakpoint
  }
})
