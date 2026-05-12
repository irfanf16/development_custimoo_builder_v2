<script setup lang="ts">
  import { provide } from 'vue'
  import { CUSTIMOO_BODY_MOBILE_DOCK } from '@/lib/custimooBodyDockInject'

  /**
   * Renders a full-viewport `fixed` layer for the mobile sheet + bottom nav. The parent
   * `Teleport` in `Customizer.vue` targets the widget root inside Shadow DOM (see
   * `useTeleportTo`), so this shell inherits the same `styles.css` and theme as the app—unlike
   * `body`, where tokens and purged utilities often break in production.
   */
  provide(CUSTIMOO_BODY_MOBILE_DOCK, true)
</script>

<template>
  <!-- Full-viewport layer: `pointer-events: none` except the dock so the widget stays tappable. -->
  <div
    data-testid="mobile-dock-shell-root"
    class="pointer-events-none fixed inset-0 z-[100] flex max-h-dvh w-full max-w-full flex-col justify-end"
  >
    <div class="pointer-events-auto flex w-full max-w-full min-h-0 max-h-full flex-col justify-end">
      <slot />
    </div>
  </div>
</template>
