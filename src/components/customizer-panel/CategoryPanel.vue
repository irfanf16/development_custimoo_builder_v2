<script setup lang="ts">
  import { useProductsStore } from '@/stores/products'
  import { flexDuoCategoryIcons } from '@/icons/flex-duo-categories'
  import { ChevronRight } from 'lucide-vue-next'
  interface Props {
    onSelectCategory?: (categoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()

  async function handleSelectCategory(categoryId: number) {
    productsStore.setActiveCategory(categoryId)
    await productsStore.dispatchGetProductPreviews(categoryId)
    const firstProductId =
      productsStore.productPreviews && productsStore.productPreviews.length
        ? productsStore.productPreviews[0].product.id
        : null
    if (firstProductId != null) {
      await productsStore.dispatchGetActiveProductDetails(firstProductId)
    }
    props.onSelectCategory?.(categoryId)
  }

  // Temporary mapping: cycle through Flex Duo icons until API provides icon per category
  const fallbackFlexDuoIcons = [
    flexDuoCategoryIcons.Football,
    flexDuoCategoryIcons.Brightness,
    flexDuoCategoryIcons.PottedFlowerTulip,
    flexDuoCategoryIcons.Leaf,
    flexDuoCategoryIcons.SnowFlake,
    flexDuoCategoryIcons.HolidayVacationBeachUmbrella,
    flexDuoCategoryIcons.Soccer,
    flexDuoCategoryIcons.Baseball,
    flexDuoCategoryIcons.Shorts,
    flexDuoCategoryIcons.Hanger,
    flexDuoCategoryIcons.Backpack,
    flexDuoCategoryIcons.ShoppingBagHandBag,
    flexDuoCategoryIcons.ModuleThree,
    flexDuoCategoryIcons.Boots,
    flexDuoCategoryIcons.CapFrozen,
    flexDuoCategoryIcons.CapSide,
    flexDuoCategoryIcons.Cricket,
    flexDuoCategoryIcons.Hockey,
    flexDuoCategoryIcons.Tennis,
    flexDuoCategoryIcons.Volleyball,
    flexDuoCategoryIcons.Cycling,
    flexDuoCategoryIcons.BicycleBike,
    flexDuoCategoryIcons.Running,
    flexDuoCategoryIcons.Swimming,
    flexDuoCategoryIcons.Hiking,
    flexDuoCategoryIcons.Skateboarding,
    flexDuoCategoryIcons.Snowboarding,
    flexDuoCategoryIcons.Surfing,
    flexDuoCategoryIcons.Kayaking,
    flexDuoCategoryIcons.RollerSkating,
    flexDuoCategoryIcons.Golf,
    flexDuoCategoryIcons.Playground,
    flexDuoCategoryIcons.Stadium,
    flexDuoCategoryIcons.Whistle,
    flexDuoCategoryIcons.Shirt,
    flexDuoCategoryIcons.Sock,
    flexDuoCategoryIcons.Meditation,
    flexDuoCategoryIcons.MartialArts,
    flexDuoCategoryIcons.MotorsportsHelmet,
    flexDuoCategoryIcons.FlagScore,
    flexDuoCategoryIcons.WalkingSteps,
    flexDuoCategoryIcons.ScubaDiving
  ] as const

  const getCategoryIcon = (index: number) =>
    fallbackFlexDuoIcons[index % fallbackFlexDuoIcons.length]
</script>

<template>
  <div class="flex flex-col">
    <button
      v-for="(item, index) in productsStore.categories?.data"
      :key="item.id"
      class="h-14 px-4 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
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
