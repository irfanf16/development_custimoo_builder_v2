<script setup lang="ts">
  import { ref, computed, type Ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
  import GradientTabs from './GradientTabs.vue'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import type { GradientColor, OutputColor } from '@/services/products/types'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useColorActions } from '@/composables/useColorActions'
  import type { Palette } from '@/composables/useColorActions'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useColorClipboard } from '@/composables/useColorClipboard'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import {
    color_shuffle_design_colors,
    color_shuffle_heading_1,
    color_shuffle_heading_2,
    color_shuffle_heading_3,
    color_shuffle_heading_4,
    color_shuffle_text_1,
    color_shuffle_text_2,
    color_shuffle_text_3,
    color_shuffle_text_4,
    colors_separator_or,
    colors_choose_from_locker,
    colors_copy,
    colors_paste,
    colors_custom_color_groups,
    nav_color
  } from '@/paraglide/messages'
  import { storeToRefs } from 'pinia'
  // no emits

  // Store (kept in case we want to wire real data later)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()
  const { effectiveSvgGroups, effectiveSvgGroupsInteractive, effectiveSvgGroupsCustom } =
    useEffectiveSelectors()
  const history = useHistoryStore()
  const { shuffleColors } = useColorActions()
  const { clipboardColor, copyColor } = useColorClipboard()
  const lockerRoomStore = useLockerRoomStore()
  const { lockerRoomsWithColors } = storeToRefs(lockerRoomStore)
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)

  // Parse locker rooms response into usable structure
  const parsedLockerRooms = computed(() => {
    const raw = lockerRoomsWithColors?.value || []
    return raw.map(room => {
      const foldersRaw = (room as any).folders || []
      const folders = foldersRaw.map((f: any) => {
        // folder may be a JSON string or object
        let parsed: any = f
        if (typeof f === 'string') {
          try {
            parsed = JSON.parse(f)
          } catch {
            // not JSON, treat as folder name
            parsed = { folder_name: String(f), color: '[]' }
          }
        }

        // parsed.color may be a JSON string or already array
        let colorsArr: any[] = []
        if (parsed && parsed.color) {
          if (typeof parsed.color === 'string') {
            try {
              colorsArr = JSON.parse(parsed.color)
            } catch {
              colorsArr = []
            }
          } else if (Array.isArray(parsed.color)) {
            colorsArr = parsed.color
          }
        }

        const colors: OutputColor[] = colorsArr.map((c: any, idx: number) => ({
          position: idx,
          name: c.name || '',
          value: c.value || c.hex || ''
        }))

        return {
          folder_name: parsed.folder_name || parsed.folderName || 'Folder',
          colors
        }
      })

      return {
        id: room.id,
        room_name: room.room_name || `Room ${room.id}`,
        folders
      }
    })
  })

  const computedPalettes = computed<Palette[] | undefined>(() => {
    return productsStore.activeProductDetails?.colors.map(colorGroup => ({
      id: colorGroup.id,
      name: colorGroup.file_name,
      colors: colorGroup.json_data
    }))
  })

  // (svg group container will be read directly by getSvgGroupColors)
  function getSvgGroupColors(svg_group: string): unknown | false {
    const container = productsStore.activeProductDetails?.svg_group_color_container as
      | Record<string, unknown>
      | undefined
    if (svg_group && container && container[svg_group]) {
      return container[svg_group]
    }
    return false
  }
  function getCustomeLogos(): any[] {
    const logos =
      customizationStore.customization?.custom_logos[productsStore.activeProductDetails?.id || '']
    if (logos && Array.isArray(logos)) {
      return logos as any[]
    }
    return []
  }
  // Small mapper to convert a raw svg-group entry into a Palette shape expected by PaletteColorSelector
  function getSvgGroupPalette(svg_group: string): Palette | false {
    const entry = getSvgGroupColors(svg_group)
    if (!entry) return false
    const e = entry as Record<string, unknown>
    const paletteColors = (e['colors'] ?? e['json_data'] ?? e['color_list']) as
      | unknown[]
      | undefined
    const name = (e['name'] ?? e['file_name'] ?? svg_group) as string
    const id = typeof e['group_id'] ? (e['group_id'] as number) : 0
    return { id, name, colors: (paletteColors ?? []) as unknown as OutputColor[] }
  }
  // Map custom logos into palettes for PaletteColorSelector
  function getCustomLogosPalettes(): Palette[] {
    const customLogosFrom = getCustomeLogos()
    if (!customLogosFrom || customLogosFrom.length === 0) return []

    // Group logos by name_of_placement
    const logosByPlacement = customLogosFrom.reduce<Record<string, typeof customLogosFrom>>(
      (acc, logo) => {
        const groupName = logo.name_of_placement || 'Custom'
        if (!acc[groupName]) acc[groupName] = []
        acc[groupName].push(logo)
        return acc
      },
      {}
    )

    // Convert each group into a Palette
    const palettes: Palette[] = Object.entries(logosByPlacement).map(([placementName, logos]) => {
      const colors: OutputColor[] = logos.flatMap(logo =>
        (logo.logo_colors ?? []).map((colorArray: number[], index: number) => {
          const r = colorArray[0] ?? 0
          const g = colorArray[1] ?? 0
          const b = colorArray[2] ?? 0
          return {
            name: logo.name_of_placement || `Logo Color ${index + 1}`,
            value: `rgb(${r}, ${g}, ${b})`,
            position: index
          } as OutputColor
        })
      )

      return {
        id: logos[0]?.id ?? 0,
        name: `${placementName} Logo`,
        colors
      }
    })

    return palettes
  }

  // Track selected gradient index for each group
  const selectedGradientIndex = ref<Record<string, number>>({})

  const shuffleColorsHeadingIndex: Ref<0 | 1 | 2 | 3> = ref(
    Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
  )
  const shuffleColorsTextIndex: Ref<0 | 1 | 2 | 3> = ref(
    Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
  )

  // Generate gradient CSS string from gradient_colors array
  function gradientColorString(gradientColors: GradientColor[]): string {
    if (!gradientColors || gradientColors.length === 0) return ''
    let cssColor = 'linear-gradient(90deg'
    gradientColors.forEach(gradientColor => {
      cssColor += ',' + gradientColor.color
    })
    cssColor += ')'
    return cssColor
  }

  // Get the current gradient index for a group (defaults to 0 if not set)
  function getGradientIndex(groupId: string): number {
    return selectedGradientIndex.value[groupId] ?? 0
  }

  // Set the gradient index for a group
  function setGradientIndex(groupId: string, index: number) {
    selectedGradientIndex.value[groupId] = index
  }

  const shuffleColorsHeadings = computed(() => {
    return [
      color_shuffle_heading_1({}, { locale: profileStore.currentLocale }),
      color_shuffle_heading_2({}, { locale: profileStore.currentLocale }),
      color_shuffle_heading_3({}, { locale: profileStore.currentLocale }),
      color_shuffle_heading_4({}, { locale: profileStore.currentLocale })
    ]
  })

  const shuffleColorsTexts = computed(() => {
    return [
      color_shuffle_text_1({}, { locale: profileStore.currentLocale }),
      color_shuffle_text_2({}, { locale: profileStore.currentLocale }),
      color_shuffle_text_3({}, { locale: profileStore.currentLocale }),
      color_shuffle_text_4({}, { locale: profileStore.currentLocale })
    ]
  })

  function setGroupColor(colorGroupId: string, color: OutputColor, gradientIndex?: number) {
    const prevRaw = customizationStore.customization?.group_colors?.[colorGroupId]
    const prevColor = prevRaw
      ? { name: prevRaw.name || '', value: prevRaw.color || '', position: 0 }
      : null

    // If this is a gradient color, get the previous gradient color
    let prevGradientColor = null
    if (gradientIndex !== undefined && prevRaw?.gradient_colors?.[gradientIndex]) {
      const gradColor = prevRaw.gradient_colors[gradientIndex]
      prevGradientColor = { name: gradColor.name || '', value: gradColor.color || '', position: 0 }
    }

    history.execute('color.set-group', {
      groupId: colorGroupId,
      prevColor: gradientIndex !== undefined ? prevGradientColor : prevColor,
      nextColor: color,
      gradientIndex
    })
  }

  function copyFrom(groupId: string) {
    // Find the color value for the given groupId from effectiveSvgGroups
    const group = effectiveSvgGroups.value?.find(g => g.id === groupId)
    if (!group) return

    // If it's a gradient color, copy the selected gradient color
    if (group.gradient_colors) {
      const gradientIndex = getGradientIndex(groupId)
      const gradientColor = group.gradient_colors[gradientIndex]
      copyColor(gradientColor?.color ?? null)
    } else {
      copyColor(group.color ?? null)
    }
  }

  function pasteTo(groupId: string) {
    if (!clipboardColor.value) return

    const group = effectiveSvgGroups.value?.find(g => g.id === groupId)
    if (!group) return

    // If it's a gradient color, paste to the selected gradient index
    if (group.gradient_colors) {
      const gradientIndex = getGradientIndex(groupId)
      setGroupColor(groupId, { name: '', value: clipboardColor.value, position: 0 }, gradientIndex)
    } else {
      setGroupColor(groupId, { name: '', value: clipboardColor.value, position: 0 })
    }
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

  // Accordion control - open the accordion item corresponding to activeColorAccordionIndex
  const accordionValue = computed(() => {
    if (workflowStore.activeColorAccordionIndex !== null) {
      return String(workflowStore.activeColorAccordionIndex)
    }
    return undefined
  })

  // When accordion value changes, update the store (or clear if closed)
  function handleAccordionChange(value: string | string[] | undefined) {
    // Handle single string value (type="single")
    if (typeof value === 'string') {
      workflowStore.setActiveColorAccordionIndex(Number(value))
    } else {
      workflowStore.setActiveColorAccordionIndex(null)
    }
  }

  // Breadcrumb logic for color selection
  const headerConfig = computed(() => ({
    breadcrumbs: [{ label: nav_color({}, { locale: profileStore.currentLocale }) }]
  }))
  void headerConfig.value
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
            color_shuffle_design_colors({}, { locale: profileStore.currentLocale })
          }}</Button>
        </div>
      </div>
      <div class="flex flex-col gap-3 px-4 md:px-6">
        <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
          <div class="flex-1 h-px bg-border" />
          <span class="px-3 text-foreground font-medium">{{
            colors_separator_or({}, { locale: profileStore.currentLocale })
          }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        <div>
          <Button
            class="w-full bg-card"
            variant="default"
            :disabled="!isAuthenticated"
            @click="lockerRoomStore.setOpenLockerWithIntent('colours')"
          >
            {{ colors_choose_from_locker({}, { locale: profileStore.currentLocale }) }}
          </Button>
        </div>
      </div>
    </div>
    <!-- Color slots (interactive groups only) -->
    <Accordion
      type="single"
      collapsible
      :model-value="accordionValue"
      @update:model-value="handleAccordionChange"
    >
      <AccordionItem
        v-for="(svgGroup, idx) in effectiveSvgGroupsInteractive"
        :key="svgGroup.id"
        :value="String(idx)"
        class="px-4 md:px-6 max-w-full"
      >
        <AccordionTrigger
          class="w-full overflow-hidden items-center no-underline hover:no-underline"
        >
          <div class="flex justify-between gap-2 md:gap-3 w-full group overflow-hidden">
            <div
              class="flex items-center gap-2 md:gap-3 shrink overflow-hidden md:overflow-visible md:group-hover:overflow-hidden"
            >
              <!-- Show gradient color if available, otherwise show solid color -->
              <ColorSelector
                class="shrink-0"
                :color="
                  svgGroup.gradient_colors
                    ? gradientColorString(svgGroup.gradient_colors)
                    : svgGroup.color
                "
                :disabled="true"
                :size="'sm'"
              />
              <span
                class="text-base font-semibold whitespace-nowrap text-ellipsis overflow-hidden shrink"
                >{{ svgGroup.id }}</span
              >
              <span
                class="text-muted-foreground leading-normal capitalize font-normal whitespace-nowrap text-ellipsis overflow-hidden shrink-999"
              >
                <template v-if="svgGroup.gradient_colors">
                  <template
                    v-for="(gradientColor, gIndex) in svgGroup.gradient_colors"
                    :key="gIndex"
                  >
                    {{ gradientColor.pantone }} {{ gradientColor.name }}
                    <template v-if="gIndex < svgGroup.gradient_colors.length - 1"> / </template>
                  </template>
                </template>
                <template v-else> {{ svgGroup.pantone }} {{ svgGroup.name }} </template>
              </span>
            </div>
            <div
              class="flex items-center shrink-0 gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-hover:no-underline md:transition-opacity"
            >
              <Button size="sm" variant="default" @click.stop="copyFrom(svgGroup.id)"
                ><span>{{ colors_copy({}, { locale: profileStore.currentLocale }) }}</span></Button
              >
              <Button
                size="sm"
                variant="default"
                :disabled="!clipboardColor"
                @click.stop="pasteTo(svgGroup.id)"
                ><span>{{ colors_paste({}, { locale: profileStore.currentLocale }) }}</span>
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <!-- Gradient color selection tabs -->
          <div v-if="svgGroup.gradient_colors" class="mb-4">
            <GradientTabs
              :gradient-colors="svgGroup.gradient_colors"
              :model-value="getGradientIndex(svgGroup.id)"
              @update:model-value="index => setGradientIndex(svgGroup.id, index)"
            />
          </div>
          <PaletteColorSelector
            v-if="(computedPalettes && computedPalettes.length) || getSvgGroupPalette(svgGroup.id)"
            :palettes="
              getSvgGroupPalette(svgGroup.id)
                ? [getSvgGroupPalette(svgGroup.id) as Palette]
                : computedPalettes || []
            "
            :custom-palettes="getCustomLogosPalettes() ? getCustomLogosPalettes() : []"
            :selected-color="
              svgGroup.gradient_colors
                ? svgGroup.gradient_colors[getGradientIndex(svgGroup.id)]?.color
                : svgGroup.color
            "
            :allow-custom-color="productsStore.activeProductDetails?.is_custom_color_allowed"
            :has-svg-colors="getSvgGroupColors(svgGroup.id) ? true : false"
            :parsed-locker-rooms="parsedLockerRooms"
            @color-select="
              color =>
                setGroupColor(
                  svgGroup.id,
                  color,
                  svgGroup.gradient_colors ? getGradientIndex(svgGroup.id) : undefined
                )
            "
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <!-- Custom color groups (readonly, underneath interactive groups) -->
    <div
      v-if="effectiveSvgGroupsCustom.length > 0"
      class="flex flex-col gap-3 px-4 md:px-6 pt-4 border-t border-border"
    >
      <div class="text-sm font-medium text-muted-foreground">
        {{ colors_custom_color_groups({}, { locale: profileStore.currentLocale }) }}
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="customGroup in effectiveSvgGroupsCustom"
          :key="customGroup.id"
          class="flex items-center gap-2 md:gap-3 py-2"
        >
          <ColorSelector
            class="shrink-0"
            :color="customGroup.color"
            :disabled="true"
            :size="'sm'"
          />
          <span class="text-base font-semibold text-foreground shrink-0">{{
            customGroup.name
          }}</span>
          <span class="text-muted-foreground text-sm shrink-0">
            {{ customGroup.pantone || '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
