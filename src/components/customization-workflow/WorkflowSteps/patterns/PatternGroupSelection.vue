<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  const productsStore = useProductsStore()
  const product = computed(() => productsStore.activeProductDetails as any)
  const groupName = computed(
    () => productsStore.activePatternGroupName || 'Pattern'
  )
  const items = computed(() => {
    const patterns = (product.value?.patterns || []) as any[]
    const group = patterns.find(
      (g: any) => g.name === productsStore.activePatternGroupName
    )
    return group?.items || []
  })
</script>

<template>
  <div class="p-6">
    <div class="text-sm text-muted-foreground mb-2">{{ groupName }}</div>
    <div class="grid grid-cols-3 gap-3">
      <div
        v-for="(p, idx) in items"
        :key="idx"
        class="h-24 rounded border border-border bg-muted"
      />
    </div>
  </div>
</template>

<style scoped></style>
