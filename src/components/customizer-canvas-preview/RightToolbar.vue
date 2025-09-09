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
  import { useHistoryStore } from '@/stores/history/history.store'
  import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent
  } from '@/components/ui/tooltip'

  const workflowStore = useWorkflowStore()
  const history = useHistoryStore()

  const tools = [
    {
      id: 'rotateCcw',
      icon: RotateCcw,
      label: 'Rotate CCW',
      action: () => {
        // TODO: implement rotate counter-clockwise
      }
    },
    {
      id: 'rotateCw',
      icon: RotateCw,
      label: 'Rotate CW',
      action: () => {
        // TODO: implement rotate clockwise
      }
    },
    {
      id: 'zoomIn',
      icon: ZoomIn,
      label: 'Zoom in',
      action: () => workflowStore.zoomIn()
    },
    {
      id: 'zoomOut',
      icon: ZoomOut,
      label: 'Zoom out',
      action: () => workflowStore.zoomOut()
    },
    {
      id: 'rotate3d',
      icon: Rotate3D,
      label: 'Rotate 3D',
      action: () => {
        // TODO: implement 3D rotation
      }
    },
    {
      id: 'layers',
      icon: Layers3,
      label: 'Layers',
      action: () => {
        // TODO: implement layers
      }
    },
    {
      id: 'shuffle',
      icon: Shuffle,
      label: 'Shuffle',
      action: () => {
        // TODO: implement shuffle
      }
    },
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      action: () => history.undo()
    },
    {
      id: 'redo',
      icon: Redo2,
      label: 'Redo',
      action: () => history.redo()
    }
  ]
</script>

<template>
  <!-- Glass toolbar wrapper -->
  <div
    class="w-12 p-1 bg-background/20 rounded-full outline outline-border backdrop-blur-sm flex flex-col gap-1"
  >
    <template v-for="t in tools" :key="t.id">
      <TooltipProvider>
        <Tooltip :delay-duration="200">
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="rounded-full size-10 p-0 bg-card outline outline-border border-0 shadow-none"
              :aria-label="t.label"
              @click="t.action"
            >
              <component :is="t.icon" class="size-4" :stroke-width="1.75" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <span v-if="t.id === 'undo' && history.nextUndoDescription">
              Undo: {{ history.nextUndoDescription }}
            </span>
            <span v-else-if="t.id === 'redo' && history.nextRedoDescription">
              Redo: {{ history.nextRedoDescription }}
            </span>
            <span v-else>{{ t.label }}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </template>
  </div>
</template>

<style scoped></style>
