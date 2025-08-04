<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import WidgetApp from '@/components/WidgetApp.vue'
  import DefaultLayout from '@/layouts/DefaultLayout.vue'
  import DashboardLayout from '@/layouts/DashboardLayout.vue'
  import AuthLayout from '@/layouts/AuthLayout.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useRoute } from 'vue-router'
  import { useAppInitialization } from '@/composables'

  // Initialize app data (company and settings)
  const appInit = useAppInitialization()
  const { isInitialized, isLoading, error, company, settings } = appInit

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
    const layout = (route?.meta?.layout as string) || 'default'

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
      console.log('onMounted')
      const authStore = useAuthStore()
      authStore.initializeAuth()
    } catch (error) {
      console.warn('Auth store not available:', error)
    }
  })
</script>

<template>
  <!-- Loading state while initializing -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted-foreground">Initializing app...</p>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <p class="text-destructive mb-4">{{ error }}</p>
      <button @click="appInit.initializeApp()" class="btn btn-primary">
        Retry
      </button>
    </div>
  </div>

  <!-- Main app content -->
  <template v-else>
    <!-- Widget mode (primary) - uses its own layout system -->
    <WidgetApp
      v-if="isWidget"
      v-bind="$attrs"
      :company="company"
      :settings="settings"
    />

    <!-- SPA mode (fallback) - uses traditional layout system -->
    <component v-else-if="isSPA && currentLayout" :is="currentLayout">
      <router-view :company="company" :settings="settings" />
    </component>
  </template>
</template>
