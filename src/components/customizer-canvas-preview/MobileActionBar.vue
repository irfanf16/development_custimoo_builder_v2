<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useColorActions } from '@/composables/useColorActions'
  import { Shuffle, Undo2, Redo2, Crosshair, RotateCcw } from 'lucide-vue-next'
  import { computed, ref } from 'vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import ResetCustomizationDialog from '@/components/customizer/ResetCustomizationDialog.vue'

  const history = useHistoryStore()
  const workflow = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const { shuffleColors } = useColorActions()

  const canUndo = computed(() => history.undoStack.length > 0)
  const canRedo = computed(() => history.redoStack.length > 0)
  const showResetDialog = ref(false)

  function centerCanvas() {
    // Center current canvas view
    workflow.setCanvasZoom(1)
  }

  function handleResetCustomization() {
    showResetDialog.value = true
  }

  function confirmResetCustomization() {
    customizationStore.clearCustomization()
    history.clear()
    showResetDialog.value = false
  }
</script>

<template>
  <div
    class="fixed bottom-[6.5rem] left-1/2 -translate-x-1/2 z-30 bg-foreground text-background rounded-full px-4 shadow-lg flex items-center"
  >
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="handleResetCustomization"
    >
      <RotateCcw class="size-4" />
      <span class="text-xs font-normal">Reset</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="shuffleColors()"
    >
      <Shuffle class="size-4" />
      <span class="text-xs font-normal">Shuffle</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] gap-0.5 p-0 hover:bg-transparent hover:text-background"
      :disabled="!canUndo"
      @click="history.undo()"
    >
      <Undo2 class="size-4" />
      <span class="text-xs font-normal">Undo</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] gap-0.5 p-0 hover:bg-transparent hover:text-background"
      :disabled="!canRedo"
      @click="history.redo()"
    >
      <Redo2 class="size-4" />
      <span class="text-xs font-normal">Redo</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="centerCanvas()"
    >
      <Crosshair class="size-4" />
      <span class="text-xs font-normal">Centre</span>
    </Button>
    <ResetCustomizationDialog v-model:open="showResetDialog" @confirm="confirmResetCustomization" />
  </div>
</template>

<style scoped></style>
