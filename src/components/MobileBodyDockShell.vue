<script setup lang="ts">
  import { provide } from 'vue'
  import { CUSTIMOO_BODY_MOBILE_DOCK } from '@/lib/custimooBodyDockInject'

  provide(CUSTIMOO_BODY_MOBILE_DOCK, true)
</script>

<template>
  <!-- Full-viewport layer: `pointer-events: none` except the dock so the widget stays tappable. -->
  <div
    class="pointer-events-none fixed inset-0 z-[100] flex max-h-[100dvh] w-full max-w-full flex-col justify-end"
  >
    <div
      class="pointer-events-auto flex w-full max-w-full min-h-0 max-h-full flex-col justify-end"
    >
      <slot />
    </div>
  </div>
</template>
