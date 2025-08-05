<script setup lang="ts">
  import { onMounted } from 'vue'
  import WidgetApp from '@/components/WidgetApp.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useAppInitialization } from '@/composables'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  // Initialize app data (company and settings)
  const appInit = useAppInitialization()
  const { isLoading, error, company, settings } = appInit

  // Initialize auth store on app startup
  onMounted(() => {
    try {
      const authStore = useAuthStore()
      authStore.initCustomerAndAccessTokenFromLocalStorage()
      if (!authStore.isAuthenticated) {
        router.push('/auth')
      }
    } catch (error) {
      // Auth store not available
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

  <!-- Widget content -->
  <WidgetApp v-else v-bind="$attrs" :company="company" :settings="settings" />
</template>
