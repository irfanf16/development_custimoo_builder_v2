import { defineStore } from 'pinia'
import { ref, computed, watch, type Ref } from 'vue'
import { API } from '@/services'
import type { DashboardCounters } from '@/services/dashboard/types'
import type { Address, AddressPayload } from '@/services/customers/types'
import type { UserPreferences, ParaglideLocale, DisplayMode } from '@/services/preferences/types'
import { useCompanyStore } from '../company/company.store'
import { setLocale } from '@/paraglide/runtime'
import { useAuthStore } from '../auth/auth.store'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useProfileStore = defineStore('profileStore', () => {
  // ===== Dashboard =====
  const counters = ref<DashboardCounters>({
    orders_count: 0,
    pending_approval_count: 0,
    track_my_orders_count: 0
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const activeTab = ref<'account' | 'orders' | 'address' | 'preferences'>('account')

  // ===== Addresses =====
  const addresses = ref<Address[]>([])
  const isLoadingAddresses = ref(false)
  const showAddModal = ref(false)
  const editingAddress = ref<Address | null>(null)
  const showDeleteConfirm = ref(false)
  const addressToDelete = ref<Address | null>(null)
  const addressTabs = ref<'personal' | 'business'>('personal')
  const addressForm = ref<Omit<AddressPayload, 'country'> & { country: number | string }>({
    id: undefined,
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company_name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 0,
    default: false
  })
  const countries = ref<{ id: number; name: string }[]>([])

  // ===== Preferences & Localization =====
  // Hybrid Approach: companyStore defines available/default, profileStore manages user selection
  const companyStore = useCompanyStore()
  const authStore = useAuthStore()

  // Check if branding is available from company settings
  const hasBranding = computed(() => {
    return Boolean(companyStore.settings?.ui_branding)
  })

  // Default display mode: use company default if available, otherwise 'light'
  function getDefaultDisplayMode(): DisplayMode {
    const companyTheme = companyStore.settings?.ui_branding?.theme
    if (companyTheme === 'dark' || companyTheme === 'light') {
      return companyTheme
    }
    return 'light'
  }

  const preferences: Ref<UserPreferences> = ref({
    display: 'light', // Default to light, will be updated based on company settings or user preference
    language: 'en'
  })
  const currentLocale = ref<ParaglideLocale>()
  const isInitialized = ref(false)

  // ===== Theme Management =====
  // Effective theme is simply the display preference (no system resolution needed)
  const effectiveTheme = computed<'light' | 'dark'>(() => {
    return preferences.value.display
  })

  // Apply theme to DOM
  // Note: widgetRoot is required since we're in Shadow DOM context
  // Applying to document.documentElement won't affect shadow DOM content
  function applyTheme(theme: 'light' | 'dark', widgetRoot: HTMLElement) {
    if (!widgetRoot) {
      console.warn('applyTheme: widgetRoot is required for Shadow DOM context')
      return
    }

    const applyThemeClass = (el: HTMLElement) => {
      if (theme === 'dark') {
        el.classList.remove('light')
        el.classList.add('dark')
      } else {
        el.classList.remove('dark')
        el.classList.add('light')
      }
    }

    // Apply to widget root container (for .dark CSS selector)
    applyThemeClass(widgetRoot)

    // Ensure the top-level widget shell (mount container) stays in sync for utility classes
    const shellContainer = widgetRoot.closest('#customizer-widget-container')
    if (shellContainer && shellContainer !== widgetRoot) {
      applyThemeClass(shellContainer as HTMLElement)
    }

    // Also apply to shadow host if available (for :host.dark CSS selector)
    // This ensures both CSS selectors work: .dark and :host.dark
    const rootNode = widgetRoot.getRootNode()
    if (rootNode instanceof ShadowRoot) {
      const host = rootNode.host as HTMLElement
      if (host) {
        if (theme === 'dark') {
          host.classList.remove('light')
          host.classList.add('dark')
        } else {
          host.classList.remove('dark')
          host.classList.add('light')
        }
      }
    }
  }

  // Get available locales from company store
  // If company store has no languages, return default [en, fr]
  const availableLocales = computed(() => {
    const languages = companyStore.localization.availableLanguages
    if (languages.length === 0) {
      // Return default languages if none are set
      return ['en', 'fr'] as ParaglideLocale[]
    }
    return languages.map(lang => lang.code as ParaglideLocale)
  })

  // Get default locale from company store as fallback
  const defaultLocale = computed<ParaglideLocale>(() => {
    const dl = companyStore.localization.defaultLanguage as ParaglideLocale | undefined
    return dl ?? 'en'
  })

  function isValidLocale(locale: string): locale is ParaglideLocale {
    return availableLocales.value.includes(locale as ParaglideLocale)
  }

  // ===== Persistence =====
  const STORAGE_KEY = 'profileStore'
  const { getItem, setItem, removeItem } = useLocalStorage()

  function saveToLocalStorage() {
    try {
      setItem(STORAGE_KEY, {
        preferences: preferences.value,
        activeTab: activeTab.value,
        currentLocale: currentLocale.value
      })
    } catch (e) {
      console.error('Failed to save profile store to localStorage:', e)
    }
  }

  function loadFromLocalStorage() {
    // Set default based on branding availability
    preferences.value.display = getDefaultDisplayMode()

    try {
      const state = getItem<{
        preferences?: UserPreferences
        activeTab?: 'account' | 'orders' | 'address' | 'preferences'
        currentLocale?: ParaglideLocale
      }>(STORAGE_KEY)

      if (!state) {
        return
      }

      if (state.activeTab) activeTab.value = state.activeTab
      if (state.preferences) {
        preferences.value = state.preferences
        // If an invalid display value is somehow present, default to 'light'
        if (preferences.value.display !== 'dark' && preferences.value.display !== 'light') {
          preferences.value.display = 'light'
        }
      } else {
        // If no preferences stored, set default
        preferences.value.display = getDefaultDisplayMode()
      }
      // 🧠 Don't override company default unless user explicitly changed it
      if (state.currentLocale && isValidLocale(state.currentLocale)) {
        currentLocale.value = state.currentLocale
      }
    } catch (e) {
      console.error('Failed to load profile store from localStorage:', e)
      // On error, set default based on branding
      preferences.value.display = getDefaultDisplayMode()
    }
  }

  function clearLocalStorage() {
    removeItem(STORAGE_KEY)
  }

  // ===== Dashboard Actions =====
  async function fetchDashboard() {
    isLoading.value = true
    error.value = null
    try {
      const response = await API.dashboard.getDashboard()
      counters.value = response.counters
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
    } finally {
      isLoading.value = false
    }
  }

  // ===== Address Actions =====
  function isDefault(address: Address): boolean {
    return Boolean(address.default)
  }

  async function fetchAddresses() {
    isLoadingAddresses.value = true
    try {
      const res = await API.customer.getAddresses()
      if (res.success) addresses.value = res.result || []
    } catch (e) {
      console.error('Fetch addresses error:', e)
    } finally {
      isLoadingAddresses.value = false
    }
  }

  async function setDefaultAddress(address: Address) {
    isLoadingAddresses.value = true
    try {
      const payload: Partial<AddressPayload> = {
        ...address,
        country: Number(address.country.id),
        default: !!address.default
      }
      const res = await API.customer.setDefaultAddress(address.id, payload)
      if (res.success) await fetchAddresses()
    } finally {
      isLoadingAddresses.value = false
    }
  }

  const defaultAddress = computed(() => addresses.value.find(address => address.default))

  async function saveAddress(payload: AddressPayload) {
    isLoadingAddresses.value = true
    try {
      let res
      if (editingAddress.value)
        res = await API.customer.updateAddress(editingAddress.value.id, payload)
      else res = await API.customer.createAddress(payload)

      if (res.success) {
        showAddModal.value = false
        editingAddress.value = null
        await fetchAddresses()
      }
    } finally {
      isLoadingAddresses.value = false
    }
  }

  async function deleteAddress() {
    if (!addressToDelete.value) return
    isLoadingAddresses.value = true
    try {
      const res = await API.customer.deleteAddress(addressToDelete.value.id)
      if (res.success) {
        showDeleteConfirm.value = false
        addressToDelete.value = null
        await fetchAddresses()
      }
    } finally {
      isLoadingAddresses.value = false
    }
  }

  function resetAddressForm() {
    addressForm.value = {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      company_name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 0,
      default: false
    }
  }

  async function fetchCountries() {
    try {
      const res = await API.customer.getCountries()
      if (res.success) countries.value = res.result || []
    } catch (err) {
      console.error('Failed to fetch countries:', err)
    }
  }

  async function updateCustomerName(payload: { first_name: string; last_name: string }) {
    try {
      const res = await API.customer.updateCustomerName(payload)
      if (res.success) {
        authStore.setCustomer(res.result)
        await authStore.saveToLocalStorage()
      }
    } catch (e) {
      console.error('Failed to update customer name:', e)
    }
  }
  function setAddressFromEdit(address: Address | null) {
    if (!address) {
      resetAddressForm()
      return
    }
    addressForm.value = {
      id: address.id,
      first_name: address.first_name,
      last_name: address.last_name,
      email: address.email || '',
      phone_number: address.phone_number || '',
      company_name: address.company_name || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      zip_code: address.zip_code || '',
      country: address.country?.id ?? 0,
      default: Boolean(address.default)
    }
  }

  function setAddressTab(tab: 'personal' | 'business') {
    addressTabs.value = tab
  }

  // ===== Preferences =====
  function setPreferences(newPrefs: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...newPrefs }
    if (newPrefs.language && isValidLocale(newPrefs.language)) {
      void setCurrentLocale(newPrefs.language)
    }
    // Theme will be applied automatically via uiStore watcher when effectiveTheme changes
    // No need to call applyTheme here since we don't have widgetRoot access
    saveToLocalStorage()
  }

  async function setCurrentLocale(locale: ParaglideLocale) {
    // Validate the locale is still available
    if (!isValidLocale(locale)) {
      console.warn(`Locale ${String(locale)} is no longer available, falling back to default`)
      locale = defaultLocale.value
    }

    // Update state
    currentLocale.value = locale
    preferences.value.language = locale

    // Update Paraglide runtime
    await setLocale(locale, { reload: false })

    // Update company store to keep UI in sync (optional, for backward compatibility)
    companyStore.localization.defaultLanguage = locale

    // Persist to localStorage
    saveToLocalStorage()
  }

  async function resetToDefault() {
    await setCurrentLocale(defaultLocale.value)
  }

  async function initializeLocale() {
    if (isInitialized.value) return

    // 1️⃣ Load saved data first
    loadFromLocalStorage()

    // 2️⃣ Case A: user has no saved locale → use company default
    if (!currentLocale.value || !isValidLocale(currentLocale.value)) {
      const fallback = companyStore.localization.defaultLanguage || defaultLocale.value
      await setCurrentLocale(fallback as ParaglideLocale)
    } else {
      // 3️⃣ Case B: user manually selected one before
      await setLocale(currentLocale.value, { reload: false })
    }
    isInitialized.value = true
  }

  // Automatically update locale if availableLocales change
  watch(availableLocales, newLocales => {
    if (newLocales.length === 1) {
      // If only one language available, automatically use it
      void setCurrentLocale(newLocales[0] as ParaglideLocale)
      return
    }

    // Only check currentLocale if it is defined
    if (newLocales.length > 0 && currentLocale.value && !isValidLocale(currentLocale.value)) {
      console.warn('Current locale is no longer available, resetting to default')
      void setCurrentLocale(defaultLocale.value ?? 'en')
    }
  })

  // Watch for branding availability changes and adjust display mode if needed
  watch(hasBranding, () => {
    // If no user preference is set yet, update to company default
    // This handles the case where company settings load after profileStore initialization
    // We only update if display is still at initial default 'light' and no explicit user choice was made
    // (We can't detect if user explicitly chose 'light', so we only update on initial load)
  })

  // Note: Theme is applied via uiStore watcher when widgetRoot is available
  // We don't apply here directly since we need the widgetRoot element
  // The uiStore watch handles theme application to the widget root
  return {
    // State
    counters,
    isLoading,
    error,
    addresses,
    activeTab,
    isLoadingAddresses,
    showAddModal,
    editingAddress,
    showDeleteConfirm,
    addressToDelete,
    addressTabs,
    addressForm,
    countries,
    preferences,
    currentLocale,
    availableLocales,
    defaultLocale,
    isInitialized,
    effectiveTheme,
    applyTheme,

    // Dashboard
    fetchDashboard,

    // Addresses
    isDefault,
    fetchAddresses,
    setDefaultAddress,
    saveAddress,
    deleteAddress,
    resetAddressForm,
    fetchCountries,
    setAddressFromEdit,
    setAddressTab,
    defaultAddress,

    // Customer
    updateCustomerName,

    // Preferences
    setPreferences,
    setCurrentLocale,
    resetToDefault,
    initializeLocale,
    isValidLocale,

    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})
