<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import type {
    OutputProductDetails,
    OutputStyleDetails,
    OutputDesignDetails,
    OutputRecentLogo,
    OutputProductLogosSetting
  } from '@/services/products/types'
  import { Button } from '@/components/ui/button'
  import LogoPlacementThumb from './LogoPlacementThumb.vue'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import {
    logos_empty_drag_drop,
    logos_empty_click_to_upload,
    logos_supported_formats,
    logos_add_logo,
    logos_recent,
    logos_choose_placement,
    logos_back_to_logos,
    logos_save_placement,
    logos_back,
    logos_editor,
    logos_recolor_logo,
    logos_primary,
    logos_more_options
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const localeStore = useLocaleStore()
  const history = useHistoryStore()

  type SubPanel = 'list' | 'placement' | 'edit'
  const subPanel = ref<SubPanel>('list')
  // Sync local panel from workflow substep
  if (
    workflowStore.logosSubStep &&
    workflowStore.logosSubStep !== subPanel.value
  ) {
    subPanel.value = workflowStore.logosSubStep
  }

  const product = computed<OutputProductDetails | null>(
    () => productsStore.activeProductDetails ?? null
  )
  const styleBase = computed<OutputStyleDetails | null>(
    () => productsStore.activeStyleDetails ?? null
  )
  const designBase = computed<OutputDesignDetails | null>(
    () => productsStore.activeDesignDetails ?? null
  )
  const placements = computed<OutputProductLogosSetting[]>(
    () => product.value?.logos_setting || []
  )

  const activeLogos = computed(() => {
    const key = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    if (!key || !map) return [] as Array<{ url?: string }>
    return (
      (map as unknown as Record<string, Array<{ url?: string }>>)[key] || []
    )
  })

  function handleSelectRecentLogo(_logo: OutputRecentLogo) {
    const key = String(customizationStore.customization?.product_id || '')
    const logo = {
      id: _logo.id,
      product_id: productsStore.activeProductDetails?.id || 0,
      product_style_id: productsStore.activeStyleDetails?.id || null,
      following_product_ids: null,
      rotation: 0,
      originalWidth: 0,
      originalHeight: 0,
      width: 0,
      height: 0,
      name_of_placement: '',
      side: 'front' as const,
      x_axis: 0,
      y_axis: 0,
      x_axis_3d: 0,
      y_axis_3d: 0,
      is_locked: 0,
      logo_name: _logo.logo_name,
      url: _logo.url,
      haveControls: true,
      logo_colors: [],
      is_replace_success: false,
      logo_index: 0
    }
    history.execute('logo.add', { key, logo })
    goToControls()
  }

  function goToPlacement() {
    subPanel.value = 'placement'
    // integrate with workflow store if needed
  }
  function goToControls() {
    subPanel.value = 'edit'
    // integrate with workflow store if needed
  }
  function goToList() {
    subPanel.value = 'list'
    // integrate with workflow store if needed
  }
  // Breadcrumbs only
  const headerExtras = { breadcrumbs: [{ label: 'Logos' }] }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="p-6">
    <Transition name="logos-slide" mode="out-in" appear>
      <div :key="`logos-${subPanel}`">
        <div v-if="subPanel === 'list'" class="flex flex-col gap-4">
          <!-- Empty state uploader -->
          <div
            v-if="activeLogos.length === 0"
            class="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center gap-2 text-center"
          >
            <div
              class="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" class="w-6 h-6 text-muted-foreground">
                <path
                  fill="currentColor"
                  d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14Zm-2-2H5V5h14ZM8 13l2.03-2.71a1 1 0 0 1 1.58-.06L13 12l2-3l3 4Z"
                />
              </svg>
            </div>
            <div class="text-sm font-medium">
              {{
                logos_empty_drag_drop({}, { locale: localeStore.currentLocale })
              }}
              <button class="text-primary underline underline-offset-2">
                {{
                  logos_empty_click_to_upload(
                    {},
                    { locale: localeStore.currentLocale }
                  )
                }}
              </button>
            </div>
            <div class="text-xs text-muted-foreground">
              {{
                logos_supported_formats(
                  {},
                  { locale: localeStore.currentLocale }
                )
              }}
            </div>
          </div>

          <!-- When a logo exists -->
          <div
            v-else
            class="rounded-xl border border-border p-3 flex flex-col items-center gap-3"
          >
            <div
              class="w-full h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
            >
              <img
                :src="activeLogos[0]?.url || ''"
                class="max-h-full object-contain"
                alt="active logo"
              />
            </div>
            <Button variant="outline" class="rounded-lg w-full">{{
              logos_add_logo({}, { locale: localeStore.currentLocale })
            }}</Button>
          </div>

          <!-- Recent logos -->
          <div class="flex flex-col gap-2">
            <div class="text-lg font-semibold">
              {{ logos_recent({}, { locale: localeStore.currentLocale }) }}
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="logo in productsStore.recentLogos || []"
                :key="logo.id"
                class="aspect-square rounded-lg border border-border overflow-hidden"
                @click="handleSelectRecentLogo(logo)"
              >
                <img
                  :src="logo.url"
                  class="w-full h-full object-cover"
                  alt="recent logo"
                />
              </button>
            </div>
          </div>

          <div class="flex gap-3">
            <Button
              variant="outline"
              class="rounded-lg"
              @click="goToPlacement"
              >{{
                logos_choose_placement(
                  {},
                  { locale: localeStore.currentLocale }
                )
              }}</Button
            >
          </div>
        </div>

        <div v-else-if="subPanel === 'placement'" class="flex flex-col gap-4">
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="s in placements"
              :key="s.id"
              class="flex flex-col gap-2 items-center"
            >
              <LogoPlacementThumb
                v-if="product && styleBase && designBase"
                :product="product"
                :style-base="styleBase"
                :design-base="designBase"
                :setting="s"
                :width="112"
                :height="112"
              />
              <div class="text-xs text-muted-foreground truncate max-w-[112px]">
                {{ s.name_of_placement }}
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-lg" @click="goToList">{{
              logos_back_to_logos({}, { locale: localeStore.currentLocale })
            }}</Button>
            <Button variant="default" class="rounded-lg" @click="goToList">{{
              logos_save_placement({}, { locale: localeStore.currentLocale })
            }}</Button>
          </div>
        </div>

        <div v-else-if="subPanel === 'edit'" class="flex flex-col gap-4">
          <div class="text-sm">
            {{ logos_editor({}, { locale: localeStore.currentLocale }) }}
          </div>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-lg" @click="goToList">{{
              logos_back({}, { locale: localeStore.currentLocale })
            }}</Button>
            <Button variant="default" class="rounded-lg" disabled>{{
              logos_editor({}, { locale: localeStore.currentLocale })
            }}</Button>
          </div>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="text-sm">
            {{ logos_editor({}, { locale: localeStore.currentLocale }) }}
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="recolor">
              <template #trigger>{{
                logos_recolor_logo({}, { locale: localeStore.currentLocale })
              }}</template>
              <div class="flex flex-col gap-2">
                <div class="text-xs">
                  {{ logos_primary({}, { locale: localeStore.currentLocale }) }}
                </div>
                <div class="h-8 bg-muted rounded" />
                <div class="text-xs">
                  {{
                    logos_more_options(
                      {},
                      { locale: localeStore.currentLocale }
                    )
                  }}
                </div>
                <div class="grid grid-cols-8 gap-1">
                  <div v-for="i in 16" :key="i" class="h-6 bg-muted rounded" />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          <div class="flex gap-3">
            <Button
              variant="outline"
              class="rounded-lg"
              @click="goToControls"
              >{{
                logos_back({}, { locale: localeStore.currentLocale })
              }}</Button
            >
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .logos-slide-enter-active,
  .logos-slide-leave-active {
    transition:
      opacity 300ms ease,
      transform 300ms ease;
    will-change: opacity, transform;
  }
  .logos-slide-enter-from {
    opacity: 0;
    transform: translateX(32px);
  }
  .logos-slide-enter-to {
    opacity: 1;
    transform: translateX(0);
  }
  .logos-slide-leave-to {
    opacity: 0;
    transform: translateX(-32px);
  }
  .logos-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
  }
</style>
