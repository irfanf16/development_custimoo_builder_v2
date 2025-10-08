<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  // import { useProductsStore } from '@/stores/products/products.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  // no type imports needed here
  import { Button } from '@/components/ui/button'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import type { CustomLogo } from '@/services/logos/types'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import {
    logos_empty_drag_drop,
    logos_empty_click_to_upload,
    logos_supported_formats,
    logos_add_logo,
    logos_recent,
    logos_back,
    logos_editor,
    logos_recolor_logo,
    logos_primary,
    logos_more_options
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import { Trash } from 'lucide-vue-next'
  import LogoUploadingSkeleton from './LogoUploadingSkeleton.vue'

  const customizationStore = useCustomizationStore()
  // const productsStore = useProductsStore()
  const localeStore = useLocaleStore()
  const history = useHistoryStore()
  const logosStore = useLogosStore()
  const { effectiveProductId, effectiveSvgGroups } = useEffectiveSelectors()

  type SubPanel = 'list' | 'edit'
  const subPanel = ref<SubPanel>('list')

  // no product/styleBase needed in this panel

  // Recent logos state
  const customLogos = computed(() => {
    const key = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    if (!key || !map) return [] as CustomLogo[]
    return (map as Record<string, CustomLogo[]>)[key] || []
  })
  const showAllRecent = ref(false)
  const displayedRecentLogos = computed(() =>
    showAllRecent.value ? logosStore.recentLogos : logosStore.recentLogos?.slice(0, 4)
  )
  const shouldShowRecentSection = computed(
    () =>
      logosStore.isLoadingRecentLogos ||
      (logosStore?.recentLogos && logosStore.recentLogos.length > 0)
  )
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  onMounted(() => {})

  // Upload area state
  const isDragOver = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const activeLogos = customLogos
  const hasAnyLogo = computed(() => activeLogos.value.length > 0)

  function onClickUpload() {
    fileInputRef.value?.click()
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = true
  }
  function onDragLeave() {
    isDragOver.value = false
  }
  async function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) await doUpload(file)
  }

  async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) await doUpload(file)
    if (input) input.value = ''
  }

  async function doUpload(file: File) {
    if (!effectiveProductId.value) return
    const res = await logosStore.uploadLogo({
      file: file,
      product_id: effectiveProductId.value
    })
    if (res.success) {
      // Add uploaded logo into customization and collect colors
      const uploaded = res?.content?.result?.customer_logo
      if (uploaded) handleLogoAfterUpload(uploaded)
      return
      // After upload, go to placement selection
      // goToPlacement()
    }
  }

  // Apply colors from logo palette to first design groups
  function rgbArrToHex(arr: number[]): string {
    const [r, g, b] = arr
    const toHex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0')
    return `#${toHex(r ?? 0)}${toHex(g ?? 0)}${toHex(b ?? 0)}`
  }

  function applyLogoColors(logo: CustomLogo) {
    const palette = logo.logo_colors as number[][] | undefined
    if (!palette?.length || !effectiveSvgGroups.value?.length) return
    const hexColors = palette.map(c => rgbArrToHex(c))
    history.runBatch('Apply logo colors', add => {
      effectiveSvgGroups.value?.forEach((group, idx) => {
        const nextHex = hexColors[idx]
        if (!nextHex) return
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
          nextColor: { name: '', value: nextHex, position: 0 }
        })
      })
    })
  }

  function setUploadedLogoAsActive(logo: CustomLogo) {
    logosStore.setActiveLogo(logo)
  }

  function removeLogoFromCustomization(logo: CustomLogo) {
    const key = String(customizationStore.customization?.product_id || '')
    const index = customLogos.value.findIndex(l => l.id === logo.id)
    if (index !== -1) {
      history.execute('logo.remove', { key, index })
    }
  }

  function goToControls() {
    subPanel.value = 'edit'
    // integrate with workflow store if needed
  }
  function goToList() {
    subPanel.value = 'list'
    // integrate with workflow store if needed
  }

  function handleRecentLogoClick(logo: CustomLogo) {
    setUploadedLogoAsActive(logo)
    emit('go-to-placement')
  }

  function handleLogoAfterUpload(logo: CustomLogo) {
    setUploadedLogoAsActive(logo)
    emit('go-to-placement')
  }

  // Emit events for parent component
  const emit = defineEmits<{
    'select-logo': [logoId: string]
    'go-to-placement': []
  }>()

  function handleLogoClick(logo: CustomLogo) {
    emit('select-logo', logo.id.toString())
  }

  // Breadcrumbs only
  const headerExtras = { breadcrumbs: [{ label: 'Logos' }] }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="pb-6">
    <Transition name="logos-slide" mode="out-in" appear>
      <div :key="`logos-${subPanel}`">
        <div v-if="subPanel === 'list'" class="flex flex-col gap-4">
          <!-- Empty state uploader (shown when no logos yet) -->
          <div
            v-if="!hasAnyLogo && !logosStore.isLoadingUploadLogo"
            class="relative rounded-xl border border-dashed border-border p-4 md:p-6 flex flex-col items-center justify-center gap-2 text-center mx-4 md:mx-6 transition-colors"
            :class="isDragOver ? 'bg-secondary/20 border-primary/60 ring-2 ring-primary/30' : ''"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <i-other-image class="size-12 text-primary icon-secondary-from-primary-50" />
            </div>
            <div class="text-sm font-medium font-brand">
              {{ logos_empty_drag_drop({}, { locale: localeStore.currentLocale }) }}
              <button
                type="button"
                class="text-primary underline underline-offset-2"
                @click="onClickUpload"
              >
                {{ logos_empty_click_to_upload({}, { locale: localeStore.currentLocale }) }}
              </button>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ logos_supported_formats({}, { locale: localeStore.currentLocale }) }}
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />
          </div>
          <LogoUploadingSkeleton v-if="logosStore.isLoadingUploadLogo && !hasAnyLogo" />

          <!-- When logos exist: render each logo with swatches + actions -->
          <div v-if="hasAnyLogo" class="flex flex-col gap-4 mx-4 md:mx-6">
            <div
              v-for="logo in customLogos || []"
              :key="logo.id"
              class="relative group rounded-xl border border-border p-3 flex flex-col gap-3 bg-background cursor-pointer hover:bg-muted/50 transition-colors"
              @click="handleLogoClick(logo)"
            >
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-24 h-24 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                >
                  <img
                    :src="baseStorageUrl + logo.url"
                    class="max-h-full object-contain"
                    alt="uploaded logo"
                  />
                </div>
                <div class="flex flex-row justify-between w-full">
                  <div class="flex items-center">
                    <div
                      v-for="(c, idx) in logo.logo_colors || []"
                      :key="idx"
                      :class="[
                        'w-10 h-10 rounded-full border border-background',
                        idx > 0 ? '-ml-5' : ''
                      ]"
                      :style="{
                        backgroundColor: rgbArrToHex(c as number[]),
                        zIndex: 10 + idx
                      }"
                      :title="rgbArrToHex(c as number[])"
                    />
                  </div>
                  <Button
                    v-if="logo.logo_colors && logo.logo_colors.length > 0"
                    size="sm"
                    variant="outline"
                    @click="applyLogoColors(logo)"
                  >
                    Apply colors
                  </Button>
                </div>
              </div>
              <Button
                as="div"
                variant="ghost"
                size="icon"
                class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                @click.stop="removeLogoFromCustomization(logo)"
              >
                <Trash class="size-4" />
              </Button>
            </div>

            <div v-if="!logosStore.isLoadingUploadLogo">
              <Button variant="outline" class="rounded-lg w-full" @click="onClickUpload">
                {{ logos_add_logo({}, { locale: localeStore.currentLocale }) }}
              </Button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onFileChange"
              />
            </div>
            <LogoUploadingSkeleton v-else />
          </div>

          <div class="h-px bg-border" />

          <!-- Recent logos -->
          <div v-if="shouldShowRecentSection" class="flex flex-col gap-2 px-4 md:px-6">
            <div class="flex items-center justify-between">
              <div class="text-base leading-none font-semibold font-brand">
                {{ logos_recent({}, { locale: localeStore.currentLocale }) }}
              </div>
              <Button
                v-if="
                  !showAllRecent &&
                  displayedRecentLogos &&
                  displayedRecentLogos.length > 4 &&
                  !logosStore.isLoadingRecentLogos
                "
                variant="ghost"
                size="sm"
                class="px-2 py-1 h-7"
                @click="showAllRecent = true"
                >View all</Button
              >
            </div>
            <!-- Loading skeleton -->
            <div
              v-if="logosStore.isLoadingRecentLogos && displayedRecentLogos?.length === 0"
              class="grid grid-cols-4 gap-2"
            >
              <div
                v-for="i in 4"
                :key="i"
                class="aspect-square rounded-lg border border-border bg-primary/30 animate-pulse"
              />
            </div>
            <!-- List -->
            <div v-else class="grid grid-cols-4 gap-2">
              <button
                v-for="logo in displayedRecentLogos"
                :key="logo.id"
                class="relative group aspect-square rounded-lg border border-border overflow-hidden"
                @click="handleRecentLogoClick(logo)"
              >
                <img
                  :src="baseStorageUrl + logo.url"
                  class="w-full h-full object-cover"
                  alt="recent logo"
                />
                <Button
                  as="div"
                  variant="outline"
                  size="icon"
                  class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                  @click.stop="logosStore.deleteRecentLogo(logo.id.toString())"
                >
                  <Trash class="size-4" />
                </Button>
              </button>
            </div>
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
                  {{ logos_more_options({}, { locale: localeStore.currentLocale }) }}
                </div>
                <div class="grid grid-cols-8 gap-1">
                  <div v-for="i in 16" :key="i" class="h-6 bg-muted rounded" />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-lg" @click="goToControls">{{
              logos_back({}, { locale: localeStore.currentLocale })
            }}</Button>
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
