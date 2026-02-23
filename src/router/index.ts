import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useAppStore } from '@/stores/app/app.store'
import { isWidgetMode } from '@/lib/widgetUtils'
import { usePostHog } from '@/composables/usePostHog'

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
    path: '/third-party-feedback/:order_item_id',
    name: 'ThirdPartyApproval',
    component: () => import('@/views/ThirdPartyApproval.vue'),
    meta: {
      layout: 'third-party-approval',
      initializationType: 'third-party-approval',
      title: 'Third Party Approval'
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
router.beforeEach((to, _from, next) => {
  // Handle share URLs: redirect /share/... to / and let initialization extract the share URL
  if (to.path.startsWith('/share/')) {
    // Extract the share URL part (everything after /share/) and include the 'share/' prefix
    const shareUrlPart = to.path.replace(/^\/share\//, '')
    if (shareUrlPart) {
      // Store the full share URL including 'share/' prefix for API request
      const appStore = useAppStore()
      appStore.setShareUrl(`share/${shareUrlPart}`)

      // Redirect to home route - initialization will handle loading the product
      next({ path: '/', replace: true })
      return
    }
  }

  // Remove handled query params from route if they exist
  // This prevents them from appearing in the URL after navigation
  const handledParams = ['sync_id', 'update_item', 'update_cart', 'line', 'roster']
  const hasHandledParams = handledParams.some(key => to.query[key] !== undefined)

  if (hasHandledParams) {
    const cleanedQuery = { ...to.query }
    handledParams.forEach(key => {
      delete cleanedQuery[key]
    })

    // Redirect to same route without handled query params
    next({
      path: to.path,
      query: cleanedQuery,
      hash: to.hash,
      replace: true
    })
    return
  }

  // Update document title
  if (typeof to.meta.title === 'string') {
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

// @ts-expect-error - posthog initialization for side effects
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { posthog } = usePostHog()

export default router
