<script setup lang="ts">
  import type { Collection, CollectionProduct } from '@/services/lockers/types'
  import { computed, ref } from 'vue'
  import CollectionProductListing from './CollectionProductListing.vue'
  import CollectionPreviewBody from './CollectionPreviewBody.vue'
  import UploadCollectionLogoDialog from './UploadCollectionLogoDialog.vue'
  import type { CustomLogo } from '@/services/logos/types'
  import type { LogoColor } from '@/services/logos/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { uploadPresignedFiles } from '@/lib/utils'
  import LogosService from '@/services/logos/logos.service'
  import { toast } from 'vue-sonner'

  type PreviewBodyRef = {
    handleLogoSelected: (logo: CustomLogo, index: number) => void
    setBackgroundFromColors?: (colors: LogoColor[] | string[] | number[][]) => void
  }
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  type CollectionTab = 'products' | 'preview'

  const props = defineProps<{
    collection: Collection | null
    collectionTab: CollectionTab
    preSelectedProducts: CollectionProduct[]
    isCreatingCollection: boolean
    sort: SortOption
  }>()

  const emit = defineEmits<{
    (e: 'remove-product', index: number): void
    (e: 'logo-removed', index: number, logoId?: number): void
  }>()

  const activeTab = computed(() => props.collectionTab)
  const showUploadLogoDialog = ref(false)
  const selectedLogoIndex = ref(0)
  const previewBodyRef = ref<PreviewBodyRef | null>(null)
  const lockerRoomStore = useLockerRoomStore()
  const collectionProductListingRef = ref<InstanceType<typeof CollectionProductListing> | null>(
    null
  )

  const handleUploadLogo = (index: number) => {
    selectedLogoIndex.value = index
    showUploadLogoDialog.value = true
  }

  const handleLogoSelected = async (logo: File | CustomLogo) => {
    // Ensure selectedLogoIndex is within valid range (0-1 for 2 logos)
    const targetIndex = Math.max(0, Math.min(selectedLogoIndex.value, 1))

    if (logo instanceof File) {
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

          // Upload file
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
            toast.success('Logo uploaded successfully', {
              id: toastId,
              duration: 2000
            })
          } else {
            toast.error('Failed to upload logo', {
              id: toastId,
              duration: 3000
            })
          }
        } else {
          toast.error('Failed to get upload URL', {
            id: toastId,
            duration: 3000
          })
        }
      } catch (err) {
        console.error('Failed uploading logo', err)
        toast.error('Failed to upload logo', { duration: 3000 })
      }
    } else {
      // CustomLogo selected from recent logos - preview body will use existing URL/path directly
      if (previewBodyRef.value) {
        // Replace logo at the target index (not add)
        previewBodyRef.value.handleLogoSelected(logo, targetIndex)
      }
    }

    showUploadLogoDialog.value = false
  }

  const handleRemoveProduct = (index: number) => {
    emit('remove-product', index)
  }

  const handleLogoRemoved = (index: number, logoId?: number) => {
    emit('logo-removed', index, logoId)
  }

  defineExpose({ collectionProductListingRef, previewBodyRef })
</script>

<template>
  <Transition name="slide-horizontal" mode="out-in">
    <div v-if="activeTab === 'products'" key="products" class="absolute inset-0">
      <CollectionProductListing
        ref="collectionProductListingRef"
        :products="preSelectedProducts"
        :sort="sort"
        @remove-product="handleRemoveProduct"
      />
    </div>

    <div v-else key="preview">
      <CollectionPreviewBody
        ref="previewBodyRef"
        :products="preSelectedProducts"
        :collection-logos="collection?.logos"
        :collection-id="collection?.id"
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
