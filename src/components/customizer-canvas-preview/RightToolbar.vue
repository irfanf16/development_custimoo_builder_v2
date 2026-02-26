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
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  // import { useColorActions } from '@/composables/useColorActions'
  import { useLogoActions } from '@/components/customization-workflow/WorkflowSteps/logo/useLogoActions'
  import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    toolbar_rotate_ccw,
    toolbar_rotate_cw,
    toolbar_zoom_in,
    toolbar_zoom_out,
    toolbar_rotate_3d,
    toolbar_layers,
    toolbar_undo,
    toolbar_redo,
    toolbar_undo_prefix,
    toolbar_redo_prefix,
    color_shuffle_design_colors
  } from '@/paraglide/messages'
  import { computed } from 'vue'

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  // const { shuffleColors: shuffleDesignColors } = useColorActions()
  const { shuffleColors: shuffleLogoColors } = useLogoActions()
  const profileStore = useProfileStore()

  const locale = computed(() => profileStore.currentLocale || 'en')

  const undoPrefix = computed(() => toolbar_undo_prefix({}, { locale: locale.value }))
  const redoPrefix = computed(() => toolbar_redo_prefix({}, { locale: locale.value }))

  function handleShuffleColors() {
    if (workflowStore.activeLogoId) {
      shuffleLogoColors()
    } else {
      // Otherwise shuffle design colors
      // shuffleDesignColors()
    }
  }

  const tools = computed(() => [
    {
      id: 'rotateCcw',
      icon: RotateCcw,
      label: toolbar_rotate_ccw({}, { locale: locale.value }),
      action: () => {
        // TODO: implement rotate counter-clockwise
      },
      disabled: true
    },
    {
      id: 'rotateCw',
      icon: RotateCw,
      label: toolbar_rotate_cw({}, { locale: locale.value }),
      action: () => {
        // TODO: implement rotate clockwise
      },
      disabled: true
    },
    {
      id: 'zoomIn',
      icon: ZoomIn,
      label: toolbar_zoom_in({}, { locale: locale.value }),
      action: () => workflowStore.zoomIn(),
      disabled: false
    },
    {
      id: 'zoomOut',
      icon: ZoomOut,
      label: toolbar_zoom_out({}, { locale: locale.value }),
      action: () => workflowStore.zoomOut(),
      disabled: false
    },
    {
      id: 'rotate3d',
      icon: Rotate3D,
      label: toolbar_rotate_3d({}, { locale: locale.value }),
      action: () => {
        // TODO: implement 3D rotation
      },
      disabled: true
    },
    {
      id: 'layers',
      icon: Layers3,
      label: toolbar_layers({}, { locale: locale.value }),
      action: () => {
        // TODO: implement layers
      },
      disabled: true
    },
    {
      id: 'shuffle',
      icon: Shuffle,
      label: color_shuffle_design_colors({}, { locale: locale.value }),
      action: () => handleShuffleColors(),
      disabled: workflowStore.activeLogoId ? false : true // Enable if a logo is active, otherwise disable (for design colors)
    },
    {
      id: 'undo',
      icon: Undo2,
      label: toolbar_undo({}, { locale: locale.value }),
      action: () => customizationStore.undo(),
      disabled: false
    },
    {
      id: 'redo',
      icon: Redo2,
      label: toolbar_redo({}, { locale: locale.value }),
      action: () => customizationStore.redo(),
      disabled: false
    }
  ])
</script>

<template>
  <!-- Glass toolbar wrapper -->
  <TooltipProvider>
    <div
      class="w-12 p-1 bg-background/20 rounded-full outline outline-border backdrop-blur-sm flex flex-col gap-1"
    >
      <template v-for="t in tools" :key="t.id">
        <Tooltip
          :delay-duration="200"
          :disable-closing-trigger="t.id === 'undo' || t.id === 'redo'"
        >
          <TooltipTrigger as-child>
            <Button
              variant="default"
              size="icon"
              class="rounded-full size-10 p-0 bg-card outline outline-border border-0 shadow-none"
              :aria-label="t.label"
              :disabled="
                t.id === 'undo'
                  ? !customizationStore.canUndo || customizationStore.undoRedoInProgress
                  : t.id === 'redo'
                    ? !customizationStore.canRedo || customizationStore.undoRedoInProgress
                    : t.disabled
              "
              @click="t.action"
            >
              <component :is="t.icon" class="size-4" :stroke-width="1.75" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <span v-if="t.id === 'undo' && customizationStore.currentActionTitle">
              {{ undoPrefix }}{{ customizationStore.currentActionTitle }}
            </span>
            <span v-else-if="t.id === 'redo' && customizationStore.nextRedoActionTitle">
              {{ redoPrefix }}{{ customizationStore.nextRedoActionTitle }}
            </span>
            <span v-else>{{ t.label }}</span>
          </TooltipContent>
        </Tooltip>
      </template>
    </div>
  </TooltipProvider>
</template>

<style scoped></style>
