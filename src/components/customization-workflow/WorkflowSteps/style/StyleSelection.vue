<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  // Style previews use static icons (PNG) from style_icon_url, so no canvas is needed
  import { Checkbox } from '@/components/ui/checkbox'
  import { Label } from '@/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import {
    styles_title,
    addons_title,
    styles_alt_icon,
    styles_description_fallback,
    styles_choose_logo_position
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { OutputStylePreviewFront } from '@/services/products/types'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { usePricing } from '@/composables/usePricing'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const companyStore = useCompanyStore()
  const historyStore = useHistoryStore()

  const { showPricing } = usePricing()
  const productId = computed(
    () => productsStore.activeProductDetails?.id || customizationStore.activeProductId
  )
  const previews = computed(() => (productsStore.stylePreviews as OutputStylePreviewFront[]) || [])
  const showStylesLoading = computed(
    () =>
      productsStore.stylePreviews == null &&
      (productsStore.isLoading || (productId.value != null && productId.value !== 0))
  )
  const headerDescription = computed(() => {
    const p = productsStore.activeProductDetails
    const description = p?.sku?.description?.trim()
    if (description) return description
    return styles_description_fallback({}, { locale: profileStore.currentLocale })
  })

  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  onMounted(() => {
    if (!productsStore.stylePreviews && productId.value) {
      productsStore.fetchStylePreviews(productId.value as number)
    }

    visibleAddons.value.forEach(addon => {
      if (addon?.preselected == true) {
        addPreselectedAddons(addon.addon_id, true)
      }
    })

    // Ensure addons are loaded when product changes
    // if (productId.value) {
    //   productsStore.fetchProductAddons(productId.value as number)
    // }
  })

  watch(
    () => productId.value,
    async (pid, prev) => {
      if (!pid || pid === prev) return
      // Ensure details and previews reflect current product
      if (productsStore.activeProductDetails?.id !== pid) {
        await productsStore.fetchActiveProductDetails(pid as number)
      }
      await productsStore.fetchStylePreviews(pid as number)
    }
  )

  async function handleStyleSelection(styleId: number) {
    await productsStore.fetchActiveStyleDetails(styleId)
    // keep user on Styles; breadcrumbs will show updated style name
  }

  async function toggleAddon(addonId: number, checked: boolean) {
    const pid = Number(productId.value)
    if (!pid || !customizationStore.customization) return
    console.log('visible addons', visibleAddons.value)
    const addon = visibleAddons.value.find(a => a.addon_id === addonId)

    // If addon is preselected, do not remove it
    if (addon?.preselected) {
      return
    }

    const prevAddons = customizationStore.customization.addons_info?.[pid]?.addons || []
    const prevIds = prevAddons.map(a => a.addon_id)
    const nextIds = checked
      ? prevIds.includes(addonId)
        ? prevIds
        : [...prevIds, addonId]
      : prevIds.filter(id => id !== addonId)
    await historyStore.execute('addons.set', { productId: pid, prevIds, nextIds })
  }

  async function addPreselectedAddons(addonId: number, checked: boolean = true) {
    const pid = Number(productId.value)
    if (!pid || !customizationStore.customization) return
    const prevAddons = customizationStore.customization.addons_info?.[pid]?.addons || []
    const prevIds = prevAddons.map(a => a.addon_id)
    const nextIds = checked
      ? prevIds.includes(addonId)
        ? prevIds
        : [...prevIds, addonId]
      : prevIds.filter(id => id !== addonId)
    await historyStore.execute('addons.set', { productId: pid, prevIds, nextIds })
  }

  const visibleAddons = computed(() => {
    const details = productsStore.activeProductDetails
    const raw = details?.company_product?.is_custom_addons
    const isCustomAddons = ['1', 1, true, 'true'].includes(raw as string | number | boolean)
    if (details?.company_addons?.length && isCustomAddons) {
      return details.company_addons.map(a => ({
        addon_id: a.addon_id,
        title: a.addon_data?.title || ''
      })) as Array<{ addon_id: number; title: string; price: string; preselected: boolean }>
    }
    if (details?.product_addons?.length) {
      return details.product_addons.map(a => ({
        addon_id: a.addon_id,
        title: a.title || '',
        price: a.currencies[0]?.price.toString() || '0',
        preselected: a.selected
      })) as Array<{ addon_id: number; title: string; price: string; preselected: boolean }>
    }
    return []
  })

  // Header search config
  const styleSearchQuery = computed({
    get: () => '',
    set: (_v: string) => {}
  })
  const filteredPreviews = computed(() => {
    const q = (styleSearchQuery as { value?: string }).value?.trim?.().toLowerCase?.() || ''
    if (!q) return previews.value
    return previews.value.filter((s: OutputStylePreviewFront) => s.name.toLowerCase().includes(q))
  })

  const fixedLogoOptions = computed(() => productsStore.activeStyleDetails?.logo ?? [])
  const showFixedLogoSelector = computed(
    () =>
      fixedLogoOptions.value.length > 0 &&
      productsStore.activeStyleDetails?.is_fixed_logos_all === false
  )
  const selectedFixedLogoIndex = computed({
    get: () => {
      const current = Number(customizationStore.customization?.fixed_logo_index ?? 0)
      if (current >= 0 && current < fixedLogoOptions.value.length) return String(current)
      const defaultIdx = fixedLogoOptions.value.findIndex(
        logo => Number(logo.is_default ?? 0) === 1
      )
      return String(defaultIdx >= 0 ? defaultIdx : 0)
    },
    set: value => {
      const idx = Number(value)
      if (!Number.isFinite(idx) || idx < 0 || idx >= fixedLogoOptions.value.length) return
      customizationStore.setFixedLogoIndex(idx)
    }
  })

  watch(
    () => productsStore.activeStyleDetails?.id,
    () => {
      if (!showFixedLogoSelector.value) return
      const current = Number(customizationStore.customization?.fixed_logo_index ?? 0)
      if (current >= 0 && current < fixedLogoOptions.value.length) return
      const defaultIdx = fixedLogoOptions.value.findIndex(
        logo => Number(logo.is_default ?? 0) === 1
      )
      customizationStore.setFixedLogoIndex(defaultIdx >= 0 ? defaultIdx : 0)
    }
  )

  function getAddonCurrency(
    addonId: number
  ): { code: string; name: string; price: number; symbol: string } | null {
    const preferredCode = companyStore.localization.currency.code
    const details = productsStore.activeProductDetails

    const raw = details?.company_product?.is_custom_addons
    const isCustomAddons = ['1', 1, true, 'true'].includes(raw as string | number | boolean)
    // Prefer company_addons
    const companyAddon = details?.company_addons?.find(a => a.addon_id === addonId)
    const companyCurrencies = companyAddon?.addon_data?.currencies || []
    if (companyCurrencies.length && isCustomAddons) {
      const match = companyCurrencies.find(c => c.code === preferredCode)
      return match ?? companyCurrencies[0]!
    }
    // Fallback to product_addons
    const productAddon = details?.product_addons?.find(a => a.addon_id === addonId)
    const productCurrencies = productAddon?.currencies || []
    if (productCurrencies.length) {
      const match = productCurrencies.find(c => c.code === preferredCode)
      return match ?? productCurrencies[0]!
    }
    return null
  }

  function getAddonFormattedPrice(addonId: number): string | null {
    const cur = getAddonCurrency(addonId)
    if (!cur) return null
    // Prefer symbol from data when provided, otherwise company setting
    const companyCurrency = companyStore.localization.currency
    const symbolToUse = cur.symbol || companyCurrency.symbol
    const fixed = Number(cur.price ?? 0).toFixed(companyCurrency.decimalPlaces)
    return companyCurrency.position === 'after'
      ? `${fixed}${symbolToUse}`
      : `${symbolToUse}${fixed}`
  }
