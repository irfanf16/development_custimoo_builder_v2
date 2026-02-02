<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { getCategoryIcon } from './icon-utils'

  interface Props {
    onSelectSubcategory?: (subcategoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  const selectedCategoryId = computed(() => workflowStore.selectedCategoryId ?? null)

  const selectedCategory = computed(() => {
    const id = selectedCategoryId.value
    if (!id) return null
    return productsStore.categories?.data?.find(c => c.id === id) || null
  })

  const subcategories = computed(() => selectedCategory.value?.subcategories || [])

  function handleSelectSubcategory(subcategoryId: number) {
    workflowStore.setSelectedSubCategoryForPreview(subcategoryId)
    props.onSelectSubcategory?.(subcategoryId)
  }
</script>

<template>
  <div class="flex flex-col">
    <PanelNavigationItem
      v-for="item in subcategories"
      :id="item.id.toString()"
      :key="item.id"
      @click="() => handleSelectSubcategory(item.id)"
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

<style scoped></style>
