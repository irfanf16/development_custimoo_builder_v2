<script setup lang="ts">
  import { computed, reactive, ref, watch, nextTick } from 'vue'
  import type { AcceptableValue } from 'reka-ui'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { useProductsStore } from '@/stores/products/products.store'
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
  import type { OutputColor } from '@/services/products/types'
  import LogoCard from './LogoCard.vue'
  import type { CustomLogo } from '@/services/logos/types'
  import { useLogoActions } from '@/composables/useLogoActions'
  import type { Palette } from '@/composables/useColorActions'
  import { Label } from '@/components/ui/label'
  import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
  import { Slider } from '@/components/ui/slider'
  import { LocateFixed, Pin } from 'lucide-vue-next'
  import type { OutputProductLogosSetting } from '@/services/products/types'

  interface Props {
    logoId: string
  }

  const props = defineProps<Props>()

  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const { removeBackground } = useLogoActions()
  const { effectiveSvgGroups } = useEffectiveSelectors()
  const logosStore = useLogosStore()
  const productsStore = useProductsStore()

  // Recent logos state
  const customLogos = computed(() => {
    const key = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    const url = customizationStore.customization?.custom_logos?.[String(key)]?.[0]?.url
    if (!key || !map || !url) return [] as CustomLogo[]
    return (map as Record<string, CustomLogo[]>)[key] || []
  })

  const placements = computed<OutputProductLogosSetting[]>(
    () => productsStore.activeProductDetails?.logos_setting || []
  )

  const customLogo = computed(() => {
    if (props.logoId) return customLogos.value.find(l => l.id.toString() === props.logoId) || null
    return logosStore.activeLogo || null
  })

  const rgbArrayToHex = (arr: number[]): string => {
    const [r = 0, g = 0, b = 0] = arr
    const toHex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const colorSwatches = computed(() =>
    (customLogo.value?.logo_colors || []).map(color => rgbArrayToHex(color as number[]))
  )

  // Get palettes from products store (same as ColorSelection.vue)
  const palettes = computed<Palette[]>(() => {
    return (
      productsStore.activeProductDetails?.namecolors.map(colorGroup => ({
        id: colorGroup.id,
        name: colorGroup.file_name,
        colors: colorGroup.json_data
      })) || []
    )
  })

  async function handleBackToLogos() {
    workflowStore.setLogosSubStep('list')
    workflowStore.setActiveLogoId(null)
    logosStore.setActiveLogo(null)
  }

  function handleRemoveBackground(type: 'simple' | 'smart') {
    if (!customLogo.value || !customizationStore.customization?.product_id) return
    removeBackground(
      customLogo.value,
      type,
      customizationStore.customization?.product_id,
      customLogos.value.findIndex(l => l.id === customLogo.value?.id)
    )
      .then(logo => {
        if (logo) {
          logosStore.setActiveLogo(logo)
          workflowStore.setActiveLogoId(logo.id.toString())
        }
      })
      .catch(error => {
        console.error('Error removing background:', error)
      })
  }

  function handleApplyColours() {
    if (!customLogo.value || !customLogo.value.logo_colors || !effectiveSvgGroups.value) {
      return
    }

    const palette = customLogo.value.logo_colors as number[][]
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

  async function handleRecolorLogo(_color: OutputColor) {
    if (!customLogo.value || !customLogo.value.id || !customLogo.value.url || !_color.value) return
    const response = await logosStore.editLogo({
      logo_id: customLogo.value.id,
      type: 'floodfill',
      image: customLogo.value.url,
      color: _color.value
    })

    if (!response.success) {
      console.error('Error recoloring logo:', response.axiosError?.message)
      return
    }

    void historyStore.execute('logo.recolor', {
      key: productKey.value,
      index: activeLogoIndex.value,
      prevImage: customLogo.value.url,
      nextImage: response.content.logo
    })
  }

  function removeLogoFromCustomization(logo: CustomLogo) {
    const key = String(customizationStore.customization?.product_id || '')
    const index = customLogos.value.findIndex(l => l.id === logo.id)
    if (index !== -1) {
      historyStore.execute('logo.remove', { key, index })
    }
  }

  function handleDeleteLogo() {
    if (!customLogo.value) return
    removeLogoFromCustomization(customLogo.value)
    handleBackToLogos()
  }

  const headerConfig = {
    breadcrumbs: [
      {
        label: 'Logos',
        action: handleBackToLogos
      },
      { label: 'Controls' }
    ]
  }
  void headerConfig

  interface PlacementOption {
    label: string
    value: string
    placementId: number
    placementKey: string
    x_axis: number | null
    y_axis: number | null
    width: number | null
    height: number | null
    side: 'front' | 'back'
  }

  const placementOptions = computed(() =>
    placements.value
      .map(placement => ({
        label: placement.name_of_placement,
        value: String(placement.id),
        placementId: placement.id,
        x_axis: placement.x_axis,
        y_axis: placement.y_axis,
        placementKey: `${placement.name_of_placement}_${placement.id}_${placement.x_axis}_${placement.y_axis}_${placement.width}_${placement.height}_${placement.side}`,
        width: placement.width ?? null,
        height: placement.height ?? null,
        side: placement.side
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )

  const productKey = computed(() => {
    const id = customizationStore.customization?.product_id
    if (!id) return null
    return String(id)
  })

  const positionForm = reactive({
    placementOption: null as PlacementOption | null,
    height: '',
    angle: [0]
  })
  const currentWidth = ref<number>(0)

  const activeLogoIndex = computed(() => {
    if (!customLogo.value) return -1
    return customLogos.value.findIndex(l => l.id === customLogo.value?.id)
  })

  const previousPlacementOption = ref<PlacementOption | null>(null)
  const isSyncingAngle = ref(false)
  const rotationChangeStart = ref<number | null>(null)
  const heightChangeStart = ref<number | null>(null)

  watch(
    customLogo,
    logo => {
      const optionByKey = placementOptions.value.find(item => item.placementKey === logo?.placement)
      const optionById = placementOptions.value.find(
        item =>
          String(item.placementId) === String((logo as { placement_id?: number })?.placement_id)
      )
      const option = optionByKey ?? optionById ?? placementOptions.value[0] ?? null
      positionForm.placementOption = option
      previousPlacementOption.value = option
      if (!logo) {
        positionForm.height = option?.height ? option.height.toFixed(1) : ''
        return
      }
      const resolvedWidth = Number(logo.width || option?.width || 0)
      const resolvedHeight = Number(logo.height || option?.height || 0)
      currentWidth.value = resolvedWidth
      positionForm.height = resolvedHeight ? resolvedHeight.toFixed(1) : ''
      isSyncingAngle.value = true
      positionForm.angle = [Number(logo.rotation || 0)]
      rotationChangeStart.value = null
      void nextTick(() => {
        isSyncingAngle.value = false
      })
    },
    { immediate: true }
  )

  function applyDraftRotation(nextAngle: number) {
    if (!customizationStore.customization) return
    if (!productKey.value) return
    const arr = customizationStore.customization.custom_logos?.[productKey.value]
    if (!arr) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const current = arr[index]
    if (!current) return
    const normalized = Number(nextAngle)
    if (!Number.isFinite(normalized)) return
    if (rotationChangeStart.value === null) {
      rotationChangeStart.value = Number(current.rotation || 0)
    }
    if (Math.abs((current.rotation ?? 0) - normalized) < 0.0001) return
    const updated = { ...current, rotation: normalized }
    arr.splice(index, 1, updated)
  }

  watch(
    () => positionForm.angle[0],
    nextAngle => {
      if (isSyncingAngle.value) return
      if (!Number.isFinite(nextAngle)) return
      applyDraftRotation(Number(nextAngle))
    }
  )

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
      prevSide
    })

    previousPlacementOption.value = option
    if (option.width) currentWidth.value = option.width
    if (option.height) {
      positionForm.height = option.height.toFixed(1)
    }
  }

  type PlacementValue = string

  function resolvePlacementByValue(value: PlacementValue | null) {
    if (!value) return null
    return placementOptions.value.find(option => option.value === value) ?? null
  }

  function handlePlacementChangeById(value: PlacementValue | null | AcceptableValue) {
    const normalized = typeof value === 'string' ? value : null
    if (!normalized) {
      positionForm.placementOption = null
      return
    }
    const option = resolvePlacementByValue(normalized)
    positionForm.placementOption = option
    handlePlacementChange(option)
  }

  function handleHeightInput(value: string | number) {
    const str = String(value)
    const sanitized = str.replace(/[^0-9.]/g, '')
    positionForm.height = sanitized
    const numeric = Number.parseFloat(sanitized)
    if (!Number.isNaN(numeric)) {
      pushDraftTransform({ height: numeric })
    }
  }

  function handleHeightModelUpdate(value: string | number) {
    handleHeightInput(value)
  }

  function pushDraftTransform(transform: { height?: number; angle?: number }) {
    if (!customizationStore.customization || !productKey.value) return
    const arr = customizationStore.customization.custom_logos?.[productKey.value]
    if (!arr) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const current = arr[index]
    if (!current) return
    const nextHeight = transform.height ?? current.height
    const nextAngle = transform.angle ?? current.rotation
    if (transform.height !== undefined && heightChangeStart.value === null) {
      heightChangeStart.value = Number(current.height || 0)
    }
    const width = Number(
      current.width ||
        currentWidth.value ||
        positionForm.placementOption?.width ||
        previousPlacementOption.value?.width ||
        0
    )
    if (
      Math.abs((current.height ?? 0) - (nextHeight ?? 0)) < 0.0001 &&
      Math.abs((current.rotation ?? 0) - (nextAngle ?? 0)) < 0.0001
    )
      return
    const updated = {
      ...current,
      height: nextHeight,
      rotation: nextAngle,
      width
    }
    arr.splice(index, 1, updated)
  }

  function commitHeightChange() {
    if (!customLogo.value || !productKey.value) return
    const index = activeLogoIndex.value
    if (index === -1) return
    const option = positionForm.placementOption || previousPlacementOption.value
    const heightValue = Number.parseFloat(positionForm.height)
    if (Number.isNaN(heightValue)) return
    const prevHeight =
      heightChangeStart.value ?? Number(customLogo.value.height || option?.height || 0)
    if (Math.abs(prevHeight - heightValue) < 0.001) {
      heightChangeStart.value = null
      return
    }
    const widthValue = Number(customLogo.value.width || currentWidth.value || option?.width || 0)
    currentWidth.value = widthValue
    void historyStore.execute('logo.update-size', {
      key: productKey.value,
      index,
      prevWidth: widthValue,
      prevHeight,
      nextWidth: widthValue,
      nextHeight: heightValue
    })
    heightChangeStart.value = null
  }

  function handleBlurHeight() {
    positionForm.height = formatDimension(positionForm.height)
    commitHeightChange()
  }

  function formatDimension(value: string) {
    const numeric = Number.parseFloat(value)
    if (Number.isNaN(numeric)) return ''
    return numeric.toFixed(1)
  }

  const angleText = computed(() => `${positionForm.angle[0]}°`)

  watch(
    () => positionForm.angle[0],
    (nextAngle, previousAngle) => {
      if (nextAngle === previousAngle) return
      if (!customLogo.value || !productKey.value) return
      const index = activeLogoIndex.value
      if (index === -1) return
      const prevRotation = Number(customLogo.value.rotation || 0)
      if (Math.abs(prevRotation - Number(nextAngle)) < 0.001) return
      void historyStore.execute('logo.update-rotation', {
        key: productKey.value,
        index,
        prevRotation,
        nextRotation: Number(nextAngle)
      })
    }
  )

  function resetPositionToCenter() {
    if (!customLogo.value || !customizationStore.customization?.product_id) return
    positionForm.angle = [0]
    // TODO: dispatch history action to reset logo coordinates once available
  }

  function pinLogo() {
    // TODO: Implement pin logo functionality (locks placement)
  }

  function handleAngleCommit(value: number[]) {
    if (!customLogo.value || !productKey.value) {
      rotationChangeStart.value = null
      return
    }
    const index = activeLogoIndex.value
    if (index === -1) {
      rotationChangeStart.value = null
      return
    }
    const [rawNext] = value
    const nextRotation = Number(rawNext ?? 0)
    const prevRotation = rotationChangeStart.value ?? Number(customLogo.value.rotation || 0)
    rotationChangeStart.value = null
    if (Math.abs(prevRotation - nextRotation) < 0.1) return
    void historyStore.execute('logo.update-rotation', {
      key: productKey.value,
      index,
      prevRotation,
      nextRotation
    })
  }
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <div class="mt-5 flex flex-col items-center mx-4 md:mx-6 gap-4">
      <LogoCard
        v-if="customLogo"
        :logo="customLogo"
        @apply-colors="handleApplyColours"
        @delete="handleDeleteLogo"
      />
    </div>

    <Accordion type="multiple" :default-value="['remove-background', 'recolor']" class="space-y-4">
      <AccordionItem value="remove-background" class="overflow-hidden">
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Remove background</span>
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
              <p class="text-sm font-semibold">Simple remove</p>
              <p class="text-xs text-muted-foreground">
                Removes all pixels matching the top-left colour, even inside the logo.
              </p>
              <Button
                size="sm"
                variant="default"
                class="mt-1 self-start px-4"
                @click.stop="handleRemoveBackground('simple')"
                >Apply</Button
              >
            </div>
          </div>

          <div class="flex w-full items-start gap-4 rounded-2xl border p-4 text-left">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15">
              <ContentRemoveIcons type="smart" />
            </div>
            <div class="flex flex-1 flex-col gap-2">
              <p class="text-sm font-semibold">Content remove</p>
              <p class="text-xs text-muted-foreground">
                Removes the top-left colour only from the background, not the logo.
              </p>
              <Button
                size="sm"
                variant="default"
                class="mt-1 self-start px-4"
                @click.stop="handleRemoveBackground('smart')"
                >Apply</Button
              >
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="recolor" class="overflow-hidden">
        <AccordionTrigger class="px-4 md:px-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Recolor logo</span>
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
            @color-select="handleRecolorLogo"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="position" class="overflow-hidden">
        <AccordionTrigger class="mx-4 md:mx-6 py-4">
          <div
            class="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between md:gap-3"
          >
            <span class="text-base font-semibold">Position</span>
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
            <Label for="logo-placement" class="text-xs font-medium text-muted-foreground"
              >Placement</Label
            >
            <Select
              :model-value="positionForm.placementOption?.value ?? null"
              @update:model-value="handlePlacementChangeById"
            >
              <SelectTrigger id="logo-placement" class="h-9 w-full">
                <SelectValue
                  :value="positionForm.placementOption?.label"
                  placeholder="Select placement"
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
              <Label for="logo-height" class="text-xs font-medium text-muted-foreground"
                >Height</Label
              >
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
              <Label for="logo-angle" class="text-xs font-medium text-muted-foreground"
                >Angle</Label
              >
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
              Center logo
            </Button>
            <Button variant="outline" class="h-9" @click="pinLogo">
              <Pin class="size-4" />
              Pin logo
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>
