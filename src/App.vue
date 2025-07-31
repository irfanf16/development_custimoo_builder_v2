<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import DefaultLayout from '@/layouts/DefaultLayout.vue'
  import DashboardLayout from '@/layouts/DashboardLayout.vue'
  import AuthLayout from '@/layouts/AuthLayout.vue'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()

  const currentLayout = computed(() => {
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
    authStore.initializeAuth()
  })
</script>

<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>
