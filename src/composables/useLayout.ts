import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useLayout() {
  const route = useRoute()
  const authStore = useAuthStore()

  const currentLayout = computed(() => {
    return (route.meta?.layout as string) || 'default'
  })

  const isAuthenticated = computed(() => authStore.isLoggedIn)
  const requiresAuth = computed(() => route.meta?.requiresAuth === true)
  const canAccess = computed(() => {
    if (!requiresAuth.value) return true
    return isAuthenticated.value
  })

  return {
    currentLayout,
    isAuthenticated,
    requiresAuth,
    canAccess
  }
}
