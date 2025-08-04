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
    customer.value = data
    const customerJson = JSON.stringify(customer.value)
    localStorage.setItem('customer', customerJson)
  }

  function initAccessToken(data: string) {
    accessToken.value = data
    isAuthenticated.value = true
    localStorage.setItem('jtwToken', data)
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

      const { status, data } = response

      if (status === 200 && data?.user && data?.access_token) {
        initCustomer(data.user)
        initAccessToken(data.access_token)

        localStorage.getItem('customer')
        localStorage.getItem('jtwToken')

        return {
          success: true,
          content: null,
          status: 200
        }
      }
      return {
        success: false,
        content: null,
        status: 400
      }
    } catch (error) {
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
    dispatchLogin,
    logout
  }
})
