<script setup lang="ts">
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
</script>

<template>
  <div class="p-6">
    <Accordion type="multiple" :collapsible="true">
      <AccordionItem value="product"
        ><template #trigger>Product</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="style"
        ><template #trigger>Style</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="design"
        ><template #trigger>Design</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="colors"
        ><template #trigger>Colors</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="logos"
        ><template #trigger>Logos</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="texts"
        ><template #trigger>Texts</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
      <AccordionItem value="roster"
        ><template #trigger>Roster</template>
        <div class="h-24 bg-muted rounded" />
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
