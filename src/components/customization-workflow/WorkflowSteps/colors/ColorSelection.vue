<script setup lang="ts">
  import { ref, computed, type Ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import type { OutputColor } from '@/services/products/types'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useColorActions } from '@/composables/useColorActions'
  import type { Palette } from '@/composables/useColorActions'
  import { useWorkflowHeaderConfig } from '@/composables/useWorkflowHeaderConfig'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import {
    color_shuffle_design_colors,
    color_shuffle_heading_1,
    color_shuffle_heading_2,
    color_shuffle_heading_3,
    color_shuffle_heading_4,
    color_shuffle_text_1,
    color_shuffle_text_2,
    color_shuffle_text_3,
    color_shuffle_text_4
  } from '@/paraglide/messages'
  // no emits

  // Store (kept in case we want to wire real data later)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const localeStore = useLocaleStore()
  const { effectiveSvgGroups } = useEffectiveSelectors()
  const history = useHistoryStore()
  const { shuffleColors } = useColorActions()

  const computedPalettes = computed<Palette[] | undefined>(() => {
    return productsStore.activeProductDetails?.namecolors.map(colorGroup => ({
      id: colorGroup.id,
      name: colorGroup.file_name,
      colors: colorGroup.json_data
    }))
  })

  // Local clipboard for copy/paste between slots
  const clipboardHex = ref<string | null>(null)

  const shuffleColorsHeadingIndex: Ref<0 | 1 | 2 | 3> = ref(
    Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
  )
  const shuffleColorsTextIndex: Ref<0 | 1 | 2 | 3> = ref(
    Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
  )

  const shuffleColorsHeadings = computed(() => {
    return [
      color_shuffle_heading_1({}, { locale: localeStore.currentLocale }),
      color_shuffle_heading_2({}, { locale: localeStore.currentLocale }),
      color_shuffle_heading_3({}, { locale: localeStore.currentLocale }),
      color_shuffle_heading_4({}, { locale: localeStore.currentLocale })
    ]
  })

  const shuffleColorsTexts = computed(() => {
    return [
      color_shuffle_text_1({}, { locale: localeStore.currentLocale }),
      color_shuffle_text_2({}, { locale: localeStore.currentLocale }),
      color_shuffle_text_3({}, { locale: localeStore.currentLocale }),
      color_shuffle_text_4({}, { locale: localeStore.currentLocale })
    ]
  })

  function setGroupColor(colorGroupId: string, color: OutputColor) {
    const prevRaw = customizationStore.customization?.group_colors?.[colorGroupId]
    const prevColor = prevRaw
      ? { name: prevRaw.name || '', value: prevRaw.color || '', position: 0 }
      : null
    history.execute('color.set-group', {
      groupId: colorGroupId,
      prevColor,
      nextColor: color
    })
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
    // Assign a random number from 0 to 3 that is not the same as the current value
    function getRandomIndexExcluding(current: number): 0 | 1 | 2 | 3 {
      const options = [0, 1, 2, 3].filter(i => i !== current)
      return options[Math.floor(Math.random() * options.length)] as 0 | 1 | 2 | 3
    }
    shuffleColorsHeadingIndex.value = getRandomIndexExcluding(shuffleColorsHeadingIndex.value)
    shuffleColorsTextIndex.value = getRandomIndexExcluding(shuffleColorsTextIndex.value)
    shuffleColors(computedPalettes.value?.[0]?.id)
  }

  // Breadcrumb logic for color selection
  useWorkflowHeaderConfig({ breadcrumbs: [{ label: 'Color' }] })
</script>

<template>
  <!-- Content -->
  <div class="flex flex-col gap-4 md:gap-6">
    <!-- Lucky / Locker actions -->
    <div class="flex flex-col gap-3">
      <div class="rounded-xl border border-border bg-primary/10 p-4 mx-6">
        <div class="flex items-start gap-3">
          <i-flex-flat-paint-palette class="size-10 text-primary" />
          <div class="flex-1">
            <Transition
              name="fade-slide"
              mode="out-in"
              type="animation"
              :duration="{ enter: 300, leave: 300 }"
            >
              <div
                :key="shuffleColorsHeadingIndex"
                class="text-base font-semibold text-foreground font-brand"
              >
                {{ shuffleColorsHeadings[shuffleColorsHeadingIndex] }}
              </div>
            </Transition>
            <Transition
              name="fade-slide"
              mode="out-in"
              type="animation"
              :duration="{ enter: 300, leave: 300 }"
            >
              <div :key="shuffleColorsTextIndex" class="text-sm text-muted-foreground">
                {{ shuffleColorsTexts[shuffleColorsTextIndex] }}
              </div>
            </Transition>
          </div>
        </div>
        <div class="mt-4">
          <Button class="w-full" variant="default" @click="shuffleAll">{{
            color_shuffle_design_colors({}, { locale: localeStore.currentLocale })
          }}</Button>
        </div>
      </div>
      <div class="flex flex-col gap-3 px-4 md:px-6">
        <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
          <div class="flex-1 h-px bg-border" />
          <span class="px-3 text-foreground font-medium">or</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        <div>
          <Button class="w-full bg-card" variant="default">Choose from locker</Button>
        </div>
      </div>
    </div>

    <!-- Color slots -->
    <Accordion type="single" collapsible>
      <AccordionItem
        v-for="(svgGroup, idx) in effectiveSvgGroups"
        :key="svgGroup.id"
        :value="String(idx)"
        class="px-4 md:px-6"
      >
        <AccordionTrigger>
          <div class="flex justify-between gap-3 w-full group">
            <div class="flex items-center gap-3 w-full">
              <ColorSelector :color="svgGroup.color" :disabled="true" :size="'sm'" />
              <!-- <span
                class="inline-block size-7 rounded-full border border-border"
                :style="{ background: svgGroup.color ?? '' }"
              /> -->
              <span class="text-base">{{ svgGroup.id }}</span>
            </div>
            <div
              class="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-hover:no-underline transition-opacity"
            >
              <Button size="sm" variant="default" @click.stop="copyFrom(svgGroup.id)"
                ><span class="no-underline">Copy</span></Button
              >
              <Button
                size="sm"
                variant="default"
                :disabled="!clipboardHex"
                @click.stop="pasteTo(svgGroup.id)"
                ><span class="no-underline">Paste</span>
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PaletteColorSelector
            v-if="computedPalettes"
            :palettes="computedPalettes"
            :selected-color="svgGroup.color"
            @color-select="color => setGroupColor(svgGroup.id, color)"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
