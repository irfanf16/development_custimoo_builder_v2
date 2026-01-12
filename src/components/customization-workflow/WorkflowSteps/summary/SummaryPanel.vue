<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { useBuildFactoryProduct } from '@/composables/useBuildFactoryProduct'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import ProductDetailsDialog from '@/components/customizer/ProductDetailsDialog.vue'
  import { Info, Check, ChevronRight, ShoppingCart } from 'lucide-vue-next'
  import { toast } from 'vue-sonner'
  import {
    summary_title,
    summary_description,
    summary_tooltip,
    summary_read_more,
    summary_selected_option,
    summary_addons,
    summary_no_addons,
    summary_logo_placement,
    summary_edit_roster,
    summary_mrsp,
    summary_for,
    summary_pcs,
    summary_estimated_delivery,
    nav_style,
    nav_logo,
    nav_color,
    nav_text,
    nav_roster,
    roster_table_name,
    roster_table_number,
    roster_table_size,
    roster_table_quantity,
    price_add_to_cart
  } from '@/paraglide/messages'
  import type { GradientColor, OutputProductText } from '@/services/products/types'

  // Stores
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()
  const cartStore = useCartStore()
  const { effectiveLogos, effectiveSvgGroups } = useEffectiveSelectors()
  const { buildFactoryProductPayload } = useBuildFactoryProduct()

  const { activeProductDetails, activeStyleDetails } = storeToRefs(productsStore)
  const { activeProductTexts, rosterEntries } = storeToRefs(customizationStore)

  const locale = computed(() => profileStore.currentLocale || 'en')
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL

  // Dialog state
  const showProductDetails = ref(false)
  const productIdForDialog = computed(() => activeProductDetails.value?.id ?? 0)

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

  const productThumbnail = computed(() => {
    return activeStyleDetails.value?.front_models?.[0]?.file_url ?? ''
  })

  // Style section
  const styleName = computed(() => {
    return activeStyleDetails.value?.name ?? 'Style'
  })

  const styleThumbnail = computed(() => {
    return activeStyleDetails.value?.front_models?.[0]?.file_url ?? ''
  })

  // Addons
  const addons = computed(() => {
    const productId = customizationStore.activeProductId
    if (!productId) return []
    const addonsInfo = customizationStore.customization?.addons_info?.[productId]
    if (!addonsInfo?.simple_addons) return []

    // Get addon details from product details - addons property might not exist
    const productAddons = (activeProductDetails.value as any)?.addons ?? []
    return addonsInfo.simple_addons
      .map((addonId: number) => productAddons.find((a: any) => a.addon_id === addonId))
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

  // Pricing
  const formattedPrice = computed(() => {
    const price = activeProductDetails.value?.sku?.customized_sku_info
    if (typeof price === 'number' && !Number.isNaN(price)) {
      return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }
    return null
  })

  const quantityText = computed(() => {
    const flexibleQuantity = activeProductDetails.value?.allowed_logos_count
    if (typeof flexibleQuantity === 'number' && flexibleQuantity > 0) {
      return flexibleQuantity
    }
    return 10
  })

  const estimatedDeliveryDate = computed(() => {
    // This would come from API, using placeholder for now
    return 'March 25-27, 2025'
  })

  // Navigation handlers
  function handleLogoClick(logoId: string) {
    workflowStore.setActiveLogoId(logoId)
    workflowStore.setLogosSubStep('edit')
    workflowStore.setActiveStep('logos')
  }

  function handleColorClick(_colorIndex: number) {
    workflowStore.setActiveStep('colors')
    // You could add logic here to auto-expand the selected color
  }

  function handleTextClick(textId: number) {
    workflowStore.setActiveTextId(textId)
    workflowStore.setTextsSubStep('edit')
    workflowStore.setActiveStep('texts')
  }

  function handleEditRoster() {
    workflowStore.setActiveStep('roster')
  }

  // Add to cart
  async function handleAddToCart() {
    try {
      const { factory_product, product_assets } = await buildFactoryProductPayload()

      await cartStore.addProductToCart({
        factory_product,
        product_assets
      })

      toast.success('Product added to cart', {
        position: 'top-right',
        richColors: true
      })
    } catch (error) {
      toast.error('Failed to add product to cart', {
        position: 'top-right',
        richColors: true
      })
      console.error('Add to cart error:', error)
    }
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
  <TooltipProvider>
    <div class="flex flex-col gap-6 pb-6">
      <!-- Header -->
      <div class="px-4 md:px-6 pt-4 md:pt-6 space-y-2">
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-semibold text-foreground">
            {{ summary_title({}, { locale }) }}
          </h2>
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="inline-flex items-center">
                <Info class="size-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p class="max-w-xs text-sm">{{ summary_tooltip({}, { locale }) }}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ summary_description({}, { locale }) }}
        </p>
      </div>

      <!-- Product Section -->
      <div class="px-4 md:px-6 border-b pb-6">
        <div class="flex gap-4">
          <div
            class="shrink-0 w-32 h-32 rounded-xl border bg-muted overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="productThumbnail"
              :src="storageUrl + productThumbnail"
              :alt="productTitle"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <h3 class="text-lg font-semibold text-foreground">{{ productTitle }}</h3>
            <p v-if="productDescription" class="text-sm text-muted-foreground">
              {{ productDescription }}
            </p>
            <Button
              variant="ghost"
              size="sm"
              class="self-start -ml-4"
              @click="showProductDetails = true"
            >
              {{ summary_read_more({}, { locale }) }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Accordion Sections -->
      <Accordion type="multiple" :default-value="['style']" class="space-y-4 px-4 md:px-6">
        <!-- Style Section -->
        <AccordionItem value="style" class="border rounded-xl">
          <AccordionTrigger class="px-4 py-3 hover:no-underline">
            <span class="text-base font-semibold">{{ nav_style({}, { locale }) }}</span>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-4">
              <!-- Style details -->
              <div class="flex items-center gap-3">
                <div
                  class="w-20 h-20 rounded-lg border bg-muted overflow-hidden flex items-center justify-center shrink-0"
                >
                  <img
                    v-if="styleThumbnail"
                    :src="storageUrl + styleThumbnail"
                    :alt="styleName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-foreground">{{ styleName }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ summary_selected_option({}, { locale }) }}
                  </p>
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
                    :key="addon.addon_id"
                    class="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Check class="size-4 text-primary" />
                    <span>{{ addon.addon_name }}</span>
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
        <AccordionItem v-if="logosCount > 0" value="logos" class="border rounded-xl">
          <AccordionTrigger class="px-4 py-3 hover:no-underline">
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold">{{ nav_logo({}, { locale }) }}</span>
              <Badge
                variant="secondary"
                class="h-5 min-w-5 flex items-center justify-center px-1.5"
              >
                {{ logosCount }}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-3">
              <button
                v-for="logo in logos"
                :key="logo.id"
                class="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                @click="handleLogoClick(logo.id.toString())"
              >
                <div
                  class="w-16 h-16 rounded-lg border bg-white overflow-hidden flex items-center justify-center shrink-0"
                >
                  <img
                    v-if="logo.url"
                    :src="storageUrl + logo.url"
                    :alt="logo.logo_name"
                    class="w-full h-full object-contain p-1"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2">
                    <p class="text-sm font-medium text-foreground">{{ logo.name_of_placement }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ logo.height?.toFixed(1) }} x {{ (logo.width || 0).toFixed(1) }} cm
                    </p>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    {{ summary_logo_placement({}, { locale }) }}
                  </p>
                </div>
                <ChevronRight
                  class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Color Section -->
        <AccordionItem value="colors" class="border rounded-xl">
          <AccordionTrigger class="px-4 py-3 hover:no-underline">
            <span class="text-base font-semibold">{{ nav_color({}, { locale }) }}</span>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-2">
              <button
                v-for="(color, index) in colors"
                :key="color.id"
                class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                @click="handleColorClick(index)"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
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
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-foreground truncate">{{ color.id }}</p>
                    <p class="text-xs text-muted-foreground truncate">
                      <template v-if="color.gradient_colors">
                        <template v-for="(gc, gIndex) in color.gradient_colors" :key="gIndex">
                          {{ gc.pantone }} {{ gc.name }}
                          <template v-if="gIndex < color.gradient_colors.length - 1"> / </template>
                        </template>
                      </template>
                      <template v-else> {{ color.pantone }} {{ color.name }} </template>
                    </p>
                  </div>
                </div>
                <ChevronRight
                  class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Text Section -->
        <AccordionItem v-if="textsCount > 0" value="texts" class="border rounded-xl">
          <AccordionTrigger class="px-4 py-3 hover:no-underline">
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold">{{ nav_text({}, { locale }) }}</span>
              <Badge
                variant="secondary"
                class="h-5 min-w-5 flex items-center justify-center px-1.5"
              >
                {{ textsCount }}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-2">
              <button
                v-for="text in textsWithValues"
                :key="text.id"
                class="w-full flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                @click="handleTextClick(text.id)"
              >
                <div class="flex items-center justify-between w-full">
                  <p class="text-sm font-medium text-foreground">{{ text.value }}</p>
                  <ChevronRight
                    class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </div>
                <p class="text-xs text-muted-foreground">{{ getTextTypeLabel(text) }}</p>
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Roster Section -->
        <AccordionItem v-if="rosterCount > 0" value="roster" class="border rounded-xl">
          <AccordionTrigger class="px-4 py-3 hover:no-underline">
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold">{{ nav_roster({}, { locale }) }}</span>
              <Badge
                variant="secondary"
                class="h-5 min-w-5 flex items-center justify-center px-1.5"
              >
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
                      <td class="py-2 px-3 text-foreground">{{ (entry as any).name }}</td>
                      <td class="py-2 px-3 text-foreground">{{ (entry as any).number }}</td>
                      <td class="py-2 px-3 text-foreground">{{ (entry as any).size }}</td>
                      <td class="py-2 px-3 text-foreground">{{ (entry as any).quantity }}</td>
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

      <!-- Pricing and Add to Cart -->
      <div class="px-4 md:px-6 space-y-4">
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            {{ summary_mrsp({}, { locale }) }}
          </p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-foreground">
              {{ formattedPrice || '$56.99' }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ summary_for({}, { locale }) }} {{ quantityText }}
              {{ summary_pcs({}, { locale }) }}
            </p>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ summary_estimated_delivery({}, { locale }) }} {{ estimatedDeliveryDate }}
          </p>
        </div>
        <Button variant="primary" size="lg" class="w-full" @click="handleAddToCart">
          <ShoppingCart class="size-4" />
          {{ price_add_to_cart({}, { locale }) }}
        </Button>
      </div>
    </div>

    <!-- Product Details Dialog -->
    <ProductDetailsDialog
      :open="showProductDetails"
      :product-id="productIdForDialog"
      @update:open="showProductDetails = $event"
    />
  </TooltipProvider>
</template>

<style scoped></style>
