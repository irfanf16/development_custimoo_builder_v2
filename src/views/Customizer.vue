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
    <div class="absolute right-4 top-3 z-20 hidden md:block">
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
        <div
          class="h-[780px] rounded-3xl bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-muted/60 via-background to-background border grid place-items-center"
        >
          <!-- Replace with actual product canvas -->
          <div class="size-[520px] rounded-full bg-muted/50" />
        </div>
      </div>

      <!-- Right toolbar -->
      <div class="pt-24">
        <RightToolbar />
      </div>
    </div>

    <!-- Bottom actions + price card -->
    <div
      class="absolute bottom-4 left-[calc(56px+260px+1rem)] right-4 flex items-end justify-between gap-4"
    >
      <BottomActions />
      <PriceCard />
    </div>
  </div>
</template>
