<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  // import type { APCustomizationGroupColor } from '@/services/products/types'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel
  } from '@/components/ui/select'
  import { useEffectiveSelectors } from '@/stores/selectors/effective'
  import type { OutputColor } from '@/services/products/types'
  // Store (kept in case we want to wire real data later)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()

  // Dummy palettes – replace with real data later
  type Palette = {
    id: number
    name: string
    colors: OutputColor[]
  }
  const computedPalettes = computed<Palette[] | undefined>(() => {
    return productsStore.activeProductDetails?.namecolors.map(colorGroup => ({
      id: colorGroup.id,
      name: colorGroup.file_name,
      colors: colorGroup.json_data
    }))
  })
  console.log('computedPalettes', computedPalettes.value)

  // Three color slots shown in the UI
  // const slotLabels = computed(
  //   () => productsStore.svgGroups?.map(group => group.id) || []
  // )
  // const slotValues = ref<string[]>(['#F9C80E', '#E5E7EB', '#111827'])

  // const customizedColorGroups = computed<
  //   Record<string, APCustomizationGroupColor>
  // >(() => {
  //   return customizationStore.customization?.group_colors || {}
  // })
  // Local clipboard for copy/paste between slots
  const clipboardHex = ref<string | null>(null)

  // Per-slot mode: 'colors' | 'pantone'
  const slotMode = ref<Record<number, 'colors' | 'pantone'>>({
    0: 'colors',
    1: 'colors',
    2: 'colors'
  })

  // List of palette options for the select dropdown
  const paletteOptions = computed(
    () =>
      computedPalettes.value?.map(palette => ({
        label: palette.name,
        value: palette.id
      })) ?? []
  )

  // The currently selected palette object
  const currentPalette = computed(() => {
    console.log(
      'currentPalette',
      computedPalettes.value?.find(p => p.id === currentPaletteId.value)
    )
    return (
      computedPalettes.value?.find(p => p.id === currentPaletteId.value) ||
      computedPalettes.value?.[0]
    )
  })

  // Model for shadcn/vue select: stores the palette name (string)
  const currentPaletteId = ref<number>(computedPalettes.value?.[0]?.id || 0)

  function setGroupColor(colorGroupId: string, color: OutputColor) {
    customizationStore.setGroupColor(colorGroupId, color)
  }

  function copyFrom(groupId: string) {
    // Find the color value for the given groupId from effectiveSvgGroups
    const group = effectiveSvgGroups.value?.find(g => g.id === groupId)
    clipboardHex.value = group?.color ?? null
  }

  function pasteTo(groupId: string) {
    if (!clipboardHex.value) return
    // Use setGroupColor to update the color for the group
    setGroupColor(groupId, { name: '', value: clipboardHex.value, position: 0 })
  }

  function shuffleAll() {
    const colors = currentPalette.value?.colors
    if (!colors?.length || !effectiveSvgGroups.value) return
    // For each group, assign a random color from the palette using setGroupColor
    effectiveSvgGroups.value.forEach(group => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      if (randomColor) {
        setGroupColor(group.id, randomColor)
      }
    })
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Lucky / Locker actions -->
    <div class="rounded-xl border border-border bg-muted/40 p-4 mx-6">
      <div class="flex items-start gap-4">
        <i-flex-line-paint-palette class="size-10 text-primary" />
        <div class="flex-1">
          <div class="text-base font-semibold text-foreground">
            Feeling lucky?
          </div>
          <div class="text-sm text-muted-foreground">
            Let’s see what the color gods decide.
          </div>
        </div>
      </div>
      <div class="mt-4">
        <Button class="w-full" variant="default" @click="shuffleAll"
          >Shuffle</Button
        >
      </div>
      <div
        class="relative my-4 flex items-center justify-center text-xs text-muted-foreground"
      >
        <span class="px-3 bg-card">or</span>
        <div class="absolute inset-x-0 h-px bg-border"></div>
      </div>
      <div>
        <Button class="w-full" variant="outline">Choose from locker</Button>
      </div>
    </div>

    <!-- Color slots -->
    <Accordion type="single" collapsible>
      <AccordionItem
        v-for="(svgGroup, idx) in effectiveSvgGroups"
        :key="svgGroup.id"
        :value="String(idx)"
        class="px-6"
      >
        <AccordionTrigger>
          <div class="flex justify-between gap-3 w-full group">
            <div class="flex items-center gap-3 w-full">
              <span
                class="inline-block size-7 rounded-full border border-border"
                :style="{ background: svgGroup.color ?? '' }"
              />
              <span class="text-base">{{ svgGroup.id }}</span>
            </div>
            <div
              class="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-hover:no-underline transition-opacity"
            >
              <Button
                size="sm"
                variant="outline"
                @click.stop="copyFrom(svgGroup.id)"
                ><span class="no-underline">Copy</span></Button
              >
              <Button
                size="sm"
                variant="outline"
                :disabled="!clipboardHex"
                @click.stop="pasteTo(svgGroup.id)"
                ><span class="no-underline">Paste</span>
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <!-- Controls row -->
          <div class="flex items-center justify-between gap-3">
            <div
              class="inline-flex rounded-lg border border-border bg-muted p-1 text-sm"
            >
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  slotMode[idx] === 'colors'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="slotMode[idx] = 'colors'"
              >
                Colors
              </button>
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  slotMode[idx] === 'pantone'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="slotMode[idx] = 'pantone'"
              >
                Pantone
              </button>
            </div>
          </div>

          <!-- Palette select -->
          <div class="mt-3">
            <Select v-model="currentPaletteId">
              <SelectTrigger class="h-9 w-full">
                <SelectValue :value="currentPalette?.name" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Palettes</SelectLabel>
                  <SelectItem
                    v-for="p in paletteOptions"
                    :key="p.value"
                    :value="p.value"
                  >
                    {{ p.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Swatches grid -->
          <div class="mt-4 grid grid-cols-8 gap-3">
            <Button
              v-for="color in currentPalette?.colors"
              :key="color.value + idx"
              :class="'relative h-8 w-8 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring '"
              :style="{ background: color.value }"
              @click="setGroupColor(svgGroup.id, color)"
            >
              <span
                v-if="svgGroup.color === color.value"
                class="absolute inset-0 rounded-full ring-2 ring-primary"
              />
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
