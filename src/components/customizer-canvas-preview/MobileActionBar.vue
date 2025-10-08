<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useColorActions } from '@/composables/useColorActions'
  import { Shuffle, Undo2, Redo2, Crosshair } from 'lucide-vue-next'
  import { computed } from 'vue'

  const history = useHistoryStore()
  const workflow = useWorkflowStore()
  const { shuffleColors } = useColorActions()

  const canUndo = computed(() => history.undoStack.length > 0)
  const canRedo = computed(() => history.redoStack.length > 0)

  function centerCanvas() {
    // Center current canvas view
    workflow.setCanvasZoom(1)
  }
</script>

<template>
  <div
    class="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 bg-foreground text-background rounded-full px-3 py-2 md:px-4 shadow-lg flex items-center gap-4 md:gap-6"
  >
    <Button variant="ghost" class="text-background hover:text-background" @click="shuffleColors()">
      <Shuffle class="size-5" />
      <span class="ml-2">Shuffle</span>
    </Button>
    <Button
      variant="ghost"
      class="text-background hover:text-background"
      :disabled="!canUndo"
      @click="history.undo()"
    >
      <Undo2 class="size-5" />
      <span class="ml-2">Undo</span>
    </Button>
    <Button
      variant="ghost"
      class="text-background hover:text-background"
      :disabled="!canRedo"
      @click="history.redo()"
    >
      <Redo2 class="size-5" />
      <span class="ml-2">Redo</span>
    </Button>
    <Button variant="ghost" class="text-background hover:text-background" @click="centerCanvas()">
      <Crosshair class="size-5" />
      <span class="ml-2">Centre</span>
    </Button>
  </div>
</template>

<style scoped></style>
