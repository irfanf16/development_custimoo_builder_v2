<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
  // import ProductDetailsDialog from '@/components/customizer/ProductDetailsDialog.vue'
  import { Check, Pencil } from 'lucide-vue-next'
  import {
    // summary_read_more,
    summary_selected_option,
    summary_addons,
    summary_no_addons,
    summary_logo_placement,
    summary_logo_size,
    summary_edit_roster,
    nav_style,
    nav_logo,
    nav_color,
    nav_text,
    nav_roster,
    roster_table_name,
    roster_table_number,
    roster_table_size,
    roster_table_quantity
  } from '@/paraglide/messages'
  import type { GradientColor, OutputProductText } from '@/services/products/types'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  // Stores
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()
  const sceneStore = useSceneStore()
  const { goTo, menuItems, pickStepOrNextAvailable } = useCustomizerMenu()
  const { effectiveLogos, effectiveSvgGroups } = useEffectiveSelectors()
  // Summary product preview: image from canvas instead of live TwoDScene

  const summaryPreviewImage = ref('')
  const summaryImageLoading = ref(true)
  onMounted(async () => {
    summaryImageLoading.value = true
    summaryPreviewImage.value = ''
    try {
      const is3DProduct = activeProductDetails.value?.is_3d_product
      const thumbOptions = { width: 256, height: 256 }
      if (is3DProduct) {
        const componentRef = sceneStore.threeDSceneRef
        if (componentRef?.getImageFromCanvas) {
          summaryPreviewImage.value = await componentRef.getImageFromCanvas('front', thumbOptions)
        }
      } else {
        const frontRef = sceneStore.getTwoDSceneRef('front')
        const getImage = frontRef?.getImageFromCanvas as
          | ((opts?: { width?: number; height?: number }) => Promise<string>)
          | undefined
        if (getImage) {
          summaryPreviewImage.value = await getImage(thumbOptions)
        }
      }
    } finally {
      summaryImageLoading.value = false
    }
  })

  const { activeProductDetails, activeStyleDetails } = storeToRefs(productsStore)
  const { activeProductTexts, rosterEntries } = storeToRefs(customizationStore)

  const locale = computed(() => profileStore.currentLocale || 'en')
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL

  // Dialog state
  // const showProductDetails = ref(false)
  // const productIdForDialog = computed(() => activeProductDetails.value?.id ?? 0)

  // Product section
  const productTitle = computed(() => {
    return (
      activeProductDetails.value?.sku?.sku_id ??
      activeProductDetails.value?.display_name ??
      'Product'
    )
  })

  const productDescription = computed(() => {
    const description = activeProductDetails.value?.sku?.description
    if (!description?.trim()) return ''
    // Truncate to ~100 characters
    if (description.length > 100) {
      return description.substring(0, 100) + '...'
    }
    return description
  })

  // Style section
  const styleName = computed(() => {
    return activeStyleDetails.value?.name ?? 'Style'
  })

  const styleThumbnail = computed(() => {
    return (
      activeStyleDetails.value?.style_icon_url ??
      productsStore.stylePreviews?.find(s => s.id === activeStyleDetails.value?.id)
        ?.style_icon_url ??
      ''
    )
  })

  // Addons
  const addons = computed(() => {
    const productId = customizationStore.activeProductId
    if (!productId) return []
    const addonsInfo = customizationStore.customization?.addons_info?.[productId]
    if (!addonsInfo?.simple_addons) return []

    // Get addon details from product details - addons property might not exist
    const productAddons = activeProductDetails.value?.active_addons ?? []
    return addonsInfo.simple_addons
      .map((addonId: number) => productAddons.find(a => a.addon_id === addonId))
      .filter(Boolean)
  })

  // Logos
  const logos = computed(() => effectiveLogos.value ?? [])
  const logosCount = computed(() => logos.value.length)

  // Colors
  const colors = computed(() => effectiveSvgGroups.value ?? [])

  // Texts - only show texts that have values
  const textsWithValues = computed(() => {
    return activeProductTexts.value.filter(text => text.value?.trim())
  })
  const textsCount = computed(() => textsWithValues.value.length)

  // Roster
  const roster = computed(() => rosterEntries.value ?? [])
  const rosterCount = computed(() => roster.value.length)

  // Navigation handlers – use visible steps so we never land on a hidden tab
  const visibleSteps = computed(() => menuItems.value.map(i => i.step))

  function handleLogoClick(logoId: string) {
    workflowStore.setActiveLogoId(logoId)
    workflowStore.setLogosSubStep('edit')
    void goTo(pickStepOrNextAvailable('logos', visibleSteps.value))
  }

  function handleColorClick(colorIndex: number) {
    workflowStore.setActiveColorAccordionIndex(colorIndex)
    void goTo(pickStepOrNextAvailable('colors', visibleSteps.value))
  }

  function handleTextClick(textId: number) {
    workflowStore.setActiveTextId(textId)
    const text = activeProductTexts.value.find(t => t.id === textId)
    const hasMultipleItems = (text?.items?.length ?? 0) > 1
    workflowStore.setTextsSubStep(hasMultipleItems ? 'multipleitems' : 'single')
    void goTo(pickStepOrNextAvailable('texts', visibleSteps.value))
  }

  function handleEditRoster() {
    void goTo(pickStepOrNextAvailable('roster', visibleSteps.value))
  }

  // Generate gradient CSS string
  function gradientColorString(gradientColors: GradientColor[]): string {
    if (!gradientColors || gradientColors.length === 0) return ''
    let cssColor = 'linear-gradient(90deg'
    gradientColors.forEach(gradientColor => {
      cssColor += ',' + gradientColor.color
    })
    cssColor += ')'
    return cssColor
  }

  // Get text type label
  function getTextTypeLabel(text: OutputProductText): string {
    switch (text.type) {
      case 'name':
        return 'Player name'
      case 'number':
        return 'Player number'
      case 'team_name':
        return 'Additional text'
      default:
        return text.label || 'Custom'
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6 pb-6">
    <!-- Product Section -->
    <div class="flex gap-4 px-4 md:px-6">
      <div
        class="shrink-0 w-32 h-32 rounded-xl border bg-muted overflow-hidden flex items-center justify-center"
      >
        <template v-if="summaryImageLoading">
          <Spinner class="size-8 text-muted-foreground" />
        </template>
        <img
          v-else-if="summaryPreviewImage"
          :src="summaryPreviewImage"
          :alt="productTitle"
          class="w-full h-full object-contain rounded-xl"
        />
      </div>
      <div class="flex-1 flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-foreground">{{ productTitle }}</h3>
        <p
          v-if="productDescription"
          class="text-sm text-muted-foreground"
          v-html="productDescription"
        ></p>
        <!-- <Button
          variant="ghost"
          size="sm"
          class="self-start -ml-4"
          @click="showProductDetails = true"
        >
          {{ summary_read_more({}, { locale }) }}
        </Button> -->
      </div>
    </div>

    <!-- Accordion Sections -->
    <Accordion type="multiple" :default-value="['style']" class="space-y-4 border-b">
      <!-- Style Section -->
      <AccordionItem value="style" class="mb-0">
        <AccordionTrigger class="px-4 py-3 md:py-4 hover:no-underline">
          <span class="text-base font-semibold">{{ nav_style({}, { locale }) }}</span>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-4">
            <!-- Style details -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex flex-col gap-1">
                <p class="text-sm font-semibold text-foreground">{{ styleName }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ summary_selected_option({}, { locale }) }}
                </p>
              </div>
              <div
                class="w-20 h-20 rounded-lg border bg-muted overflow-hidden flex items-center justify-center shrink-0"
              >
                <img
                  v-if="styleThumbnail"
                  :src="storageUrl + styleThumbnail"
                  :alt="styleName"
                  class="w-full h-full object-contain p-1"
                />
              </div>
            </div>

            <!-- Divider -->
            <div class="h-px bg-border" />
            <!-- Addons -->
            <div class="space-y-2">
              <p class="text-sm font-semibold text-foreground">
                {{ summary_addons({}, { locale }) }}
              </p>
              <div v-if="addons.length > 0" class="space-y-2">
                <div
                  v-for="addon in addons"
                  :key="addon?.addon_id"
                  class="flex items-center gap-2 text-sm text-foreground"
                >
                  <Check class="size-4 text-primary" />
                  <span>{{ addon?.title ?? '' }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground">
                {{ summary_no_addons({}, { locale }) }}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Logo Section -->
      <AccordionItem v-if="logosCount > 0" value="logos" class="mb-0">
        <AccordionTrigger class="px-4 py-3 md:py-4 hover:no-underline">
          <div class="flex items-center justify-between w-full">
            <span class="text-base font-semibold">{{ nav_logo({}, { locale }) }}</span>
            <Badge variant="secondary" class="h-5 min-w-5 flex items-center justify-center px-1.5">
              {{ logosCount }}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-0">
            <template v-for="(logo, index) in logos" :key="logo.id">
              <button
                class="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors text-left group"
                @click="handleLogoClick(logo.id.toString())"
              >
                <!-- Left: Placement -->
                <div class="flex flex-col gap-0.5">
                  <p class="text-sm font-semibold text-foreground">{{ logo.name_of_placement }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ summary_logo_placement({}, { locale }) }}
                  </p>
                </div>

                <!-- Middle: Size -->
                <div class="flex flex-col gap-0.5 items-center">
                  <p class="text-sm font-semibold text-foreground">
                    {{ logo.height?.toFixed(1) }} x {{ (logo.width || 0).toFixed(1) }} cm
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ summary_logo_size({}, { locale }) }}
                  </p>
                </div>

                <!-- Right: Logo thumbnail with pencil on hover -->
                <div
                  class="relative w-16 h-16 rounded-lg border bg-white overflow-hidden flex items-center justify-center shrink-0"
                >
                  <img
                    v-if="logo.url"
                    :src="storageUrl + logo.url"
                    :alt="logo.logo_name"
                    class="w-full h-full object-contain p-1"
                  />
                  <div
                    class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil class="size-4 text-white" />
                  </div>
                </div>
              </button>
              <div v-if="index < logos.length - 1" class="h-px bg-border" />
            </template>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Color Section -->
      <AccordionItem value="colors" class="mb-0">
        <AccordionTrigger class="px-4 py-3 md:py-4 hover:no-underline">
          <span class="text-base font-semibold">{{ nav_color({}, { locale }) }}</span>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-0">
            <template v-for="(color, index) in colors" :key="color.id">
              <button
                class="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors text-left group rounded-lg"
                @click="handleColorClick(index)"
              >
                <p class="text-sm text-muted-foreground capitalize">{{ color.id }}</p>
                <div class="flex items-center gap-2">
                  <p class="text-sm text-foreground">
                    <template v-if="color.gradient_colors">
                      <template v-for="(gc, gIndex) in color.gradient_colors" :key="gIndex">
                        {{ gc.pantone }}
                        <template v-if="gIndex < color.gradient_colors.length - 1">/</template>
                      </template>
                    </template>
                    <template v-else> {{ color.pantone }} {{ color.name }}</template>
                  </p>
                  <div class="relative">
                    <ColorSelector
                      :color="
                        color.gradient_colors
                          ? gradientColorString(color.gradient_colors)
                          : color.color
                      "
                      :disabled="true"
                      :size="'sm'"
                      class="shrink-0"
                    />
                    <div
                      class="absolute size-7 m-px inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil class="size-3 text-white" />
                    </div>
                  </div>
                </div>
              </button>
              <div v-if="index < colors.length - 1" class="h-px bg-border" />
            </template>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Text Section -->
      <AccordionItem v-if="textsCount > 0" value="texts" class="mb-0">
        <AccordionTrigger class="px-4 py-3 md:py-4 hover:no-underline">
          <div class="flex items-center justify-between w-full">
            <span class="text-base font-semibold">{{ nav_text({}, { locale }) }}</span>
            <Badge variant="secondary" class="h-5 min-w-5 flex items-center justify-center px-1.5">
              {{ textsCount }}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-2">
            <button
              v-for="(text, index) in textsWithValues"
              :key="text.id"
              class="w-full flex flex-col items-start gap-1 text-left group relative"
              @click="handleTextClick(text.id)"
            >
              <div v-if="index > 0" class="h-px bg-border w-full" />

              <div class="flex items-center justify-between w-full">
                <p class="text-sm text-foreground">{{ text.value }}</p>
                <Pencil
                  class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </div>
              <p class="text-xs text-muted-foreground">{{ getTextTypeLabel(text) }}</p>
            </button>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Roster Section -->
      <AccordionItem v-if="rosterCount > 0" value="roster" class="mb-0">
        <AccordionTrigger class="px-4 py-3 md:py-4 hover:no-underline">
          <div class="flex items-center justify-between w-full">
            <span class="text-base font-semibold">{{ nav_roster({}, { locale }) }}</span>
            <Badge variant="secondary" class="h-5 min-w-5 flex items-center justify-center px-1.5">
              {{ rosterCount }}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-3">
            <!-- Roster table -->
            <div class="rounded-lg border overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium text-muted-foreground">
                      {{ roster_table_name({}, { locale }) }}
                    </th>
                    <th class="text-left py-2 px-3 font-medium text-muted-foreground">
                      {{ roster_table_number({}, { locale }) }}
                    </th>
                    <th class="text-left py-2 px-3 font-medium text-muted-foreground">
                      {{ roster_table_size({}, { locale }) }}
                    </th>
                    <th class="text-left py-2 px-3 font-medium text-muted-foreground">
                      {{ roster_table_quantity({}, { locale }) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, index) in roster" :key="index" class="border-t">
                    <td class="py-2 px-3 text-foreground">{{ entry.text || '' }}</td>
                    <td class="py-2 px-3 text-foreground">{{ entry.number || '' }}</td>
                    <td class="py-2 px-3 text-foreground">{{ entry.size || '' }}</td>
                    <td class="py-2 px-3 text-foreground">{{ entry.quantity || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Button variant="outline" class="w-full" @click="handleEditRoster">
              {{ summary_edit_roster({}, { locale }) }}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>

  <!-- Product Details Dialog -->
  <!-- <ProductDetailsDialog
    :open="showProductDetails"
    :product-id="productIdForDialog"
    @update:open="showProductDetails = $event"
  /> -->
</template>

<style scoped></style>
