<script setup lang="ts">
  import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="p-4 md:p-6 flex flex-col gap-3">
    <div
      class="h-40 border border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground"
    >
      Drag and drop or click to upload
    </div>
    <div class="flex gap-2">
      <Button variant="secondary">Choose from locker</Button>
      <Button variant="default">Create manually</Button>
    </div>
  </div>
</template>

<style scoped></style>
