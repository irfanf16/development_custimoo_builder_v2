<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { Button } from '@/components/ui/button'
  import type { OutputProductText } from '@/services/products/types'
  import { Plus, Trash2 } from 'lucide-vue-next'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { useTexts } from './useTexts'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    texts_label_player_name,
    texts_label_player_number,
    texts_label_team_name,
    texts_label_custom,
    texts_add_label_player_name,
    texts_add_label_player_number,
    texts_add_label_team_name,
    texts_add_label_default,
    texts_add_label_generic,
    texts_additional_text_button,
    texts_untitled_entry,
    texts_copy_style,
    texts_paste_style,
    nav_text
  } from '@/paraglide/messages'

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
  const profileStore = useProfileStore()

  // ===== CONSTANTS =====

  // ===== COMPUTED =====

  const effectiveProductId = computed(() => customizationStore.activeProductId)
  const locale = computed(() => profileStore.currentLocale || 'en')

  // ===== NAVIGATION =====

  /**
   * Navigate to placement selection step
   * Used when user clicks "Add additional text" button
   */
  function goToPlacement() {
    // Reset active text context so selecting a placement creates a brand-new entry
    workflowStore.setActiveTextId(null)
    workflowStore.setActiveTextItemIndex(null)
    workflowStore.setPendingTextTemplateId(null)
    workflowStore.setTextsSubStep('placement')
  }

  /**
   * Navigate to number font selection step
   * Used for number type texts (they have a special font selection step)
   */
  function goToMultipleItems() {
    workflowStore.setTextsSubStep('multipleitems')
  }

  /**
   * Navigate to text edit step (single item)
   */
  function goToSingleItem() {
    workflowStore.setTextsSubStep('single')
  }

  /**
   * Navigate to the appropriate edit step based on text entry
   * - If the entry has multiple items (placements), go to number-font selection first
   * - Otherwise go directly to edit
   *
   * @param customText - The text entry to edit
   * @param _index - Index in the list (unused, kept for consistency)
   */
  function goToEdit(customText: OutputProductText, _index: number) {
    // Validate: allow any ID including temporary negative IDs (for unsaved entries)
    if (!customText || customText.id === undefined || customText.id === null) return

    workflowStore.setActiveTextId(customText.id)

    const hasMultipleItems = (customText.items?.length ?? 0) > 1
    if (hasMultipleItems) {
      goToMultipleItems()
    } else {
      goToSingleItem()
    }
  }

  // ===== CLIPBOARD OPERATIONS =====

  /**
   * Type definition for clipboard style data
   * Contains the style properties that can be copied and pasted
   */
  type ClipboardStyle = {
    font_family: string
    color: string
    outline_width: number
    outline_color: string
  }

  /**
   * Copies a text entry's style to the clipboard
   *
   * Style includes:
   * - font_family from the product_text entry
   * - color, outline_width, outline_color from the first item (if available)
   *
   * The clipboard is runtime-only and not persisted to localStorage.
   *
   * @param index - Index of the text entry in activeProductTexts
   */
  function handleCopyStyle(index: number) {
    const entry = activeProductTexts.value[index]
    if (!entry) return

    // Get the first item to extract style properties
    const firstItem = entry.items?.[0]

    const style: ClipboardStyle = {
      font_family: entry.font_family || '',
      color: firstItem?.color || '#000000',
      outline_width: firstItem?.outline_width ?? 0,
      outline_color: firstItem?.outline_color || '#FFFFFF'
    }

    workflowStore.setTextClipboard({ style })
  }

  /**
   * Pastes a copied style to a text entry
   *
   * Applies the copied style to ALL items in the target entry:
   * - font_family is set on the entry level
   * - color, outline_width, outline_color are applied to all items
   *
   * The paste operation is added to history for undo/redo support.
   *
   * @param index - Index of the target text entry in activeProductTexts
   */
  async function handlePasteStyle(index: number) {
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
    const copiedStyle = clipboard.style as ClipboardStyle

    // Create updated entry with style applied to all items
    const next: OutputProductText = {
      ...entry,
      font_family: copiedStyle.font_family,
      items: entry.items.map(item => ({
        ...item,
        color: copiedStyle.color,
        outline_width: copiedStyle.outline_width,
        outline_color: copiedStyle.outline_color
      }))
    }

    // Add to history for undo/redo support
    await history.execute('text.update-entry', {
      key,
      textId: entry.id,
      prev: entry,
      next
    })
  }

  /**
   * Checks if clipboard has a style available for pasting
   */
  const hasClipboardStyle = computed(() => {
    return textClipboard.value?.style != null
  })

  // ===== LABEL HELPERS =====

  /**
   * Gets the secondary label for a text entry
   * Used to display the text type or custom label below the main value
   */
  function getSecondaryLabel(text: OutputProductText): string {
    if (text.label) return text.label
    switch (text.type) {
      case 'name':
        return texts_label_player_name({}, { locale: locale.value })
      case 'number':
        return texts_label_player_number({}, { locale: locale.value })
      case 'team_name':
        return texts_label_team_name({}, { locale: locale.value })
      default:
        return texts_label_custom({}, { locale: locale.value })
    }
  }

  /**
   * Gets the "Add" label for a text entry
   * Used when the text has no value yet
   * Handles proper article (a/an) based on label starting letter
   */
  function getAddLabel(text: OutputProductText): string {
    // Use predefined label if available
    switch (text.type) {
      case 'name':
        return texts_add_label_player_name({}, { locale: locale.value })
      case 'number':
        return texts_add_label_player_number({}, { locale: locale.value })
      case 'team_name':
        return texts_add_label_team_name({}, { locale: locale.value })
    }

    const baseLabel = text.label?.trim()
    if (!baseLabel) {
      return texts_add_label_default({}, { locale: locale.value })
    }
    return texts_add_label_generic({ label: baseLabel }, { locale: locale.value })
  }

  /**
   * Checks if a text entry has a non-empty value
   */
  function hasTextValue(text: OutputProductText): boolean {
    return typeof text.value === 'string' && text.value.trim().length > 0
  }

  /**
   * Delete a manually-added custom text entry (with undo support)
   */
  async function handleDeleteCustomText(customText: OutputProductText) {
    if (!customText?.manually_added || effectiveProductId.value == null) return
    const key = String(effectiveProductId.value)
    const storeIndex = activeProductTexts.value.findIndex(e => e.id === customText.id)
    if (storeIndex < 0) return
    await history.execute('text.remove-entry', {
      key,
      index: storeIndex
    })
  }

  const headerConfig = computed(() => ({
    breadcrumbs: [{ label: nav_text({}, { locale: locale.value }) }]
  }))
  void headerConfig.value
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="workflow-texts-selection">
    <div class="flex flex-col gap-2">
      <PanelNavigationItem
        v-for="(customText, index) in customAndPresetTexts"
        :id="`texts-selection-preset-${customText.id}`"
        :key="customText.id"
        :data-testid="`workflow-texts-item-${customText.id}`"
        :class="['h-[60px]']"
        @click="() => goToEdit(customText, index)"
      >
        <template #content>
          <div
            v-if="!hasTextValue(customText)"
            class="flex w-full items-center justify-between gap-2"
          >
            <span class="text-sm font-semibold text-foreground">
              {{ getAddLabel(customText) }}
            </span>
            <Button
              v-if="customText.manually_added"
              size="sm"
              variant="ghost"
              class="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
              :title="'Delete'"
              @click.stop="handleDeleteCustomText(customText)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
          <div v-else class="flex w-full items-center gap-4 group">
            <div class="flex min-w-0 flex-1 flex-col gap-1 items-start">
              <span class="truncate text-sm font-semibold text-foreground">
                {{ customText.value || customText.label || texts_untitled_entry({}, { locale }) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ getSecondaryLabel(customText) }}
              </span>
            </div>
            <div
              class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                size="sm"
                variant="outline"
                class="h-8 px-3"
                @click.stop="handleCopyStyle(index)"
              >
                {{ texts_copy_style({}, { locale }) }}
              </Button>
              <Button
                v-if="hasClipboardStyle"
                size="sm"
                variant="outline"
                class="h-8 px-3"
                @click.stop="handlePasteStyle(index)"
              >
                {{ texts_paste_style({}, { locale }) }}
              </Button>
              <Button
                v-if="customText.manually_added"
                size="sm"
                variant="outline"
                class="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
                @click.stop="handleDeleteCustomText(customText)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </PanelNavigationItem>
    </div>
    <div v-if="allowExtraText" class="w-full px-4 md:px-6">
      <Button variant="default" class="w-full" data-testid="workflow-texts-button-add" @click="goToPlacement">
        <Plus class="size-4" />
        <span class="text-sm font-medium">{{ texts_additional_text_button({}, { locale }) }}</span>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
