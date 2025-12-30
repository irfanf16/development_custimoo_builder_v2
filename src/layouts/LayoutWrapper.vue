<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { DefaultLayout, ThirdPartyApprovalLayout } from './index'

  const route = useRoute()

  const layout = computed(() => {
    return route.meta?.layout || 'default'
  })

  const LayoutComponent = computed(() => {
    switch (layout.value) {
      case 'default':
        return DefaultLayout

      case 'auth':
        return DefaultLayout // For now, using DefaultLayout for auth too

      case 'third-party-approval':
        return ThirdPartyApprovalLayout

      default:
        return DefaultLayout
    }
  })
</script>

<template>
  <component :is="LayoutComponent">
    <slot />
  </component>
</template>
