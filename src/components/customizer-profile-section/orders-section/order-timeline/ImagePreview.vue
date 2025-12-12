<template>
  <Dialog v-model:open="isOpen">
    <DialogContent variant="large" class="max-w-4xl">
      <DialogHeader class="h-fit">
        <DialogTitle>Image Preview</DialogTitle>
        <DialogDescription> Hover over the images to zoom in and see details </DialogDescription>
      </DialogHeader>

      <div
        class="flex items-center justify-center gap-3 p-3 bg-primary/10 dark:bg-primary/20 border border-primary rounded-lg text-primary"
      >
        <ZoomInIcon class="size-5" />
        <span class="text-sm font-medium">Please hover over the images to zoom!</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(image, index) in displayImages" :key="index" class="flex flex-col gap-3">
          <div class="text-xs sm:text-sm font-medium text-muted-foreground text-center">
            {{ image.label }}
          </div>
          <!-- <div class="w-full aspect-4/3 rounded-lg overflow-hidden"> -->
          <ZoomOnHover :image-src="image.src" :image-alt="image.alt" :zoom-factor="2" />
          <!-- </div> -->
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useVModel } from '@vueuse/core'
  import { ZoomInIcon } from 'lucide-vue-next'
  import {
    Dialog,
    DialogContent
    // DialogDescription,
    // DialogHeader,
    // DialogTitle
  } from '@/components/ui/dialog'
  import { ZoomOnHover } from '@/components/ui/zoom-on-hover'
  import type { ActivityItem, FactoryProduct } from '@/services/orders/types'
  import type { ContentGroup } from '@/services/orders/types'

  interface Props {
    open?: boolean
    images?: Array<{ url: string; alt?: string }>
    factory_product?: FactoryProduct
    activity_item?: ActivityItem
    content_group?: ContentGroup
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    images: undefined,
    factory_product: undefined,
    activity_item: undefined,
    content_group: undefined
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  const isOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL

  const displayImages = computed(() => {
    // If images array is provided directly, use it
    if (props.images && props.images.length > 0) {
      return props.images.map((img, idx) => ({
        src: img.url.startsWith('http') ? img.url : `${storageUrl}${img.url}`,
        alt: img.alt || `Image ${idx + 1}`,
        label: props.images!.length === 2 ? (idx === 0 ? 'Front' : 'Back') : `Image ${idx + 1}`
      }))
    }

    // If content_group is provided, use its images
    if (
      props.content_group &&
      props.content_group.images &&
      props.content_group.images.length > 0
    ) {
      return props.content_group.images.map((img, idx) => ({
        src: img.url.startsWith('http') ? img.url : `${storageUrl}${img.url}`,
        alt: img.alt || `Image ${idx + 1}`,
        label:
          props.content_group!.images.length === 2
            ? idx === 0
              ? 'Front'
              : 'Back'
            : `Image ${idx + 1}`
      }))
    }

    // If factory_product is provided
    if (props.factory_product) {
      const images: Array<{ src: string; alt: string; label: string }> = []
      if (props.factory_product.front_image) {
        images.push({
          src: props.factory_product.front_image.startsWith('http')
            ? props.factory_product.front_image
            : `${storageUrl}${props.factory_product.front_image}`,
          alt: 'Front image',
          label: 'Front'
        })
      }
      if (props.factory_product.back_image) {
        images.push({
          src: props.factory_product.back_image.startsWith('http')
            ? props.factory_product.back_image
            : `${storageUrl}${props.factory_product.back_image}`,
          alt: 'Back image',
          label: 'Back'
        })
      }
      return images
    }

    // If activity_item is provided
    if (props.activity_item && props.activity_item.activity_files) {
      return props.activity_item.activity_files.map(
        (file: string | { url: string; alt?: string }, idx: number) => {
          const url = typeof file === 'string' ? file : file.url
          const alt =
            typeof file === 'string'
              ? `Activity image ${idx + 1}`
              : file.alt || `Activity image ${idx + 1}`
          return {
            src: url.startsWith('http') ? url : `${storageUrl}${url}`,
            alt,
            label:
              props.activity_item!.activity_files.length === 2
                ? idx === 0
                  ? 'Front'
                  : 'Back'
                : `Image ${idx + 1}`
          }
        }
      )
    }

    return []
  })

  // Watch for open changes and close when needed
  watch(isOpen, newValue => {
    if (!newValue) {
      emit('update:open', false)
    }
  })
</script>
