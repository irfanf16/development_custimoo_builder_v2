<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { ChevronRight } from 'lucide-vue-next'
  import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'

  interface Props {
    onSelectSubcategory?: (subcategoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()

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

  // Temporary mapping: cycle through Flex Duo icons until API provides icon per category
  const fallbackFlexDuoIcons = [
    flexFlatCategoryIcons.Shorts,
    flexFlatCategoryIcons.Hockey,
    flexFlatCategoryIcons.Baseball,
    flexFlatCategoryIcons.Soccer,
    flexFlatCategoryIcons.Football,
    flexFlatCategoryIcons.Brightness,
    flexFlatCategoryIcons.PottedFlowerTulip,
    flexFlatCategoryIcons.Leaf,
    flexFlatCategoryIcons.SnowFlake,
    flexFlatCategoryIcons.HolidayVacationBeachUmbrella,
    flexFlatCategoryIcons.Hanger,
    flexFlatCategoryIcons.Backpack,
    flexFlatCategoryIcons.ShoppingBagHandBag,
    flexFlatCategoryIcons.ModuleThree,
    flexFlatCategoryIcons.Boots,
    flexFlatCategoryIcons.CapFrozen,
    flexFlatCategoryIcons.CapSide,
    flexFlatCategoryIcons.Cricket,
    flexFlatCategoryIcons.Tennis,
    flexFlatCategoryIcons.Volleyball,
    flexFlatCategoryIcons.Cycling,
    flexFlatCategoryIcons.BicycleBike,
    flexFlatCategoryIcons.Running,
    flexFlatCategoryIcons.Swimming,
    flexFlatCategoryIcons.Hiking,
    flexFlatCategoryIcons.Skateboarding,
    flexFlatCategoryIcons.Snowboarding,
    flexFlatCategoryIcons.Surfing,
    flexFlatCategoryIcons.Kayaking,
    flexFlatCategoryIcons.RollerSkating,
    flexFlatCategoryIcons.Golf,
    flexFlatCategoryIcons.Playground,
    flexFlatCategoryIcons.Stadium,
    flexFlatCategoryIcons.Whistle,
    flexFlatCategoryIcons.Shirt,
    flexFlatCategoryIcons.Sock,
    flexFlatCategoryIcons.Meditation,
    flexFlatCategoryIcons.MartialArts,
    flexFlatCategoryIcons.MotorsportsHelmet,
    flexFlatCategoryIcons.FlagScore,
    flexFlatCategoryIcons.WalkingSteps,
    flexFlatCategoryIcons.ScubaDiving
  ] as const

  const getCategoryIcon = (index: number) =>
    fallbackFlexDuoIcons[index % fallbackFlexDuoIcons.length]

  // Breadcrumbs handled centrally via useWorkflow
</script>

<template>
  <div class="flex flex-col">
    <button
      v-for="(item, index) in subcategories"
      :key="item.id"
      class="h-14 px-4 md:px-6 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
      @click="() => handleSelectSubcategory(item.id)"
    >
      <div class="flex items-center gap-3">
        <component
          :is="getCategoryIcon(index)"
          class="size-6 text-primary icon-secondary-from-primary-50"
        />
        <span class="text-base font-semibold text-card-foreground">{{ item.category_name }}</span>
      </div>
      <ChevronRight class="size-4 text-muted-foreground" />
    </button>
  </div>
</template>

<style scoped></style>
