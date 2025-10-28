<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  // Style previews use static icons (PNG) from style_icon_url, so no canvas is needed
  import { Checkbox } from '@/components/ui/checkbox'
  import { Label } from '@/components/ui/label'
  import { styles_title, addons_title, styles_alt_icon } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import type { OutputStylePreviewFront } from '@/services/products/types'
  import { useWorkflowHeaderConfig } from '@/composables/useWorkflowHeaderConfig'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useHistoryStore } from '@/stores/history/history.store'

  // no emits
  // no emits
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const localeStore = useLocaleStore()
  const companyStore = useCompanyStore()
  const historyStore = useHistoryStore()

  const productId = computed(
    () => productsStore.activeProductDetails?.id || customizationStore.activeProductId
  )
  const previews = computed(() => (productsStore.stylePreviews as OutputStylePreviewFront[]) || [])
  const headerDescription = computed(() => {
    const p = productsStore.activeProductDetails
    return p?.sku?.description || ''
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
    const prevIds = customizationStore.customization.addons_info?.[pid]?.simple_addons || []
    const nextIds = checked
      ? prevIds.includes(addonId)
        ? prevIds
        : [...prevIds, addonId]
      : prevIds.filter(id => id !== addonId)
    await historyStore.execute('addons.set', { productId: pid, prevIds, nextIds })
  }

  const visibleAddons = computed(() => {
    const details = productsStore.activeProductDetails
    if (details?.company_addons?.length) {
      return details.company_addons.map(a => ({
        addon_id: a.addon_id,
        title: a.addon_data?.title || ''
      })) as Array<{ addon_id: number; title: string; price: string }>
    }
    if (details?.product_addons?.length) {
      return details.product_addons.map(a => ({
        addon_id: a.addon_id,
        title: a.title || ''
      })) as Array<{ addon_id: number; title: string; price: string }>
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

  // Use function for dynamic breadcrumbs based on active product
  // Pass function so breadcrumbs are evaluated when config is accessed
  useWorkflowHeaderConfig(() => {
    const title = productsStore.activeProductDetails?.display_name || 'Styles'
    return { breadcrumbs: [{ label: title }] }
  })

  function getAddonCurrency(
    addonId: number
  ): { code: string; name: string; price: number; symbol: string } | null {
    const preferredCode = companyStore.localization.currency.code
    const details = productsStore.activeProductDetails
    // Prefer company_addons
    const companyAddon = details?.company_addons?.find(a => a.addon_id === addonId)
    const companyCurrencies = companyAddon?.addon_data?.currencies || []
    if (companyCurrencies.length) {
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
  <div class="flex flex-col gap-4 md:gap-6 pr-4 mx-4 md:mx-6">
    <div class="flex flex-col gap-2">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text-muted-foreground text-base leading-relaxed" v-html="headerDescription"></div>
    </div>
    <div class="flex flex-col gap-3 pt-6 pb-2">
      <div class="text-lg font-semibold font-brand">
        {{ styles_title({}, { locale: localeStore.currentLocale }) }}
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
            :alt="styles_alt_icon({}, { locale: localeStore.currentLocale })"
            @click="handleStyleSelection((s as OutputStylePreviewFront).id)"
          />
        </div>
      </div>
    </div>
    <div v-if="visibleAddons.length" :key="productId as any" class="flex flex-col gap-3 pt-6 pb-2">
      <div class="text-lg font-semibold">
        {{ addons_title({}, { locale: localeStore.currentLocale }) }}
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
                productId &&
                customizationStore.customization?.addons_info &&
                customizationStore.customization.addons_info[productId]?.simple_addons?.includes(
                  addon.addon_id
                )
              )
            "
            @update:model-value="toggleAddon(addon.addon_id, $event === true)"
          />
          <Label
            :for="`checkbox-addon-${addon.addon_id}`"
            class="flex items-center justify-between gap-1 w-full cursor-pointer"
          >
            {{ addon.title }}
            <template v-if="getAddonFormattedPrice(addon.addon_id)">
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
  </div>
</template>

<style scoped></style>
