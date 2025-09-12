<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'

  // no emits
  const productsStore = useProductsStore()
  const product = computed(() => productsStore.activeProductDetails as any)
  const patterns = computed(() => product.value?.patterns || [])

  function openGroup(name: string) {
    console.log('openGroup', name)
    // productsStore.setActivePatternGroup(name)
    // productsStore.setPatternsSubStep('group')
  }

  // Breadcrumb logic for pattern selection
  const breadcrumbs = computed(() => [{ label: 'Pattern' }])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <!-- Content -->
  <div class="p-6 grid grid-cols-2 gap-3">
    <button
      v-for="(group, idx) in patterns"
      :key="idx"
      class="h-14 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors px-3"
      @click="openGroup(group.name || 'Base')"
    >
      <span class="text-base font-semibold">{{ group.name || 'Base' }}</span>
      <span class="text-sm text-muted-foreground">Select</span>
    </button>
  </div>
</template>

<style scoped></style>
