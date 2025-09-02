import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth.store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Customizer',
    component: () => import('@/views/Customizer.vue'),
    meta: {
      layout: 'default',
      title: 'Customizer'
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: {
      layout: 'auth',
      title: 'Authentication'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      layout: 'default',
      title: 'Page Not Found'
    }
  }
]

// Determine router mode based on environment
const isWidgetMode = () => document.querySelector('customizer-widget') !== null
const isSPAMode = () => document.getElementById('app') !== null

// Use hash mode for widgets (default), history mode for SPA
const useHashMode = isWidgetMode() || !isSPAMode()

const router = createRouter({
  history: useHashMode ? createWebHashHistory() : createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard for authentication
router.beforeEach(async (to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    const mode = isWidgetMode() ? 'Widget' : 'Customizer'
    document.title = `${to.meta.title} - ${mode}`
  }

  // Initialize auth store if not already done
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    // authStore.initCustomerAndAccessToken()
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/auth')
      return
    }
  }

  next()
})

export default router
