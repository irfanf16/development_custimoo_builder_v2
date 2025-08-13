<script setup lang="ts">
  import { useProductsStore } from '@/stores/products'

  interface Props {
    onSelectCategory: (categoryId: number) => void
  }

  defineProps<Props>()
  const productsStore = useProductsStore()
</script>

<template>
  <div class="flex flex-col">
    <button
      v-for="item in productsStore.categories?.data"
      :key="item.id"
      class="h-14 px-4 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
      @click="() => onSelectCategory(item.id)"
    >
      <div class="flex items-center gap-3">
        <div class="grid place-items-center size-6 rounded-lg border">
          <div class="size-3.5 bg-primary/20 rounded"></div>
        </div>
        <span class="text-base font-semibold">{{ item.category_name }}</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="size-4 text-muted-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
/* Category panel specific styles */
</style>
