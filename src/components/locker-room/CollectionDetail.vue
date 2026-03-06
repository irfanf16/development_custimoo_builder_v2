<script setup lang="ts">
  import type { Collection, CollectionProduct } from '@/services/lockers/types'
  import { computed, ref, watch } from 'vue'
  import CollectionProductListing from './CollectionProductListing.vue'
  import CollectionPreviewBody from './CollectionPreviewBody.vue'
  import UploadCollectionLogoDialog from './UploadCollectionLogoDialog.vue'
  import type { CustomLogo } from '@/services/logos/types'
  import type { LogoColor } from '@/services/logos/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { uploadPresignedFiles } from '@/lib/utils'
  import LogosService from '@/services/logos/logos.service'
  import { toast } from 'vue-sonner'
  import {
    msg_logo_uploaded_success,
    msg_failed_to_upload_logo,
    msg_failed_to_get_upload_url
  } from '@/paraglide/messages'

  export type WorkingLogoSlot = {
    file: File | null
    url: string | null
    logo: CustomLogo | null
    id?: number
    isDeleted?: boolean
    uploadedPath?: string
  }

  type PreviewBodyRef = {
    handleLogoSelected: (logo: File | CustomLogo, index: number) => void
    setBackgroundFromColors?: (colors: LogoColor[] | string[] | number[][]) => void
  }
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  type CollectionTab = 'products' | 'preview'

  const defaultLogoSlots = (): WorkingLogoSlot[] => [
    { file: null, url: null, logo: null, isDeleted: false },
    { file: null, url: null, logo: null, isDeleted: false }
  ]

  const props = defineProps<{
    collection: Collection | null
    collectionTab: CollectionTab
    preSelectedProducts: CollectionProduct[]
    isCreatingCollection: boolean
    sort: SortOption
  }>()

  const emit = defineEmits<{
    (e: 'remove-product', products: CollectionProduct[]): void
    (e: 'logo-removed', index: number, logoId?: number): void
  }>()

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const activeTab = computed(() => props.collectionTab)
  const showUploadLogoDialog = ref(false)
  const selectedLogoIndex = ref(0)
  const previewBodyRef = ref<PreviewBodyRef | null>(null)
  const lockerRoomStore = useLockerRoomStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const collectionProductListingRef = ref<InstanceType<typeof CollectionProductListing> | null>(
    null
  )

  const workingLogos = ref<WorkingLogoSlot[]>(defaultLogoSlots())

  watch(
    () => [props.collection?.id, props.collection?.logos] as const,
    ([_id, collectionLogos]) => {
      if (!collectionLogos?.length) {
        workingLogos.value = defaultLogoSlots()
        return
      }
      const base = baseStorageUrl.value
      workingLogos.value = [
        { file: null, url: null, logo: null, isDeleted: false },
        { file: null, url: null, logo: null, isDeleted: false }
      ]
      collectionLogos.forEach((cl, index) => {
        if (index < workingLogos.value.length) {
          workingLogos.value[index] = {
            file: null,
            url: base + cl.path,
            logo: null,
            id: cl.id,
            isDeleted: false,
            uploadedPath: cl.path
          }
        }
      })
    },
    { immediate: true }
  )

  function setWorkingLogoAtIndex(index: number, slot: WorkingLogoSlot) {
    if (index >= 0 && index < workingLogos.value.length) {
      workingLogos.value = workingLogos.value.map((s, i) => (i === index ? slot : s))
    }
  }

  const handleUploadLogo = (index: number) => {
    selectedLogoIndex.value = index
    showUploadLogoDialog.value = true
  }

  const handleLogoSelected = async (logo: File | CustomLogo) => {
    // Ensure selectedLogoIndex is within valid range (0-1 for 2 logos)
    const targetIndex = Math.max(0, Math.min(selectedLogoIndex.value, 1))

    if (logo instanceof File) {
      setWorkingLogoAtIndex(targetIndex, {
        file: logo,
        url: URL.createObjectURL(logo),
        logo: null,
        isDeleted: false,
        uploadedPath: undefined
      })

      const toastId = toast.loading('Uploading logo...', {
        duration: Infinity
      })
      try {
        const collectionId = props.collection?.id ?? null
        const fileMeta = { name: logo.name, type: logo.type || 'image/png', size: logo.size }
        const presignedResp = await lockerRoomStore.getCollectionLogoPresignedUrls(collectionId, [
          fileMeta
        ])
        if (presignedResp && presignedResp?.result?.presigned_urls?.[0]) {
          const presigned = presignedResp?.result?.presigned_urls[0]
          const preparedFile = [
            {
              presigned_url: presigned.presigned_url,
              file_type: logo.type || 'image/png',
              file: logo
            }
          ]

          const uploadResult = await uploadPresignedFiles(preparedFile)
          if (uploadResult && uploadResult[0] && uploadResult[0].success) {
            const uploadedPath = presigned.path
            const fullLogo: Partial<CustomLogo> = {
              url: uploadedPath || '',
              logo_name: logo.name,
              logo_colors: []
            }
            try {
              const colorResp = await LogosService.getLogoColors(uploadedPath)
              const colors = colorResp?.data?.result?.logo_colors || null
              if (colors && colors.length) {
                fullLogo.logo_colors = colors as LogoColor[]
                previewBodyRef.value?.setBackgroundFromColors?.(colors as LogoColor[])
              }
            } catch (_e) {
              // ignore
            }

            if (previewBodyRef.value) {
              // Replace logo at the target index (not add)
              previewBodyRef.value.handleLogoSelected(fullLogo as CustomLogo, targetIndex)
            }

            const logoUrl = baseStorageUrl.value + uploadedPath
            setWorkingLogoAtIndex(targetIndex, {
              file: null,
              url: logoUrl,
              logo: fullLogo as CustomLogo,
              isDeleted: false,
              uploadedPath
            })

            toast.success(msg_logo_uploaded_success({}, { locale: locale.value }), {
              id: toastId,
              duration: 2000
            })
          } else {
            toast.error(msg_failed_to_upload_logo({}, { locale: locale.value }), {
              id: toastId,
              duration: 3000
            })
          }
        } else {
          toast.error(msg_failed_to_get_upload_url({}, { locale: locale.value }), {
            id: toastId,
            duration: 3000
          })
        }
      } catch (err) {
        console.error('Failed uploading logo', err)
        toast.error(msg_failed_to_upload_logo({}, { locale: locale.value }), {
          duration: 3000
        })
      }
    } else {
      const logoUrl = logo.url
        ? logo.url.startsWith('http')
          ? logo.url
          : baseStorageUrl.value + logo.url
        : null
      const logoPath = logo.url?.startsWith('http')
        ? logo.url.replace(baseStorageUrl.value, '')
        : (logo.url ?? '')
      if (logoUrl) {
        setWorkingLogoAtIndex(targetIndex, {
          file: null,
          url: logoUrl,
          logo,
          isDeleted: false,
          uploadedPath: logoPath
        })
      }
    }

    showUploadLogoDialog.value = false
  }

  const handleRemoveProduct = (products: CollectionProduct[]) => {
    emit('remove-product', products)
  }

  const handleLogoRemoved = (index: number, logoId?: number) => {
    emit('logo-removed', index, logoId)
  }

  defineExpose({ collectionProductListingRef, previewBodyRef })
</script>

<template>
  <Transition name="slide-horizontal" mode="out-in">
    <!-- Keep this in normal flow so outer ScrollArea can measure content height -->
    <div v-if="activeTab === 'products'" key="products" class="w-full">
      <CollectionProductListing
        ref="collectionProductListingRef"
        :products="preSelectedProducts"
        :sort="sort"
        :is-locker-collection="collection?.room_id !== null"
        @remove-product="handleRemoveProduct"
      />
    </div>

    <div v-else key="preview" class="w-full">
      <CollectionPreviewBody
        ref="previewBodyRef"
        :products="preSelectedProducts"
        :collection-logos="collection?.logos"
        :working-logos="workingLogos"
        :collection-id="collection?.id"
        @update:working-logos="workingLogos = $event"
        @upload-logo="handleUploadLogo"
        @logo-selected="handleLogoSelected"
        @logo-removed="handleLogoRemoved"
      />
    </div>
  </Transition>

  <UploadCollectionLogoDialog
    :open="showUploadLogoDialog"
    @close="showUploadLogoDialog = false"
    @logo-selected="handleLogoSelected"
  />
</template>
