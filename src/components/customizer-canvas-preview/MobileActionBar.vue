<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useColorActions } from '@/composables/useColorActions'
  import { useResetCustomization } from '@/composables/useResetCustomization'
  import { Shuffle, Undo2, Redo2, Crosshair, RotateCcw, Pin, PinOff } from 'lucide-vue-next'
  import { computed } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { toolbar_pin_all, toolbar_unpin_all } from '@/paraglide/messages'

  const customizationStore = useCustomizationStore()
  const workflow = useWorkflowStore()
  const profileStore = useProfileStore()
  const { shuffleColors } = useColorActions()
  const { openResetDialog } = useResetCustomization()

  const locale = computed(() => profileStore.currentLocale || 'en')

  const canUndo = computed(() => customizationStore.canUndo)
  const canRedo = computed(() => customizationStore.canRedo)

  const pinAllLabel = computed(() =>
    customizationStore.allLogosAndTextsPinned
      ? toolbar_unpin_all({}, { locale: locale.value })
      : toolbar_pin_all({}, { locale: locale.value })
  )

  function togglePinAll() {
    customizationStore.pinAllLogosAndTexts(!customizationStore.allLogosAndTextsPinned)
  }

  function centerCanvas() {
    // Center current canvas view
    workflow.setCanvasZoom(1)
  }

  function handleResetCustomization() {
    openResetDialog()
  }
</script>

<template>
  <!-- 5×60px + px-4 exceeded narrow viewports (e.g. 320px SE); grid + max-width keeps bar inside safe horizontal bounds -->
  <div
    class="fixed bottom-[6.5rem] left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-1rem)] bg-foreground text-background rounded-full px-2 sm:px-4 shadow-lg flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
  >
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] shrink-0 gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="handleResetCustomization"
    >
      <RotateCcw class="size-4 shrink-0" />
      <span class="truncate text-[10px] font-normal leading-tight sm:text-xs">Reset</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] shrink-0 gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="shuffleColors()"
    >
      <Shuffle class="size-4 shrink-0" />
      <span class="truncate text-[10px] font-normal leading-tight sm:text-xs">Shuffle</span>
    </Button>
    <Button
      v-if="customizationStore.hasAnyLogosOrTexts"
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 min-w-[60px] max-w-[72px] shrink-0 gap-0.5 px-0.5 p-0 hover:bg-transparent hover:text-background"
      :aria-label="pinAllLabel"
      @click="togglePinAll()"
    >
      <component
        :is="customizationStore.allLogosAndTextsPinned ? PinOff : Pin"
        class="size-4"
        :stroke-width="1.75"
      />
      <span class="text-[10px] sm:text-xs font-normal leading-tight text-center line-clamp-2">{{
        pinAllLabel
      }}</span>
    </Button>
    <Button
      v-if="customizationStore.hasAnyLogosOrTexts"
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 min-w-[60px] max-w-[72px] shrink-0 gap-0.5 px-0.5 p-0 hover:bg-transparent hover:text-background"
      :aria-label="pinAllLabel"
      @click="togglePinAll()"
    >
      <component
        :is="customizationStore.allLogosAndTextsPinned ? PinOff : Pin"
        class="size-4"
        :stroke-width="1.75"
      />
      <span class="text-[10px] sm:text-xs font-normal leading-tight text-center line-clamp-2">{{
        pinAllLabel
      }}</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] shrink-0 gap-0.5 p-0 hover:bg-transparent hover:text-background"
      :disabled="!canUndo"
      @click="customizationStore.undo()"
    >
      <Undo2 class="size-4 shrink-0" />
      <span class="truncate text-[10px] font-normal leading-tight sm:text-xs">Undo</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] shrink-0 gap-0.5 p-0 hover:bg-transparent hover:text-background"
      :disabled="!canRedo"
      @click="customizationStore.redo()"
    >
      <Redo2 class="size-4 shrink-0" />
      <span class="truncate text-[10px] font-normal leading-tight sm:text-xs">Redo</span>
    </Button>
    <Button
      variant="ghost"
      class="flex flex-col items-center justify-center h-14 w-[60px] shrink-0 gap-0.5 p-0 hover:bg-transparent hover:text-background"
      @click="centerCanvas()"
    >
      <Crosshair class="size-4 shrink-0" />
      <span class="truncate text-[10px] font-normal leading-tight sm:text-xs">Centre</span>
    </Button>
  </div>
</template>

<style scoped></style>
