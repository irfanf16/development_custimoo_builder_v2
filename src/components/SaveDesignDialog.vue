<script setup lang="ts">
  import ProductPreview from '@/components/product-preview/ProductPreview.vue'
  import { Button } from '@/components/ui/button'
  import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
  import { Input } from '@/components/ui/input'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { ArrowUpDown, Calendar, Check, Plus, SwatchBook } from 'lucide-vue-next'
  import { computed, ref, watch, type ComponentPublicInstance } from 'vue'

  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { InputSearchGroup } from '@/components/ui/input-search-group'
  import { base64ToFile, timeAgo as timeAgoUtil, uploadPresignedFiles } from '@/lib/utils'
  import type { Locker } from '@/services/lockers/types'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { storeToRefs } from 'pinia'
  import TwoDScene from './scene/TwoDScene.vue'

  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { objectToFormData } from '../lib/utils'
  import CreateLockerDialog from './locker-room/CreateLockerDialog.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    design_name_placeholder,
    design_search_locker_placeholder,
    save_design_title,
    save_design_choose_locker,
    save_design_button,
    locker_sort,
    locker_sort_last_modified,
    locker_sort_alphabetically,
    locker_sort_created_date,
    locker_create_locker,
    locker_designs_count,
    locker_cancel,
    time_ago_just_now,
    time_ago_seconds,
    time_ago_seconds_plural,
    time_ago_minutes,
    time_ago_minutes_plural,
    time_ago_hours,
    time_ago_hours_plural,
    time_ago_days,
    time_ago_days_plural,
    time_ago_yesterday,
    time_ago_months,
    time_ago_months_plural,
    time_ago_years,
    time_ago_years_plural
  } from '@/paraglide/messages'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type TwoDSceneRef = {
    getImageFromCanvas: () => string
  } | null
  const props = defineProps<{
    open: boolean
  }>()

  const emit = defineEmits(['update:open', 'save-design', 'create-locker', 'select-locker'])

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const sortOption = ref<SortOption>('alphabetical')
  const sceneStore = useSceneStore()
  const productName = ref('')
  const selectedLockerId = ref<number | null>(null)

  const frontImage = ref('')
  const backImage = ref('')
  const lockerStore = useLockerRoomStore()
  const workflowStore = useWorkflowStore()
  const lockerStoreRef = storeToRefs(lockerStore)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const isSubmitting = ref<boolean>(false)
  const createLocker = ref<boolean>(false)
  const { activeProductDetails } = storeToRefs(productsStore)
  const customizationStoreRef = storeToRefs(customizationStore)

  const timeAgoMessages = computed(() => ({
    just_now: () => time_ago_just_now({}, { locale: locale.value }),
    seconds: (params: { count: number }) => time_ago_seconds(params, { locale: locale.value }),
    seconds_plural: (params: { count: number }) =>
      time_ago_seconds_plural(params, { locale: locale.value }),
    minutes: (params: { count: number }) => time_ago_minutes(params, { locale: locale.value }),
    minutes_plural: (params: { count: number }) =>
      time_ago_minutes_plural(params, { locale: locale.value }),
    hours: (params: { count: number }) => time_ago_hours(params, { locale: locale.value }),
    hours_plural: (params: { count: number }) =>
      time_ago_hours_plural(params, { locale: locale.value }),
    days: (params: { count: number }) => time_ago_days(params, { locale: locale.value }),
    days_plural: (params: { count: number }) =>
      time_ago_days_plural(params, { locale: locale.value }),
    yesterday: () => time_ago_yesterday({}, { locale: locale.value }),
    months: (params: { count: number }) => time_ago_months(params, { locale: locale.value }),
    months_plural: (params: { count: number }) =>
      time_ago_months_plural(params, { locale: locale.value }),
    years: (params: { count: number }) => time_ago_years(params, { locale: locale.value }),
    years_plural: (params: { count: number }) =>
      time_ago_years_plural(params, { locale: locale.value })
  }))

  const localizedTimeAgo = (dateTime: string) => timeAgoUtil(dateTime, timeAgoMessages.value)

  const lockers = computed(() => lockerStoreRef.lockers.value)

  const search = ref('')

  const filteredLockers = computed(() => {
    if (!search.value) return lockers.value
    return lockers.value.filter(l => l.room_name.toLowerCase().includes(search.value.toLowerCase()))
  })

  const handleSelectLocker = (locker: Locker) => {
    selectedLockerId.value = locker.id
    emit('select-locker', locker)
  }
  let frontImageComponentRef: TwoDSceneRef = sceneStore.getTwoDSceneRef('front')
  if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
    frontImage.value = (
      frontImageComponentRef as unknown as ComponentPublicInstance & {
        getImageFromCanvas: () => string
      }
    ).getImageFromCanvas()
  }

  let backImageComponentRef: TwoDSceneRef = sceneStore.getTwoDSceneRef('back')
  if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
    backImage.value = (
      backImageComponentRef as unknown as ComponentPublicInstance & {
        getImageFromCanvas: () => string
      }
    ).getImageFromCanvas()
  }

  let componentRef = sceneStore.threeDSceneRef
  if (componentRef && 'getImageFromCanvas' in componentRef) {
    frontImage.value = (
      componentRef as unknown as ComponentPublicInstance & {
        getImageFromCanvas: (side?: string) => string
      }
    ).getImageFromCanvas('front')
    backImage.value = (
      componentRef as unknown as ComponentPublicInstance & {
        getImageFromCanvas: (side?: string) => string
      }
    ).getImageFromCanvas('back')
  }
  const handleSave = async () => {
    if (!selectedLockerId.value) return
    isSubmitting.value = true
    const signedUrls = await lockerStore.getSignedUrl(selectedLockerId.value)
    if (!signedUrls) {
      isSubmitting.value = false
      return
    } else {
      const preparedFiles = signedUrls.urls.map(u => {
        return {
          presigned_url: u.presigned_url,
          file_type: u.file_type,
          file:
            u.file_side === 'front'
              ? base64ToFile(frontImage.value, 'front.png')
              : base64ToFile(backImage.value, 'back.png'),
          file_side: u.file_side
        }
      })
      const results = await uploadPresignedFiles(preparedFiles)
      if (results.every(r => r.success)) {
        const customization = customizationStore.customization
        const productId = activeProductDetails.value!.product_id
        const productKey = String(productId)

        // Get svg_parts from active design details
        const svgParts = productsStore.activeDesignDetails?.svg_parts || []

        // Get custom logos
        const customLogos = customization?.custom_logos[productKey] || []

        // Get product custom texts
        const productCustomTexts = customization?.product_custom_texts[productKey] || []

        // Get roster detail
        const rosterDetail = customization?.products_rosters[productKey] || []

        // Get default colors
        const defaultColors = customization?.default_colors || []

        // Get group colors
        const groupColors = customization?.group_colors || {}

        // Get svgcolors from svgGroups
        const svgcolors = productsStore.svgGroups.map(group => ({
          value: group.color || '',
          name: group.name || '',
          pantone: group.pantone || ''
        }))

        // Get addons info
        const addonsInfo = customization?.addons_info || {}
        // grouped_addons should be an object (empty object if no grouped addons)
        const groupedAddons =
          Object.keys(addonsInfo).length > 0
            ? Object.values(addonsInfo).reduce(
                (acc, addonInfo: any) => {
                  // Merge all grouped_addons from all products
                  const grouped = addonInfo?.grouped_addons || {}
                  return { ...acc, ...grouped }
                },
                {} as Record<string, unknown>
              )
            : {}
        const ungroupedAddons = Object.values(addonsInfo).flatMap(
          (addonInfo: any) => addonInfo?.ungrouped_addons || []
        )

        // Build locker product payload matching API structure
        let locker = {
          addons: [],
          roster_url: false,
          room_id: selectedLockerId.value,
          product_id: productId,
          product_name: productName.value || '',
          svg_parts: svgParts,
          style_id: customizationStoreRef.activeStyleId.value || 0,
          design_id: customizationStore.activeDesignId || 0,
          custom_logos: customLogos,
          text: productCustomTexts,
          colors: [],
          shuffle_color_number: customization?.shuffle_color_number || 0,
          defaultcolors: defaultColors,
          groupcolors: groupColors,
          front_image: signedUrls.urls.find(item => item.file_side === 'front')!.original_url,
          back_image: signedUrls.urls.find(item => item.file_side === 'back')!.original_url,
          product_roster_detail: rosterDetail,
          fixed_logo_index: customization?.fixed_logo_index || 0,
          svgcolors: svgcolors,
          grouped_addons: groupedAddons,
          ungrouped_addons: ungroupedAddons,
          group_patterns: customization?.group_patterns || {}
        }
        const payload = objectToFormData(locker)
        const success = await lockerStore.saveDesignToLocker(
          payload,
          selectedLockerId.value,
          locker.front_image
        )
        if (success) {
          isSubmitting.value = false
          emit('update:open', false)
        } else {
          isSubmitting.value = false
        }
      }
    }
  }
  const handlePreviewToggle = () => {
    workflowStore.toggleActiveCanvasSide()
  }

  watch(
    () => props.open,
    async (newVal: boolean) => {
      if (newVal) {
        if (!lockerStoreRef.lockers.value.length) {
          await lockerStore.fetchLockers()
        }
        frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
        if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
          frontImage.value = (
            frontImageComponentRef as unknown as TwoDSceneRef & {
              getImageFromCanvas: () => string
            }
          ).getImageFromCanvas()
        }

        backImageComponentRef = sceneStore.getTwoDSceneRef('back')
        if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
          backImage.value = (
            backImageComponentRef as unknown as TwoDSceneRef & {
              getImageFromCanvas: () => string
            }
          ).getImageFromCanvas()
        }
        componentRef = sceneStore.threeDSceneRef
        if (componentRef && 'getImageFromCanvas' in componentRef) {
          frontImage.value = (
            componentRef as unknown as ComponentPublicInstance & {
              getImageFromCanvas: (side?: string) => string
            }
          ).getImageFromCanvas('front')
          backImage.value = (
            componentRef as unknown as ComponentPublicInstance & {
              getImageFromCanvas: (side?: string) => string
            }
          ).getImageFromCanvas('back')
        }
      }
    }
  )

  const handleClick = () => {
    createLocker.value = true
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="w-full flex flex-col gap-0 p-0 overflow-hidden h-fit">
      <!-- HEADER -->
      <DialogHeader class="p-4">
        <h2 class="text-lg font-semibold">{{ save_design_title({}, { locale }) }}</h2>
      </DialogHeader>
      <div class="flex overflow-hidden p-4">
        <!-- LEFT: PRODUCT PREVIEW -->
        <div
          class="w-[60%] p-6 flex items-center justify-center bg-accent relative h-fit! rounded-[20px]"
        >
          <ProductPreview class="h-fit!" />

          <div
            v-if="!activeProductDetails?.is_3d_product"
            class="w-fit h-fit p-2 rounded-2xl backdrop-blur-sm bg-white absolute right-6 bottom-6 z-[100] cursor-pointer"
            @click="handlePreviewToggle"
          >
            <div class="size-24 flex items-center justify-center">
              <TwoDScene
                :side="workflowStore.activeCanvasSide === 'front' ? 'back' : 'front'"
                :main-preview="true"
                :canvas-width="600"
                :canvas-height="600"
                canvas-class="w-full h-full object-contain rounded-lg transition-opacity duration-300"
              />
            </div>
          </div>
        </div>

        <!-- RIGHT: LOCKER LIST -->
        <div class="w-[40%] flex flex-col p-6 pb-0! gap-3">
          <div class="flex flex-col gap-3">
            <Input
              v-model="productName"
              :placeholder="design_name_placeholder({}, { locale })"
              class="h-9 bg-accent"
              :disabled="isSubmitting"
            />
            <h4 class="text-sm font-semibold mb-0">
              {{ save_design_choose_locker({}, { locale }) }}
            </h4>
            <div class="flex items-center justify-between gap-1">
              <InputSearchGroup
                v-model="search"
                :placeholder="design_search_locker_placeholder({}, { locale })"
                class="w-full h-9 bg-accent"
                :disabled="isSubmitting"
                @update:model-value="
                  (val: string | number) => {
                    search = val as string
                  }
                "
              />

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="flex items-center gap-2 h-9">
                    <ArrowUpDown class="w-4 h-4" />
                    {{ locker_sort({}, { locale }) }}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent class="w-48">
                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'lastModified' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_last_modified({}, { locale }) }}
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'alphabetical' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_alphabetically({}, { locale }) }}
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Check
                      :class="{ '!opacity-100': sortOption === 'createdDate' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_created_date({}, { locale }) }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                class="h-9 flex items-center gap-2"
                :disabled="isSubmitting"
                @click="handleClick"
              >
                <Plus class="w-4 h-4" /> {{ locker_create_locker({}, { locale }) }}
              </Button>
            </div>
          </div>

          <!-- LIST SECTION -->
          <ScrollArea class="flex-1 px-6 py-4 h-full overflow-y-auto p-3 border rounded-lg">
            <!-- <div class="grid gap-4 h-full"> -->
            <div
              v-for="locker in filteredLockers"
              :key="locker.id"
              class="flex gap-4 rounded-lg cursor-pointer hover:bg-accent transition mb-4 p-1 last-of-type:mb-0"
              :class="{
                'bg-primary/20': selectedLockerId === locker.id,
                'pointer-events-none': isSubmitting,
                'cursor-not-allowed': isSubmitting
              }"
              @click="handleSelectLocker(locker)"
            >
              <!-- THUMBNAIL -->
              <div
                class="w-20 h-20 grid gap-1 overflow-hidden rounded-md border bg-accent p-2"
                :class="[
                  locker.product_thumbnails.length === 1 && 'place-items-center',
                  locker.product_thumbnails.length === 2 && 'grid-cols-2',
                  locker.product_thumbnails.length === 3 && 'grid-cols-2 grid-rows-2',
                  locker.product_thumbnails.length >= 4 && 'grid-cols-2 grid-rows-2'
                ]"
              >
                <img
                  v-for="(img, i) in locker.product_thumbnails.slice(0, 4)"
                  :key="i"
                  :src="baseStorageUrl + img"
                  class="object-contain w-full h-full"
                />
              </div>

              <!-- META -->
              <div class="flex flex-col gap-1">
                <div class="font-medium">{{ locker.room_name }}</div>

                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span class="flex items-center gap-1">
                    <SwatchBook class="size-3" />
                    {{ locker.product_count }} {{ locker_designs_count({}, { locale }) }}
                  </span>

                  <span class="w-1 h-1 rounded-full bg-muted-foreground"></span>

                  <span class="flex items-center gap-1">
                    <Calendar class="size-3" />
                    {{ localizedTimeAgo(locker.updated_at) }}
                  </span>
                </div>
              </div>
            </div>
            <!-- </div> -->
          </ScrollArea>
          <div
            class="flex justify-end gap-3"
            :class="{ 'pointer-events-none': !selectedLockerId || isSubmitting }"
          >
            <Button variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              {{ locker_cancel({}, { locale }) }}
            </Button>
            <Button :disabled="!selectedLockerId || isSubmitting" @click="handleSave">
              {{ save_design_button({}, { locale }) }}
            </Button>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
    </DialogContent>
  </Dialog>
  <CreateLockerDialog :open="createLocker" @update:open="createLocker = $event" />
</template>
