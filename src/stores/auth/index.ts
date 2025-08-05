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

  function clearCustomer() {
    customer.value = null
  }
  function clearAccessToken() {
    accessToken.value = null
    isAuthenticated.value = false
  }

  function clearCustomerAndAccessToken() {
    clearCustomer()
    clearAccessToken()
  }

  function initCustomer(data: Customer) {
    setCustomer(data)
    const customerJson = JSON.stringify(customer.value)
    localStorage.setItem('customer', customerJson)
  }

  function initAccessToken(data: string) {
    setAccessToken(data)
    localStorage.setItem('jtwToken', data)
  }

  function setCustomerAndAccessToken(data: OutputLogin) {
    if (data.user && data.access_token) {
      initCustomer(data.user)
      initAccessToken(data.access_token)
    }
  }

  function initCustomerAndAccessTokenFromLocalStorage() {
    const customerJson = localStorage.getItem('customer')
    const jtwToken = localStorage.getItem('jtwToken')
    if (customerJson && jtwToken) {
      initCustomer(JSON.parse(customerJson))
      initAccessToken(jtwToken)
    }
  }

  function logout() {
    clearCustomerAndAccessToken()
    // Remove from local storage
    localStorage.removeItem('customer')
    localStorage.removeItem('jtwToken')
  }

  // API Functions
  async function dispatchLogin(
    input: InputLogin
  ): Promise<APIResponse<OutputLogin>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.authentication.postLogin(input))
    if (output.success) {
      setCustomerAndAccessToken(output.content)
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
