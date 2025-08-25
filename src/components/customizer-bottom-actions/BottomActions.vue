<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Ruler, Save, Share2, FileText, RotateCcw } from 'lucide-vue-next'
  import { useProductsStore } from '@/stores/products'

  const productsStore = useProductsStore()

  function handleResetCustomization() {
    productsStore.resetToDefaultsSnapshot()
  }
</script>

<template>
  <div class="flex items-center gap-2">
    <Button variant="outline" size="default" class="rounded-lg">
      <Ruler class="size-4" />
      Size guide
    </Button>
    <Button
      variant="outline"
      size="default"
      class="rounded-lg"
      @click="handleResetCustomization"
    >
      <RotateCcw class="size-4" />
      Reset customization
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <Save class="size-4" />
      Save design
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <Share2 class="size-4" />
      Share design
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <FileText class="size-4" />
      Generate PDF
    </Button>
  </div>
</template>

<style scoped></style>
