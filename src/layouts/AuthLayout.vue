<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goHome = () => {
    router.push('/')
  }
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <header
      class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 rounded-lg bg-primary"></div>
            <span class="text-xl font-bold">Customizer</span>
          </div>

          <!-- Back to Home -->
          <Button variant="ghost" @click="goHome"> ← Back to Home </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t bg-background py-4">
      <div
        class="container mx-auto px-4 text-center text-sm text-muted-foreground"
      >
        © 2024 Customizer. All rights reserved.
      </div>
    </footer>
  </div>
</template>
