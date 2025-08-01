import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type InputLogin, type Customer } from '@/services/authentication/types'
import { type APIResponse } from '@/services/types'
import { API } from '../../services'
import type { AxiosError } from 'axios'

export const useAuthenticationStore = defineStore('authenticationStore', () => {
  const customer = ref<Customer | null>(null)
  const isAuthenticated = ref(false)
  const accessToken = ref<string | null>(null)

  function initCustomer(data: Customer) {
    console.log('initCustomer called with:', data)
    customer.value = data
    const customerJson = JSON.stringify(customer.value)
    console.log('Setting localStorage customer:', customerJson)
    localStorage.setItem('customer', customerJson)
    console.log('localStorage customer set successfully')
  }

  function initAccessToken(data: string) {
    console.log('initAccessToken called with:', data)
    accessToken.value = data
    isAuthenticated.value = true
    console.log('Setting localStorage jtwToken:', data)
    localStorage.setItem('jtwToken', data)
    console.log('localStorage jtwToken set successfully')
  }

  function logout() {
    customer.value = null
    accessToken.value = null
    isAuthenticated.value = false
    // Remove from local storage
    localStorage.removeItem('customer')
    localStorage.removeItem('jtwToken')
  }

  async function dispatchLogin(input: InputLogin): Promise<APIResponse<null>> {
    try {
      const response = await API.authentication.postLogin(input)
      console.log('Full axios response:', response)

      const { status, data } = response

      if (status === 200 && data?.user && data?.access_token) {
        initCustomer(data.user)
        initAccessToken(data.access_token)

        // Verify localStorage was set
        const storedCustomer = localStorage.getItem('customer')
        const storedToken = localStorage.getItem('jtwToken')
        console.log('Stored customer:', storedCustomer)
        console.log('Stored token:', storedToken)

        return {
          success: true,
          content: null,
          status: 200
        }
      } else {
        console.error(
          'Invalid data structure. Expected data.content.user and data.content.access_token'
        )
        console.error('Actual data structure:', data)
        return {
          success: false,
          content: null,
          status: 400
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      const _error = error as AxiosError<string>
      return {
        success: false,
        status: _error.response?.status,
        content: null
      }
    }
  }

  return {
    customer,
    isAuthenticated,
    accessToken,
    initCustomer,
    initAccessToken,
    dispatchLogin,
    logout
  }
})
