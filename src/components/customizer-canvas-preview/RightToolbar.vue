<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import {
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    RotateCw,
    Rotate3D,
    Layers3,
    Shuffle
  } from 'lucide-vue-next'

  const workflowStore = useWorkflowStore()

  const tools = [
    { id: 'rotateCcw', icon: RotateCcw, label: 'Rotate CCW' },
    { id: 'rotateCw', icon: RotateCw, label: 'Rotate CW' },
    { id: 'zoomIn', icon: ZoomIn, label: 'Zoom in' },
    { id: 'zoomOut', icon: ZoomOut, label: 'Zoom out' },
    { id: 'rotate3d', icon: Rotate3D, label: 'Rotate 3D' },
    { id: 'layers', icon: Layers3, label: 'Layers' },
    { id: 'shuffle', icon: Shuffle, label: 'Shuffle' },
    { id: 'undo', icon: Undo2, label: 'Undo' },
    { id: 'redo', icon: Redo2, label: 'Redo' }
  ]
</script>

<template>
  <!-- Glass toolbar wrapper -->
  <div
    class="w-12 p-1 bg-background/20 rounded-full outline outline-border backdrop-blur-sm flex flex-col gap-1"
  >
    <Button
      v-for="t in tools"
      :key="t.id"
      variant="outline"
      size="icon"
      class="rounded-full size-10 p-0 bg-card outline outline-border border-0 shadow-none"
      :aria-label="t.label"
      @click="
        t.id === 'zoomIn'
          ? workflowStore.zoomIn()
          : t.id === 'zoomOut'
            ? workflowStore.zoomOut()
            : null
      "
    >
      <component :is="t.icon" class="size-4" :stroke-width="1.75" />
    </Button>
  </div>
</template>

<style scoped></style>
