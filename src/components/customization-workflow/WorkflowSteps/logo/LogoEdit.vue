<script setup lang="ts">
  import { computed, watch, onMounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { AcceptableValue } from 'reka-ui'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { Button } from '@/components/ui/button'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
  import { ColorsPreview } from '@/components/ui/colors-preview'
  import ContentRemoveIcons from './ContentRemoveIcons.vue'
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectValue
  } from '@/components/ui/select'
  import type { OutputColor, OutputProductLogoTechnology } from '@/services/products/types'
  import type { CustomLogo } from '@/services/logos/types'
  import LogoCard from './LogoCard.vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import { useLogoActions, type BackgroundRemovalMode } from './useLogoActions'
  import { useLogos } from './useLogos'
  import { useLogoPlacements, type PlacementOption } from './useLogoPlacements'
  import { useLogoDimensions } from './useLogoDimensions'
  import { useLogoPosition } from './useLogoPosition'
  import { rgbArrayToHex, MAX_DECIMALS } from './useLogoUtils'
  import type { Palette } from '@/composables/useColorActions'
  import { Label } from '@/components/ui/label'
  import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
  import { Slider } from '@/components/ui/slider'
  import { LocateFixed, Pin } from 'lucide-vue-next'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useLogoUpload } from './useLogoUpload'
  import { useLogoAddAnotherUpload } from './useLogoAddAnotherUpload'
  import LogoUploadingSkeleton from './LogoUploadingSkeleton.vue'
  import AILogoGenerator from './AILogoGenerator.vue'
  import { generateAILogo } from '@/services/ai/ai-logo-generation'
  import { materializeAiLogoResult } from '@/services/ai/ai-logo-result'
  import { useAILogoMeta } from './useAILogoMeta'
  import { useAILogoLimit } from './useAILogoLimit'
  import { useAiLogoGenerationEnabled } from './useAiLogoGenerationEnabled'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { mergeLogoPreservePlacement } from './mergeLogoPreservePlacement'
  import {
    logos_logos_color,
    logos_add_logo,
    colors_separator_or,
    colors_choose_from_locker,
    logos_position_section_title,
    logos_placement_label,
    logos_select_placement_placeholder,
    logos_side_label,
    logos_side_front,
    logos_side_back,
    logos_height_label,
    logos_angle_label,
    logos_center_logo_button,
    logos_pin_logo_button,
    logos_unpin_logo_button,
    logos_remove_background_title,
    logos_remove_background_simple_title,
    logos_remove_background_simple_description,
    logos_remove_background_smart_title,
    logos_remove_background_smart_description,
    logos_applying,
    logos_apply,
    logos_recolor_logo,
    nav_color
  } from '@/paraglide/messages'
  import { usePricing } from '@/composables/usePricing'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { stripCsvExtension } from '@/lib/utils'
  import { hexToRgbObject } from '@/lib/utils'
  import type { LogoColor } from '@/services/types'

  interface Props {
    logoId: string
    logoIndex: number | null
  }

  const props = defineProps<Props>()

  // ===== STORES =====
  const workflowStore = useWorkflowStore()
  const historyStore = useHistoryStore()
  const logosStore = useLogosStore()
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
  const customizationStore = useCustomizationStore()
  const { showPricing } = usePricing()
  const companyStore = useCompanyStore()
  const lockerRoomStore = useLockerRoomStore()
  const { lockerRoomsWithColors } = storeToRefs(lockerRoomStore)
  const authStore = useAuthStore()
  const isLoggedIn = computed(() => authStore.isAuthenticated)
  const { fileInputRef, onClickUpload, doUpload } = useLogoUpload()
  void fileInputRef
  // ===== COMPOSABLES =====
  const { productKey, customLogos, getLogoById, getActiveLogoIndex } = useLogos()
  const {
    removeBackground,
    applyLogoColors,
    syncDefaultColorsFromLogoPalette,
    shuffleExtractedColorsForActiveLogo,
    useOriginalColorsAndProceed,
    recolorLogo,
    removeLogo,
    setActiveLogo
  } = useLogoActions()
  const {
    positionForm,
    currentWidth,
    previousPlacementOption,
    isSyncingAngle,
    rotationChangeStart,
    heightChangeStart,
    placementOptions,
    syncFormWithLogo,
    resolvePlacementByValue
  } = useLogoPlacements()

  // ===== COMPUTED =====
  const customLogo = computed(() => {
    if (props.logoIndex !== null && props.logoIndex >= 0) {
      return customLogos.value[props.logoIndex] ?? null
    }
    if (props.logoId) return getLogoById(props.logoId)
    return logosStore.activeLogo
  })

  const logoTechnologies = computed(() => {
    const technologies = productsStore.activeProductDetails?.logo_technologies
    if (!technologies) return []

    // logo_technologies is an object with keys being product_logo_setting_id
    // Get the current placement ID to look up the correct technologies
    const placementId = positionForm.placementOption?.placementId
    if (!placementId) return []

    // Look up technologies by placement ID (product_logo_setting_id)
    const technologiesForPlacement = technologies[placementId]
    return Array.isArray(technologiesForPlacement) ? technologiesForPlacement : []
  })

  const colorSwatches = computed(() =>
    (customLogo.value?.logo_colors || []).map((color: LogoColor) => {
      if (Array.isArray(color)) return rgbArrayToHex(color)
      const h = color.hex?.trim()
      if (!h) return ''
      return h.startsWith('#') ? h : `#${h}`
    })
  )

  // Get palettes from products store (logo recolor / fallback)
  const palettes = computed<Palette[]>(() => {
    return (
      productsStore.activeProductDetails?.namecolors.map(colorGroup => ({
        id: colorGroup.id,
        name: stripCsvExtension(colorGroup.file_name),
        colors: colorGroup.json_data
      })) || []
    )
  })

  /** Same source as Colors tab `computedPalettes` (product `colors` files). */
  const computedPalettesForColorsTab = computed<Palette[]>(() => {
    return (
      productsStore.activeProductDetails?.colors.map(colorGroup => ({
        id: colorGroup.id,
        name: colorGroup.file_name,
        colors: colorGroup.json_data
      })) || []
    )
  })

  const palettesForLogosColorPanel = computed<Palette[]>(() => {
    const fromColorsTab = computedPalettesForColorsTab.value
    if (fromColorsTab.length > 0) return fromColorsTab
    return palettes.value
  })

  const customLogosPalettesForLogosColorPanel = computed(() => getCustomLogosPalettes())

  type RoomWithFolders = { id: number; room_name?: string; folders?: unknown[] }
  type ParsedFolder = { folder_name?: string; folderName?: string; color?: string | unknown[] }
  type RawColor = { name?: string; value?: string; hex?: string }

  const parsedLockerRooms = computed(() => {
    const raw = lockerRoomsWithColors?.value || []
    return raw.map((room: RoomWithFolders) => {
      const foldersRaw = room.folders || []
      const folders = foldersRaw.map((f: unknown) => {
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

  function getCustomeLogosForPalette(): CustomLogo[] {
    const logos =
      customizationStore.customization?.custom_logos[productsStore.activeProductDetails?.id || '']
    if (logos && Array.isArray(logos)) {
      return logos as CustomLogo[]
    }
    return []
  }

  function getCustomLogosPalettes(): Palette[] {
    const customLogosFrom = getCustomeLogosForPalette()
    if (!customLogosFrom.length) return []

    const logosByPlacement = customLogosFrom.reduce<Record<string, CustomLogo[]>>((acc, logo) => {
      const groupName = logo.name_of_placement || 'Custom'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(logo)
      return acc
    }, {})

    return Object.entries(logosByPlacement).map(([placementName, logos]) => {
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
  }

  const logoDetectedPreviewStrings = computed(() =>
    (customLogo.value?.logo_colors || []).map((c: LogoColor) => {
      if (Array.isArray(c)) return `rgb(${c.join(',')})`
      return c.hex || 'rgba(0,0,0,0.12)'
    })
  )

  const accordionOpen = ref<string[]>([])
  /** Once per `logoId`, expand default control sections (upload ? placement ? edit). */
  const accordionDefaultsSeededForLogoId = ref<string | null>(null)
  const selectedLogoColorIndex = ref<number | null>(null)

  const logosColorPaletteSelectedHex = computed(() => {
    const i = selectedLogoColorIndex.value
    if (i === null || i < 0) return undefined
    const s = colorSwatches.value[i]
    return s && s.length > 0 ? s : undefined
  })

  /** Parse palette hex/rgb strings into [r,g,b] (handles #RGB, #RRGGBB, #RRGGBBAA, bare hex). */
  function outputColorValueToRgb(value: string): number[] | null {
    const v = (value || '').trim()
    if (!v) return null

    const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(v)
    if (m) {
      return [Number(m[1]), Number(m[2]), Number(m[3])]
    }

    let hex = v.startsWith('#') ? v.slice(1) : v
    if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
      hex = hex
        .split('')
        .map(c => c + c)
        .join('')
    } else if (/^[0-9A-Fa-f]{8}$/.test(hex)) {
      hex = hex.slice(0, 6)
    }
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if ([r, g, b].some(n => Number.isNaN(n))) return null
      return [r, g, b]
    }

    const o = hexToRgbObject(v.startsWith('#') ? v : `#${v}`)
    return o ? [o.red, o.green, o.blue] : null
  }

  function resolveCustomLogoRowIndex(): number {
    if (!customLogo.value) return -1
    if (props.logoIndex != null && props.logoIndex >= 0) return props.logoIndex
    return getActiveLogoIndex(customLogo.value.id)
  }

  function handleOpenLogosColorFromCard(index: number) {
    selectedLogoColorIndex.value = index
    if (!accordionOpen.value.includes('logos-color')) {
      accordionOpen.value = [...accordionOpen.value, 'logos-color']
    }
  }

  function handleLogosColorSwatchInPanel(index: number) {
    selectedLogoColorIndex.value = index
  }

  function handleLogosColorPaletteSelect(color: OutputColor) {
    if (!customLogo.value || !productKey.value) return
    if (selectedLogoColorIndex.value === null) {
      const n = customLogo.value.logo_colors?.length ?? 0
      if (n > 0) selectedLogoColorIndex.value = 0
    }
    if (selectedLogoColorIndex.value === null) return

    const logoIndex = resolveCustomLogoRowIndex()
    if (logoIndex === -1) return
    const rgb = outputColorValueToRgb(color.value)
    if (!rgb) return

    const prev = customLogo.value.logo_colors || []
    const i = selectedLogoColorIndex.value
    if (i < 0 || i >= prev.length) return

    const nextColors = [...prev]
    nextColors[i] = rgb

    const nextLogo = {
      ...customLogo.value,
      logo_colors: nextColors as CustomLogo['logo_colors']
    }

    customizationStore.updateCustomLogo({
      custom_logo_index: logoIndex,
      data: { logo_colors: nextColors as CustomLogo['logo_colors'] },
      productId: Number(productKey.value)
    })

    const hasAppliedSlots = (customizationStore.customization?.default_colors || []).some(
      (c: { color?: string | null }) => c.color
    )
    const pinned = workflowStore.logoApplySourceIndex
    const idMatches = workflowStore.activeLogoId === String(customLogo.value.id)
    const indexMatches = pinned === null || pinned === logoIndex
    if (hasAppliedSlots && idMatches && indexMatches) {
      syncDefaultColorsFromLogoPalette(nextLogo)
    }

    customizationStore.pushHistoryState('Logo color')

    if (logosStore.activeLogo?.id === customLogo.value.id) {
      logosStore.setActiveLogo(nextLogo)
    }
  }

  // Side options for the select
  const sideOptions = computed(() => [
    { value: 'front', label: logos_side_front({}, { locale: profileStore.currentLocale }) },
    { value: 'back', label: logos_side_back({}, { locale: profileStore.currentLocale }) }
  ])

  // Current side value
  const currentSide = computed(() => {
    return customLogo.value?.side || 'front'
  })

  const heightUnitLabel = computed(() => {
    const measurementUnit = companyStore.settings?.settings?.measurement_unit
    if (!measurementUnit) return 'cm'
    const unit = typeof measurementUnit === 'string' ? measurementUnit : measurementUnit.unit
    if (!unit) return 'cm'
    if (unit.toLowerCase() === 'in' || unit.toLowerCase() === 'inch') return 'in'
    if (unit.toLowerCase() === 'cm') return 'cm'
    return unit
  })

  // ===== DIMENSION HANDLING =====
  const {
    widthInputValue,
    heightInputValue,
    isWidthFocused,
    isHeightFocused,
    handleWidthInputEvent,
    handleHeightInputEvent,
    handleWidthInput,
    handleHeightInput,
    handleBlurWidth,
    handleBlurHeight
  } = useLogoDimensions(customLogo, productKey, positionForm, getActiveLogoIndex)

  const widthLabel = computed(() => {
    const locale = profileStore.currentLocale || 'en'
    const labels: Record<string, string> = {
      en: 'Width',
      fr: 'Largeur',
      es: 'Ancho',
      da: 'Bredde'
    }
    return labels[locale] ?? 'Width'
  })

  // ===== POSITION COMPOSABLE =====
  const {
    activeLogoIndex,
    angleText,
    handleAngleCommit,
    resetPositionToCenter,
    pinLogo,
    setupAngleWatcher
  } = useLogoPosition(
    customLogo,
    positionForm,
    currentWidth,
    previousPlacementOption,
    isSyncingAngle,
    rotationChangeStart,
    heightChangeStart,
    computed(() => props.logoIndex)
  )

  // ===== ACTIONS =====
  async function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    logosStore.setActiveLogo(null)
  }

  const removingBackgroundMode = ref<BackgroundRemovalMode | null>(null)
  const isRecoloring = ref(false)
  const selectedLogoTechnology = ref<OutputProductLogoTechnology | null>(null)

  async function handleRemoveBackground(type: BackgroundRemovalMode) {
    if (!customLogo.value || !productKey.value) return
    const logoIndex = getActiveLogoIndex(customLogo.value.id)
    if (logoIndex === -1) return
    if (removingBackgroundMode.value) return
    removingBackgroundMode.value = type

    try {
      const logo = await removeBackground(
        customLogo.value,
        type,
        Number(productKey.value),
        logoIndex
      )
      if (logo) {
        setActiveLogo(logo)
      }
    } catch (error) {
      console.error('Error removing background:', error)
    } finally {
      removingBackgroundMode.value = null
    }
  }

  function handleApplyColours() {
    if (!customLogo.value) return
    const idx =
      props.logoIndex != null && props.logoIndex >= 0
        ? props.logoIndex
        : getActiveLogoIndex(customLogo.value.id)
    if (idx < 0) return
    applyLogoColors(customLogo.value, idx)
  }

  function handleShuffleExtractedColors(logo: CustomLogo) {
    const idx =
      props.logoIndex != null && props.logoIndex >= 0
        ? props.logoIndex
        : getActiveLogoIndex(logo.id)
    shuffleExtractedColorsForActiveLogo(logo, idx >= 0 ? idx : undefined)
  }

  async function handleRecolorLogo(color: OutputColor) {
    if (!customLogo.value) return
    if (isRecoloring.value) return
    isRecoloring.value = true
    try {
      await recolorLogo(customLogo.value, color)
    } finally {
      isRecoloring.value = false
    }
  }

  function handleDeleteLogo() {
    if (!customLogo.value) return
    removeLogo(customLogo.value)
    handleBackToLogos()
  }

  function handlePlacementChange(option: PlacementOption | null) {
    positionForm.placementOption = option
    if (!customLogo.value || !productKey.value || !option) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const prevLabel = customLogo.value.name_of_placement || null
    const prevPlacementKey = customLogo.value.placement ?? null
    const prevOption = previousPlacementOption.value
    const nextX = option.x_axis ?? customLogo.value.x_axis ?? 0
    const nextY = option.y_axis ?? customLogo.value.y_axis ?? 0
    const nextSide = option.side ?? customLogo.value.side ?? 'front'

    if (
      option.label === prevLabel &&
      option.placementKey === prevPlacementKey &&
      nextX === (prevOption?.x_axis ?? customLogo.value.x_axis ?? 0) &&
      nextY === (prevOption?.y_axis ?? customLogo.value.y_axis ?? 0) &&
      nextSide === (prevOption?.side ?? customLogo.value.side ?? 'front')
    ) {
      return
    }

    customizationStore.updateCustomLogo({
      custom_logo_index: index,
      data: {
        name_of_placement: option.label,
        placement: option.placementKey ?? undefined,
        x_axis: nextX,
        y_axis: nextY,
        side: nextSide,
        height: option.height!,
        rotation: option.rotation!,
        scaleX: 0,
        scaleY: 0,
        x_axis_3d: 0,
        y_axis_3d: 0
      },
      productId: Number(productKey.value)
    })
    customizationStore.pushHistoryState('Moved logo')

    previousPlacementOption.value = option
    if (option.width) currentWidth.value = option.width
    if (option.height) {
      positionForm.height = option.height.toFixed(2)
    }
  }

  function handlePlacementChangeById(value: string | null | AcceptableValue) {
    const normalized = typeof value === 'string' ? value : null
    if (!normalized) {
      positionForm.placementOption = null
      return
    }
    const option = resolvePlacementByValue(normalized)
    positionForm.placementOption = option
    handlePlacementChange(option)
  }

  function handleSideChange(value: string | null | AcceptableValue) {
    const normalized = typeof value === 'string' ? value : null
    if (!customLogo.value || !productKey.value || !normalized) return

    const newSide = normalized as 'front' | 'back'
    const prevSide = customLogo.value.side || 'front'

    if (newSide === prevSide) return

    const index = activeLogoIndex.value
    if (index === -1) return

    customizationStore.updateCustomLogo({
      custom_logo_index: index,
      data: { side: newSide, x_axis_3d: 0, y_axis_3d: 0 },
      productId: Number(productKey.value)
    })
    customizationStore.pushHistoryState('Moved logo')
  }

  // Radio group value for logo technology (syncs with selectedLogoTechnology)
  const logoTechnologyRadioValue = computed({
    get: () => (selectedLogoTechnology.value ? String(selectedLogoTechnology.value.sku_id) : ''),
    set: (val: string) => {
      if (!val) {
        selectLogoTechnologyClear()
        return
      }
      const tech = logoTechnologies.value.find(t => String(t.sku_id) === val)
      if (tech) selectLogoTechnology(tech)
    }
  })

  function selectLogoTechnology(technology: OutputProductLogoTechnology) {
    if (!customLogo.value || !productKey.value) return
    selectedLogoTechnology.value = technology
    applyLogoTechnologyToStore()
  }

  function selectLogoTechnologyClear() {
    if (!customLogo.value || !productKey.value) return
    selectedLogoTechnology.value = null
    applyLogoTechnologyToStore()
  }

  function applyLogoTechnologyToStore() {
    if (!customLogo.value || !productKey.value) return

    // Update the logo in customization store
    const logoIndex = getActiveLogoIndex(customLogo.value.id)
    if (logoIndex === -1) return

    const map = customizationStore.customization?.custom_logos
    if (!map) return
    const arr = map[productKey.value]
    if (!arr || logoIndex < 0 || logoIndex >= arr.length) return

    // Update logo with technology (using type assertion since logo_technology is not in the base type)
    const updatedLogo = {
      ...arr[logoIndex],
      logo_technology: selectedLogoTechnology.value
    } as CustomLogo & { logo_technology?: OutputProductLogoTechnology | null }

    arr[logoIndex] = updatedLogo as CustomLogo
    customizationStore.pushHistoryState('Changed logo technology')

    // Update active logo if it's the same one
    if (logosStore.activeLogo?.id === customLogo.value.id) {
      logosStore.setActiveLogo(updatedLogo as CustomLogo)
    }
  }

  function mergeDefaultAccordionSections(logo: CustomLogo) {
    const keys: string[] = ['position', 'remove-background', 'recolor']
    if ((logo.logo_colors?.length ?? 0) > 0) keys.unshift('logos-color')
    accordionOpen.value = [...new Set([...accordionOpen.value, ...keys])]
  }

  watch(
    () => props.logoId,
    (id, prev) => {
      accordionDefaultsSeededForLogoId.value = null
      if (prev != null && id !== prev) {
        accordionOpen.value = []
      }
    }
  )

  // Watch for logo changes and sync form
  watch(
    customLogo,
    logo => {
      syncFormWithLogo(logo)
      // Initialize selected logo technology from logo
      if (logo) {
        const logoWithTech = logo as CustomLogo & {
          logo_technology?: OutputProductLogoTechnology | null
        }
        selectedLogoTechnology.value = logoWithTech.logo_technology || null

        if (String(logo.id) === props.logoId) {
          const pending = workflowStore.consumePendingOpenLogosColorSwatchIndex()
          if (pending !== null) {
            const nColors = logo.logo_colors?.length ?? 0
            if (pending >= 0 && pending < nColors) {
              selectedLogoColorIndex.value = pending
              if (!accordionOpen.value.includes('logos-color')) {
                accordionOpen.value = [...accordionOpen.value, 'logos-color']
              }
            }
          }

          if (accordionDefaultsSeededForLogoId.value !== props.logoId) {
            accordionDefaultsSeededForLogoId.value = props.logoId
            mergeDefaultAccordionSections(logo)
          }
        }

        const n = logo.logo_colors?.length ?? 0
        const sel = selectedLogoColorIndex.value
        if (sel !== null && (n === 0 || sel >= n)) {
          selectedLogoColorIndex.value = n > 0 ? 0 : null
        }
      } else {
        selectedLogoTechnology.value = null
        selectedLogoColorIndex.value = null
      }
    },
    { immediate: true }
  )

  // Opening "Logos Color" without clicking a swatch left no slot targeted; default to first.
  watch(
    () => accordionOpen.value.includes('logos-color'),
    isOpen => {
      if (!isOpen) return
      if (selectedLogoColorIndex.value !== null) return
      const n = customLogo.value?.logo_colors?.length ?? 0
      if (n > 0) selectedLogoColorIndex.value = 0
    }
  )

  // Also watch explicit logo index changes (in case index is passed via workflow store)
  watch(
    () => props.logoIndex,
    () => {
      syncFormWithLogo(customLogo.value)
    }
  )

  // Re-sync form when undo/redo restores state so angle/height inputs reflect restored logo
  watch(
    () => customizationStore.historyIndex,
    () => {
      syncFormWithLogo(customLogo.value)
    }
  )

  // Setup angle watchers
  onMounted(() => {
    setupAngleWatcher()
  })

  function handleLogoAfterUpload(logo: CustomLogo) {
    setActiveLogo(logo)
    workflowStore.setLogoEditorLogoId(String(logo.id))
    workflowStore.setLogosSubStep('placement')
  }

  const { handleFileChange } = useLogoAddAnotherUpload(doUpload, handleLogoAfterUpload)

  const { registerAILogo, getAIPrompt, logoShowsAiUi } = useAILogoMeta()
  const { syncQuotaAfterGeneration: syncAILogoQuota, hasReachedLimit: hasReachedAiLimit } =
    useAILogoLimit()
  const { isAiLogoGenerationEnabled } = useAiLogoGenerationEnabled()
  const aiGenRef = ref<InstanceType<typeof AILogoGenerator> | null>(null)

  function handleAILogoAppliedEditor(logo: CustomLogo) {
    setActiveLogo(logo)
    workflowStore.setLogoEditorLogoId(String(logo.id))
    workflowStore.setLogosSubStep('placement')
  }

  async function handleAILogoRequestApply(payload: {
    prompt: string
    blob?: Blob
    customerLogo?: CustomLogo
  }) {
    try {
      let uploaded: CustomLogo | null = null
      if (payload.customerLogo) {
        logosStore.appendLogoFromAiGeneration(payload.customerLogo)
        uploaded = payload.customerLogo
      } else if (payload.blob) {
        uploaded = await materializeAiLogoResult(payload.blob, doUpload)
      }
      if (uploaded) {
        registerAILogo(uploaded.id, payload.prompt, uploaded.url)
        handleAILogoAppliedEditor(uploaded)
        void logosStore.fetchRecentLogos()
      }
    } finally {
      aiGenRef.value?.resetApplyState?.()
    }
  }

  const refiningLogoIdsEditor = ref(new Set<number>())
  const regeneratingLogoIdsEditor = ref(new Set<number>())

  function isRefiningLogo(id: number): boolean {
    return refiningLogoIdsEditor.value.has(id)
  }

  function isRegeneratingLogo(id: number): boolean {
    return regeneratingLogoIdsEditor.value.has(id)
  }

  function buildRefinedPrompt(parentLogo: CustomLogo, refinementPrompt: string): string {
    const refinement = refinementPrompt.trim()
    const base = getAIPrompt(parentLogo.id) ?? parentLogo.ai_user_prompt?.trim() ?? ''
    if (!base) return refinement
    return `${base}\n\nRefinement:\n${refinement}`
  }

  async function handleAIRefineEditor(parentLogo: CustomLogo, userPrompt: string) {
    if (hasReachedAiLimit.value) return
    if (refiningLogoIdsEditor.value.has(parentLogo.id)) return

    const refinedPrompt = buildRefinedPrompt(parentLogo, userPrompt)
    // Optimistically update prompt text on current logo while refine is in progress.
    registerAILogo(parentLogo.id, refinedPrompt, parentLogo.url)
    refiningLogoIdsEditor.value = new Set(refiningLogoIdsEditor.value).add(parentLogo.id)
    try {
      const genResult = await generateAILogo({
        prompt: userPrompt,
        customerLogoId: parentLogo.id,
        mode: 'refine'
      })
      syncAILogoQuota(genResult.remainingQuota)
      const uploaded = await materializeAiLogoResult(genResult.logo, doUpload)
      if (!uploaded) return

      if (!(genResult.logo instanceof Blob)) logosStore.appendLogoFromAiGeneration(uploaded)
      // Keep latest local refine chain immediately; backend prompt can lag until recents refresh.
      const promptToPersist = refinedPrompt
      registerAILogo(uploaded.id, promptToPersist, uploaded.url, parentLogo.id)

      const key = productKey.value
      const idx = key ? getActiveLogoIndex(parentLogo.id) : -1
      if (key && idx >= 0) {
        const prev = { ...(customLogos.value[idx] as CustomLogo) } as CustomLogo
        const merged = mergeLogoPreservePlacement(prev, uploaded)
        await historyStore.execute('logo.ai-replace', {
          key,
          index: idx,
          prevLogo: prev,
          nextLogo: merged
        })
        customizationStore.pushHistoryState('Refine AI logo')
        setActiveLogo(merged)
        workflowStore.setActiveLogoId(String(merged.id))
        workflowStore.setLogoEditorLogoId(String(merged.id))
        workflowStore.setActiveLogoIndex(idx)
      } else {
        handleAILogoAppliedEditor(uploaded)
      }
      void logosStore.fetchRecentLogos()
    } catch (err) {
      console.error('[LogoEdit] AI refine failed', err)
    } finally {
      const next = new Set(refiningLogoIdsEditor.value)
      next.delete(parentLogo.id)
      refiningLogoIdsEditor.value = next
    }
  }

  async function handleAIRegenerateLogoEditor(parentLogo: CustomLogo) {
    if (hasReachedAiLimit.value) return
    if (regeneratingLogoIdsEditor.value.has(parentLogo.id)) return

    const prompt = getAIPrompt(parentLogo.id) ?? 'Regenerate this logo'
    regeneratingLogoIdsEditor.value = new Set(regeneratingLogoIdsEditor.value).add(parentLogo.id)
    try {
      const genResult = await generateAILogo({
        prompt,
        customerLogoId: parentLogo.id,
        mode: 'shuffle'
      })
      syncAILogoQuota(genResult.remainingQuota)
      const uploaded = await materializeAiLogoResult(genResult.logo, doUpload)
      if (!uploaded) return

      if (!(genResult.logo instanceof Blob)) logosStore.appendLogoFromAiGeneration(uploaded)
      registerAILogo(uploaded.id, prompt, uploaded.url)

      const key = productKey.value
      const idx = key ? getActiveLogoIndex(parentLogo.id) : -1
      if (key && idx >= 0) {
        const prev = { ...(customLogos.value[idx] as CustomLogo) } as CustomLogo
        const merged = mergeLogoPreservePlacement(prev, uploaded)
        await historyStore.execute('logo.ai-replace', {
          key,
          index: idx,
          prevLogo: prev,
          nextLogo: merged
        })
        customizationStore.pushHistoryState('Regenerate AI logo')
        setActiveLogo(merged)
        workflowStore.setActiveLogoId(String(merged.id))
        workflowStore.setLogoEditorLogoId(String(merged.id))
        workflowStore.setActiveLogoIndex(idx)
      } else {
        handleAILogoAppliedEditor(uploaded)
      }
      void logosStore.fetchRecentLogos()
    } catch (err) {
      console.error('[LogoEdit] AI regenerate failed', err)
    } finally {
      const next = new Set(regeneratingLogoIdsEditor.value)
      next.delete(parentLogo.id)
      regeneratingLogoIdsEditor.value = next
    }
  }
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <div class="flex flex-col items-center mx-4 md:mx-6 gap-4">
      <LogoCard
        v-if="customLogo"
        :logo="customLogo"
        :index="props.logoIndex ?? -1"
        :interactive-logo-colors="(customLogo.logo_colors?.length ?? 0) > 0"
        :highlighted-logo-color-index="selectedLogoColorIndex"
        :is-ai="logoShowsAiUi(customLogo)"
        :show-ai-actions="logoShowsAiUi(customLogo)"
        :disable-ai-refine-regenerate="hasReachedAiLimit"
        :is-refining="isRefiningLogo(customLogo.id)"
        :is-regenerating="isRegeneratingLogo(customLogo.id)"
        @apply-colors="handleApplyColours"
        @delete="handleDeleteLogo"
        @logo-color-click="handleOpenLogosColorFromCard"
        @shuffle-colors="handleShuffleExtractedColors"
        @use-original-and-proceed="useOriginalColorsAndProceed"
        @refine="handleAIRefineEditor"
        @regenerate-logo="handleAIRegenerateLogoEditor"
      />
    </div>

    <Accordion v-model="accordionOpen" type="multiple" class="space-y-4">
      <AccordionItem v-if="colorSwatches.length > 0" value="logos-color" class="overflow-hidden">
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">{{
              logos_logos_color({}, { locale: profileStore.currentLocale })
            }}</span>
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
        <AccordionContent class="space-y-6 px-4 md:px-6 py-5">
          <div class="space-y-2 text-left">
            <!-- <Label class="text-xs font-medium text-muted-foreground">
              {{ colors_extracted_from_logo({}, { locale: profileStore.currentLocale }) }}
            </Label> -->
            <ColorsPreview
              :colors="logoDetectedPreviewStrings"
              interactive
              :selected-swatch-index="selectedLogoColorIndex"
              @swatch-click="handleLogosColorSwatchInPanel"
            />
          </div>
          <div class="space-y-2 border-t border-border pt-4 text-left">
            <Label class="text-xs font-medium text-muted-foreground">
              {{ nav_color({}, { locale: profileStore.currentLocale }) }}
            </Label>
            <PaletteColorSelector
              v-if="
                palettesForLogosColorPanel.length || customLogosPalettesForLogosColorPanel.length
              "
              :palettes="palettesForLogosColorPanel"
              :custom-palettes="customLogosPalettesForLogosColorPanel"
              :selected-color="logosColorPaletteSelectedHex"
              :allow-custom-color="productsStore.activeProductDetails?.is_custom_color_allowed"
              :has-svg-colors="false"
              :parsed-locker-rooms="parsedLockerRooms"
              color-type-key="logo_color_type"
              @color-select="handleLogosColorPaletteSelect"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        v-if="logoTechnologies.length > 0"
        value="technologies"
        class="overflow-hidden"
      >
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Logo Technology</span>
          </div>
        </AccordionTrigger>
        <AccordionContent class="space-y-6 px-4 md:px-6 py-5">
          <RadioGroup v-model="logoTechnologyRadioValue" class="space-y-3 text-left">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="logo-tech-none" value="" />
              <Label
                for="logo-tech-none"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                None
              </Label>
            </div>
            <div
              v-for="(technology, index) in logoTechnologies"
              :key="technology.sku_id"
              class="flex items-center space-x-2"
            >
              <RadioGroupItem :id="`logo-tech-${index}`" :value="String(technology.sku_id)" />
              <Label
                :for="`logo-tech-${index}`"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {{ technology.label }}
                <template v-if="showPricing && technology.price">
                  <span class="text-muted-foreground ml-1">
                    +{{ technology.price }}{{ technology.currency_symbol }}
                  </span>
                </template>
              </Label>
            </div>
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="position" class="overflow-hidden">
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">{{
              logos_position_section_title({}, { locale: profileStore.currentLocale })
            }}</span>
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
        <AccordionContent class="space-y-6 px-4 md:px-6 py-5">
          <div class="space-y-1 text-left">
            <Label for="logo-placement" class="text-xs font-medium text-muted-foreground">
              {{ logos_placement_label({}, { locale: profileStore.currentLocale }) }}
            </Label>
            <Select
              :model-value="positionForm.placementOption?.value ?? null"
              @update:model-value="handlePlacementChangeById"
            >
              <SelectTrigger id="logo-placement" class="h-9 w-full">
                <SelectValue
                  :value="positionForm.placementOption?.label"
                  :placeholder="
                    logos_select_placement_placeholder({}, { locale: profileStore.currentLocale })
                  "
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="option in placementOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <!-- Side Selector — hidden for 3D products (no front/back sides) -->
          <div
            v-if="!productsStore.activeProductDetails?.is_3d_product"
            class="space-y-1 text-left"
          >
            <Label for="logo-side" class="text-xs font-medium text-muted-foreground">
              {{ logos_side_label({}, { locale: profileStore.currentLocale }) }}
            </Label>
            <Select :model-value="currentSide" @update:model-value="handleSideChange">
              <SelectTrigger id="logo-side" class="h-9 w-full">
                <SelectValue :value="currentSide" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="option in sideOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label for="logo-width" class="text-xs font-medium text-muted-foreground">
                {{ widthLabel }}
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="logo-width"
                  :model-value="widthInputValue"
                  inputmode="decimal"
                  :max-decimals="MAX_DECIMALS"
                  @input="handleWidthInputEvent"
                  @update:model-value="handleWidthInput"
                  @focus="isWidthFocused = true"
                  @blur="handleBlurWidth"
                />
                <InputGroupAddon class="pr-3 text-xs">{{ heightUnitLabel }}</InputGroupAddon>
              </InputGroup>
            </div>
            <div class="space-y-1">
              <Label for="logo-height" class="text-xs font-medium text-muted-foreground">
                {{ logos_height_label({}, { locale: profileStore.currentLocale }) }}
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="logo-height"
                  :model-value="heightInputValue"
                  inputmode="decimal"
                  :max-decimals="MAX_DECIMALS"
                  @input="handleHeightInputEvent"
                  @update:model-value="handleHeightInput"
                  @focus="isHeightFocused = true"
                  @blur="handleBlurHeight"
                />
                <InputGroupAddon class="pr-3 text-xs">{{ heightUnitLabel }}</InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label for="logo-angle" class="text-xs font-medium text-muted-foreground">
                {{ logos_angle_label({}, { locale: profileStore.currentLocale }) }}
              </Label>
              <span class="text-sm text-foreground">{{ angleText }}</span>
            </div>
            <Slider
              id="logo-angle"
              v-model="positionForm.angle"
              :max="360"
              :min="0"
              :step="1"
              @value-commit="handleAngleCommit"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Button variant="outline" class="h-9" @click="resetPositionToCenter">
              <LocateFixed class="size-4" />
              {{ logos_center_logo_button({}, { locale: profileStore.currentLocale }) }}
            </Button>
            <Button variant="outline" class="h-9" @click="pinLogo">
              <Pin class="size-4" />
              {{
                customLogo?.pinned
                  ? logos_unpin_logo_button({}, { locale: profileStore.currentLocale })
                  : logos_pin_logo_button({}, { locale: profileStore.currentLocale })
              }}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="remove-background" class="overflow-hidden">
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">{{
              logos_remove_background_title({}, { locale: profileStore.currentLocale })
            }}</span>
          </div>
          <template #icon>
            <svg
              class="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </template>
        </AccordionTrigger>
        <AccordionContent class="space-y-4 px-4 md:px-6 py-5">
          <div class="flex w-full items-start gap-4 rounded-2xl border p-4 text-left">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <ContentRemoveIcons type="simple" />
            </div>
            <div class="flex flex-1 flex-col gap-2">
              <p class="text-sm font-semibold">
                {{
                  logos_remove_background_simple_title({}, { locale: profileStore.currentLocale })
                }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{
                  logos_remove_background_simple_description(
                    {},
                    { locale: profileStore.currentLocale }
                  )
                }}
              </p>
              <Button
                size="sm"
                variant="default"
                class="mt-1 self-start px-4"
                :disabled="Boolean(removingBackgroundMode)"
                @click.stop="handleRemoveBackground('simple')"
              >
                <Spinner v-if="removingBackgroundMode === 'simple'" class="mr-2 size-3.5" />
                <span>{{
                  removingBackgroundMode === 'simple'
                    ? logos_applying({}, { locale: profileStore.currentLocale })
                    : logos_apply({}, { locale: profileStore.currentLocale })
                }}</span>
              </Button>
            </div>
          </div>

          <div class="flex w-full items-start gap-4 rounded-2xl border p-4 text-left">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <ContentRemoveIcons type="smart" />
            </div>
            <div class="flex flex-1 flex-col gap-2">
              <p class="text-sm font-semibold">
                {{
                  logos_remove_background_smart_title({}, { locale: profileStore.currentLocale })
                }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{
                  logos_remove_background_smart_description(
                    {},
                    { locale: profileStore.currentLocale }
                  )
                }}
              </p>
              <Button
                size="sm"
                variant="default"
                class="mt-1 self-start px-4"
                :disabled="Boolean(removingBackgroundMode)"
                @click.stop="handleRemoveBackground('smart')"
              >
                <Spinner v-if="removingBackgroundMode === 'smart'" class="mr-2 size-3.5" />
                <span>{{
                  removingBackgroundMode === 'smart'
                    ? logos_applying({}, { locale: profileStore.currentLocale })
                    : logos_apply({}, { locale: profileStore.currentLocale })
                }}</span>
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="recolor" class="overflow-hidden">
        <AccordionTrigger class="px-4 md:px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">{{
              logos_recolor_logo({}, { locale: profileStore.currentLocale })
            }}</span>
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
        <AccordionContent class="px-4 md:px-6 py-5">
          <PaletteColorSelector
            :palettes="palettes"
            :selected-color="colorSwatches[0]"
            :loading="isRecoloring"
            @color-select="handleRecolorLogo"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <div
      v-if="!logosStore.isLoadingUploadLogo"
      class="flex flex-col gap-3 mx-4 md:mx-6 pt-4 border-t border-border"
    >
      <Button variant="default" class="rounded-lg w-full mb-2" @click="onClickUpload">
        {{ logos_add_logo({}, { locale: profileStore.currentLocale }) }}
      </Button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />
      <template v-if="isLoggedIn">
        <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
          <div class="flex-1 h-px bg-border" />
          <span class="px-3 text-foreground font-medium">{{
            colors_separator_or({}, { locale: profileStore.currentLocale })
          }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        <Button
          class="w-full bg-card"
          variant="secondary"
          @click="lockerRoomStore.setOpenLockerWithIntent('assets')"
        >
          {{ colors_choose_from_locker({}, { locale: profileStore.currentLocale }) }}
        </Button>
      </template>
      <div v-if="isAiLogoGenerationEnabled" class="flex flex-col gap-3 w-full">
        <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
          <div class="flex-1 h-px bg-border" />
          <span class="px-3 text-foreground font-medium">{{
            colors_separator_or({}, { locale: profileStore.currentLocale })
          }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        <AILogoGenerator ref="aiGenRef" @request-apply="handleAILogoRequestApply" />
      </div>
    </div>
    <LogoUploadingSkeleton v-else class="mx-4 md:mx-6" />
  </div>
</template>
