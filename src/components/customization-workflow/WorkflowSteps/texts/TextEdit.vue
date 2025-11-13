<script setup lang="ts">
  import { computed, watch } from 'vue'
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
  import { useTextActions } from './useTextActions'
  import { useTexts } from './useTexts'

  // ===== COMPOSABLES =====
  const { form, currentEntry } = useTextActions()
  const { fontOptions, colorPalettes } = useTexts()
  const isNumberEntry = computed(() => currentEntry.value?.type === 'number')

  // ===== COMPUTED =====
  // Slider value for angle (Slider component expects an array)
  const angleSliderValue = computed({
    get: () => [form.angle],
    set: (value: number[]) => {
      form.angle = value[0] || 0
    }
  })

  // Slider value for outline width (Slider component expects an array)
  const outlineWidthSliderValue = computed({
    get: () => [form.outline_width],
    set: (value: number[]) => {
      form.outline_width = value[0] || 0
    }
  })

  // Watch for font options to set default
  watch(
    () => fontOptions.value,
    options => {
      if (!form.font && options.length) {
        form.font = options[0]?.value || ''
      }
    },
    { immediate: true }
  )

  // ===== UTILITIES =====
  // Color name lookup
  function getColorName(colorValue: string): string {
    for (const palette of colorPalettes.value) {
      const color = palette.colors.find(c => c.value === colorValue)
      if (color) return color.name
    }
    return 'Custom'
  }
</script>

<template>
  <div class="grid gap-4 md:grid-cols-[360px,1fr] md:gap-8">
    <div class="space-y-0 flex flex-col gap-4">
      <!-- Text Input Section -->
      <div v-if="!isNumberEntry" class="space-y-2 px-4 md:px-6 pt-1">
        <Input v-model="form.text" rows="3" placeholder="Enter text" class="text-lg h-[3.5rem]" />
      </div>

      <!-- Font Selection Section -->
      <div v-if="!isNumberEntry" class="space-y-2 px-4 md:px-6">
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
        <AccordionItem v-if="form.outline_enabled" value="outline">
          <AccordionTrigger class="px-4 md:px-6 py-4 hover:no-underline">
            <div class="flex items-center gap-3 w-full">
              <div
                class="w-7 h-7 rounded-full border border-input shrink-0"
                :style="{ backgroundColor: form.outline }"
              />
              <div class="flex-1 flex items-center gap-2 text-left">
                <span class="text-base font-semibold text-foreground">Outline</span>
                <span class="text-base text-muted-foreground">{{
                  getColorName(form.outline)
                }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4 space-y-4">
            <!-- Outline Width Slider -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium text-foreground">Outline width</Label>
                <span class="text-sm text-foreground">{{ form.outline_width }}px</span>
              </div>
              <div class="flex items-center gap-2">
                <Slider
                  v-model="outlineWidthSliderValue"
                  :max="20"
                  :min="0"
                  :step="1"
                  class="flex-1"
                />
              </div>
            </div>

            <!-- Color Selector -->
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
                <span class="text-base text-muted-foreground">{{ form.placement }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4 space-y-4">
            <!-- Placement Selector -->
            <div class="space-y-2">
              <Label class="text-sm font-medium text-foreground">Placement</Label>
              <Select v-model="form.placement">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Front">Front</SelectItem>
                  <SelectItem value="Back">Back</SelectItem>
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
            <!-- <div class="flex gap-2">
              <Button variant="outline" class="flex-1 h-9 gap-2" @click="centerText">
                <AlignCenter class="w-4 h-4" />
                Center text
              </Button>
              <Button variant="outline" class="flex-1 h-9 gap-2" @click="pinText">
                <Pin class="w-4 h-4" />
                Pin text
              </Button>
            </div> -->
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
</template>

<style scoped></style>
