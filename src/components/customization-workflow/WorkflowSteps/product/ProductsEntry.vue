<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import CategorySelection from './CategorySelection.vue'
  import SubcategorySelection from './SubcategorySelection.vue'
  import ProductSelection from './ProductSelection.vue'

  type ProductsPanel = 'category' | 'subcategory' | 'product'

  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const { handleCategorySelect: selectCategory, handleSubcategorySelect: selectSubcategory } =
    workflowStore

  const categories = computed(() => productsStore.categories?.data ?? [])
  const hasCategories = computed(() => categories.value.length > 0)

  const selectedCategoryId = computed<number | null>(() => workflowStore.selectedCategoryId ?? null)
  const selectedCategory = computed(() => {
    if (selectedCategoryId.value == null) return null
    return categories.value.find(cat => cat.id === selectedCategoryId.value) || null
  })
  const selectedCategoryHasSubcategories = computed(() => {
    return (selectedCategory.value?.subcategories?.length ?? 0) > 0
  })

  // Determine the active panel based on workflow state and data availability
  const activePanel = computed<ProductsPanel>(() => {
    // If no categories, show products directly
    if (!hasCategories.value) return 'product'

    const workflowPanel = (workflowStore.productsSubStep as ProductsPanel | null) ?? 'category'

    // If workflow says subcategory but category has no subcategories, show products
    if (workflowPanel === 'subcategory' && !selectedCategoryHasSubcategories.value) {
      return 'product'
    }

    return workflowPanel
  })

  // Sync computed panel back to workflow store when it changes
  watch(
    activePanel,
    panel => {
      if (workflowStore.productsSubStep !== panel) {
        workflowStore.setProductsSubStep(panel)
      }
    },
    { immediate: true }
  )

  function handleCategorySelect(categoryId: number) {
    selectCategory(categoryId)
  }

  function handleSubcategorySelect(subcategoryId: number) {
    selectSubcategory(subcategoryId)
  }

  function handleProductScroll(elementId: string, behavior: 'smooth' | 'auto' = 'auto') {
    const target = document.getElementById(elementId)
    if (target) {
      target.scrollIntoView({ behavior })
    }
  }
</script>

<template>
  <Transition name="panel-slide" mode="out-in" appear>
    <CategorySelection
      v-if="activePanel === 'category'"
      key="products-category"
      @select-category="handleCategorySelect"
    />

    <SubcategorySelection
      v-else-if="activePanel === 'subcategory'"
      key="products-subcategory"
      @select-subcategory="handleSubcategorySelect"
    />

    <ProductSelection v-else key="products-product" @scroll-to-element="handleProductScroll" />
  </Transition>
</template>
