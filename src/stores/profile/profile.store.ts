import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { API } from '@/services'
import type { DashboardCounters } from '@/services/dashboard/types'
import type { Address, AddressPayload } from '@/services/addresses/types'
import type { UserPreferences } from '@/services/preferences/types'

export const useProfileStore = defineStore('profileStore', () => {
  // ✅ Dashboard state
  const counters = ref<DashboardCounters>({
    orders_count: 0,
    pending_approval_count: 0,
    track_my_orders_count: 0
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const activeTab = ref<'account' | 'orders' | 'address' | 'preferences'>('account')

  // ✅ Addresses state
  const addresses = ref<Address[]>([])
  const isLoadingAddresses = ref(false)
  const showAddModal = ref(false)
  const editingAddress = ref<Address | null>(null)
  const showDeleteConfirm = ref(false)
  const addressToDelete = ref<Address | null>(null)
  const addressTabs = ref<'personal' | 'business'>('personal')

  const addressForm = ref<AddressPayload & { country: number | string }>({
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

  const countries = ref<Array<{ id: number; name: string }>>([])

  // ✅ Preferences state
  const preferences: Ref<UserPreferences> = ref({
    display: 'system',
    language: 'en'
  })

  // ===== PERSISTENCE =====
  const STORAGE_KEY = 'profileStore'

  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const state = {
        preferences: preferences.value,
        activeTab: activeTab.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save profile store to localStorage:', e)
    }
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      const state = JSON.parse(stored) as {
        preferences?: UserPreferences
        activeTab?: 'account' | 'orders' | 'address' | 'preferences'
      }

      if (state.activeTab) {
        activeTab.value = state.activeTab
      }

      if (state.preferences) preferences.value = state.preferences
      return true
    } catch (e) {
      console.error('Failed to load profile store from localStorage:', e)
      return false
    }
  }

  function clearLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }

  // ✅ Fetch Dashboard Data
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

  // ✅ Address utilities
  function isDefault(address: Address): boolean {
    return address.default === true || address.default === 1
  }

  async function fetchAddresses() {
    isLoadingAddresses.value = true
    try {
      const res = await API.addresses.getAddresses()
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
        country: address.country.id,
        default: !!address.default
      }
      const res = await API.addresses.setDefaultAddress(address.id, payload)
      if (res.success) await fetchAddresses()
    } finally {
      isLoadingAddresses.value = false
    }
  }

  async function saveAddress(payload: AddressPayload) {
    isLoadingAddresses.value = true
    try {
      let res
      if (editingAddress.value)
        res = await API.addresses.updateAddress(editingAddress.value.id, payload)
      else res = await API.addresses.createAddress(payload)

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
      const res = await API.addresses.deleteAddress(addressToDelete.value.id)
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
      const res = await API.addresses.getCountries()
      if (res.success) {
        countries.value = res.result || []
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err)
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
      default: address.default === true || address.default === 1
    }
  }

  function setAddressTab(tab: 'personal' | 'business') {
    addressTabs.value = tab
  }

  // ✅ Preferences management
  function setPreferences(newPrefs: Partial<UserPreferences>): void {
    preferences.value = { ...preferences.value, ...newPrefs }
    localStorage.setItem('userPreferences', JSON.stringify(preferences.value))
  }

  function loadPreferences(): void {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('userPreferences')
    if (!saved) return
    try {
      const parsed: UserPreferences = JSON.parse(saved) as UserPreferences
      preferences.value = parsed
    } catch (err) {
      console.error('Failed to parse userPreferences:', err)
    }
  }

  async function fetchPreferences(): Promise<void> {
    try {
      const res = await API.preferences.getPreferences()
      preferences.value = res
      localStorage.setItem('userPreferences', JSON.stringify(res))
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    }
  }

  async function savePreferences(): Promise<void> {
    try {
      await API.preferences.updatePreferences(preferences.value)
    } catch (err) {
      console.error('Failed to save preferences:', err)
    }
  }

  return {
    // ✅ State
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
    isDefault,
    addressTabs,
    addressForm,
    countries,
    preferences,

    // ✅ Actions
    fetchDashboard,
    fetchAddresses,
    setDefaultAddress,
    saveAddress,
    deleteAddress,
    setAddressTab,
    resetAddressForm,
    fetchCountries,
    setAddressFromEdit,

    setPreferences,
    loadPreferences,
    fetchPreferences,
    savePreferences,

    // ✅ Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})
