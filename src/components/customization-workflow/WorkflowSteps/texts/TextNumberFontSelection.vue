<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { FontSelector } from '@/components/ui/font-selector'
  import { Switch } from '@/components/ui/switch'
  import { ChevronRight } from 'lucide-vue-next'
  import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
  import { useTexts } from './useTexts'
  import { clone } from './useTextUtils'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    texts_number_input_placeholder,
    texts_font_label,
    texts_no_text_placements,
    texts_placement_generic_label
  } from '@/paraglide/messages'
  import { useTextActions } from './useTextActions'

  type ManagedTextItem = OutputProductTextItem & {
    placement_id?: number
    __templateIndex?: number
  }

  type DisplayItem = {
    key: string
    label: string
    isChecked: boolean
    templateItem: ManagedTextItem | null
    templateIndex: number | null
    currentItem: ManagedTextItem | null
    currentIndex: number | null
  }

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const productsStore = useProductsStore()
  const { fontOptions } = useTexts()
  const profileStore = useProfileStore()
  const { syncTextToRosterAndEntry } = useTextActions()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const { activeTextId } = storeToRefs(workflowStore)
  const { activeProductId } = storeToRefs(customizationStore)
  const { activeProductDetails } = storeToRefs(productsStore)

  const textEntries = computed(() => customizationStore.activeProductTexts)

  const currentEntry = computed<OutputProductText | null>(() => {
    if (activeTextId.value == null) return null
    return textEntries.value.find(entry => entry.id === activeTextId.value) ?? null
  })

  const originalEntry = computed<OutputProductText | null>(() => {
    if (!currentEntry.value) return null
    return (
      activeProductDetails.value?.product_texts?.find(text => text.id === currentEntry.value?.id) ??
      null
    )
  })

  const templateIndexMap = computed(() => {
    const map = new Map<string, number>()
    const items = originalEntry.value?.items ?? []
    items.forEach((item, index) => {
      map.set(getItemKey(item, index), index)
    })
    return map
  })

  const form = reactive({
    font: '',
    number: ''
  })

  const isSyncingForm = ref(false)
  const initializedEntries = new Set<number>()

  function getItemKey(item: OutputProductTextItem, fallbackIndex: number) {
    const extended = item as ManagedTextItem
    if (extended.placement_id != null) {
      return `placement-${extended.placement_id}`
    }
    if (item.label) {
      return `label-${item.label.toLowerCase()}`
    }
    if (extended.__templateIndex != null) {
      return `template-${extended.__templateIndex}`
    }
    return `index-${fallbackIndex}`
  }

  function hasItemWithKey(entry: OutputProductText | null, key: string) {
    return (
      entry?.items?.some(
        (currentItem, currentIndex) => getItemKey(currentItem, currentIndex) === key
      ) ?? false
    )
  }

  const displayItems = computed<DisplayItem[]>(() => {
    const templateItems = originalEntry.value?.items ?? []
    const currentItems = currentEntry.value?.items ?? []
    const lookup = new Map<string, DisplayItem>()

    templateItems.forEach((item, index) => {
      const key = getItemKey(item, index)
      const isPresent = hasItemWithKey(currentEntry.value, key)
      const defaultChecked = isPresent
      lookup.set(key, {
        key,
        label: item.label || `Placement ${index + 1}`,
        isChecked: defaultChecked,
        templateItem: { ...(item as ManagedTextItem), __templateIndex: index },
        templateIndex: index,
        currentItem: null,
        currentIndex: null
      })
    })

    currentItems.forEach((item, index) => {
      const key = getItemKey(item, index)
      const entry = lookup.get(key)
      const managedItem: ManagedTextItem = {
        ...(item as ManagedTextItem),
        __templateIndex: templateIndexMap.value.get(key) ?? undefined
      }
      if (entry) {
        entry.isChecked = true
        entry.currentItem = managedItem
        entry.currentIndex = index
        if (!entry.templateItem) {
          entry.templateItem = managedItem
        }
        if (!entry.label) {
          entry.label =
            managedItem.label ||
            texts_placement_generic_label({ index: String(index + 1) }, { locale: locale.value })
        }
      } else {
        lookup.set(key, {
          key,
          label:
            managedItem.label ||
            texts_placement_generic_label({ index: String(index + 1) }, { locale: locale.value }),
          isChecked: true,
          templateItem: null,
          templateIndex: templateIndexMap.value.get(key) ?? null,
          currentItem: managedItem,
          currentIndex: index
        })
      }
    })

    return Array.from(lookup.values()).sort((a, b) => {
      const ai = a.templateIndex ?? Number.MAX_SAFE_INTEGER
      const bi = b.templateIndex ?? Number.MAX_SAFE_INTEGER
      if (ai === bi) {
        return a.label.localeCompare(b.label)
      }
      return ai - bi
    })
  })

  async function ensureDefaultItems(
    entry: OutputProductText | null,
    template: OutputProductText | null
  ) {
    if (!entry || !template?.items?.length) return
    if (initializedEntries.has(entry.id)) return

    const missing = template.items.some((templateItem, index) => {
      const key = getItemKey(templateItem, index)
      return !hasItemWithKey(entry, key)
    })

    if (!missing) {
      initializedEntries.add(entry.id)
      return
    }

    await commitEntryUpdate(next => {
      const templateItems = template.items ?? []
      const nextItems = [...(next.items ?? [])]
      let changed = false

      templateItems.forEach((templateItem, index) => {
        const key = getItemKey(templateItem, index)
        const exists = nextItems.some((candidate, candidateIndex) => {
          return getItemKey(candidate, candidateIndex) === key
        })
        if (exists) return

        changed = true
        nextItems.push({
          ...(clone(templateItem) as ManagedTextItem),
          font_family: next.font_family || templateItem.font_family,
          __templateIndex: index
        } as ManagedTextItem)
      })

      if (!changed) return next

      next.items = sortItemsByTemplateOrder(nextItems)

      if (next.items.length === 0) {
        next.active_item_index = 0
      } else if (
        next.active_item_index == null ||
        next.active_item_index < 0 ||
        next.active_item_index >= next.items.length
      ) {
        next.active_item_index = 0
      }

      return next
    })

    initializedEntries.add(entry.id)
  }

  function annotateEntryItems(entry: OutputProductText): OutputProductText {
    const templateItems = originalEntry.value?.items ?? []
    const placementMap = new Map<number, number>()
    const labelMap = new Map<string, number>()
    templateItems.forEach((item, index) => {
      const extended = item as ManagedTextItem
      if (extended.placement_id != null) {
        placementMap.set(extended.placement_id, index)
      }
      if (item.label) {
        labelMap.set(item.label.toLowerCase(), index)
      }
    })

    const usedIndices = new Set<number>()
    let nextIndex = templateItems.length

    entry.items = entry.items.map(item => {
      const managed: ManagedTextItem = { ...(item as ManagedTextItem) }
      let templateIndex: number | null = null

      if (managed.placement_id != null && placementMap.has(managed.placement_id)) {
        templateIndex = placementMap.get(managed.placement_id) ?? null
      } else if (managed.label) {
        const labelKey = managed.label.toLowerCase()
        if (labelMap.has(labelKey)) {
          templateIndex = labelMap.get(labelKey) ?? null
        }
      }

      if (templateIndex == null || usedIndices.has(templateIndex)) {
        while (usedIndices.has(nextIndex)) {
          nextIndex++
        }
        templateIndex = nextIndex++
      }

      managed.__templateIndex = templateIndex
      usedIndices.add(templateIndex)
      return managed
    })

    return entry
  }

  function sortItemsByTemplateOrder(items: ManagedTextItem[]): ManagedTextItem[] {
    const entries = [...items]
    return entries.sort((a, b) => {
      const keyA = getItemKey(a, a.__templateIndex ?? 0)
      const keyB = getItemKey(b, b.__templateIndex ?? 0)
      const ai = a.__templateIndex ?? templateIndexMap.value.get(keyA) ?? Number.MAX_SAFE_INTEGER
      const bi = b.__templateIndex ?? templateIndexMap.value.get(keyB) ?? Number.MAX_SAFE_INTEGER
      if (ai === bi) return 0
      return ai - bi
    })
  }

  async function commitEntryUpdate(
    transform: (entry: OutputProductText) => OutputProductText,
    description?: string,
    skipEqualityCheck = false
  ): Promise<OutputProductText | null> {
    const entry = currentEntry.value
    const productId = activeProductId.value
    if (!entry || productId == null) return null
    const prev = clone(entry)
    const next = transform(clone(entry))
    if (!next) return null
    const prevAnnotated = annotateEntryItems(prev)
    const nextAnnotated = annotateEntryItems(next)
    if (!skipEqualityCheck && JSON.stringify(prevAnnotated) === JSON.stringify(nextAnnotated))
      return null
    await historyStore.execute(
      'text.update-entry',
      {
        key: String(productId),
        textId: entry.id,
        prev: prevAnnotated,
        next: nextAnnotated
      },
      description
    )
    return nextAnnotated
  }

  async function handleNumberChange(nextValue: string) {
    const normalizedValue = nextValue != null ? String(nextValue) : ''
    await commitEntryUpdate(entry => {
      entry.value = normalizedValue
      return entry
    })
  }

  async function handleFontChange(nextFont: string) {
    await commitEntryUpdate(
      entry => {
        entry.font_family = nextFont
        entry.items = entry.items.map(item => ({
          ...(item as ManagedTextItem),
          font_family: nextFont
        }))
        return entry
      },
      undefined,
      true
    )
  }

  async function toggleItem(item: DisplayItem, enabled: boolean) {
    if (!currentEntry.value) return
    const productId = activeProductId.value
    if (productId == null) return

    if (enabled) {
      const sourceRaw = item.currentItem ?? item.templateItem ?? null
      const source = sourceRaw ? (clone(sourceRaw) as ManagedTextItem) : null
      if (!source) return

      const updatedEntry = await commitEntryUpdate(entry => {
        const exists = entry.items.find((it, index) => getItemKey(it, index) === item.key)
        if (exists) return entry

        const managedItem: ManagedTextItem = {
          ...source,
          font_family: entry.font_family,
          __templateIndex: item.templateIndex ?? templateIndexMap.value.get(item.key) ?? undefined
        }

        const items = [...entry.items, managedItem]
        entry.items = sortItemsByTemplateOrder(items)

        const targetIndex = entry.items.findIndex((it, index) => getItemKey(it, index) === item.key)
        entry.active_item_index = targetIndex >= 0 ? targetIndex : (entry.active_item_index ?? 0)

        return entry
      })

      if (updatedEntry) {
        const activeItem = updatedEntry.items[updatedEntry.active_item_index ?? 0] ?? null
        if (activeItem) {
          const placementId = (activeItem as ManagedTextItem).placement_id
          workflowStore.setActiveTextItemIndex(
            placementId != null ? placementId : (updatedEntry.active_item_index ?? null)
          )
        }
      } else {
        const activeItem =
          currentEntry.value?.items?.[currentEntry.value.active_item_index ?? 0] ?? null
        if (activeItem) {
          const placementId = (activeItem as ManagedTextItem).placement_id
          workflowStore.setActiveTextItemIndex(
            placementId != null ? placementId : (currentEntry.value.active_item_index ?? null)
          )
        }
      }
      return
    }

    const updatedEntry = await commitEntryUpdate(entry => {
      const targetIndex = entry.items.findIndex((it, index) => getItemKey(it, index) === item.key)
      if (targetIndex === -1) return entry
      const items = [...entry.items]
      items.splice(targetIndex, 1)
      entry.items = items
      if (items.length === 0) {
        entry.active_item_index = 0
      } else if (entry.active_item_index >= items.length) {
        entry.active_item_index = items.length - 1
      } else if (entry.active_item_index === targetIndex) {
        entry.active_item_index = Math.max(0, entry.active_item_index - 1)
      }
      return entry
    })

    if (!updatedEntry || updatedEntry.items.length === 0) {
      workflowStore.setActiveTextItemIndex(null)
    } else {
      const activeItem = updatedEntry.items[updatedEntry.active_item_index ?? 0] ?? null
      if (!activeItem) {
        workflowStore.setActiveTextItemIndex(null)
      } else {
        const placementId = (activeItem as ManagedTextItem).placement_id
        workflowStore.setActiveTextItemIndex(
          placementId != null ? placementId : (updatedEntry.active_item_index ?? null)
        )
      }
    }
  }

  async function navigateToItem(item: DisplayItem) {
    if (!item.isChecked || !currentEntry.value) return
    const targetIndex = currentEntry.value.items.findIndex(
      (it, index) => getItemKey(it, index) === item.key
    )
    if (targetIndex === -1) return
    let updatedEntry: OutputProductText | null = null
    if (currentEntry.value.active_item_index !== targetIndex) {
      updatedEntry = await commitEntryUpdate(entry => {
        entry.active_item_index = targetIndex
        return entry
      })
    }

    const sourceEntry = updatedEntry ?? currentEntry.value
    const effectiveIndex = sourceEntry.active_item_index ?? targetIndex
    const activeItem = sourceEntry.items[effectiveIndex] ?? null
    const placementId = (activeItem as ManagedTextItem | null)?.placement_id
    workflowStore.setActiveTextItemIndex(placementId != null ? placementId : effectiveIndex)
    workflowStore.setTextsSubStep('single')
  }

  watch(
    [() => currentEntry.value, () => originalEntry.value],
    ([entry, template]) => {
      void ensureDefaultItems(entry, template)
    },
    { immediate: true }
  )

  watch(
    () => currentEntry.value,
    entry => {
      isSyncingForm.value = true
      form.font = entry?.font_family || ''
      const entryValue = entry?.value ?? ''
      form.number = entryValue
      isSyncingForm.value = false
    },
    { immediate: true }
  )

  watch(
    () => form.number,
    (next, prev) => {
      if (isSyncingForm.value) return
      if (next === prev) return
      // Pass the number value directly to syncTextToRosterAndEntry
      // This ensures we use the correct value from TextNumberFontSelection's form
      syncTextToRosterAndEntry(next)
      void handleNumberChange(next)
    }
  )

  watch(
    () => form.font,
    (next, prev) => {
      if (isSyncingForm.value) return
      if (next === prev) return
      void handleFontChange(next)
    }
  )
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header Section -->
    <div class="px-6 space-y-5">
      <!-- Number Input -->
      <div class="space-y-2">
        <div class="h-14">
          <Input
            v-model="form.number"
            :placeholder="texts_number_input_placeholder({}, { locale })"
            class="h-full text-lg"
            inputmode="numeric"
          />
        </div>
      </div>

      <!-- Font Selection -->
      <div class="space-y-2">
        <Label class="text-sm font-medium text-foreground">{{
          texts_font_label({}, { locale })
        }}</Label>
        <div class="h-14">
          <FontSelector v-model="form.font" :options="fontOptions" />
        </div>
      </div>
    </div>

    <!-- Placement List -->
    <div class="border-t border-border">
      <p v-if="!displayItems.length" class="px-4 py-6 text-sm text-muted-foreground">
        {{ texts_no_text_placements({}, { locale }) }}
      </p>
      <div
        v-for="item in displayItems"
        :key="item.key"
        :class="[
          'flex h-[60px] w-full items-center gap-3 border-b border-border px-4 py-4 first:border-t-0 transition-colors',
          item.isChecked ? 'hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'
        ]"
      >
        <button
          type="button"
          class="flex h-full flex-1 items-center justify-between text-left focus:outline-none disabled:cursor-not-allowed"
          :disabled="!item.isChecked"
          @click="navigateToItem(item)"
        >
          <div class="flex flex-1 items-center">
            <p class="text-sm font-semibold text-foreground">{{ item.label }}</p>
          </div>
          <div class="flex shrink-0 items-center justify-center text-muted-foreground">
            <div class="shrink-0" @click.stop>
              <Switch
                :model-value="item.isChecked"
                :disabled="!currentEntry"
                @update:model-value="(checked: boolean) => toggleItem(item, checked)"
              />
            </div>
            <ChevronRight class="size-4" />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
