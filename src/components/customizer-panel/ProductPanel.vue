<script setup lang="ts">
  // Product panel specific logic can be added here
</script>

<template>
  <div
    :class="[
      'flex flex-wrap overflow-y-auto max-h-[640px]'
    ]"
  >
    <!-- Mock products for demo -->
    <div
      v-for="i in 24"
      :key="i"
      class="flex flex-col items-center flex-shrink-0 gap-6 pl-6 pb-6 pt-6"
    >
      <div class="text-sm font-medium text-left w-full text-foreground">
        {{ ['1000-series', '2000-series', '2500-series', '3000-series'][i % 4] }}
      </div>
      <img
        src="https://placehold.co/176x176"
        alt="Product placeholder"
        class="bg-muted/20 rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer hover:bg-muted/30 object-cover"
      />
      
    </div>
  </div>
</template>

<style scoped>
/* Product panel specific styles */
</style>


