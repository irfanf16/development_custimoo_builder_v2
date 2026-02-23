<script setup lang="ts">
  import { useThirdPartyApprovalInitialization } from '@/composables/useThirdPartyApprovalInitialization'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { Button } from '@/components/ui/button'
  import { ScrollArea } from '@/components/ui/scroll-area'

  const { isLoading, unauthorized, error, isInitialized, initializeApp } =
    useThirdPartyApprovalInitialization()
</script>

<template>
  <div class="layout w-full mx-auto overflow-hidden min-h-screen">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <Spinner class="size-8 text-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Loading samples...</p>
      </div>
    </div>

    <!-- Unauthorized State -->
    <div v-else-if="unauthorized" class="flex items-center justify-center min-h-screen px-4">
      <div class="text-center max-w-md">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">Unauthorized Access</h2>
        <p class="text-muted-foreground mb-4">
          {{ error || 'This link has expired or you are not authorized to access this page.' }}
        </p>
        <p class="text-sm text-muted-foreground">
          Please contact the person who sent you this link for assistance.
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen px-4">
      <div class="text-center max-w-md">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">Error Loading Samples</h2>
        <p class="text-muted-foreground mb-4">
          {{ error }}
        </p>
        <Button @click="initializeApp()">Retry</Button>
      </div>
    </div>

    <!-- Success State - Render Slot -->
    <ScrollArea v-else-if="isInitialized" class="h-screen w-full overflow-y-auto">
      <slot />
    </ScrollArea>
  </div>
</template>
