<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useProductsStore } from '@/stores/products'
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
    logos_controls,
    logos_back,
    logos_editor,
    logos_recolor_logo,
    logos_primary,
    logos_more_options,
    logos_back_to_controls
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale'

  const productsStore = useProductsStore()
  const localeStore = useLocaleStore()

  type SubPanel = 'list' | 'placement' | 'controls' | 'editor'
  const subPanel = ref<SubPanel>('list')
  // Keep in sync with store-driven breadcrumbs
  watch(
    () => (productsStore as any).logosSubStep,
    step => {
      if (step && step !== subPanel.value) subPanel.value = step as SubPanel
    },
    { immediate: true }
  )

  const product = computed(() => (productsStore.product as any) || null)
  const styleBase = computed(() => (productsStore.style as any) || null)
  const designBase = computed(() => (productsStore.design as any) || null)
  const placements = computed(
    () => (product.value?.logos_setting as any[]) || []
  )

  function handleSelectRecentLogo(logo: any) {
    productsStore.addCustomLogoFromRecent(logo)
    goToControls()
  }

  function goToPlacement() {
    subPanel.value = 'placement'
    productsStore.setLogosSubStep('placement')
  }
  function goToControls() {
    subPanel.value = 'controls'
    productsStore.setLogosSubStep('controls')
  }
  function goToEditor() {
    subPanel.value = 'editor'
    productsStore.setLogosSubStep('editor')
  }
  function goToList() {
    subPanel.value = 'list'
    productsStore.setLogosSubStep('list')
  }
</script>

<template>
  <div class="p-4">
    <Transition name="logos-slide" mode="out-in" appear>
      <div :key="`logos-${subPanel}`">
        <div v-if="subPanel === 'list'" class="flex flex-col gap-4">
          <!-- Empty state uploader -->
          <div
            v-if="
              (productsStore.customizedProduct?.custom_logos?.length || 0) === 0
            "
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
                :src="
                  productsStore.customizedProduct?.custom_logos?.[
                    productsStore.selectedCustomLogoIdx ?? 0
                  ]?.url ||
                  productsStore.customizedProduct?.custom_logos?.[0]?.url
                "
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

        <div v-else-if="subPanel === 'controls'" class="flex flex-col gap-4">
          <div class="text-sm">
            {{ logos_controls({}, { locale: localeStore.currentLocale }) }}
          </div>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-lg" @click="goToList">{{
              logos_back({}, { locale: localeStore.currentLocale })
            }}</Button>
            <Button variant="default" class="rounded-lg" @click="goToEditor">{{
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
                logos_back_to_controls(
                  {},
                  { locale: localeStore.currentLocale }
                )
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
