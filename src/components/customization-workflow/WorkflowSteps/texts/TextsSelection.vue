<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { Button } from '@/components/ui/button'

  const productsStore = useProductsStore()
  const texts = computed(() => {
    const map = (productsStore.activeProductDetails as any)?.productnames || []
    return map
  })
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div
      v-for="t in texts"
      :key="t.id"
      class="flex items-center justify-between border rounded-lg p-3"
    >
      <div>
        <div class="font-medium">{{ t.name_of_placement || 'Text' }}</div>
        <div class="text-xs text-muted-foreground">Placement</div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm">Copy</Button>
        <Button variant="outline" size="sm">Paste</Button>
      </div>
    </div>
    <Button variant="outline" class="rounded-lg">Add additional text</Button>
  </div>
</template>

<style scoped></style>
