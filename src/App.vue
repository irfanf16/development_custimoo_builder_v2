<script setup lang="ts">
  import WidgetApp from '@/components/WidgetApp.vue'
  import { useAppInitialization } from '@/composables'
  import { Button } from '@/components/ui/button'

  // Initialize app data (company and settings)
  const appInit = useAppInitialization()
  const { isLoading, error } = appInit

  // Auth initialization now lives in useAppInitialization
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
      <Button
        variant="default"
        class="px-4 py-2"
        @click="appInit.initializeApp()"
      >
        Retry
      </Button>
    </div>
  </div>

  <!-- Widget content -->
  <WidgetApp v-else v-bind="$attrs" />
</template>
