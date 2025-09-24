import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('uiStore', () => {
  // State
  const isMobileMenuOpen = ref(false)
  const isLoginDialogOpen = ref(false)
  const isRegisterDialogOpen = ref(false)
  const isLoading = ref(false)
  const allowColorModeSwitch = ref(false)
  const defaultColorMode = ref<'light' | 'dark'>('light')
  const currentTheme = ref<'light' | 'dark'>(
    (localStorage.getItem('customizer-theme') as 'light' | 'dark') || 'light'
  )
  const widgetRoot = ref<HTMLElement>()
  const containerWidth = ref<number>(0)
  const containerHeight = ref<number>(0)
  let resizeObserver: ResizeObserver | null = null
  // Configurable mobile breakpoint to determine layout behavior
  const mobileBreakpoint = ref<number>(768)

  // Derived state
  const isMobile = computed(() => containerWidth.value < mobileBreakpoint.value)
  const minWidgetHeight = computed(() => (isMobile.value ? 700 : 800))

  // Actions

  function setWidgetRoot(root: HTMLElement) {
    widgetRoot.value = root

    // Disconnect any previous observer
    if (resizeObserver) {
      try {
        resizeObserver.disconnect()
      } catch (_) {}
      resizeObserver = null
    }

    // Measure immediately
    const measure = () => {
      try {
        const rect = root.getBoundingClientRect()
        setContainerSize(Math.round(rect.width), Math.round(rect.height))
      } catch (_) {}
    }
    measure()

    // Observe size changes
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        measure()
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

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('customizer-theme', currentTheme.value)
  }

  function setTheme(theme: 'light' | 'dark') {
    currentTheme.value = theme
    localStorage.setItem('customizer-theme', theme)
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
