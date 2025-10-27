<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  // Style previews use static icons (PNG) from style_icon_url, so no canvas is needed
  import { Checkbox } from '@/components/ui/checkbox'
  import { Label } from '@/components/ui/label'
  import { styles_title, addons_title, styles_alt_icon } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import type { OutputStylePreviewFront } from '@/services/products/types'
  import { useWorkflowHeaderConfig } from '@/composables/useWorkflowHeaderConfig'

  // no emits
  // no emits
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const localeStore = useLocaleStore()

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

  async function handleStyleSelection(styleId: number) {
    await productsStore.fetchActiveStyleDetails(styleId)
    // keep user on Styles; breadcrumbs will show updated style name
  }

  function toggleAddon(addonId: number) {
    if (!productsStore.activeProductDetails?.active_addons) return
    const idx = productsStore.activeProductDetails?.active_addons.findIndex(
      a => a.addon_id === addonId
    )
    if (idx >= 0) {
      // Use a setter to update store state
      // Update customization state with the new addon selection
      customizationStore.setAddons([...productsStore.activeProductDetails?.active_addons])
    }
  }

  const visibleAddons = computed(() => {
    if (
      productsStore.activeProductDetails?.company_addons &&
      productsStore.activeProductDetails?.company_addons.length
    ) {
      return (productsStore.activeProductDetails?.company_addons || []).map(a => ({
        addon_id: a.addon_id,
        title: a.addon_data.title
      })) as Array<{ addon_id: number; title: string }>
    }
    return (productsStore.activeProductDetails?.product_addons || []).map(a => ({
      addon_id: a.addon_id,
      title: a.title
    })) as Array<{ addon_id: number; title: string }>
  })

  // Breadcrumb logic for style selection
  const breadcrumbs = computed(() => {
    const title = productsStore.activeProductDetails?.display_name || 'Styles'
    return [{ label: title }]
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

  useWorkflowHeaderConfig({ breadcrumbs })
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
    <div class="flex flex-col gap-3 pt-6 pb-2">
      <div class="text-lg font-semibold">
        {{ addons_title({}, { locale: localeStore.currentLocale }) }}
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="addon in visibleAddons" :key="addon.addon_id" class="flex items-center gap-2">
          <Checkbox
            :id="`checkbox-addon-${addon.addon_id}`"
            :checked="
              (productsStore.activeProductDetails?.active_addons || []).some(
                a => a.addon_id === addon.addon_id && a.selected
              )
            "
            @change="toggleAddon(addon.addon_id)"
          />
          <Label :for="`checkbox-addon-${addon.addon_id}`">
            {{ addon.title }}
          </Label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
