<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
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
  import type { Palette } from '@/composables/useColorActions'
  import type { CustomLogo } from '@/services/logos/types'
  import type { LogoColor } from '@/services/types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useColorClipboard } from '@/composables/useColorClipboard'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { stripCsvExtension } from '@/lib/utils'
  import {
    color_shuffle_design_colors,
    color_shuffle_heading_1,
    color_shuffle_text_1,
    colors_separator_or,
    colors_choose_from_locker,
    colors_extracted_from_logo,
    colors_extracted_from_design,
    colors_use_original_colors,
    colors_copy,
    colors_paste,
    colors_custom_color_groups,
    nav_color,
    logos_shuffle_colors
  } from '@/paraglide/messages'
  import { storeToRefs } from 'pinia'
  import { Plus, X } from 'lucide-vue-next'
  // no emits

  // Store (kept in case we want to wire real data later)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()
  const {
    effectiveSvgGroups,
    effectiveSvgGroupsInteractive,
    effectiveSvgGroupsCustom,
    effectiveProductId
  } = useEffectiveSelectors()
  const history = useHistoryStore()
  const { clipboardColor, copyColor } = useColorClipboard()
  const lockerRoomStore = useLockerRoomStore()
  const { lockerRoomsWithColors } = storeToRefs(lockerRoomStore)
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)

  // Parse locker rooms response into usable structure
  /** Raw room from API may have folders as string[] or array of objects */
  type RoomWithFolders = { id: number; room_name?: string; folders?: unknown[] }
  /** Parsed folder shape (folder_name/folderName, color string or array) */
  type ParsedFolder = { folder_name?: string; folderName?: string; color?: string | unknown[] }
  /** Raw color item from locker API */
  type RawColor = { name?: string; value?: string; hex?: string }

  const parsedLockerRooms = computed(() => {
    const raw = lockerRoomsWithColors?.value || []
    return raw.map((room: RoomWithFolders) => {
      const foldersRaw = room.folders || []
      const folders = foldersRaw.map((f: unknown) => {
        // folder may be a JSON string or object
        let parsed: ParsedFolder
        if (typeof f === 'string') {
          try {
            parsed = JSON.parse(f) as ParsedFolder
          } catch {
            parsed = { folder_name: String(f), color: '[]' }
          }
        } else if (typeof f === 'object' && f !== null) {
          parsed = f as ParsedFolder
        } else {
          parsed = { folder_name: String(f), color: '[]' }
        }

        // parsed.color may be a JSON string or already array
        let colorsArr: RawColor[] = []
        if (parsed && parsed.color !== undefined) {
          if (typeof parsed.color === 'string') {
            try {
              colorsArr = JSON.parse(parsed.color) as RawColor[]
            } catch {
              colorsArr = []
            }
          } else if (Array.isArray(parsed.color)) {
            colorsArr = parsed.color as RawColor[]
          }
        }

        const colors: OutputColor[] = colorsArr.map((c: RawColor, idx: number) => ({
          position: idx,
          name: c.name || '',
          value: c.value || c.hex || ''
        }))

        return {
          folder_name: stripCsvExtension(parsed.folder_name || parsed.folderName || 'Folder'),
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
      name: stripCsvExtension(colorGroup.file_name),
      colors: colorGroup.json_data
    }))
  })

  // Per-group palette from API only. When absent, the template uses computedPalettes (one tab per color file).
  // Merging all product.colors into one list duplicated swatches (~5×) and collapsed tabs to a single trigger.
  function getSvgGroupColors(svg_group: string): unknown | false {
    const container = productsStore.activeProductDetails?.svg_group_color_container as
      | Record<string, unknown>
      | undefined
    if (svg_group && container && container[svg_group]) {
      return container[svg_group]
    }
    return false
  }
  function getCustomeLogos(): CustomLogo[] {
    const logos =
      customizationStore.customization?.custom_logos[productsStore.activeProductDetails?.id || '']
    if (logos && Array.isArray(logos)) {
      return logos as CustomLogo[]
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
    const rawGroupId = e['group_id']
    const id =
      typeof rawGroupId === 'number'
        ? rawGroupId
        : typeof rawGroupId === 'string' && rawGroupId !== ''
          ? Number(rawGroupId) || 0
          : 0
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
        (logo.logo_colors ?? []).map((color: LogoColor, index: number) => {
          if (Array.isArray(color)) {
            const r = color[0] ?? 0
            const g = color[1] ?? 0
            const b = color[2] ?? 0
            return {
              name: logo.name_of_placement || `Logo Color ${index + 1}`,
              value: `rgb(${r}, ${g}, ${b})`,
              position: index
            } as OutputColor
          }
          return {
            name: color.name ?? logo.name_of_placement ?? `Logo Color ${index + 1}`,
            value: color.hex ?? '',
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
    const initialGroups = productsStore.initialSvgGroups ?? []
    if (initialGroups.length === 0 || !customizationStore.customization) return

    const seen = new Set<string>()
    const uniqueByColor = initialGroups.filter(g => {
      const c = (g.color ?? '').trim().toLowerCase()
      if (!c || seen.has(c)) return false
      seen.add(c)
      return true
    })
    const shuffled = [...uniqueByColor].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 4)

    const defaultColors: Array<{
      color: string | null
      pantone: string | null
      name: string | null
    }> = picked.map(g => ({
      color: g.color ?? null,
      pantone: g.pantone ?? null,
      name: g.name ?? null
    }))
    while (defaultColors.length < 4) {
      defaultColors.push({ color: null, pantone: null, name: null })
    }
    customizationStore.customization.default_colors = defaultColors.slice(0, 4)
    customizationStore.customization.shuffle_color_number = Math.floor(Math.random() * 24) + 1
    customizationStore.customization.group_colors = {}
    workflowStore.setDefaultColorsSource('design')
    workflowStore.setActiveLogoId(null)
    customizationStore.pushHistoryState('Shuffle design colors')
  }

  /** Shuffle current extracted logo colors by reordering default_colors (shared with logo shuffle). */
  function shuffleExtractedColorsAmongSvgParts() {
    customizationStore.shuffleDefaultColors('Shuffle extracted colors')
  }

  function useOriginalColors() {
    const snapshot = workflowStore.getAndClearGroupColorsBeforeLogoApply()
    if (customizationStore.customization) {
      customizationStore.customization.group_colors = snapshot ? { ...snapshot } : {}
      customizationStore.clearDefaultColors()
      customizationStore.pushHistoryState('Use original colors')
    }
    workflowStore.setDefaultColorsSource(null)
    workflowStore.setActiveColorAccordionIndex(null)
    editingDefaultColorIndex.value = null
  }

  // Shuffle is only relevant when product has SVG parts (colorable groups)
  const hasSvgParts = computed(() => (effectiveSvgGroupsInteractive.value?.length ?? 0) > 0)

  // Show applied logo colors block only when product has at least one custom logo
  const hasCustomLogos = computed(() => getCustomeLogos().length > 0)

  // When user removes all logos, clear default_colors and group_colors in one go
  watch(
    hasCustomLogos,
    has => {
      if (!has) {
        customizationStore.clearLogoColorsAndApplied()
        workflowStore.setDefaultColorsSource(null)
        if (workflowStore.activeColorAccordionIndex === 0) {
          workflowStore.setActiveColorAccordionIndex(null)
        }
        editingDefaultColorIndex.value = null
      }
    },
    { immediate: false }
  )

  // Applied logo colors (default_colors) – shown when hasCustomLogos; add/remove only touch default_colors
  const appliedLogoColors = computed(() => {
    const dc = customizationStore.customization?.default_colors || []
    const arr: Array<{
      index: number
      color: string
      pantone: string | null
      name: string | null
    }> = []
    for (let i = 0; i < 4; i++) {
      const slot = dc[i]
      if (slot?.color)
        arr.push({
          index: i,
          color: slot.color,
          pantone: slot.pantone ?? null,
          name: slot.name ?? null
        })
    }
    return arr
  })
  const canAddMore = computed(() => appliedLogoColors.value.length < 4)
  const firstEmptySlotIndex = computed(() => {
    const dc = customizationStore.customization?.default_colors || []
    for (let i = 0; i < 4; i++) {
      if (!dc[i]?.color) return i
    }
    return 4
  })

  const palettesForAddColor = computed(() => {
    const first = effectiveSvgGroupsInteractive.value?.[0]
    const palette = first ? getSvgGroupPalette(first.id) : null
    if (palette) return [palette] as Palette[]
    return computedPalettes.value || []
  })

  // When opening palette from swatch click we edit this slot; when from plus we add (use first empty)
  const editingDefaultColorIndex = ref<number | null>(null)

  function addColorFromPicker(color: OutputColor) {
    const idx = editingDefaultColorIndex.value ?? firstEmptySlotIndex.value
    if (idx >= 4) return
    const pantone = (color as { pantone?: string }).pantone ?? null
    customizationStore.setDefaultColorAt(idx, {
      color: color.value,
      pantone,
      name: color.name ?? null
    })
    editingDefaultColorIndex.value = null
    workflowStore.setActiveColorAccordionIndex(null)
  }

  function openPaletteForSlot(slotIndex: number | null) {
    // Toggle close when clicking the same element that opened the picker
    if (
      workflowStore.activeColorAccordionIndex === 0 &&
      editingDefaultColorIndex.value === slotIndex
    ) {
      workflowStore.setActiveColorAccordionIndex(null)
      editingDefaultColorIndex.value = null
      return
    }
    editingDefaultColorIndex.value = slotIndex
    workflowStore.setActiveColorAccordionIndex(0)
  }

  function removeAppliedColorAt(index: number) {
    customizationStore.removeDefaultColorAt(index)
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
      editingDefaultColorIndex.value = null
    }
  }

  // Label for extracted colors: from logo vs from design (shuffle)
  const extractedSectionLabel = computed(() =>
    workflowStore.defaultColorsSource === 'design'
      ? colors_extracted_from_design({}, { locale: profileStore.currentLocale })
      : colors_extracted_from_logo({}, { locale: profileStore.currentLocale })
  )

  // Choose Color accordion item only when user has opened it (clicked + or swatch)
  const showChooseColorAccordion = computed(
    () => appliedLogoColors.value.length > 0 && workflowStore.activeColorAccordionIndex === 0
  )

  /** Hex (or rgb) for the slot being edited — drives palette swatch highlight to match extracted swatch */
  const selectedColorForExtractedPalette = computed(() => {
    const idx = editingDefaultColorIndex.value
    if (idx === null) return undefined
    return customizationStore.customization?.default_colors?.[idx]?.color ?? undefined
  })
  // Design shuffle with a single SVG group only fills one default slot — hide the duplicate "extracted" strip + picker chrome.
  const showAppliedExtractedColorsBlock = computed(() => {
    if (appliedLogoColors.value.length === 0) return false
    const oneGroup = (effectiveSvgGroupsInteractive.value?.length ?? 0) === 1
    const oneSwatch = appliedLogoColors.value.length === 1
    if (workflowStore.defaultColorsSource === 'design' && oneGroup && oneSwatch) return false
    return true
  })

  watch(effectiveProductId, (id, prev) => {
    if (prev == null || id === prev) return
    selectedGradientIndex.value = {}
    workflowStore.setDefaultColorsSource(null)
    workflowStore.setActiveColorAccordionIndex(null)
    editingDefaultColorIndex.value = null
  })

  // Breadcrumb logic for color selection
  const headerConfig = computed(() => ({
    breadcrumbs: [{ label: nav_color({}, { locale: profileStore.currentLocale }) }]
  }))
  void headerConfig.value
</script>

<template>
  <!-- Content -->
  <div class="flex flex-col gap-4 md:gap-6">
    <!-- Lucky / Locker actions (first) -->
    <div class="flex flex-col gap-3">
      <div class="rounded-xl border border-border bg-primary/10 p-4 mx-6">
        <div class="flex items-start gap-3">
          <i-flex-flat-paint-palette class="size-10 text-primary" />
          <div class="flex-1">
            <div class="text-base font-semibold text-foreground font-brand">
              {{ color_shuffle_heading_1({}, { locale: profileStore.currentLocale }) }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ color_shuffle_text_1({}, { locale: profileStore.currentLocale }) }}
            </div>
          </div>
        </div>
        <div class="mt-4">
          <Button class="w-full" variant="default" :disabled="!hasSvgParts" @click="shuffleAll">{{
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

    <!-- Applied logo colors – only when logo colors have been applied; after Lucky/Locker -->
    <div v-if="showAppliedExtractedColorsBlock" class="px-4 md:px-6 flex flex-col gap-2">
      <p class="text-base font-semibold text-foreground">
        {{ extractedSectionLabel }}
      </p>
      <div
        class="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
      >
        <!-- Swatches stay left; never centered as a group on narrow viewports -->
        <div class="flex flex-wrap items-center gap-2 self-start">
          <div
            v-for="item in appliedLogoColors"
            :key="item.index"
            class="relative group/swatch shrink-0"
          >
            <button
              type="button"
              class="rounded-full p-0 border-0 bg-transparent cursor-pointer !size-7.5"
              :class="{ 'outline-none ring-2 ring-ring ': editingDefaultColorIndex === item.index }"
              aria-label="Change color"
              @click="openPaletteForSlot(item.index)"
            >
              <ColorSelector
                :color="item.color"
                :size="'sm'"
                class="rounded-full pointer-events-none"
                :disabled="true"
              />
            </button>
            <button
              type="button"
              class="absolute -top-1 -right-1 size-4 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity"
              :aria-label="'Remove color'"
              @click.stop="removeAppliedColorAt(item.index)"
            >
              <X class="size-2.5" />
            </button>
          </div>
          <button
            v-if="canAddMore"
            type="button"
            class="!size-7.5 rounded-full border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground shrink-0"
            aria-label="Add color"
            @click="openPaletteForSlot(null)"
          >
            <Plus class="size-4" />
          </button>
        </div>
        <!-- Mobile: full-width row under swatches, two equal columns; sm+: inline end, same as desktop -->
        <div
          class="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            class="min-h-9 w-full justify-center sm:w-auto"
            :disabled="!hasSvgParts || appliedLogoColors.length === 0"
            @click="shuffleExtractedColorsAmongSvgParts"
          >
            {{ logos_shuffle_colors({}, { locale: profileStore.currentLocale }) }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="min-h-9 w-full justify-center sm:w-auto"
            @click="useOriginalColors"
          >
            {{ colors_use_original_colors({}, { locale: profileStore.currentLocale }) }}
          </Button>
        </div>
      </div>
      <!-- Headless palette: appears when user clicks + or a swatch; no header, same block as extracted colors -->
      <div v-if="showChooseColorAccordion" class="pt-2">
        <PaletteColorSelector
          v-if="palettesForAddColor.length"
          :palettes="palettesForAddColor"
          :custom-palettes="getCustomLogosPalettes()"
          :selected-color="selectedColorForExtractedPalette"
          :allow-custom-color="productsStore.activeProductDetails?.is_custom_color_allowed"
          :has-svg-colors="
            effectiveSvgGroupsInteractive[0]
              ? !!getSvgGroupColors(effectiveSvgGroupsInteractive[0].id)
              : false
          "
          :parsed-locker-rooms="parsedLockerRooms"
          @color-select="addColorFromPicker"
        />
      </div>
    </div>

    <!-- SVG group color slots -->
    <Accordion
      type="single"
      collapsible
      :model-value="accordionValue"
      @update:model-value="handleAccordionChange"
    >
      <AccordionItem
        v-for="(svgGroup, idx) in effectiveSvgGroupsInteractive"
        :key="svgGroup.id"
        :value="String(idx + 1)"
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
              (color: OutputColor) =>
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
