<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Undo2,
    Redo2,
    Eye,
    EyeOff,
    Move,
    ZoomIn,
    ZoomOut
  } from 'lucide-vue-next'

  const tools = [
    { id: 'undo', icon: Undo2, label: 'Undo' },
    { id: 'redo', icon: Redo2, label: 'Redo' },
    { id: 'show', icon: Eye, label: 'Show' },
    { id: 'hide', icon: EyeOff, label: 'Hide' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'zoomIn', icon: ZoomIn, label: 'Zoom in' },
    { id: 'zoomOut', icon: ZoomOut, label: 'Zoom out' }
  ]
</script>

<template>
  <div class="flex flex-col gap-2">
    <Button
      v-for="t in tools"
      :key="t.id"
      variant="outline"
      size="sm"
      class="rounded-2xl h-10 w-10 p-0"
      :aria-label="t.label"
    >
      <component :is="t.icon" class="size-4" :stroke-width="1.75" />
    </Button>
  </div>
</template>

<style scoped></style>
