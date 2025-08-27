<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useRouter } from 'vue-router'
  import { notfound_go_back } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale'

  const router = useRouter()
  const localeStore = useLocaleStore()

  const goHome = () => {
    router.push('/')
  }

  const goBack = () => {
    router.go(-1)
  }
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div class="text-6xl font-bold text-muted-foreground mb-4">404</div>
      <h1 class="text-3xl font-bold mb-4">Page Not Found</h1>
      <p class="text-muted-foreground mb-8 max-w-md mx-auto">
        Sorry, we couldn't find the page you're looking for. It might have been
        moved, deleted, or you entered the wrong URL.
      </p>
      <div class="flex justify-center space-x-4">
        <Button @click="goHome">Go Home</Button>
        <Button variant="outline" @click="goBack">{{
          notfound_go_back({}, { locale: localeStore.currentLocale })
        }}</Button>
      </div>
    </div>
  </div>
</template>
