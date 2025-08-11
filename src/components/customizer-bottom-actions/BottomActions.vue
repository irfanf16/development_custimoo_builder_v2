<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Ruler, Save, Share2, FileText } from 'lucide-vue-next'
</script>

<template>
  <div class="w-full flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button variant="outline" size="default" class="rounded-lg">
        <Ruler class="size-4" />
        Size guide
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
  </div>
</template>

<style scoped></style>
