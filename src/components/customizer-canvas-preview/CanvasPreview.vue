<template>
  <!-- Canvas area -->
  <div class="relative z-0">
    <!-- Preview layer (kept behind toolbars/menus) -->
    <div
      class="absolute inset-0 z-0 grid place-items-center pointer-events-none"
    >
      <div class="h-[816px] rounded-[32px] grid place-items-center">
        <div class="w-[715px] flex flex-col items-center">
          <img
            class="w-[715px] h-[817px] object-cover select-none"
            src="https://placehold.co/715x817"
            alt="t-shirt"
          />
          <div class="w-96 h-4 bg-black/80 rounded-full blur-xl -mt-6"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Canvas preview component logic
</script>
