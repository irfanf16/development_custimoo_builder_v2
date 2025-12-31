<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import WidgetApp from '@/components/WidgetApp.vue'
  import { useAppInitialization } from '@/composables'
  import { Button } from '@/components/ui/button'
  import Spinner from '@/components/ui/spinner/Spinner.vue'

  const route = useRoute()

  // Check if we should skip main initialization (e.g., for third-party approval route)
  const initType = computed(() => route.meta?.intitializationType as string | undefined)

  // Initialize app data (company and settings) - only if not skipping
  const appInit = initType.value === 'third-party-approval' ? null : useAppInitialization()
  const isLoading = computed(() => appInit?.isLoading.value ?? false)
  const error = computed(() => appInit?.error.value ?? null)

  // Auth initialization now lives in useAppInitialization
</script>

<template>
  <!-- Loading state while initializing -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <Spinner class="size-8 text-primary mx-auto mb-4" />
      <p class="text-muted-foreground">Initializing app...</p>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <p class="text-destructive mb-4">{{ error }}</p>
      <Button v-if="appInit" variant="default" class="px-4 py-2" @click="appInit.initializeApp()">
        Retry
      </Button>
    </div>
  </div>

  <!-- Widget content -->
  <WidgetApp v-else v-bind="$attrs" />
</template>
