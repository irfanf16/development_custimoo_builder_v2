<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useProductsStore } from '@/stores/products'
  // Style previews use static icons (PNG) from style_icon_url, so no canvas is needed
  import { Checkbox } from '@/components/ui/checkbox'
  import { Label } from '@/components/ui/label'

  const productsStore = useProductsStore()

  const productId = computed(
    () => (productsStore.product as any)?.id || productsStore.activeProductId
  )
  const previews = computed(() => productsStore.stylePreviews || [])
  const headerDescription = computed(() => {
    const p = productsStore.product as any
    return p?.sku?.description || p?.description || ''
  })

  const storageBase = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''
  function fromStorage(path: string): string {
    const base = storageBase.endsWith('/') ? storageBase : storageBase + '/'
    const clean = path?.startsWith('/') ? path.slice(1) : path
    return base + clean
  }

  onMounted(() => {
    if (!productsStore.stylePreviews && productId.value) {
      productsStore.dispatchGetStylePreviews(productId.value as number)
    }
    // Ensure addons are loaded when product changes
    if (productId.value) {
      productsStore.dispatchGetProductAddons(productId.value as number)
    }
  })

  async function selectStyle(styleId: number) {
    await productsStore.dispatchGetActiveStyleDetails(styleId)
    await productsStore.dispatchGetDesignPreviewsByStyleId(styleId)
    // keep user on Styles; breadcrumbs will show updated style name
  }

  function toggleAddon(addonId: number) {
    if (!productsStore.activeAddons) return
    const idx = productsStore.activeAddons.findIndex(
      a => a.addon_id === addonId
    )
    if (idx >= 0) {
      const next = !productsStore.activeAddons[idx].selected
      productsStore.activeAddons[idx].selected = next
    }
  }

  const visibleAddons = computed(() => {
    if (productsStore.companyAddons && productsStore.companyAddons.length) {
      return productsStore.companyAddons as unknown as Array<any>
    }
    return productsStore.productAddons as unknown as Array<any>
  })
</script>

<template>
  <div class="flex flex-col gap-6 max-h-[640px] overflow-y-auto pr-4">
    <div class="flex flex-col gap-2 px-6">
      <div
        class="text-muted-foreground text-base leading-relaxed"
        v-html="headerDescription"
      ></div>
    </div>
    <div class="flex flex-col gap-3 pt-6 px-6 pb-2">
      <div class="text-lg font-semibold">Styles</div>
      <div class="grid grid-cols-2 gap-x-16 gap-y-8 px-6">
        <div
          v-for="s in previews"
          :key="s.id"
          class="flex flex-col gap-3 items-start"
        >
          <div class="text-base font-semibold">{{ s.name }}</div>
          <img
            :src="
              fromStorage(
                (s as any).style_icon_url ||
                  (productsStore.style as any)?.style_icon_url ||
                  ''
              )
            "
            class="w-full aspect-square object-contain rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/30 hover:border-border transition-colors"
            @click="selectStyle(s.id)"
            alt="Style icon"
          />
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-3 pt-6 px-6 pb-2">
      <div class="text-lg font-semibold">Addons</div>
      <div class="flex flex-col gap-2">
        <div
          v-for="addon in visibleAddons"
          :key="(addon as any).addon_id || (addon as any).addon_id"
          class="flex items-center gap-2"
        >
          <Checkbox
            :id="`checkbox-addon-${addon.addon_id}`"
            :checked="
              (productsStore.activeAddons || []).some(
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
      <!-- Prev/Next moved to MenuPanel footer slot -->
    </div>
  </div>
</template>

<style scoped></style>
