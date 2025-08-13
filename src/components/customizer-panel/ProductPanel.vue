<script setup lang="ts">
  // Product panel specific logic can be added here
</script>

<template>
  <div
    :class="[
      'grid gap-6 gap-y-8 overflow-y-auto',
      'grid-cols-2 max-h-[640px] pr-1'
    ]"
  >
    <!-- Mock products for demo -->
    <div
      v-for="i in 24"
      :key="i"
      class="flex flex-col items-start gap-3"
    >
      <div class="w-full aspect-[1/1] bg-muted/20 rounded-xl grid place-items-center">
        <div class="text-sm text-muted-foreground">
          {{ ['1000-series', '2000-series', '2500-series', '3000-series'][i % 4] }}
        </div>
      </div>
      <div class="text-base font-semibold">
        {{ ['1000-series', '2000-series', '2500-series', '3000-series'][i % 4] }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Product panel specific styles */
</style>


