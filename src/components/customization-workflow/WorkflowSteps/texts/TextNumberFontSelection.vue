<script setup lang="ts">
  import { computed, reactive, watch, watchEffect } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Badge } from '@/components/ui/badge'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
  import { FontSelector } from '@/components/ui/font-selector'
  import { Slider } from '@/components/ui/slider'
  import ProductPreviewCanvas from '@/components/customization-workflow/WorkflowSteps/ProductPreviewCanvas.vue'
  import type {
    OutputProductText,
    OutputProductTextItem,
    OutputFont,
    OutputColor,
    OutputProductName
  } from '@/services/products/types'

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()

  const { activeTextIndex, pendingNumberPreset } = storeToRefs(workflowStore)
  const { activeProductDetails, activeStyleDetails, activeDesignDetails } =
    storeToRefs(productsStore)

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

  const breadcrumbs = computed(() => [
    { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
    { label: 'Numbers' }
  ])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })

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
    font: '',
    fill: '#000000',
    outline: '#ffffff',
    height: 0,
    angle: [0]
  })

  const PREVIEW_SIZE = 360
  const CANVAS_BASE = 600

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
    form.font = entry.font_family || fontOptions.value[0]?.value || ''
    form.fill = item.color || '#000000'
    form.outline = item.outline_color || '#ffffff'
    form.height = toNumber(item.height, 10)
    // form.width = toNumber(item.width ?? item.height, form.height)
    form.angle = [toNumber(item.rotation, 0)]
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

  const currentOverlay = computed(() => {
    const placement = currentPlacement.value
    const item = currentItem.value
    const scale = PREVIEW_SIZE / CANVAS_BASE
    if (placement) {
      const width = placement.width ?? placement.height ?? 0
      const height = placement.height ?? width
      return {
        x: (placement.x_axis - width / 2) * scale,
        y: (placement.y_axis - height / 2) * scale,
        width: width * scale,
        height: height * scale,
        color: 'rgba(59,130,246,0.35)'
      }
    }
    if (item) {
      // const width = toNumber(item.width ?? item.height)
      const height = toNumber(item.height)
      const x = toNumber(item.x_axis)
      const y = toNumber(item.y_axis)
      return {
        x: (x - height / 2) * scale,
        y: (y - height / 2) * scale,
        width: height * scale,
        height: height * scale,
        color: 'rgba(59,130,246,0.35)'
      }
    }
    return undefined
  })

  function buildUpdatedEntry(entry: OutputProductText): OutputProductText {
    const next = clone(entry)
    next.font_family = form.font
    const idx = next.active_item_index ?? 0
    if (!next.items) next.items = []
    if (!next.items[idx]) next.items[idx] = {} as OutputProductTextItem
    const target = next.items[idx]
    target.label = target.label || next.label
    target.height = String(form.height)
    // target.width = String(form.width)
    target.color = form.fill
    target.outline_color = form.outline
    target.rotation = String(form.angle[0])
    target.scaleX = target.scaleX ?? 1
    target.scaleY = target.scaleY ?? 1
    target.selected = true
    return next
  }

  async function saveChanges() {
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

  function cancel() {
    workflowStore.setTextsSubStep('list')
  }

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

  const numberPresets = computed(() => {
    const presets: string[] = []
    const entry = currentEntry.value
    if (entry?.is_first_number) {
      // Add common number presets
      for (let i = 1; i <= 99; i++) {
        presets.push(String(i))
      }
    }
    return presets
  })

  const selectedNumber = computed(() => {
    return pendingNumberPreset.value || currentEntry.value?.value || '1'
  })

  function selectNumber(number: string) {
    workflowStore.setPendingNumberPreset(number)
    if (currentEntry.value && productId.value != null && activeTextIndex.value != null) {
      const key = String(productId.value)
      const prev = currentEntry.value
      const next = clone(prev)
      next.value = number
      historyStore.execute('text.update-entry', {
        key,
        index: activeTextIndex.value,
        prev,
        next
      })
    }
  }
</script>

<template>
  <div class="grid gap-6 p-4 md:grid-cols-[360px,1fr] md:gap-8 md:p-6">
    <div class="space-y-6">
      <div class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground">Number</Label>
        <div class="text-2xl font-bold text-foreground">{{ selectedNumber }}</div>
        <p class="text-xs text-muted-foreground">This number cannot be edited</p>
      </div>

      <div class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground">Font</Label>
        <FontSelector v-model="form.font" :options="fontOptions" />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-medium text-muted-foreground">Fill colour</Label>
            <Badge variant="outline">{{ form.fill }}</Badge>
          </div>
          <PaletteColorSelector
            :palettes="colorPalettes"
            :selected-color="form.fill"
            @color-select="color => (form.fill = color.value)"
          />
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-medium text-muted-foreground">Outline colour</Label>
            <Badge variant="outline">{{ form.outline }}</Badge>
          </div>
          <PaletteColorSelector
            :palettes="colorPalettes"
            :selected-color="form.outline"
            @color-select="color => (form.outline = color.value)"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-xs font-medium text-muted-foreground">Height (cm)</Label>
          <Input v-model.number="form.height" type="number" min="1" step="0.5" />
        </div>
        <!-- <div class="space-y-2">
          <Label class="text-xs font-medium text-muted-foreground">Width (cm)</Label>
          <Input v-model.number="form.width" type="number" min="1" step="0.5" />
        </div> -->
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-xs font-medium text-muted-foreground">Angle</Label>
          <span class="text-xs text-muted-foreground">{{ form.angle[0] }}°</span>
        </div>
        <Slider v-model="form.angle" :max="360" :min="0" :step="1" />
      </div>

      <div class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground">Number presets</Label>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="preset in numberPresets.slice(0, 18)"
            :key="preset"
            :class="[
              'rounded-lg border p-2 text-sm font-medium transition',
              selectedNumber === preset
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            ]"
            @click="selectNumber(preset)"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <Button variant="outline" @click="cancel">Cancel</Button>
        <Button variant="default" @click="saveChanges">Save</Button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-foreground">Preview</h3>
        <p class="text-xs text-muted-foreground">
          Adjust font, colours and geometry to see changes on the product preview.
        </p>
        <div class="mt-4 overflow-hidden rounded-xl border border-border">
          <ProductPreviewCanvas
            v-if="activeProductDetails && activeStyleDetails && activeDesignDetails"
            :product="activeProductDetails"
            :style-base="activeStyleDetails"
            :design-base="activeDesignDetails"
            :width="PREVIEW_SIZE"
            :height="PREVIEW_SIZE"
            :side="currentPlacement?.side === 'back' ? 'back' : 'front'"
            :overlay-rect="currentOverlay"
          />
        </div>
        <div
          v-if="currentPlacement"
          class="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Badge variant="outline">{{ currentPlacement.name_of_placement }}</Badge>
          <span>•</span>
          <span>{{ currentPlacement.width ?? currentPlacement.height ?? '-' }} cm</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
