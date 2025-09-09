import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type InputLogin,
  type Customer,
  type OutputLogin
} from '@/services/authentication/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'

export const useAuthStore = defineStore('authStore', () => {
  // ===== STATE =====
  const customer = ref<Customer | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ===== COMPUTED =====
  const isAuthenticated = computed(() => !!accessToken.value)
  const customerInitials = computed(() => {
    if (!customer.value) return ''
    return `${customer.value?.first_name?.charAt(0)}${customer.value?.last_name?.charAt(0)}`.toUpperCase()
  })

  // ===== ACTIONS =====
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setCustomer(data: Customer) {
    customer.value = data
  }

  function setAccessToken(data: string) {
    accessToken.value = data
  }

  function clearAuth() {
    customer.value = null
    accessToken.value = null
  }

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    if (customer.value) {
      localStorage.setItem('customer', JSON.stringify(customer.value))
    }
    if (accessToken.value) {
      localStorage.setItem('jwtToken', accessToken.value)
    }
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return false
    const customerJson = localStorage.getItem('customer')
    const jwtToken = localStorage.getItem('jwtToken')
    if (customerJson && jwtToken) {
      try {
        setCustomer(JSON.parse(customerJson))
        setAccessToken(jwtToken)
        return true
      } catch (error) {
        console.error('Failed to parse stored customer data:', error)
        clearAuth()
      }
    }
    return false
  }

  function clearLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('customer')
    localStorage.removeItem('jwtToken')
  }

  // ===== BUSINESS LOGIC =====
  function initCustomerAndAccessToken(data: OutputLogin) {
    if (data.user && data.access_token) {
      setCustomer(data.user)
      setAccessToken(data.access_token)
      saveToLocalStorage()
    }
  }

  function logout() {
    clearAuth()
    clearLocalStorage()
  }

  async function login(input: InputLogin): Promise<APIResponse<OutputLogin>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.authentication.postLogin(input))
    if (output.success) {
      initCustomerAndAccessToken(output.content)
    } else {
      setError('Login error')
    }
    setLoading(false)
    return output
  }

  // ===== RETURN =====
  return {
    // State
    customer,
    accessToken,
    isLoading,
    error,
    // Computed
    isAuthenticated,
    customerInitials,
    // Actions
    setLoading,
    setError,
    setCustomer,
    setAccessToken,
    clearAuth,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    // Business Logic
    initCustomerAndAccessToken,
    login,
    logout
  }
})
