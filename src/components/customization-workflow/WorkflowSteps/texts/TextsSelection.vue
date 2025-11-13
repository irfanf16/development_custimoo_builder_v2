<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { Button } from '@/components/ui/button'
  import type { OutputProductText } from '@/services/products/types'
  import { Plus } from 'lucide-vue-next'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { useTexts } from './useTexts'

  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const history = useHistoryStore()
  const { textClipboard } = storeToRefs(workflowStore)
  const { activeProductTexts } = storeToRefs(customizationStore)
  const { customAndPresetTexts } = useTexts()

  const TEXT_LABELS: Record<OutputProductText['type'], string> = {
    name: 'Player name',
    number: 'Player number',
    team_name: 'Additional text'
  }

  const ADD_LABELS: Record<OutputProductText['type'], string> = {
    name: 'Add a player name',
    number: 'Add a player number',
    team_name: 'Add additional text'
  }

  const CLIPBOARD_ENABLED_TYPES: OutputProductText['type'][] = ['name', 'number']

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

  function goToEdit(customText: OutputProductText, _index: number) {
    // Allow any ID including temporary negative IDs (for unsaved entries)
    if (!customText || customText.id === undefined || customText.id === null) return
    workflowStore.setActiveTextId(customText.id)
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
    // Allow any ID including temporary negative IDs (for unsaved entries)
    if (
      !clipboard?.style ||
      !entry ||
      !effectiveProductId.value ||
      entry.id === undefined ||
      entry.id === null
    )
      return
    const key = String(effectiveProductId.value)
    const next = {
      ...entry,
      font_family: (clipboard.style as OutputProductText).font_family,
      items: (clipboard.style as OutputProductText).items
    }
    history.execute('text.update-entry', {
      key,
      textId: entry.id,
      prev: entry,
      next
    })
  }

  function getSecondaryLabel(text: OutputProductText) {
    return text.label || TEXT_LABELS[text.type] || 'Custom'
  }

  function getAddLabel(text: OutputProductText) {
    if (ADD_LABELS[text.type]) return ADD_LABELS[text.type]
    const baseLabel = text.label?.trim()
    if (!baseLabel) return 'Add text'
    const normalized = baseLabel.toLowerCase()
    const needsAn = /^[aeiou]/.test(normalized)
    return `Add ${needsAn ? 'an' : 'a'} ${normalized}`
  }

  function hasTextValue(text: OutputProductText) {
    return typeof text.value === 'string' && text.value.trim().length > 0
  }

  function canUseClipboard(text: OutputProductText) {
    return CLIPBOARD_ENABLED_TYPES.includes(text.type)
  }

  const headerConfig = { breadcrumbs: [{ label: 'Texts' }] }
  void headerConfig
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1 px-4 md:px-6">
      <p class="text-base">Insert and style text.</p>
    </div>

    <div class="flex flex-col gap-2">
      <PanelNavigationItem
        v-for="(customText, index) in customAndPresetTexts"
        :id="`texts-selection-preset-${customText.id}`"
        :key="customText.id"
        :class="['h-[60px]']"
        @click="() => goToEdit(customText, index)"
      >
        <template #content>
          <div v-if="!hasTextValue(customText)" class="flex w-full items-center">
            <span class="text-sm font-semibold text-foreground">
              {{ getAddLabel(customText) }}
            </span>
          </div>
          <div v-else class="flex w-full items-center gap-4 group">
            <div class="flex min-w-0 flex-1 flex-col gap-1 items-start">
              <span class="truncate text-sm font-semibold text-foreground">
                {{ customText.value || customText.label || 'Untitled text' }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ getSecondaryLabel(customText) }}
              </span>
            </div>

            <div
              v-if="canUseClipboard(customText)"
              class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                size="sm"
                variant="outline"
                class="h-8 px-3"
                @click.stop="handleCopyStyle(index)"
              >
                Copy style
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="h-8 px-3"
                :disabled="!textClipboard"
                @click.stop="handlePasteStyle(index)"
              >
                Paste style
              </Button>
            </div>
          </div>
        </template>
      </PanelNavigationItem>
    </div>
    <div class="w-full px-4 md:px-6">
      <Button variant="default" class="w-full" @click="goToPlacement">
        <Plus class="size-4" /> <span class="text-sm font-medium">Add additional text</span>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
