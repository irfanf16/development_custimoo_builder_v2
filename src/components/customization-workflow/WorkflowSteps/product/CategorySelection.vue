<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  // import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'
  import { ChevronRight } from 'lucide-vue-next'

  interface Props {
    onSelectCategory?: (categoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const categories = computed(() => productsStore.categories?.data)

  async function handleSelectCategory(categoryId: number) {
    workflowStore.setSelectedCategoryForPreview(categoryId)
    // Do not commit category or preload products here; ProductSelection will handle fetching
    props.onSelectCategory?.(categoryId)
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

  // Expose breadcrumb data to parent using new header model
  const breadcrumbs = computed(() => [{ label: 'Category' }])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col">
    <button
      v-for="(item, index) in categories"
      :key="item.id"
      class="h-14 px-4 md:px-6 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
      @click="() => handleSelectCategory(item.id)"
    >
      <div class="flex items-center gap-3">
        <component
          :is="getCategoryIcon(index)"
          class="size-6 text-primary icon-secondary-from-primary-50"
        />
        <span class="text-base font-semibold text-card-foreground">{{
          item.category_name
        }}</span>
      </div>
      <ChevronRight class="size-4 text-muted-foreground" />
    </button>
  </div>
</template>

<style scoped>
  /* Category panel specific styles */
</style>
