<script setup lang="ts">
  import { computed, ref, watchEffect } from 'vue'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { Button } from '@/components/ui/button'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { ColorGrid } from '@/components/ui/color-grid'
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel
  } from '@/components/ui/select'
  import { Trash } from 'lucide-vue-next'
  import type { CustomLogo } from '@/services/logos/types'
  import type { OutputColor } from '@/services/products/types'
  import ColorsPreview from '@/components/ui/colors-preview/ColorsPreview.vue'

  interface Props {
    logoId: string
  }

  const props = defineProps<Props>()

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()
  const logosStore = useLogosStore()

  type ColorMode = 'soccer' | 'socks' | 'pantone'
  type BackgroundRemovalMode = 'simple' | 'content' | null

  // Type for color that can be either a hex string or RGB object
  type ColorValue = string | { r: number; g: number; b: number }

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  // Local clipboard for copy/paste between slots
  const clipboardHex = ref<string | null>(null)

  const logo = computed(() => {
    if (logosStore.activeLogo) return logosStore.activeLogo
    return logosStore.recentLogos?.find(l => l.id.toString() === props.logoId) || null
  })

  const selectedColorMode = ref<ColorMode>('soccer')
  const removeBackgroundMode = ref<BackgroundRemovalMode>(null)

  const hasColors = computed(() => (logo.value?.logo_colors?.length ?? 0) > 0)
  const placementLabel = computed(() => (logo.value as CustomLogo)?.placement || 'Chest middle')
  const previewUrl = computed(() => `${baseStorageUrl.value}${logo.value?.url ?? ''}`)

  // List of palette options for the select dropdown
  const paletteOptions = computed(
    () =>
      (colorPalettes &&
        Object.keys(colorPalettes).map(key => ({
          label: colorModes.find(mode => mode.id === key)?.label || key,
          value: key
        }))) ??
      []
  )

  // The currently selected palette object
  const currentPalette = computed(() => {
    return colorPalettes[selectedColorMode.value] || colorPalettes.soccer
  })

  // Convert palette colors to OutputColor objects for ColorGrid
  const currentPaletteHex = computed(() => {
    return currentPalette.value.map((color: ColorValue, index: number) => {
      const hexValue =
        typeof color === 'string'
          ? color
          : `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`

      return {
        position: index,
        name: hexValue,
        value: hexValue
      }
    })
  })

  // Model for shadcn/vue select: stores the palette name (string)
  const currentPaletteId = ref<string>(selectedColorMode.value)

  const rgbArrayToHex = (arr: number[]): string => {
    const [r = 0, g = 0, b = 0] = arr
    const toHex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const colorSwatches = computed(() =>
    (logo.value?.logo_colors || []).map(color => rgbArrayToHex(color as number[]))
  )

  // Color modes for recoloring
  const colorModes = [
    { id: 'soccer', label: 'Soccer colors' },
    { id: 'socks', label: 'Socks colours' },
    { id: 'pantone', label: 'Pantone' }
  ]

  // Mock color palettes for different modes
  const colorPalettes = {
    soccer: [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85C1E9',
      '#D7BDE2',
      '#A9DFBF'
    ],
    socks: [
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FFFF00',
      '#FF00FF',
      '#00FFFF',
      '#FFA500',
      '#800080',
      '#008000',
      '#000080',
      '#808080',
      '#C0C0C0',
      '#800000',
      '#808000',
      '#000000',
      '#FFFFFF'
    ],
    pantone: [
      '#C5282F',
      '#F4A261',
      '#E76F51',
      '#2A9D8F',
      '#264653',
      '#E9C46A',
      '#F77F00',
      '#FCBF49',
      '#D62828',
      '#F77F00',
      '#06FFA5',
      '#3A86FF',
      '#8338EC',
      '#FF006E',
      '#FB5607',
      '#FFBE0B'
    ]
  }

  watchEffect(() => {
    if (logo.value) {
      logosStore.setActiveLogo(logo.value)
    }
  })

  // Sync currentPaletteId with selectedColorMode
  watchEffect(() => {
    currentPaletteId.value = selectedColorMode.value
  })

  watchEffect(() => {
    selectedColorMode.value = currentPaletteId.value as ColorMode
  })

  function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    workflowStore.setActiveLogoId(null)
    logosStore.setActiveLogo(null)
  }

  function handleRemoveBackground(type: 'simple' | 'content') {
    removeBackgroundMode.value = type
  }

  function handleApplyColours() {
    if (!logo.value || !logo.value.logo_colors || !effectiveSvgGroups.value) {
      return
    }

    const palette = logo.value.logo_colors as number[][]
    const hexPalette = palette.map(rgbArrayToHex)

    historyStore.runBatch('Apply logo colors', add => {
      effectiveSvgGroups.value?.forEach((group, index) => {
        const nextColor = hexPalette[index]
        if (!nextColor) return

        const prevRaw = customizationStore.customization?.group_colors?.[group.id]
        const prevColor = prevRaw
          ? {
              name: prevRaw.name || '',
              value: prevRaw.color || '',
              position: 0
            }
          : null

        add('color.set-group', {
          groupId: group.id,
          prevColor,
          nextColor: { name: '', value: nextColor, position: 0 }
        })
      })
    })
  }

  function handleRecolorLogo(_color: OutputColor) {
    // TODO: Implement logo recoloring
  }

  function handleDeleteLogo() {
    if (!logo.value) return
    // TODO: Implement logo deletion
    handleBackToLogos()
  }

  function copyFrom() {
    // Find the color value for the logo from colorSwatches
    clipboardHex.value = colorSwatches.value[0] ?? null
  }

  function pasteTo() {
    if (!clipboardHex.value) return
    // TODO: Apply the copied color to the logo
  }

  const breadcrumbs = computed(() => [
    {
      label: 'Logos',
      action: handleBackToLogos
    },
    { label: 'Controls' }
  ])

  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="rounded-lg border bg-card mx-6">
      <header class="flex items-start justify-between">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {{ placementLabel }}
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-muted-foreground hover:text-destructive"
          @click="handleDeleteLogo"
        >
          <Trash class="h-4 w-4" />
        </Button>
      </header>

      <div class="mt-5 flex flex-col items-center gap-4">
        <div
          class="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl md:h-48"
        >
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="max-h-[85%] max-w-[80%] object-contain"
            alt="logo preview"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-sm text-muted-foreground"
          >
            Logo preview unavailable
          </div>

          <div
            v-if="hasColors"
            class="absolute inset-x-4 bottom-4 flex items-center justify-between"
          >
            <ColorsPreview :colors="colorSwatches" />
            <!-- <div class="flex items-center gap-2">
              <div
                v-for="(color, idx) in colorSwatches"
                :key="color + idx"
                class="h-8 w-8 rounded-full border border-background shadow-sm"
                :class="idx > 0 ? '-ml-3' : ''"
                :style="{ backgroundColor: color }"
                :title="color"
              />
            </div> -->
            <Button
              size="sm"
              variant="outline"
              class="px-4 rounded-lg shadow-xs"
              @click="handleApplyColours"
            >
              Apply colours
            </Button>
          </div>

          <div
            v-else
            class="absolute bottom-4 right-4 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            No palette detected
          </div>
        </div>
      </div>
    </section>

    <Accordion type="multiple" :default-value="['remove-background', 'recolor']" class="space-y-4">
      <AccordionItem value="remove-background" class="overflow-hidden">
        <AccordionTrigger class="px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Remove background</span>
            <span class="text-sm font-normal text-muted-foreground md:text-right">
              Nacho Kings Nacho Kings
            </span>
          </div>
          <template #icon>
            <svg
              class="ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </template>
        </AccordionTrigger>
        <AccordionContent class="space-y-4 px-6 py-5">
          <button
            type="button"
            class="flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition hover:border-primary"
            :class="{
              'border-primary bg-primary/5 ring-1 ring-primary/30':
                removeBackgroundMode === 'simple'
            }"
            @click="handleRemoveBackground('simple')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white"
              >
                <span class="text-base font-semibold">S</span>
              </div>
            </div>
            <div class="flex flex-1 flex-col gap-2">
              <p class="text-sm font-semibold">Simple remove</p>
              <p class="text-xs text-muted-foreground">
                Removes all pixels matching the top-left colour, even inside the logo.
              </p>
              <Button size="sm" variant="secondary" class="mt-1 self-start rounded-full px-4">
                Apply
              </Button>
            </div>
          </button>

          <button
            type="button"
            class="flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition hover:border-primary"
            :class="{
              'border-primary bg-primary/5 ring-1 ring-primary/30':
                removeBackgroundMode === 'content'
            }"
            @click="handleRemoveBackground('content')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white"
              >
                <span class="text-base font-semibold">C</span>
              </div>
            </div>
            <div class="flex flex-1 flex-col gap-2">
              <p class="text-sm font-semibold">Content remove</p>
              <p class="text-xs text-muted-foreground">
                Removes the top-left colour only from the background, not the logo.
              </p>
              <Button size="sm" variant="secondary" class="mt-1 self-start rounded-full px-4">
                Apply
              </Button>
            </div>
          </button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="recolor" class="overflow-hidden">
        <AccordionTrigger class="px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Recolor logo</span>
            <span class="text-sm font-normal text-muted-foreground md:text-right">
              Nacho Kings Nacho Kings
            </span>
          </div>
          <template #icon>
            <svg
              class="ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </template>
        </AccordionTrigger>
        <AccordionContent class="px-6 py-5">
          <!-- Controls row -->
          <div class="flex items-center justify-between gap-3">
            <div class="inline-flex rounded-lg border border-border bg-muted p-1 text-sm">
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  selectedColorMode === 'soccer'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="selectedColorMode = 'soccer'"
              >
                Soccer colors
              </button>
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  selectedColorMode === 'socks'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="selectedColorMode = 'socks'"
              >
                Socks colours
              </button>
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  selectedColorMode === 'pantone'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="selectedColorMode = 'pantone'"
              >
                Pantone
              </button>
            </div>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="outline" @click="copyFrom">
                <span class="no-underline">Copy</span>
              </Button>
              <Button size="sm" variant="outline" :disabled="!clipboardHex" @click="pasteTo">
                <span class="no-underline">Paste</span>
              </Button>
            </div>
          </div>

          <!-- Palette select -->
          <div class="mt-3">
            <Select v-model="currentPaletteId">
              <SelectTrigger class="h-9 w-full">
                <SelectValue
                  :value="colorModes.find(mode => mode.id === currentPaletteId)?.label"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Palettes</SelectLabel>
                  <SelectItem v-for="p in paletteOptions" :key="p.value" :value="p.value">
                    {{ p.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Swatches grid -->
          <div class="mt-4">
            <ColorGrid
              :colors="currentPaletteHex"
              :selected-color="colorSwatches[0]"
              @color-select="handleRecolorLogo"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="position" class="overflow-hidden">
        <AccordionTrigger class="px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Position</span>
            <span class="text-sm font-normal text-muted-foreground md:text-right">
              Nacho Kings Nacho Kings
            </span>
          </div>
          <template #icon>
            <svg
              class="ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </template>
        </AccordionTrigger>
        <AccordionContent class="px-6 py-5 text-sm text-muted-foreground">
          Position controls coming soon.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="technology" class="overflow-hidden">
        <AccordionTrigger class="px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Logo technology</span>
            <span class="text-sm font-normal text-muted-foreground md:text-right">
              Nacho Kings Nacho Kings
            </span>
          </div>
          <template #icon>
            <svg
              class="ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </template>
        </AccordionTrigger>
        <AccordionContent class="px-6 py-5 text-sm text-muted-foreground">
          Technology options will appear here.
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <div class="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
      <Button variant="outline" class="w-full rounded-full sm:w-auto" @click="handleBackToLogos">
        Cancel
      </Button>
      <Button class="w-full rounded-full sm:w-auto">Save</Button>
    </div>
  </div>
</template>
