<script setup lang="ts">
  import CustomizerMenu from '@/components/customizer-menu/index.vue'
  import CategoryPanel from '@/components/customizer-panel/CategoryPanel.vue'
  import RightToolbar from '@/components/customizer-toolbar/RightToolbar.vue'
  import BottomActions from '@/components/customizer-bottom-actions/BottomActions.vue'
  import PriceCard from '@/components/customizer-price/PriceCard.vue'
  import CustomizerTopbar from '@/components/customizer-topbar/index.vue'
</script>

<template>
  <div class="relative w-full min-h-[700px]">
    <!-- Top Right controls -->
    <div class="absolute right-4 top-4 z-20 hidden md:block">
      <CustomizerTopbar />
    </div>

    <div class="grid grid-cols-[56px_260px_1fr_56px] gap-4 items-start w-full">
      <!-- Mini left icon rail -->
      <div class="pt-4">
        <CustomizerMenu />
      </div>

      <!-- Category panel -->
      <div class="pt-4">
        <CategoryPanel />
      </div>

      <!-- Canvas area -->
      <div class="relative">
        <!--<div class="h-[816px] rounded-[32px] grid place-items-center">
           <div class="w-[715px] flex flex-col items-center z-0">
            <img
              class="w-[715px] h-[817px] object-cover select-none pointer-events-none"
              src="https://placehold.co/715x817"
              alt="t-shirt"
            />
            <div class="w-96 h-4 bg-black/80 rounded-full blur-xl -mt-6"></div>
          </div>
        </div> -->
      </div>

      <!-- Right toolbar -->
      <div class="pt-24">
        <RightToolbar />
      </div>
    </div>

    <!-- Bottom actions + price card -->
    <div
      class="absolute bottom-6 left-0 right-0 px-6 flex items-end justify-between gap-4"
    >
      <BottomActions />
      <PriceCard />
    </div>
  </div>
</template>
