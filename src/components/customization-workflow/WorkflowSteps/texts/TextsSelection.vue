<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { Button } from '@/components/ui/button'
  import type { OutputProductText } from '@/services/products/types'
  import { Copy, Plus, Paintbrush } from 'lucide-vue-next'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { useTexts } from '@/composables/useTexts'

  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const history = useHistoryStore()
  const { textClipboard } = storeToRefs(workflowStore)
  const { activeProductTexts } = storeToRefs(customizationStore)
  const { customAndPresetTexts } = useTexts()

  // const productCustomTexts = computed(() => customizationStore.activeProductTexts)
  const effectiveProductId = computed(() => customizationStore.activeProductId)

  function goToPlacement() {
    workflowStore.setTextsSubStep('placement')
  }

  function goToNumberFont() {
    workflowStore.setTextsSubStep('number-font')
  }
  function goToEditText() {
    workflowStore.setTextsSubStep('edit')
  }

  function goToEdit(customText: OutputProductText, index: number) {
    if (!customText) return
    workflowStore.setActiveTextIndex(index)
    if (customText.type === 'number') {
      goToNumberFont()
    } else {
      goToEditText()
    }
  }

  function handleCopyStyle(index: number) {
    const entry = activeProductTexts.value[index]
    if (!entry) return
    workflowStore.setTextClipboard({ style: entry })
  }

  function handlePasteStyle(index: number) {
    const clipboard = textClipboard.value
    const entry = activeProductTexts.value[index]
    if (!clipboard?.style || !entry || !effectiveProductId.value) return
    const key = String(effectiveProductId.value)
    const next = {
      ...entry,
      font_family: (clipboard.style as OutputProductText).font_family,
      items: (clipboard.style as OutputProductText).items
    }
    history.execute('text.update-entry', {
      key,
      index,
      prev: entry,
      next
    })
  }

  const headerConfig = { breadcrumbs: [{ label: 'Texts' }] }
  void headerConfig
</script>

<template>
  <div class="pb-2">
    <div class="flex flex-col gap-1 mx-4 md:mx-6">
      <p class="text-sm text-muted-foreground">Insert and style text.</p>
    </div>

    <div class="flex flex-col">
      <PanelNavigationItem
        v-for="(customText, index) in customAndPresetTexts"
        :id="`texts-selection-preset-${customText.id}`"
        :key="customText.id"
        @click="() => goToEdit(customText, index)"
      >
        <template #content>
          <div
            v-if="(customText && !customText.value) || customText.value === ''"
            class="flex items-center gap-3"
          >
            <div class="flex flex-col gap-1">
              <span class="text-sm font-semibold">
                Add a {{ customText.label.toLowerCase() }}
              </span>
            </div>
          </div>
          <div v-else class="flex items-start justify-between gap-3 w-full">
            <div class="flex flex-col gap-1 flex-1">
              <div class="text-lg font-semibold text-foreground">
                {{ customText.value || customText.label || 'Untitled text' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ customText.label || customText.type || 'Custom' }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                class="gap-1 h-8 px-3 text-xs"
                @click.stop="handleCopyStyle(index)"
              >
                <Copy class="size-3.5" /> Copy style
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="gap-1 h-8 px-3 text-xs"
                :disabled="!textClipboard"
                @click.stop="handlePasteStyle(index)"
              >
                <Paintbrush class="size-3.5" /> Paste style
              </Button>
            </div>
          </div>
        </template>
      </PanelNavigationItem>
    </div>
    <div class="px-4 md:px-6 w-full mt-2">
      <Button class="w-full" @click="goToPlacement()">
        <Plus class="size-4" />
        <span class="text-sm font-medium">Add additional text</span>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
