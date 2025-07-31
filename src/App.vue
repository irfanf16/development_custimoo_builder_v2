<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import WidgetApp from '@/components/WidgetApp.vue'
  import DefaultLayout from '@/layouts/DefaultLayout.vue'
  import DashboardLayout from '@/layouts/DashboardLayout.vue'
  import AuthLayout from '@/layouts/AuthLayout.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useRoute } from 'vue-router'

  // Check if we're in widget mode (primary) or SPA mode (fallback)
  const isWidget = computed(
    () => document.querySelector('customizer-widget') !== null
  )
  const isSPA = computed(() => document.getElementById('app') !== null)

  // Layout detection for SPA mode
  const currentLayout = computed(() => {
    if (isWidget.value) return null

    // In SPA mode, we can use router to get current route
    const route = useRoute()
    const layout = (route.meta?.layout as string) || 'default'

    switch (layout) {
      case 'dashboard':
        return DashboardLayout
      case 'auth':
        return AuthLayout
      default:
        return DefaultLayout
    }
  })

  // Initialize auth store on app startup
  onMounted(() => {
    try {
      const authStore = useAuthStore()
      authStore.initializeAuth()
    } catch (error) {
      console.warn('Auth store not available:', error)
    }
  })
</script>

<template>
  <!-- Widget mode (primary) - uses its own layout system -->
  <WidgetApp v-if="isWidget" v-bind="$attrs" />

  <!-- SPA mode (fallback) - uses traditional layout system -->
  <component v-else-if="isSPA && currentLayout" :is="currentLayout">
    <router-view />
  </component>
</template>
