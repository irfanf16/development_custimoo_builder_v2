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
  import { Checkbox } from '@/components/ui/checkbox'
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

  interface Props {
    logoId: string
  }

  const props = defineProps<Props>()

  // ===== STORES =====
  const workflowStore = useWorkflowStore()
  const logosStore = useLogosStore()
  const productsStore = useProductsStore()
  const historyStore = useHistoryStore()
  const profileStore = useProfileStore()
  const customizationStore = useCustomizationStore()

  // ===== COMPOSABLES =====
  const { productKey, getLogoById, getActiveLogoIndex } = useLogos()
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

  // ===== POSITION COMPOSABLE =====
  const {
    activeLogoIndex,
    angleText,
    handleHeightInput,
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
    heightChangeStart
  )

  // ===== ACTIONS =====
  async function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    workflowStore.setActiveLogoId(null)
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

  function handleHeightModelUpdate(value: string | number) {
    handleHeightInput(value)
  }

  function selectLogoTechnology(technology: OutputProductLogoTechnology) {
    if (!customLogo.value || !productKey.value) return

    // Toggle selection: if already selected, deselect; otherwise select
    if (selectedLogoTechnology.value?.sku_id === technology.sku_id) {
      selectedLogoTechnology.value = null
    } else {
      selectedLogoTechnology.value = technology
    }

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
          <div class="space-y-3 text-left">
            <div
              v-for="(technology, index) in logoTechnologies"
              :key="technology.sku_id"
              class="flex items-center space-x-2"
            >
              <Checkbox
                :id="`logo-tech-${index}`"
                :checked="selectedLogoTechnology?.sku_id === technology.sku_id"
                @update:checked="() => selectLogoTechnology(technology)"
              />
              <Label
                :for="`logo-tech-${index}`"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                @click="selectLogoTechnology(technology)"
              >
                {{ technology.label }}
                <template v-if="technology.price">
                  <span class="text-muted-foreground ml-1">
                    +{{ technology.price }}{{ technology.currency_symbol }}
                  </span>
                </template>
              </Label>
            </div>
          </div>
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

          <div class="grid grid-cols-1 gap-4">
            <div class="space-y-1">
              <Label for="logo-height" class="text-xs font-medium text-muted-foreground">
                {{ logos_height_label({}, { locale: profileStore.currentLocale }) }}
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="logo-height"
                  inputmode="decimal"
                  :model-value="positionForm.height"
                  @update:model-value="handleHeightModelUpdate"
                  @blur="handleBlurHeight"
                />
                <InputGroupAddon class="pr-3 text-xs">cm</InputGroupAddon>
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
