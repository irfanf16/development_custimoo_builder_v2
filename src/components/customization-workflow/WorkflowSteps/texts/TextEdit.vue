<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
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
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useColorClipboard } from '@/composables/useColorClipboard'
  import {
    texts_text_input_placeholder,
    texts_font_label,
    texts_fill_color_label,
    texts_color_custom,
    texts_outline_label,
    texts_outline_width_label,
    texts_sizing_section_title,
    texts_placement_label,
    texts_select_placement_placeholder,
    texts_width_label,
    texts_height_label,
    texts_angle_label,
    texts_unit_cm,
    texts_unit_px,
    texts_side_front,
    texts_side_back,
    colors_copy,
    colors_paste
  } from '@/paraglide/messages'

  // ===== COMPOSABLES =====
  const { form, currentEntry } = useTextActions()
  const { fontOptions, colorPalettes } = useTexts()
  const { clipboardColor, copyColor } = useColorClipboard()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  // ===== COMPUTED =====

  /**
   * Checks if the current entry is a number type
   * Number entries have a different UI flow (TextNumberFontSelection)
   */
  const isNumberEntry = computed(() => currentEntry.value?.type === 'number')

  /**
   * Slider value adapter for angle
   * The Slider component expects an array, but form.angle is a number
   * This computed property bridges the gap
   */
  const angleSliderValue = computed({
    get: () => [form.angle],
    set: (value: number[]) => {
      form.angle = value[0] || 0
    }
  })

  /**
   * Slider value adapter for outline width
   * The Slider component expects an array, but form.outline_width is a number
   * This computed property bridges the gap
   */
  const outlineWidthSliderValue = computed({
    get: () => [form.outline_width],
    set: (value: number[]) => {
      form.outline_width = value[0] || 0
    }
  })

  // ===== WATCHERS =====

  /**
   * Auto-select first font option if no font is selected
   * Ensures the form always has a valid font value
   */
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

  /**
   * Looks up the display name for a color value
   * Searches through all color palettes to find a matching color
   *
   * @param colorValue - The hex color value to look up
   * @returns The color name if found, 'Custom' otherwise
   */
  function getColorName(colorValue: string): string {
    for (const palette of colorPalettes.value) {
      const color = palette.colors.find(c => c.value === colorValue)
      if (color) return color.name
    }
    return texts_color_custom({}, { locale: locale.value })
  }
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="space-y-0 flex flex-col gap-4">
      <!-- Text Input Section -->
      <div v-if="!isNumberEntry" class="space-y-2 px-4 md:px-6 pt-1">
        <Input
          v-model="form.text"
          rows="3"
          :placeholder="texts_text_input_placeholder({}, { locale })"
          class="text-lg h-[3.5rem]"
        />
      </div>

      <!-- Font Selection Section -->
      <div v-if="!isNumberEntry" class="space-y-2 px-4 md:px-6">
        <Label class="text-sm font-medium text-foreground">{{
          texts_font_label({}, { locale })
        }}</Label>
        <FontSelector v-model="form.font" :options="fontOptions" />
      </div>

      <!-- Color and Sizing Accordion -->
      <Accordion type="multiple" :default-value="['sizing']">
        <!-- Fill Colour Accordion Item -->
        <AccordionItem value="fill" class="px-4 md:px-6 max-w-full">
          <AccordionTrigger
            class="w-full overflow-hidden items-center no-underline hover:no-underline"
          >
            <div class="flex justify-between gap-2 md:gap-3 w-full group overflow-hidden">
              <div
                class="flex items-center gap-2 md:gap-3 shrink overflow-hidden md:overflow-visible md:group-hover:overflow-hidden"
              >
                <ColorSelector
                  class="flex-shrink-0"
                  :color="form.fill"
                  :disabled="true"
                  :size="'sm'"
                />
                <span
                  class="text-base font-semibold whitespace-nowrap text-ellipsis overflow-hidden shrink"
                  >{{ texts_fill_color_label({}, { locale }) }}</span
                >
                <span
                  class="text-muted-foreground leading-normal capitalize font-normal whitespace-nowrap text-ellipsis overflow-hidden shrink-999"
                  >{{ getColorName(form.fill) }}</span
                >
              </div>
              <div
                class="flex items-center shrink-0 gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-hover:no-underline md:transition-opacity"
              >
                <Button size="sm" variant="default" @click.stop="copyColor(form.fill)"
                  ><span>{{ colors_copy({}, { locale }) }}</span></Button
                >
                <Button
                  size="sm"
                  variant="default"
                  :disabled="!clipboardColor"
                  @click.stop="form.fill = clipboardColor || form.fill"
                  ><span>{{ colors_paste({}, { locale }) }}</span>
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="pb-4">
            <PaletteColorSelector
              :palettes="colorPalettes"
              :selected-color="form.fill"
              @color-select="color => (form.fill = color.value)"
            />
          </AccordionContent>
        </AccordionItem>

        <!-- Outline Colour Accordion Item -->
        <AccordionItem
          v-if="form.outline_enabled"
          value="outline"
          class="px-4 md:px-6 max-w-full hover:bg-primary/10"
        >
          <AccordionTrigger
            class="w-full overflow-hidden items-center no-underline hover:no-underline"
          >
            <div class="flex justify-between gap-2 md:gap-3 w-full group overflow-hidden">
              <div
                class="flex items-center gap-2 md:gap-3 shrink overflow-hidden md:overflow-visible md:group-hover:overflow-hidden"
              >
                <ColorSelector
                  class="flex-shrink-0"
                  :color="form.outline"
                  :disabled="true"
                  :size="'sm'"
                />
                <span
                  class="text-base font-semibold whitespace-nowrap text-ellipsis overflow-hidden shrink"
                  >{{ texts_outline_label({}, { locale }) }}</span
                >
                <span
                  class="text-muted-foreground leading-normal capitalize font-normal whitespace-nowrap text-ellipsis overflow-hidden shrink-999"
                  >{{ getColorName(form.outline) }}</span
                >
              </div>
              <div
                class="flex items-center shrink-0 gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-hover:no-underline md:transition-opacity"
              >
                <Button size="sm" variant="default" @click.stop="copyColor(form.outline)"
                  ><span>{{ colors_copy({}, { locale }) }}</span></Button
                >
                <Button
                  size="sm"
                  variant="default"
                  :disabled="!clipboardColor"
                  @click.stop="form.outline = clipboardColor || form.outline"
                  ><span>{{ colors_paste({}, { locale }) }}</span>
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="pb-4 space-y-4">
            <!-- Outline Width Slider -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium text-foreground">{{
                  texts_outline_width_label({}, { locale })
                }}</Label>
                <span class="text-sm text-foreground"
                  >{{ form.outline_width }}{{ texts_unit_px({}, { locale }) }}</span
                >
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
                <span class="text-base font-semibold text-foreground">{{
                  texts_sizing_section_title({}, { locale })
                }}</span>
                <span class="text-base text-muted-foreground">{{ form.placement }}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 md:px-6 pb-4 space-y-4">
            <!-- Placement Selector -->
            <div class="space-y-2">
              <Label class="text-sm font-medium text-foreground">{{
                texts_placement_label({}, { locale })
              }}</Label>
              <Select v-model="form.placement">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="texts_select_placement_placeholder({}, { locale })" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Front">{{ texts_side_front({}, { locale }) }}</SelectItem>
                  <SelectItem value="Back">{{ texts_side_back({}, { locale }) }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Width and Height Inputs -->
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-2">
                <Label class="text-sm font-medium text-foreground">{{
                  texts_width_label({}, { locale })
                }}</Label>
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
                    >{{ texts_unit_cm({}, { locale }) }}</span
                  >
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium text-foreground">{{
                  texts_height_label({}, { locale })
                }}</Label>
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
                    >{{ texts_unit_cm({}, { locale }) }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Angle Slider -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium text-foreground">{{
                  texts_angle_label({}, { locale })
                }}</Label>
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
