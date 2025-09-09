<script setup lang="ts">
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
</script>

<template>
  <div class="p-6">
    <Accordion type="multiple" :collapsible="true">
      <AccordionItem value="product"
        ><AccordionTrigger>Product</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="style"
        ><AccordionTrigger>Style</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="design"
        ><AccordionTrigger>Design</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="colors"
        ><AccordionTrigger>Colors</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="logos"
        ><AccordionTrigger>Logos</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="texts"
        ><AccordionTrigger>Texts</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="roster"
        ><AccordionTrigger>Roster</AccordionTrigger>
        <AccordionContent>
          <div class="h-24 bg-muted rounded" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
