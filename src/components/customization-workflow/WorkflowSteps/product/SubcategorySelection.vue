<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { ChevronRight } from 'lucide-vue-next'

  interface Props {
    onSelectSubcategory?: (subcategoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()

  const selectedCategoryId = computed(
    () => workflowStore.selectedCategoryId ?? null
  )

  const selectedCategory = computed(() => {
    const id = selectedCategoryId.value
    if (!id) return null
    return productsStore.categories?.data?.find(c => c.id === id) || null
  })

  const subcategories = computed(
    () => selectedCategory.value?.subcategories || []
  )

  function handleSelectSubcategory(subcategoryId: number) {
    workflowStore.setSelectedSubCategoryForPreview(subcategoryId)
    props.onSelectSubcategory?.(subcategoryId)
  }

  // Expose breadcrumb via header model
  const breadcrumbs = computed(() => {
    const category = selectedCategory.value
    return [
      {
        label: 'Category',
        action: () => {
          workflowStore.setProductsSubStep('category')
          workflowStore.setActiveStep('Categories')
        }
      },
      { label: category?.category_name || '—' }
    ]
  })
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col">
    <button
      v-for="item in subcategories"
      :key="item.id"
      class="h-14 px-4 md:px-6 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
      @click="() => handleSelectSubcategory(item.id)"
    >
      <div class="flex items-center gap-3">
        <div class="size-6 rounded bg-secondary" />
        <span class="text-base font-semibold text-card-foreground">{{
          item.category_name
        }}</span>
      </div>
      <ChevronRight class="size-4 text-muted-foreground" />
    </button>
  </div>
</template>

<style scoped></style>
