<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { Label } from '@/components/ui/label'
  import { FontSelector } from '@/components/ui/font-selector'
  import { Switch } from '@/components/ui/switch'
  import { ChevronRight } from 'lucide-vue-next'
  import type { OutputProductText, OutputProductName } from '@/services/products/types'
  import { useTextPlacements } from './useTextPlacements'
  import { useTexts } from './useTexts'
  import { onSaveChanges, onCancel } from './useTextActions'

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const { availablePlacements, isPlacementEnabled } = useTextPlacements()
  const { fontOptions } = useTexts()

  const { activeTextIndex, pendingNumberPreset } = storeToRefs(workflowStore)

  const textEntries = computed(() => customizationStore.activeProductTexts)

  const currentEntry = computed<OutputProductText | null>(() => {
    if (activeTextIndex.value == null) return null
    return textEntries.value[activeTextIndex.value] ?? null
  })

  const selectedNumber = computed(() => {
    return pendingNumberPreset.value || currentEntry.value?.value || '1'
  })

  const headerConfig = computed(() => ({
    breadcrumbs: [
      { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
      { label: selectedNumber.value }
    ]
  }))
  void headerConfig.value

  // Minimal state to satisfy template usage
  const form = reactive({ font: '' })

  function navigateToPlacement(_placement: OutputProductName) {}
  function togglePlacement(_placement: OutputProductName, _enabled: boolean) {}

  onCancel.value = () => {
    console.log('onCancel from TextNumberFontSelection')
    workflowStore.setTextsSubStep('list')
  }
  onSaveChanges.value = () => {
    console.log('onSaveChanges from TextNumberFontSelection')
    workflowStore.setTextsSubStep('list')
  }
</script>

<template>
  <div class="flex flex-col">
    <!-- Header Section -->
    <div class="p-6 space-y-5">
      <!-- Number Input -->
      <div class="space-y-2">
        <div class="h-14">
          <div
            class="flex h-full items-center rounded-md border border-primary bg-background px-4 text-lg text-foreground"
          >
            {{ selectedNumber }}|
          </div>
        </div>
      </div>

      <!-- Font Selection -->
      <div class="space-y-2">
        <Label class="text-sm font-medium text-foreground">Font</Label>
        <div class="h-14">
          <FontSelector v-model="form.font" :options="fontOptions" />
        </div>
      </div>
    </div>

    <!-- Placement List -->
    <div class="border-t border-border">
      <button
        v-for="placement in availablePlacements"
        :key="placement.id"
        class="flex h-[60px] w-full items-center gap-3 border-b border-border px-4 py-4 first:border-t-0 hover:bg-muted/50 transition-colors"
        @click="navigateToPlacement(placement)"
      >
        <div class="flex flex-1 items-center">
          <p class="text-sm font-semibold text-foreground">{{ placement.name_of_placement }}</p>
        </div>
        <div @click.stop>
          <Switch
            :checked="isPlacementEnabled(currentEntry, placement.id)"
            @update:checked="(checked: boolean) => togglePlacement(placement, checked)"
          />
        </div>
        <div class="flex shrink-0 items-center justify-center text-muted-foreground">
          <ChevronRight class="size-4" />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
