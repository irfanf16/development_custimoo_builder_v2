<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { getCategoryIcon } from './icon-utils'

  interface Props {
    onSelectCategory?: (categoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const categories = computed(() => productsStore.categories?.data)

  function handleSelectCategory(categoryId: number) {
    // Do not commit category or preload products here; ProductSelection will handle fetching
    props.onSelectCategory?.(categoryId)
  }
</script>

<template>
  <div class="flex flex-col">
    <PanelNavigationItem
      v-for="(item, index) in categories"
      :id="item.id.toString()"
      :key="item.id"
      @click="() => handleSelectCategory(item.id)"
    >
      <template #content>
        <div class="flex items-center gap-3">
          <component
            :is="getCategoryIcon(index)"
            class="size-6 text-primary icon-secondary-from-primary-50"
          />
          <span class="text-base font-semibold text-card-foreground">{{ item.category_name }}</span>
        </div>
      </template>
    </PanelNavigationItem>
  </div>
</template>

<style scoped>
  /* Category panel specific styles */
</style>
