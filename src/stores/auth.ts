import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  bio: string
  location: string
  website: string
  joined: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(
    () => isAuthenticated.value && user.value !== null
  )
  const userInitials = computed(() => {
    if (!user.value) return ''
    return user.value.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
  })

  // Actions
  const initializeAuth = () => {
    const storedAuth = localStorage.getItem('isAuthenticated')
    const storedUser = localStorage.getItem('user')

    if (storedAuth === 'true' && storedUser) {
      try {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
        clearAuth()
      }
    }
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock user data - in real app, this would come from API
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: credentials.email,
        role: 'Full Stack Developer',
        avatar: 'JD',
        bio: 'Passionate developer with 5+ years of experience building modern web applications.',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        joined: 'January 2023'
      }

      user.value = mockUser
      isAuthenticated.value = true

      // Persist to localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify(mockUser))

      return { success: true }
    } catch (err) {
      error.value = 'Login failed. Please check your credentials.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock user data - in real app, this would come from API
      const mockUser: User = {
        id: '1',
        name: credentials.name,
        email: credentials.email,
        role: 'Full Stack Developer',
        avatar: credentials.name
          .split(' ')
          .map(n => n.charAt(0))
          .join('')
          .toUpperCase(),
        bio: 'New user account created.',
        location: 'Unknown',
        website: '',
        joined: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        })
      }

      user.value = mockUser
      isAuthenticated.value = true

      // Persist to localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify(mockUser))

      return { success: true }
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    error.value = null

    // Clear localStorage
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
  }

  const clearAuth = () => {
    user.value = null
    isAuthenticated.value = false
    error.value = null

    // Clear localStorage
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user.value) return { success: false, error: 'No user logged in' }

    isLoading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Update user data
      user.value = { ...user.value, ...updates }

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user.value))

      return { success: true }
    } catch (err) {
      error.value = 'Failed to update profile. Please try again.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Getters
    isLoggedIn,
    userInitials,

    // Actions
    initializeAuth,
    login,
    register,
    logout,
    clearAuth,
    updateProfile
  }
})
