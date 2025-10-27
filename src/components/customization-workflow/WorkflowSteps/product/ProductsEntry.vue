<script setup lang="ts">
  import { computed, watch, ref } from 'vue'
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

  const derivedPanel = computed<ProductsPanel>(() => {
    return (workflowStore.productsSubStep as ProductsPanel | null) ?? 'category'
  })

  const preferredPanel = ref<ProductsPanel>(derivedPanel.value)

  watch(derivedPanel, panel => {
    preferredPanel.value = panel
  })

  watch(
    [hasCategories, selectedCategoryHasSubcategories],
    ([hasCats, hasSubs]) => {
      if (!hasCats && preferredPanel.value !== 'product') {
        preferredPanel.value = 'product'
      } else if (preferredPanel.value === 'subcategory' && !hasSubs) {
        preferredPanel.value = 'product'
      }
    },
    { immediate: true }
  )

  const activePanel = computed<ProductsPanel>(() => {
    if (!hasCategories.value) return 'product'
    if (preferredPanel.value === 'subcategory') {
      return selectedCategoryHasSubcategories.value ? 'subcategory' : 'product'
    }
    return preferredPanel.value
  })

  watch(
    () => activePanel.value,
    panel => {
      if (workflowStore.productsSubStep !== panel) {
        workflowStore.setProductsSubStep(panel)
      }
    },
    { immediate: true }
  )

  const categoryRef = ref<{ headerExtras?: unknown } | null>(null)
  const subcategoryRef = ref<{ headerExtras?: unknown } | null>(null)
  const productRef = ref<{ headerExtras?: unknown } | null>(null)

  const headerExtras = computed(() => {
    if (activePanel.value === 'category') {
      return categoryRef.value?.headerExtras
    }
    if (activePanel.value === 'subcategory') {
      return subcategoryRef.value?.headerExtras
    }
    return productRef.value?.headerExtras
  })

  defineExpose({ headerExtras })

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
      ref="categoryRef"
      @select-category="handleCategorySelect"
    />

    <SubcategorySelection
      v-else-if="activePanel === 'subcategory'"
      key="products-subcategory"
      ref="subcategoryRef"
      @select-subcategory="handleSubcategorySelect"
    />

    <ProductSelection
      v-else
      key="products-product"
      ref="productRef"
      @scroll-to-element="handleProductScroll"
    />
  </Transition>
</template>
