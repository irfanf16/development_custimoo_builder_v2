import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type InputLogin,
  type Customer,
  type OutputLogin
} from '@/services/authentication/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'

export const useAuthStore = defineStore('authStore', () => {
  const customer = ref<Customer | null>(null)
  const isAuthenticated = ref(false)
  const accessToken = ref<string | null>(null)
  const customerInitials = computed(() => {
    return `${customer.value?.first_name?.charAt(0)}${customer.value?.last_name?.charAt(0)}`.toUpperCase()
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
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
    isAuthenticated.value = true
  }

  // Consolidated clear function
  function clearAuth() {
    customer.value = null
    accessToken.value = null
    isAuthenticated.value = false
  }

  // Initialize customer and token from data
  function initCustomerAndAccessToken(data: OutputLogin) {
    if (data.user && data.access_token) {
      setCustomer(data.user)
      setAccessToken(data.access_token)
      // Persist to localStorage
      localStorage.setItem('customer', JSON.stringify(data.user))
      localStorage.setItem('jwtToken', data.access_token)
    }
  }

  // Initialize from localStorage
  function initCustomerAndAccessTokenFromLocalStorage() {
    const customerJson = localStorage.getItem('customer')
    const jwtToken = localStorage.getItem('jwtToken')
    if (customerJson && jwtToken) {
      try {
        setCustomer(JSON.parse(customerJson))
        setAccessToken(jwtToken)
      } catch (error) {
        console.error('Failed to parse stored customer data:', error)
        clearAuth()
      }
    }
  }

  function logout() {
    clearAuth()
    // Remove from localStorage
    localStorage.removeItem('customer')
    localStorage.removeItem('jwtToken')
  }

  // API Functions
  async function dispatchLogin(
    input: InputLogin
  ): Promise<APIResponse<OutputLogin>> {
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

  return {
    customer,
    isAuthenticated,
    accessToken,
    dispatchLogin,
    logout,
    customerInitials,
    isLoading,
    error,
    initCustomerAndAccessTokenFromLocalStorage
  }
})
