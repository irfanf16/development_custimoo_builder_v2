<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'

  const productsStore = useProductsStore()
  const product = computed(() => productsStore.activeProductDetails as any)
  const colorGroups = computed(() => {
    const map = (product.value?.svg_group_color_container || {}) as Record<
      string,
      { name: string; json_data: { name: string; value: string }[] }
    >
    return Object.values(map)
  })
</script>

<template>
  <div class="p-6">
    <Accordion type="single" collapsible>
      <AccordionItem v-for="g in colorGroups" :key="g.name" :value="g.name">
        <template #trigger>{{ g.name }}</template>
        <div class="grid grid-cols-8 gap-2">
          <div
            v-for="c in g.json_data"
            :key="c.name"
            class="h-8 rounded"
            :style="{ background: c.value }"
          />
        </div>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