</script>

<template>
  <!-- Content -->
  <div v-if="showStylesLoading" class="flex items-center justify-center min-h-[200px] w-full">
    <Spinner class="size-8 text-primary" />
  </div>
  <div v-else class="flex flex-col md:gap-2 lg:gap-4 pr-4 md:mx-3">
    <div class="flex flex-col gap-2">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text-muted-foreground text-base leading-relaxed" v-html="headerDescription"></div>
    </div>
    <div class="flex flex-col gap-3 pt-3 lg:pt-6 pb-1 lg:pb-2">
      <div class="text-lg font-semibold font-brand">
        {{ styles_title({}, { locale: profileStore.currentLocale }) }}
      </div>
      <div class="grid grid-cols-2 gap-x-8 md:gap-x-16 gap-y-6 md:gap-y-8 px-4 md:px-6">
        <div v-for="s in filteredPreviews" :key="s.id" class="flex flex-col gap-3 items-start">
          <div class="text-base font-semibold">{{ s.name }}</div>
          <img
            :src="
              fromStorage(
                (s as any).style_icon_url ||
                  (productsStore.activeStyleDetails as any)?.style_icon_url ||
                  ''
              )
            "
            class="w-full aspect-square object-contain rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 hover:border-border transition-colors"
            :alt="styles_alt_icon({}, { locale: profileStore.currentLocale })"
            @click="handleStyleSelection((s as OutputStylePreviewFront).id)"
          />
        </div>
      </div>
    </div>
    <div
      v-if="visibleAddons.length"
      :key="productId as any"
      class="flex flex-col gap-3 pt-3 lg:pt-6 pb-1 lg:pb-2"
    >
      <div class="text-lg font-semibold">
        {{ addons_title({}, { locale: profileStore.currentLocale }) }}
      </div>
      <div class="flex flex-col gap-3">
        <div
          v-for="addon in visibleAddons"
          :key="addon.addon_id"
          class="flex items-center w-full gap-2"
        >
          <Checkbox
            :id="`checkbox-addon-${addon.addon_id}`"
            :model-value="
              !!(
                addon.preselected ||
                (productId &&
                  customizationStore.customization?.addons_info &&
                  customizationStore.customization.addons_info[productId]?.addons?.some(
                    infoAddon => infoAddon.addon_id === addon.addon_id
                  ))
              )
            "
            @update:model-value="toggleAddon(addon.addon_id, $event === true)"
          />
          <Label
            :for="`checkbox-addon-${addon.addon_id}`"
            class="flex items-center justify-between gap-1 w-full cursor-pointer"
          >
            {{ addon.title }}
            <template v-if="showPricing && getAddonFormattedPrice(addon.addon_id)">
              <span class="text-xs text-muted-foreground flex items-center gap-0.5">
                <span class="font-bold text-primary">+</span>
                <span class="font-bold text-primary">{{
                  getAddonFormattedPrice(addon.addon_id)
                }}</span>
              </span>
            </template>
          </Label>
        </div>
      </div>
    </div>
    <div v-if="showFixedLogoSelector" class="flex flex-col gap-3 pt-3 lg:pt-6 pb-1 lg:pb-2">
      <div class="text-lg font-semibold font-brand">
        {{ styles_choose_logo_position({}, { locale: profileStore.currentLocale }) }}
      </div>
      <RadioGroup v-model="selectedFixedLogoIndex" class="space-y-3">
        <div
          v-for="(logo, index) in fixedLogoOptions"
          :key="`${logo.id ?? index}-fixed-logo-option`"
          class="flex items-center space-x-2"
        >
          <RadioGroupItem :id="`fixed-logo-position-${index}`" :value="String(index)" />
          <Label :for="`fixed-logo-position-${index}`" class="cursor-pointer">
            {{ logo.placement_title || `Position ${index + 1}` }}
          </Label>
        </div>
      </RadioGroup>
    </div>
  </div>
</template>

<style scoped></style>
