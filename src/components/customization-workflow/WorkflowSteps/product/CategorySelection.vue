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
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
</script>

<template>
  <div class="flex flex-col">
    <PanelNavigationItem
      v-for="item in categories"
      :id="item.id.toString()"
      :key="item.id"
      @click="() => handleSelectCategory(item.id)"
    >
      <template #content>
        <div class="flex items-center gap-3">
          <img v-if="item.image_url" :src="storage_url + item.image_url" class="size-6" />
          <component
            :is="getCategoryIcon(item.icon_name)"
            v-else-if="item.icon_name"
            class="size-6 text-primary icon-secondary-from-primary-50"
          />
          <span class="text-base font-semibold text-card-foreground whitespace-nowrap">{{
            item.category_name
          }}</span>
        </div>
      </template>
    </PanelNavigationItem>
  </div>
</template>

<style scoped>
  /* Category panel specific styles */
</style>
