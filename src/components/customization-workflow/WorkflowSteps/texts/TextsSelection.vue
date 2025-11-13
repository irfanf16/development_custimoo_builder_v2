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
  import { useProductsStore } from '@/stores/products/products.store'

  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const history = useHistoryStore()
  const { textClipboard } = storeToRefs(workflowStore)
  const { activeProductTexts } = storeToRefs(customizationStore)
  const productsStore = useProductsStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const allowExtraText = computed(() =>
    activeProductDetails.value?.allow_extra_text === 1 ? true : false
  )
  const { customAndPresetTexts } = useTexts()

  // ===== CONSTANTS =====

  /**
   * Display labels for different text types
   * Used to show secondary labels in the text list
   */
  const TEXT_LABELS: Record<OutputProductText['type'], string> = {
    name: 'Player name',
    number: 'Player number',
    team_name: 'Additional text'
  }

  /**
   * Labels for "Add" buttons/placeholders for different text types
   * Used when a text entry has no value yet
   */
  const ADD_LABELS: Record<OutputProductText['type'], string> = {
    name: 'Add a player name',
    number: 'Add a player number',
    team_name: 'Add additional text'
  }

  /**
   * Text types that support copy/paste style functionality
   * Only name and number types can copy/paste styles
   */
  const CLIPBOARD_ENABLED_TYPES: OutputProductText['type'][] = ['name', 'number']

  // ===== COMPUTED =====

  const effectiveProductId = computed(() => customizationStore.activeProductId)

  // ===== NAVIGATION =====

  /**
   * Navigate to placement selection step
   * Used when user clicks "Add additional text" button
   */
  function goToPlacement() {
    workflowStore.setTextsSubStep('placement')
  }

  /**
   * Navigate to number font selection step
   * Used for number type texts (they have a special font selection step)
   */
  function goToNumberFont() {
    workflowStore.setTextsSubStep('number-font')
  }

  /**
   * Navigate to text edit step
   * Used for name and team_name type texts
   */
  function goToEditText() {
    workflowStore.setTextsSubStep('edit')
  }

  /**
   * Navigate to the appropriate edit step based on text type
   *
   * @param customText - The text entry to edit
   * @param _index - Index in the list (unused, kept for consistency)
   */
  function goToEdit(customText: OutputProductText, _index: number) {
    // Validate: allow any ID including temporary negative IDs (for unsaved entries)
    if (!customText || customText.id === undefined || customText.id === null) return

    workflowStore.setActiveTextId(customText.id)

    // Navigate to appropriate step based on text type
    if (customText.type === 'number') {
      goToNumberFont()
    } else {
      goToEditText()
    }
  }

  // ===== CLIPBOARD OPERATIONS =====

  /**
   * Copies a text entry's style to the clipboard
   * Style includes font_family and items (placement configurations)
   *
   * @param index - Index of the text entry in activeProductTexts
   */
  function handleCopyStyle(index: number) {
    const entry = activeProductTexts.value[index]
    if (!entry) return
    workflowStore.setTextClipboard({ style: entry })
  }

  /**
   * Pastes a copied style to a text entry
   * Applies font_family and items from the clipboard to the target entry
   *
   * @param index - Index of the target text entry in activeProductTexts
   */
  function handlePasteStyle(index: number) {
    const clipboard = textClipboard.value
    const entry = activeProductTexts.value[index]

    // Validate all required data is present
    // Allow any ID including temporary negative IDs (for unsaved entries)
    if (
      !clipboard?.style ||
      !entry ||
      !effectiveProductId.value ||
      entry.id === undefined ||
      entry.id === null
    ) {
      return
    }

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

  // ===== LABEL HELPERS =====

  /**
   * Gets the secondary label for a text entry
   * Used to display the text type or custom label below the main value
   */
  function getSecondaryLabel(text: OutputProductText): string {
    return text.label || TEXT_LABELS[text.type] || 'Custom'
  }

  /**
   * Gets the "Add" label for a text entry
   * Used when the text has no value yet
   * Handles proper article (a/an) based on label starting letter
   */
  function getAddLabel(text: OutputProductText): string {
    // Use predefined label if available
    if (ADD_LABELS[text.type]) return ADD_LABELS[text.type]

    // Generate label from text.label with proper article
    const baseLabel = text.label?.trim()
    if (!baseLabel) return 'Add text'

    const normalized = baseLabel.toLowerCase()
    const needsAn = /^[aeiou]/.test(normalized)
    return `Add ${needsAn ? 'an' : 'a'} ${normalized}`
  }

  /**
   * Checks if a text entry has a non-empty value
   */
  function hasTextValue(text: OutputProductText): boolean {
    return typeof text.value === 'string' && text.value.trim().length > 0
  }

  /**
   * Checks if a text type supports clipboard operations
   * Only name and number types support copy/paste style
   */
  function canUseClipboard(text: OutputProductText): boolean {
    return CLIPBOARD_ENABLED_TYPES.includes(text.type)
  }

  const headerConfig = { breadcrumbs: [{ label: 'Texts' }] }
  void headerConfig
</script>

<template>
  <div class="flex flex-col gap-4">
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
    <div v-if="allowExtraText" class="w-full px-4 md:px-6">
      <Button variant="default" class="w-full" @click="goToPlacement">
        <Plus class="size-4" /> <span class="text-sm font-medium">Add additional text</span>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
