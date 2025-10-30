<script setup lang="ts">
  import { computed, reactive, ref, watch, watchEffect } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
  import { FontSelector } from '@/components/ui/font-selector'
  import { Slider } from '@/components/ui/slider'
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
  } from '@/components/ui/accordion'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { AlignCenter, Pin } from 'lucide-vue-next'
  import type {
    OutputProductText,
    OutputProductTextItem,
    OutputFont,
    OutputColor,
    OutputProductName
  } from '@/services/products/types'
  import { onSaveChanges, onCancel } from './config'
  // Extended type for text items that may have additional properties
  type ExtendedTextItem = OutputProductTextItem & {
    width?: string
    placement_id?: number
  }

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()

  const { activeTextIndex } = storeToRefs(workflowStore)
  const { activeProductDetails } = storeToRefs(productsStore)

  const textEntries = computed(() => customizationStore.activeProductTexts)
  const productId = computed(
    () => customizationStore.activeProductId ?? activeProductDetails.value?.id ?? null
  )

  const currentEntry = computed<OutputProductText | null>(() => {
    if (activeTextIndex.value == null) return null
    return textEntries.value[activeTextIndex.value] ?? null
  })

  const currentItem = computed<OutputProductTextItem | null>(() => {
    const entry = currentEntry.value
    if (!entry) return null
    const idx = entry.active_item_index ?? 0
    return entry.items?.[idx] ?? entry.items?.[0] ?? null
  })

  const placementMap = computed<Record<number, OutputProductName>>(() => {
    const map: Record<number, OutputProductName> = {}
    for (const placement of activeProductDetails.value?.productnames ?? []) {
      map[placement.id] = placement
    }
    return map
  })

  const currentPlacement = computed<OutputProductName | null>(() => {
    const id = (currentItem.value as Record<string, unknown> | null)?.placement_id
    if (typeof id === 'number') return placementMap.value[id] ?? null
    return null
  })

  // header/footer config is provided by texts/config.ts and layout; breadcrumbs are rendered via header config

  const palettes = computed(() => productsStore.activeProductDetails?.namecolors ?? [])

  // Helper to construct full font URL from path
  function getFontUrl(path: string): string {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  const fontOptions = computed(() => {
    const options: {
      label: string
      value: string
      preview?: string
      fontUrl?: string
      fontFamily?: string
    }[] = []
    for (const font of productsStore.activeProductDetails?.namefonts ?? []) {
      addFontOption(font, options)
    }
    return options
  })

  function addFontOption(
    font: OutputFont,
    bucket: {
      label: string
      value: string
      preview?: string
      fontUrl?: string
      fontFamily?: string
    }[]
  ) {
    ;(font.json_data ?? []).forEach(file => {
      bucket.push({
        label: file.name,
        value: file.name,
        preview: file.name,
        fontUrl: getFontUrl(file.path),
        fontFamily: file.name
      })
    })
  }

  const fallbackColors: OutputColor[] = [
    { position: 0, name: 'Black', value: '#000000' },
    { position: 1, name: 'White', value: '#ffffff' },
    { position: 2, name: 'Grey', value: '#808080' }
  ]

  const form = reactive({
    text: '',
    font: '',
    fill: '#000000',
    outline: '#ffffff',
    height: 0,
    width: 0,
    angle: 0
  })

  const clone = <T,>(value: T): T =>
    typeof structuredClone === 'function'
      ? structuredClone(value)
      : (JSON.parse(JSON.stringify(value)) as T)

  function toNumber(input: string | number | undefined, fallback = 0) {
    if (typeof input === 'number') return input
    const parsed = parseFloat(String(input ?? ''))
    return Number.isFinite(parsed) ? parsed : fallback
  }

  watchEffect(() => {
    const entry = currentEntry.value
    const item = currentItem.value
    if (!entry || !item) return
    form.text = entry.value || ''
    form.font = entry.font_family || fontOptions.value[0]?.value || ''
    form.fill = item.color || '#000000'
    form.outline = item.outline_color || '#ffffff'
    form.height = toNumber(item.height, 10)
    form.width = toNumber((item as ExtendedTextItem).width ?? item.height, form.height)
    form.angle = toNumber(item.rotation, 0)

    // Set selected placement if available
    const placementId = (item as ExtendedTextItem)?.placement_id
    if (typeof placementId === 'number') {
      selectedPlacementId.value = placementId
    }
  })

  watch(
    () => fontOptions.value,
    options => {
      if (!form.font && options.length) {
        form.font = options[0]?.value || ''
      }
    },
    { immediate: true }
  )

  function buildUpdatedEntry(entry: OutputProductText): OutputProductText {
    const next = clone(entry)
    next.value = form.text
    next.font_family = form.font
    const idx = next.active_item_index ?? 0
    if (!next.items) next.items = []
    if (!next.items[idx]) next.items[idx] = {} as OutputProductTextItem
    const target = next.items[idx]
    const extendedTarget = target as ExtendedTextItem
    extendedTarget.label = extendedTarget.label || next.label
    extendedTarget.height = String(form.height)
    extendedTarget.width = String(form.width)
    extendedTarget.color = form.fill
    extendedTarget.outline_color = form.outline
    extendedTarget.rotation = String(form.angle)
    extendedTarget.scaleX = extendedTarget.scaleX ?? 1
    extendedTarget.scaleY = extendedTarget.scaleY ?? 1
    extendedTarget.selected = true

    // Update placement if selected
    if (selectedPlacementId.value) {
      extendedTarget.placement_id = selectedPlacementId.value
    }

    return next
  }

  onSaveChanges.value = async () => {
    console.log('onSaveChanges from TextEdit')
    if (!currentEntry.value || productId.value == null || activeTextIndex.value == null) return
    const key = String(productId.value)
    const prev = currentEntry.value
    const next = buildUpdatedEntry(prev)
    await historyStore.execute('text.update-entry', {
      key,
      index: activeTextIndex.value,
      prev,
      next
    })
    workflowStore.setTextsSubStep('list')
  }

  onCancel.value = () => {
    console.log('onCancel from TextEdit')
    workflowStore.setTextsSubStep('list')
  }

  // function applyStylingClipboard() {
  //   if (!currentEntry.value) return
  //   workflowStore.setTextClipboard({ style: clone(currentEntry.value) })
  // }

  const colorPalettes = computed(() => {
    const source = palettes.value
    if (!source?.length) {
      return [
        {
          id: 0,
          name: 'Defaults',
          colors: fallbackColors
        }
      ]
    }
    return source.map(group => ({ id: group.id, name: group.file_name, colors: group.json_data }))
  })

  // const showNumberControls = computed(() => Boolean(currentEntry.value?.is_first_number))

  // Slider value for angle (Slider component expects an array)
  const angleSliderValue = computed({
    get: () => [form.angle],
    set: (value: number[]) => {
      form.angle = value[0] || 0
    }
  })

  // Placement selection
  const selectedPlacementId = ref<number | null>(null)
  const placementOptions = computed(() => activeProductDetails.value?.productnames ?? [])

  // Watch for placement selection changes
  watch(selectedPlacementId, newPlacementId => {
    if (newPlacementId && currentItem.value) {
      const placement = placementMap.value[newPlacementId]
      if (placement) {
        // Update text dimensions based on placement
        form.width = placement.width ?? placement.height ?? form.width
        form.height = placement.height ?? form.height
      }
    }
  })

  // Color name lookup
  function getColorName(colorValue: string): string {
    for (const palette of colorPalettes.value) {
      const color = palette.colors.find(c => c.value === colorValue)
      if (color) return color.name
    }
    return 'Custom'
  }

  // Text positioning actions
  function centerText() {
    if (!currentItem.value) return
    // Center the text on the placement
    const placement = currentPlacement.value
    if (placement) {
      const centerX = placement.x_axis
      const centerY = placement.y_axis
      // Update the text position to center it
      // This would need to be implemented based on your text positioning logic
      console.log('Centering text at:', centerX, centerY)
    }
  }

  function pinText() {
    if (!currentItem.value) return
    // Pin the text to prevent accidental movement
    // This would need to be implemented based on your text pinning logic
    console.log('Pinning text')
  }
</script>

<template>
  <div class="grid gap-6 md:grid-cols-[360px,1fr] md:gap-8">
    <div class="space-y-0 flex flex-col gap-4">
      <!-- Text Input Section -->
      <div class="space-y-2 px-4 md:px-6 pt-1">
        <Input v-model="form.text" rows="3" placeholder="Enter text" class="text-lg" />
      </div>

      <!-- Font Selection Section -->
      <div class="space-y-2 px-4 md:px-6">
        <Label class="text-sm font-medium text-foreground">Font</Label>
        <FontSelector v-model="form.font" :options="fontOptions" />
      </div>

      <!-- Color and Sizing Accordion -->
      <Accordion type="multiple" :default-value="['sizing']" class="w-full">
        <!-- Fill Colour Accordion Item -->
        <AccordionItem value="fill">
          <AccordionTrigger class="px-4 md:px-6 py-4 hover:no-underline">
            <div class="flex items-center gap-3 w-full">
              <div
                class="w-7 h-7 rounded-full border border-input shrink-0"
                :style="{ backgroundColor: form.fill }"
              />
              <div class="flex-1 flex items-center gap-2 text-left">
                <span class="text-base font-semibold text-foreground">Fill colour</span>
                <span class="text-base text-muted-foreground">{{ getColorName(form.fill) }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4">
            <PaletteColorSelector
              :palettes="colorPalettes"
              :selected-color="form.fill"
              @color-select="color => (form.fill = color.value)"
            />
          </AccordionContent>
        </AccordionItem>

        <!-- Outline Colour Accordion Item -->
        <AccordionItem value="outline">
          <AccordionTrigger class="px-4 md:px-6 py-4 hover:no-underline">
            <div class="flex items-center gap-3 w-full">
              <div
                class="w-7 h-7 rounded-full border border-input shrink-0"
                :style="{ backgroundColor: form.outline }"
              />
              <div class="flex-1 flex items-center gap-2 text-left">
                <span class="text-base font-semibold text-foreground">Outline colour</span>
                <span class="text-base text-muted-foreground">{{
                  getColorName(form.outline)
                }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4">
            <PaletteColorSelector
              :palettes="colorPalettes"
              :selected-color="form.outline"
              @color-select="color => (form.outline = color.value)"
            />
          </AccordionContent>
        </AccordionItem>

        <!-- Sizing Accordion Item -->
        <AccordionItem value="sizing">
          <AccordionTrigger class="px-4 md:px-6 py-4 hover:no-underline">
            <div class="flex items-center gap-3 w-full">
              <div class="flex-1 flex items-center gap-2 text-left">
                <span class="text-base font-semibold text-foreground">Sizing</span>
                <span class="text-base text-muted-foreground">{{
                  currentPlacement?.name_of_placement || 'Custom'
                }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4 space-y-4">
            <!-- Placement Selector -->
            <div class="space-y-2">
              <Label class="text-sm font-medium text-foreground">Placement</Label>
              <Select v-model="selectedPlacementId">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">Select placement</SelectItem>
                  <SelectItem
                    v-for="placement in placementOptions"
                    :key="placement.id"
                    :value="placement.id"
                  >
                    {{ placement.name_of_placement }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Width and Height Inputs -->
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-2">
                <Label class="text-sm font-medium text-foreground">Width</Label>
                <div class="relative">
                  <Input
                    v-model.number="form.width"
                    type="number"
                    min="1"
                    step="0.1"
                    class="pr-8"
                  />
                  <span
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    >cm</span
                  >
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium text-foreground">Height</Label>
                <div class="relative">
                  <Input
                    v-model.number="form.height"
                    type="number"
                    min="1"
                    step="0.1"
                    class="pr-8"
                  />
                  <span
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    >cm</span
                  >
                </div>
              </div>
            </div>

            <!-- Angle Slider -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium text-foreground">Angle</Label>
                <span class="text-sm text-foreground">{{ form.angle }}°</span>
              </div>
              <div class="flex items-center gap-2">
                <Slider v-model="angleSliderValue" :max="360" :min="0" :step="1" class="flex-1" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <Button variant="outline" class="flex-1 h-9 gap-2" @click="centerText">
                <AlignCenter class="w-4 h-4" />
                Center text
              </Button>
              <Button variant="outline" class="flex-1 h-9 gap-2" @click="pinText">
                <Pin class="w-4 h-4" />
                Pin text
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
</template>

<style scoped></style>
