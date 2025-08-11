<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Save, FolderOpen, ShoppingCart, UserRound } from 'lucide-vue-next'
  import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <div class="flex items-center gap-2">
    <Button variant="ghost" size="sm" class="rounded-xl">
      <Save class="size-4" />
      <span class="hidden sm:inline">Save design</span>
    </Button>
    <Button variant="ghost" size="sm" class="rounded-xl">
      <FolderOpen class="size-4" />
      <span class="hidden sm:inline">Locker room</span>
    </Button>
    <Button variant="ghost" size="sm" class="rounded-xl">
      <ShoppingCart class="size-4" />
      <span class="hidden sm:inline">Cart</span>
    </Button>
    <Button variant="ghost" size="sm" class="rounded-xl">
      <UserRound class="size-4" />
      <span class="hidden sm:inline">My profile</span>
    </Button>
    <ThemeToggle variant="ghost" size="sm" class="rounded-xl" />
  </div>
</template>

<style scoped></style>
