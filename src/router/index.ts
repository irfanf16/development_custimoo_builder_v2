import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      layout: 'default',
      title: 'Home'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      layout: 'default',
      title: 'About'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      layout: 'dashboard',
      title: 'Dashboard',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      layout: 'dashboard',
      title: 'Profile',
      requiresAuth: true
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
    authStore.initializeAuth()
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      next('/auth')
      return
    }
  }

  next()
})

export default router
