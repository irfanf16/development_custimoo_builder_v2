<script setup lang="ts">
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
  import { urlToBase64 } from '@/services/files/file.service'
  import { useProductsStore } from '@/stores/products/products.store'
  import { useSceneStore } from '@/stores/scene/scene.store'
  import { storeToRefs } from 'pinia'

  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import CreateLockerDialog from './locker-room/CreateLockerDialog.vue'
  import type { SaveLockerProductPayload } from '@/services/lockers/types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import {
    design_name_placeholder,
    design_search_locker_placeholder,
    save_design_title,
    save_design_choose_locker,
    save_design_button,
    save_design_name_required,
    save_design_locker_required,
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
  import Spinner from './ui/spinner/Spinner.vue'
  import { onImageError, PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type TwoDSceneRef = {
    getImageFromCanvas: () => Promise<string>
  } | null
  const props = defineProps<{
    open: boolean
  }>()

  const emit = defineEmits([
    'update:open',
    'save-design',
    'saved-to-locker',
    'create-locker',
    'select-locker'
  ])

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const sortOption = ref<SortOption>('lastModified')
  const sceneStore = useSceneStore()
  const productName = ref('')
  const selectedLockerId = ref<number | null>(null)

  // Validation errors – only show after user has attempted submit
  const formSubmitted = ref(false)
  const designNameError = ref<string | null>(null)
  const lockerSelectionError = ref<string | null>(null)

  const frontImage = ref('')
  const backImage = ref('')
  const mainDisplaySide = ref<'front' | 'back'>('front')
  const imagesLoading = ref(false)
  const lockerStore = useLockerRoomStore()
  const lockerStoreRef = storeToRefs(lockerStore)
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const uiStore = useUIStore()
  const isSubmitting = ref<boolean>(false)
  const createLocker = ref<boolean>(false)
  const { activeProductDetails } = storeToRefs(productsStore)
  const customizationStoreRef = storeToRefs(customizationStore)

  // Check if we have order product data (factory product with front/back images for display and urlToBase64 save flow)
  const orderProductData = computed(() => uiStore.orderProductData)
  const factoryProduct = computed(() => orderProductData.value?.product ?? null)
  const useFactoryProductImages = computed(
    () => !!factoryProduct.value?.front_image && !!factoryProduct.value?.back_image
  )

  // Collection product context (from CollectionView): use folder-based image URLs and build payload from plr
  const collectionProduct = computed(() => uiStore.saveDesignDialogCollectionProduct)
  // const useCollectionProductImages = computed(
  //   () =>
  //     !!collectionProduct.value?.product_locker_room?.locker_product_images_folder &&
  //     !!frontImage.value &&
  //     !!backImage.value
  // )
  const baseStorageUrlForCollection = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  const toDisplayImageUrl = (pathOrUrl: string) =>
    pathOrUrl.startsWith('http') ? pathOrUrl : baseStorageUrl.value + pathOrUrl

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
    return lockers.value
      .filter(l =>
        l.room_name.toLowerCase().includes(search.value ? search.value.toLowerCase() : '')
      )
      .sort((a, b) => {
        switch (sortOption.value) {
          case 'alphabetical':
            return a.room_name.localeCompare(b.room_name)

          case 'createdDate':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

          case 'lastModified':
          default:
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        }
      })
  })

  const handleSelectLocker = (locker: Locker) => {
    selectedLockerId.value = locker.id
    lockerSelectionError.value = null
    emit('select-locker', locker)
  }

  // Validation functions
  const validateDesignName = (): boolean => {
    const trimmedName = productName.value?.trim() || ''
    if (!trimmedName) {
      designNameError.value = save_design_name_required({}, { locale: locale.value })
      return false
    }
    designNameError.value = null
    return true
  }

  const validateLockerSelection = (): boolean => {
    if (!selectedLockerId.value) {
      lockerSelectionError.value = save_design_locker_required({}, { locale: locale.value })
      return false
    }
    lockerSelectionError.value = null
    return true
  }

  const validateForm = (): boolean => {
    const isDesignNameValid = validateDesignName()
    const isLockerValid = validateLockerSelection()
    return isDesignNameValid && isLockerValid
  }

  let frontImageComponentRef: TwoDSceneRef = sceneStore.getTwoDSceneRef('front')
  let backImageComponentRef: TwoDSceneRef = sceneStore.getTwoDSceneRef('back')
  let componentRef = sceneStore.threeDSceneRef

  const handleSave = async () => {
    formSubmitted.value = true
    if (!validateForm()) {
      return
    }

    let frontBase64: string
    let backBase64: string

    if (useFactoryProductImages.value && factoryProduct.value) {
      // Convert factory product image URLs to base64 via API
      const fileUrls = [factoryProduct.value.front_image!, factoryProduct.value.back_image!]
      const base64Files = await urlToBase64(fileUrls)
      if (base64Files.length < 2) {
        console.error('URL_TO_BASE64 did not return both front and back images')
        return
      }
      frontBase64 = base64Files[0]!
      backBase64 = base64Files[1]!
    } else if (collectionProduct.value && frontImage.value && backImage.value) {
      // Collection product: frontImage/backImage are full URLs (from locker_product_images_folder)
      const fileUrls = [frontImage.value, backImage.value]
      const base64Files = await urlToBase64(fileUrls)
      if (base64Files.length < 2) {
        console.error('URL_TO_BASE64 did not return both front and back images')
        return
      }
      frontBase64 = base64Files[0]!
      backBase64 = base64Files[1]!
    } else {
      // Use canvas images; ensure we have them
      if (!frontImage.value || !backImage.value) {
        const is3DProduct = activeProductDetails.value?.is_3d_product
        if (is3DProduct) {
          componentRef = sceneStore.threeDSceneRef
          if (componentRef && 'getImageFromCanvas' in componentRef) {
            const getImage = (
              componentRef as unknown as ComponentPublicInstance & {
                getImageFromCanvas: (side?: string) => Promise<string>
              }
            ).getImageFromCanvas
            if (!frontImage.value) frontImage.value = await getImage('front')
            if (!backImage.value) backImage.value = await getImage('back')
          }
        } else {
          if (!frontImage.value) {
            frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
            if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
              frontImage.value = await frontImageComponentRef.getImageFromCanvas()
            }
          }
          if (!backImage.value) {
            backImageComponentRef = sceneStore.getTwoDSceneRef('back')
            if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
              backImage.value = await backImageComponentRef.getImageFromCanvas()
            }
          }
        }
      }
      if (!frontImage.value || !backImage.value) {
        console.error('Failed to get images from canvas')
        return
      }
      frontBase64 = frontImage.value
      backBase64 = backImage.value
    }

    isSubmitting.value = true
    const signedUrls = await lockerStore.getSignedUrl(selectedLockerId.value!)
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
              ? base64ToFile(frontBase64, 'front.png')
              : base64ToFile(backBase64, 'back.png'),
          file_side: u.file_side
        }
      })

      let locker: SaveLockerProductPayload
      const results = await uploadPresignedFiles(preparedFiles)
      if (results.every(r => r.success)) {
        const frontUrl = signedUrls.urls.find(item => item.file_side === 'front')!.original_url
        const backUrl = signedUrls.urls.find(item => item.file_side === 'back')!.original_url

        if (collectionProduct.value) {
          const plr = collectionProduct.value.product_locker_room
          const parseJson = <T,>(s: string, fallback: T): T => {
            if (!s || typeof s !== 'string') return fallback
            try {
              return JSON.parse(s) as T
            } catch {
              return fallback
            }
          }
          const svgParts = parseJson<unknown[]>(plr.product_attribute, [])
          const parsedSvgParts = Array.isArray(svgParts)
            ? svgParts
            : typeof svgParts === 'object' && svgParts !== null && 'svg_parts' in svgParts
              ? ((svgParts as { svg_parts?: unknown[] }).svg_parts ?? [])
              : []
          locker = {
            addons: {},
            roster_url: false,
            room_id: selectedLockerId.value!,
            product_id: plr.product_id,
            product_name: productName.value || plr.product_name || '',
            svg_parts: parsedSvgParts,
            style_id: plr.style_id,
            design_id: plr.design_id,
            custom_logos: parseJson(plr.custom_logos, []),
            text: parseJson(plr.text as string, []),
            product_custom_texts: parseJson(plr.text as string, []),
            colors: parseJson(plr.colors, []),
            shuffle_color_number: 0,
            defaultcolors: parseJson(plr.defaultcolors, []),
            groupcolors: parseJson(plr.groupcolors, {}),
            front_image: frontUrl,
            back_image: backUrl,
            product_roster_detail: Array.isArray(plr.product_roster_detail)
              ? plr.product_roster_detail
              : parseJson(plr.product_roster_detail as unknown as string, []),
            fixed_logo_index: 0,
            svgcolors: [],
            grouped_addons: {},
            ungrouped_addons: [],
            group_patterns: {}
          }
        } else {
          const customization = customizationStore.customization
          const productId = activeProductDetails.value!.product_id
          const productKey = String(productId)

          const rawSvgParts = productsStore.activeDesignDetails?.svg_parts || []
          const svgParts = Array.isArray(rawSvgParts)
            ? rawSvgParts
            : typeof rawSvgParts === 'string'
              ? JSON.parse(rawSvgParts)
              : []
          const customLogos = customization?.custom_logos[productKey] || []
          const productCustomTexts = customization?.product_custom_texts[productKey] || []
          const rosterDetail = customization?.products_rosters[productKey] || []
          const defaultColors = customization?.default_colors || []
          const groupColors = customization?.group_colors || {}
          const svgcolors = productsStore.svgGroups.map(group => ({
            value: group.color || '',
            name: group.name || '',
            pantone: group.pantone || ''
          }))
          const addonsInfo = customization?.addons_info || {}

          const productAddonsInfo = addonsInfo[productId] as
            | import('@/services/products/types/customization').APCustomizationAddonsInfoEntry
            | undefined
          const selectedAddons = productAddonsInfo?.addons || []

          // grouped_addons should be an object (empty object if no grouped addons)

          const groupedAddons =
            Object.keys(addonsInfo).length > 0
              ? Object.values(addonsInfo).reduce(
                  (acc, addonInfo: any) => {
                    const grouped = addonInfo?.grouped_addons || {}
                    return { ...acc, ...grouped }
                  },
                  {} as Record<string, unknown>
                )
              : {}
          const ungroupedAddons = Object.values(addonsInfo).flatMap(
            (addonInfo: any) => addonInfo?.ungrouped_addons || []
          )

          // Build locker product payload (plain JSON values — no double encoding)
          locker = {
            addons: selectedAddons,
            roster_url: false,
            room_id: selectedLockerId.value!,
            product_id: productId,
            product_name: productName.value || '',
            svg_parts: svgParts,
            style_id: customizationStoreRef.activeStyleId.value || 0,
            design_id: customizationStore.activeDesignId || 0,
            custom_logos: customLogos,
            text: productCustomTexts,
            product_custom_texts: productCustomTexts,
            colors: customization?.group_colors ?? [],
            shuffle_color_number: customization?.shuffle_color_number || 0,
            defaultcolors: defaultColors,
            groupcolors: groupColors,
            front_image: frontUrl,
            back_image: backUrl,
            product_roster_detail: rosterDetail,
            fixed_logo_index: customization?.fixed_logo_index || 0,
            svgcolors: svgcolors,
            grouped_addons: groupedAddons,
            ungrouped_addons: ungroupedAddons,
            group_patterns: customization?.group_patterns || {},
            category_id: customizationStore.activeCategoryId ?? undefined,
            sub_category_id: customizationStore.activeSubCategoryId ?? null
          }
        }

        const success = await lockerStore.saveDesignToLocker(
          locker,
          selectedLockerId.value!,
          locker.front_image
        )
        if (success) {
          isSubmitting.value = false
          emit('update:open', false)
          emit('saved-to-locker', selectedLockerId.value!)
        } else {
          isSubmitting.value = false
        }
      }
    }
  }
  const togglePreviewSide = () => {
    mainDisplaySide.value = mainDisplaySide.value === 'front' ? 'back' : 'front'
  }

  const mainImageUrl = computed(() =>
    mainDisplaySide.value === 'front' ? frontImage.value : backImage.value
  )
  const thumbnailImageUrl = computed(() =>
    mainDisplaySide.value === 'front' ? backImage.value : frontImage.value
  )
  const imagesReady = computed(() => !!frontImage.value && !!backImage.value)

  watch(
    () => props.open,
    (newVal: boolean) => {
      if (newVal) {
        // Reset validation state synchronously so errors never show on open
        formSubmitted.value = false
        designNameError.value = null
        lockerSelectionError.value = null
      }
    },
    { flush: 'sync' }
  )
  watch(
    () => props.open,
    async (newVal: boolean) => {
      if (newVal) {
        mainDisplaySide.value = 'front'
        imagesLoading.value = true
        productName.value =
          activeProductDetails.value?.display_name ?? factoryProduct.value?.product_name ?? ''
        if (!lockerStoreRef.lockers.value.length) {
          await lockerStore.fetchLockers()
        }

        // When opened with order product data, use factory product front/back image URLs for display
        if (useFactoryProductImages.value && factoryProduct.value) {
          frontImage.value = toDisplayImageUrl(factoryProduct.value.front_image!)
          backImage.value = toDisplayImageUrl(factoryProduct.value.back_image!)
          imagesLoading.value = false
          return
        }

        // When opened from CollectionView, use locker_product_images_folder for image URLs
        if (collectionProduct.value) {
          const plr = collectionProduct.value.product_locker_room
          const folder = plr.locker_product_images_folder
          if (folder) {
            const base = folder.startsWith('http')
              ? folder
              : baseStorageUrlForCollection.value + folder
            const sep = base.endsWith('/') ? '' : '/'
            frontImage.value = `${base}${sep}front.png`
            backImage.value = `${base}${sep}back.png`
          }
          productName.value = collectionProduct.value.product_nickname || plr.product_name || ''
          imagesLoading.value = false
          return
        }

        // Otherwise get images from canvas (2D or 3D)
        const is3DProduct = activeProductDetails.value?.is_3d_product

        if (is3DProduct) {
          componentRef = sceneStore.threeDSceneRef
          if (componentRef && 'getImageFromCanvas' in componentRef) {
            const getImage = (
              componentRef as unknown as ComponentPublicInstance & {
                getImageFromCanvas: (side?: string) => Promise<string>
              }
            ).getImageFromCanvas
            frontImage.value = await getImage('front')
            backImage.value = await getImage('back')
          }
        } else {
          frontImageComponentRef = sceneStore.getTwoDSceneRef('front')
          if (frontImageComponentRef && 'getImageFromCanvas' in frontImageComponentRef) {
            frontImage.value = await frontImageComponentRef.getImageFromCanvas()
          }

          backImageComponentRef = sceneStore.getTwoDSceneRef('back')
          if (backImageComponentRef && 'getImageFromCanvas' in backImageComponentRef) {
            backImage.value = await backImageComponentRef.getImageFromCanvas()
          }
        }
        imagesLoading.value = false
      }
    }
  )

  const handleClick = () => {
    createLocker.value = true
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      variant="large"
      class="w-full flex flex-col gap-0 p-0 pb-3 overflow-hidden h-fit max-md:max-h-[90dvh] max-md:min-h-0 max-md:flex max-md:flex-col"
    >
      <!-- HEADER -->
      <DialogHeader class="shrink-0 p-4">
        <h2 class="text-lg font-semibold">{{ save_design_title({}, { locale }) }}</h2>
      </DialogHeader>
      <!-- Mobile: image max 30% height; fixed header + scrollable locker list + fixed buttons -->
      <div
        class="flex flex-col md:flex-row overflow-hidden p-4 flex-1 min-h-0 max-md:min-h-0 md:max-h-[640px]"
      >
        <!-- LEFT: IMAGE – on mobile max 30vh -->
        <div
          class="w-full md:w-[60%] p-4 md:p-6 flex items-center justify-center bg-accent relative shrink-0 rounded-[20px] max-h-[30vh] md:max-h-[640px] md:h-full min-h-[120px]"
        >
          <template v-if="imagesLoading">
            <div class="flex items-center justify-center size-full">
              <Spinner class="w-10 h-10 text-muted-foreground" />
            </div>
          </template>
          <template v-else-if="imagesReady">
            <img
              :src="mainImageUrl"
              alt="Design preview"
              class="w-[80%] max-h-[-webkit-fill-available] object-contain"
            />
            <div
              class="size-16 md:size-28 p-1.5 md:p-2 rounded-xl md:rounded-2xl backdrop-blur-sm absolute right-2 bottom-2 md:right-6 md:bottom-6 z-[100] cursor-pointer border border-accent-foreground bg-accent"
              @click="togglePreviewSide"
            >
              <img
                :src="thumbnailImageUrl"
                alt="Other side"
                class="w-full h-full object-contain rounded-lg transition-opacity duration-300"
              />
            </div>
          </template>
        </div>

        <!-- RIGHT: fixed header (name + search row), scrollable locker list only, fixed buttons -->
        <div class="w-full md:w-[40%] flex flex-col flex-1 min-h-0 p-4 md:p-6 gap-3">
          <!-- FIXED: design name + choose locker + search/sort/create -->
          <div class="flex flex-col gap-3 shrink-0">
            <div class="flex flex-col gap-1">
              <Input
                v-model="productName"
                :placeholder="design_name_placeholder({}, { locale })"
                class="h-9 bg-accent"
                :disabled="isSubmitting"
                :aria-invalid="formSubmitted && designNameError !== null"
                @blur="validateDesignName"
              />
              <p
                v-if="formSubmitted && designNameError"
                class="text-[0.8rem] font-medium text-destructive"
              >
                {{ designNameError }}
              </p>
            </div>
            <div class="flex flex-col gap-1">
              <h4 class="text-sm font-semibold mb-0">
                {{ save_design_choose_locker({}, { locale }) }}
              </h4>
              <p
                v-if="formSubmitted && lockerSelectionError"
                class="text-[0.8rem] font-medium text-destructive"
              >
                {{ lockerSelectionError }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              <InputSearchGroup
                v-model="search"
                :placeholder="design_search_locker_placeholder({}, { locale })"
                class="min-w-0 flex-1 h-9 bg-accent max-md:min-w-[120px]"
                :disabled="isSubmitting"
                @update:model-value="
                  (val: string | number) => {
                    search = val as string
                  }
                "
              />

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="flex items-center gap-2 h-9 shrink-0">
                    <ArrowUpDown class="w-4 h-4" />
                    {{ locker_sort({}, { locale }) }}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent class="w-48">
                  <DropdownMenuItem @click="sortOption = 'lastModified'">
                    <Check
                      :class="{ '!opacity-100': sortOption === 'lastModified' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_last_modified({}, { locale }) }}
                  </DropdownMenuItem>

                  <DropdownMenuItem @click="sortOption = 'alphabetical'">
                    <Check
                      :class="{ '!opacity-100': sortOption === 'alphabetical' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_alphabetically({}, { locale }) }}
                  </DropdownMenuItem>

                  <DropdownMenuItem @click="sortOption = 'createdDate'">
                    <Check
                      :class="{ '!opacity-100': sortOption === 'createdDate' }"
                      class="w-4 h-4 opacity-0"
                    />
                    {{ locker_sort_created_date({}, { locale }) }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                class="h-9 flex items-center gap-2 shrink-0"
                :disabled="isSubmitting"
                @click="handleClick"
              >
                <Plus class="w-4 h-4" /> {{ locker_create_locker({}, { locale }) }}
              </Button>
            </div>
          </div>

          <!-- SCROLLABLE: locker list only – uses our ScrollArea (mobile + desktop) -->
          <ScrollArea class="flex-1 min-h-0 max-md:min-h-[200px] border rounded-lg overflow-hidden">
            <div class="p-3 md:px-4 md:py-3 space-y-1">
              <div
                v-for="locker in filteredLockers"
                :key="locker.id"
                class="flex gap-3 rounded-lg cursor-pointer hover:bg-accent transition p-2 md:p-2.5"
                :class="{
                  'bg-primary/20': selectedLockerId === locker.id,
                  'pointer-events-none': isSubmitting,
                  'cursor-not-allowed': isSubmitting
                }"
                @click="handleSelectLocker(locker)"
              >
                <div
                  class="w-14 h-14 md:w-20 md:h-20 shrink-0 grid gap-0.5 overflow-hidden rounded-md border bg-accent p-1 md:p-2"
                  :class="[
                    locker.product_thumbnails.length === 1 && 'place-items-center',
                    locker.product_thumbnails.length === 2 && 'grid-cols-2',
                    locker.product_thumbnails.length === 3 && 'grid-cols-2 grid-rows-2',
                    locker.product_thumbnails.length >= 4 && 'grid-cols-2 grid-rows-2'
                  ]"
                >
                  <template v-if="locker.product_thumbnails.length">
                    <img
                      v-for="(img, i) in locker.product_thumbnails.slice(0, 4)"
                      :key="i"
                      :src="baseStorageUrl + img"
                      class="object-contain w-full h-full"
                      @error="onImageError"
                    />
                  </template>
                  <img
                    v-else
                    :src="PLACEHOLDER_IMAGE"
                    class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
                  />
                </div>
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div class="font-medium text-sm truncate">{{ locker.room_name }}</div>
                  <div class="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span class="flex items-center gap-1">
                      <SwatchBook class="size-3 shrink-0" />
                      {{ locker.product_count }} {{ locker_designs_count({}, { locale }) }}
                    </span>
                    <span class="w-1 h-1 rounded-full bg-muted-foreground shrink-0"></span>
                    <span class="flex items-center gap-1">
                      <Calendar class="size-3 shrink-0" />
                      {{ localizedTimeAgo(locker.updated_at) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <!-- FIXED: Cancel / Save -->
          <div
            class="flex justify-end gap-3 shrink-0 pt-1"
            :class="{
              'pointer-events-none': isSubmitting
            }"
          >
            <Button variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              {{ locker_cancel({}, { locale }) }}
            </Button>
            <Button :disabled="isSubmitting" @click="handleSave">
              <Spinner v-if="isSubmitting" class="w-4 h-4" />
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
