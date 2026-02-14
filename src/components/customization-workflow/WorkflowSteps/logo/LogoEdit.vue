<script setup lang="ts">
  import { computed, watch, onMounted, ref } from 'vue'
  import type { AcceptableValue } from 'reka-ui'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { PaletteColorSelector } from '@/components/ui/palette-color-selector'
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
  import { useLogoPosition } from './useLogoPosition'
  import { rgbArrayToHex } from './useLogoUtils'
  import type { Palette } from '@/composables/useColorActions'
  import { Label } from '@/components/ui/label'
  import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
  import { Slider } from '@/components/ui/slider'
  import { LocateFixed, Pin } from 'lucide-vue-next'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
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
    logos_remove_background_title,
    logos_remove_background_simple_title,
    logos_remove_background_simple_description,
    logos_remove_background_smart_title,
    logos_remove_background_smart_description,
    logos_applying,
    logos_apply,
    logos_recolor_logo
  } from '@/paraglide/messages'
  import { usePricing } from '@/composables/usePricing'
  import { useCompanyStore } from '@/stores/company/company.store'
  interface Props {
    logoId: string
    logoIndex: number | null
  }

  const props = defineProps<Props>()

  // ===== STORES =====
  const workflowStore = useWorkflowStore()
  const logosStore = useLogosStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()
  const profileStore = useProfileStore()
  const customizationStore = useCustomizationStore()
  const { showPricing } = usePricing()
  const companyStore = useCompanyStore()
  // ===== COMPOSABLES =====
  const { productKey, customLogos, getLogoById, getActiveLogoIndex } = useLogos()
  const { removeBackground, applyLogoColors, recolorLogo, removeLogo, setActiveLogo } =
    useLogoActions()
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
    (customLogo.value?.logo_colors || []).map(color => rgbArrayToHex(color as number[]))
  )

  // Get palettes from products store
  const palettes = computed<Palette[]>(() => {
    return (
      productsStore.activeProductDetails?.namecolors.map(colorGroup => ({
        id: colorGroup.id,
        name: colorGroup.file_name,
        colors: colorGroup.json_data
      })) || []
    )
  })

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

  const originalHeightText = computed(() => {
    const raw = customLogo.value?.originalHeight
    if (raw === undefined || raw === null || raw === '') return ''
    const num = Number(raw)
    if (Number.isFinite(num)) return `${num.toFixed(1)}`
    return String(raw)
  })

  const heightModelValue = computed(() => {
    if (originalHeightText.value) return originalHeightText.value
    return positionForm.height
  })

  const originalWidthText = computed(() => {
    const raw = customLogo.value?.originalWidth
    if (raw === undefined || raw === null || raw === '') return ''
    const num = Number(raw)
    if (Number.isFinite(num)) return `${num.toFixed(1)}`
    return String(raw)
  })

  const widthModelValue = computed(() => {
    if (originalWidthText.value) return originalWidthText.value
    return ''
  })

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
    handleBlurHeight,
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
    workflowStore.setActiveLogoId(null)
    workflowStore.setActiveLogoIndex(null)
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
        workflowStore.setActiveLogoId(logo.id.toString())
      }
    } catch (error) {
      console.error('Error removing background:', error)
    } finally {
      removingBackgroundMode.value = null
    }
  }

  function handleApplyColours() {
    if (!customLogo.value) return
    applyLogoColors(customLogo.value)
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
    const nextPlacementId = option.placementId
    const nextX = option.x_axis ?? null
    const nextY = option.y_axis ?? null
    const nextSide = option.side ?? customLogo.value.side ?? null
    const prevX = prevOption?.x_axis ?? customLogo.value.x_axis ?? null
    const prevY = prevOption?.y_axis ?? customLogo.value.y_axis ?? null
    const prevSide = prevOption?.side ?? customLogo.value.side ?? null
    // Add width and height to the history
    const nextWidth = option.width ?? null
    const nextHeight = option.height ?? null
    const prevWidth = prevOption?.width ?? customLogo.value.width ?? null
    const prevHeight = prevOption?.height ?? customLogo.value.height ?? null

    if (
      option.label === prevLabel &&
      option.placementKey === prevPlacementKey &&
      nextX === prevX &&
      nextY === prevY &&
      nextSide === prevSide
    ) {
      return
    }

    void historyStore.execute('logo.update-placement', {
      key: productKey.value,
      index,
      prevPlacementLabel: prevLabel,
      nextPlacementLabel: option.label,
      placementId: nextPlacementId,
      nextPlacementKey: option.placementKey ?? null,
      prevPlacementKey: prevPlacementKey,
      nextX,
      nextY,
      prevX,
      prevY,
      nextSide,
      prevSide,
      nextWidth,
      nextHeight,
      prevWidth,
      prevHeight
    })

    previousPlacementOption.value = option
    if (option.width) currentWidth.value = option.width
    if (option.height) {
      positionForm.height = option.height.toFixed(1)
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

    // Don't update if the side hasn't changed
    if (newSide === prevSide) return

    const index = activeLogoIndex.value
    if (index === -1) return

    void historyStore.execute('logo.update-placement', {
      key: productKey.value,
      index,
      prevPlacementLabel: customLogo.value.name_of_placement || null,
      nextPlacementLabel: customLogo.value.name_of_placement || null,
      placementId: positionForm.placementOption?.placementId,
      nextPlacementKey: customLogo.value.placement ?? null,
      prevPlacementKey: customLogo.value.placement ?? null,
      nextX: customLogo.value.x_axis ?? null,
      nextY: customLogo.value.y_axis ?? null,
      prevX: customLogo.value.x_axis ?? null,
      prevY: customLogo.value.y_axis ?? null,
      nextSide: newSide,
      prevSide: prevSide,
      nextWidth: customLogo.value.width ?? null,
      nextHeight: customLogo.value.height ?? null,
      prevWidth: customLogo.value.width ?? null,
      prevHeight: customLogo.value.height ?? null
    })
  }

  /**
   * Shared handler for originalWidth and originalHeight.
   * Both use the same scaleX/scaleY; changing either dimension applies the same ratio to both scales
   * and to the other stored dimension so width and height fields stay in sync.
   */
  function handleOriginalDimensionUpdate(dimension: 'width' | 'height', value: string | number) {
    const str = String(value)
    if (!customLogo.value || !productKey.value) return
    const arr = customizationStore.customization?.custom_logos?.[productKey.value]
    if (!arr) return
    const index = getActiveLogoIndex(customLogo.value.id)
    if (index === -1 || !arr[index]) return

    const numeric = Number.parseFloat(str)
    const nextOriginal = Number.isFinite(numeric) ? Number(Number(numeric).toFixed(1)) : str
    const logo = arr[index] as CustomLogo & {
      originalWidth?: number | string
      originalHeight?: number | string
      scaleX?: number
      scaleY?: number
    }

    let scaleX = logo.scaleX ?? 1
    let scaleY = logo.scaleY ?? 1
    const originalNum =
      dimension === 'width' ? Number(logo.originalWidth) : Number(logo.originalHeight)
    let ratio = 1
    if (
      Number.isFinite(numeric) &&
      numeric > 0 &&
      Number.isFinite(originalNum) &&
      originalNum > 0
    ) {
      ratio = numeric / originalNum
      scaleX = scaleX * ratio
      scaleY = scaleY * ratio
      const precision = 12
      scaleX = Number(scaleX.toFixed(precision))
      scaleY = Number(scaleY.toFixed(precision))
    }
    const updated = { ...logo, scaleX, scaleY }
    if (dimension === 'width') {
      updated.originalWidth = nextOriginal
      const otherNum = Number(logo.originalHeight)
      if (Number.isFinite(otherNum) && otherNum > 0) {
        updated.originalHeight = Number((otherNum * ratio).toFixed(1))
      }
    } else {
      updated.originalHeight = nextOriginal
      const otherNum = Number(logo.originalWidth)
      if (Number.isFinite(otherNum) && otherNum > 0) {
        updated.originalWidth = Number((otherNum * ratio).toFixed(1))
      }
    }
    arr.splice(index, 1, updated as CustomLogo)
    if (dimension === 'height') {
      positionForm.height = String(nextOriginal)
    }
    customizationStore.saveToLocalStorage()
  }

  function handleBlurWidth() {
    const num = Number.parseFloat(widthModelValue.value)
    if (!Number.isNaN(num)) {
      handleOriginalDimensionUpdate('width', num.toFixed(1))
    }
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
    customizationStore.saveToLocalStorage()

    // Update active logo if it's the same one
    if (logosStore.activeLogo?.id === customLogo.value.id) {
      logosStore.setActiveLogo(updatedLogo as CustomLogo)
    }
  }

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
      } else {
        selectedLogoTechnology.value = null
      }
    },
    { immediate: true }
  )

  // Also watch explicit logo index changes (in case index is passed via workflow store)
  watch(
    () => props.logoIndex,
    () => {
      syncFormWithLogo(customLogo.value)
    }
  )

  // Setup angle watchers
  onMounted(() => {
    setupAngleWatcher()
  })
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <div class="flex flex-col items-center mx-4 md:mx-6 gap-4">
      <LogoCard
        v-if="customLogo"
        :logo="customLogo"
        :index="props.logoIndex ?? -1"
        @apply-colors="handleApplyColours"
        @delete="handleDeleteLogo"
      />
    </div>

    <Accordion type="multiple" class="space-y-4">
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

          <div class="space-y-1 text-left">
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
                  inputmode="decimal"
                  :model-value="widthModelValue"
                  @update:model-value="
                    (v: string | number) => handleOriginalDimensionUpdate('width', v)
                  "
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
                  inputmode="decimal"
                  :model-value="heightModelValue"
                  @update:model-value="
                    (v: string | number) => handleOriginalDimensionUpdate('height', v)
                  "
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
              {{ logos_pin_logo_button({}, { locale: profileStore.currentLocale }) }}
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
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15">
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
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15">
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
  </div>
</template>
