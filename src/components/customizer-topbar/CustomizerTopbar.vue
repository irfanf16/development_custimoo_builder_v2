<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Save, ShoppingCart } from 'lucide-vue-next'
  import ThemeToggle from '@/components/ThemeToggle.vue'
  import SignInButton from '@/components/SignInButton.vue'
</script>

<template>
  <!-- Right aligned action group. Save is a split button to match figma. -->
  <div class="flex items-center gap-2">
    <div class="flex rounded-lg outline outline-border overflow-hidden">
      <Button variant="outline" size="default" class="rounded-none border-0">
        <Save class="size-4" />
        <span>Save</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        class="rounded-none border-0 border-l outline-0"
        aria-label="Save options"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Button>
    </div>

    <Button variant="outline" size="default" class="rounded-lg">
      <span>Locker room</span>
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <ShoppingCart class="size-4" />
      <span>Cart</span>
    </Button>
    <SignInButton variant="outline" size="default" class="rounded-lg" />
    <ThemeToggle variant="outline" size="default" class="rounded-lg" />
  </div>
</template>

<style scoped></style>
