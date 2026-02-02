<script setup lang="ts">
  import type { CollectionProduct, CollectionLogo } from '@/services/lockers/types'
  import { computed, ref, watch, onMounted } from 'vue'
  import type { CustomLogo, LogoColor } from '@/services/logos/types'
  import { X, Loader2 } from 'lucide-vue-next'
  import LogosService from '@/services/logos/logos.service'
  import { toast } from 'vue-sonner'

  const props = defineProps<{
    products: CollectionProduct[]
    collectionLogos?: CollectionLogo[]
    collectionId?: number | null
  }>()

  const emit = defineEmits<{
    (e: 'upload-logo', index: number): void
    (e: 'logo-selected', logo: File | CustomLogo, index: number): void
    (e: 'logo-removed', index: number, logoId?: number): void
  }>()

  const logos = ref<
    Array<{
      file: File | null
      url: string | null
      logo: CustomLogo | null
      id?: number
      isDeleted?: boolean
      uploadedPath?: string // Store the uploaded path after uploading to presigned URL
    }>
  >([
    { file: null, url: null, logo: null, isDeleted: false },
    { file: null, url: null, logo: null, isDeleted: false }
  ])

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const backgroundGradient = ref<string>(
    'linear-gradient(135deg, #6b73ff 0%, #000dff 50%, #ff6ec4 100%)'
  )
  const isLoadingColors = ref(false)

  // Allow externally setting background colors (e.g., server-provided colors)
  function setBackgroundFromColors(colors: LogoColor[] | string[] | number[][]) {
    if (!colors || !colors.length) return

    // Convert colors to CSS color strings
    const cssColors = colors
      .map(color => {
        // Handle RGB array format: [203, 178, 146]
        if (Array.isArray(color) && typeof color[0] === 'number') {
          return `rgb(${color.join(', ')})`
        }
        // Handle LogoColor object format: { hex: string | null; ... }
        if (typeof color === 'object' && color !== null && 'hex' in color) {
          return (color as { hex: string | null }).hex || ''
        }
        // Handle string format (hex or rgb)
        if (typeof color === 'string') {
          return color
        }
        return ''
      })
      .filter(Boolean)

    if (cssColors.length === 0) return

    if (cssColors.length >= 3) {
      backgroundGradient.value = `linear-gradient(135deg, ${cssColors[0]} 0%, ${cssColors[1]} 50%, ${cssColors[2]} 100%)`
    } else if (cssColors.length === 2) {
      backgroundGradient.value = `linear-gradient(135deg, ${cssColors[0]} 0%, ${cssColors[1]} 100%)`
    } else if (cssColors.length === 1) {
      backgroundGradient.value = `linear-gradient(135deg, ${cssColors[0]} 0%, ${cssColors[0]} 100%)`
    }
  }

  // Fetch colors for a logo path
  async function fetchLogoColors(path: string): Promise<number[][] | null> {
    if (!path) return null
    try {
      isLoadingColors.value = true
      const colorResp = await LogosService.getLogoColors(path)
      const colors = colorResp?.data?.result?.logo_colors || null
      return colors
    } catch (error) {
      console.error('Failed to fetch logo colors:', error)
      return null
    } finally {
      isLoadingColors.value = false
    }
  }

  // Fetch colors for all active logos
  async function fetchColorsForActiveLogos() {
    const activeLogos = logos.value.filter(logo => logo.url && !logo.isDeleted)
    if (activeLogos.length === 0) {
      backgroundGradient.value = 'linear-gradient(135deg, #6b73ff 0%, #000dff 50%, #ff6ec4 100%)'
      return
    }

    // Show toast when fetching
    const toastId = toast.loading('Fetching logo colors...', {
      duration: Infinity
    })

    try {
      isLoadingColors.value = true
      // Fetch colors for the first active logo (or use the most recently added/changed one)
      const logoToUse = activeLogos[0]
      if (!logoToUse) {
        toast.dismiss(toastId)
        return
      }

      let path: string | null = null

      // Get path from logo object or URL
      if (logoToUse.logo?.url) {
        path = logoToUse.logo.url
      } else if (logoToUse.url) {
        // Extract path from full URL (remove baseStorageUrl if present)
        path = logoToUse.url.replace(baseStorageUrl.value, '')
      }

      if (path) {
        const colors = await fetchLogoColors(path)
        if (colors && colors.length) {
          setBackgroundFromColors(colors)
          toast.success('Colors loaded successfully', {
            id: toastId,
            duration: 2000
          })
        } else {
          toast.dismiss(toastId)
        }
      } else {
        toast.dismiss(toastId)
      }
    } catch (_error) {
      toast.error('Failed to fetch logo colors', {
        id: toastId,
        duration: 3000
      })
    } finally {
      isLoadingColors.value = false
    }
  }

  // Load logos from collection if editing
  watch(
    () => props.collectionLogos,
    async newLogos => {
      if (newLogos && newLogos.length > 0) {
        newLogos.forEach((collectionLogo, index) => {
          if (index < logos.value.length) {
            logos.value[index] = {
              file: null,
              url: baseStorageUrl.value + collectionLogo.path,
              logo: null,
              id: collectionLogo.id,
              isDeleted: false,
              uploadedPath: collectionLogo.path // Store the path as uploadedPath for existing logos
            }
          }
        })
        // Fetch colors for loaded logos
        await fetchColorsForActiveLogos()
      }
    },
    { immediate: true }
  )

  // Watch for logo URL changes (but not when we're manually updating)
  // This handles cases where logos are updated externally
  const isManuallyUpdating = ref(false)
  watch(
    () => logos.value.map(logo => ({ url: logo.url, isDeleted: logo.isDeleted })),
    async () => {
      // Skip if we're manually updating (to avoid duplicate API calls)
      if (isManuallyUpdating.value) {
        isManuallyUpdating.value = false
        return
      }
      await fetchColorsForActiveLogos()
    },
    { deep: true }
  )

  // Fetch colors on mount if logos are present
  onMounted(async () => {
    const activeLogos = logos.value.filter(logo => logo.url && !logo.isDeleted)
    if (activeLogos.length > 0) {
      await fetchColorsForActiveLogos()
    }
  })

  const handleRemoveLogo = async (index: number) => {
    const logo = logos.value[index]
    isManuallyUpdating.value = true
    if (logo?.id) {
      // Mark as deleted if it has an ID (existing logo)
      logos.value[index] = {
        ...logo,
        url: null,
        file: null,
        logo: null,
        isDeleted: true
      }
    } else {
      // Just clear if it's a new logo
      logos.value[index] = {
        file: null,
        url: null,
        logo: null,
        isDeleted: false
      }
    }
    emit('logo-removed', index, logo?.id)

    // After removal, fetch colors from remaining logos (first active logo)
    const remainingLogos = logos.value.filter(l => l.url && !l.isDeleted)
    if (remainingLogos.length > 0) {
      const logoToUse = remainingLogos[0]
      if (!logoToUse) return

      let path: string | null = null

      if (logoToUse.logo?.url) {
        path = logoToUse.logo.url
      } else if (logoToUse.url) {
        path = logoToUse.url.replace(baseStorageUrl.value, '')
      }

      if (path) {
        const toastId = toast.loading('Fetching logo colors...', {
          duration: Infinity
        })
        try {
          isLoadingColors.value = true
          const colors = await fetchLogoColors(path)
          if (colors && colors.length) {
            setBackgroundFromColors(colors)
            toast.success('Colors loaded successfully', {
              id: toastId,
              duration: 2000
            })
          } else {
            toast.dismiss(toastId)
          }
        } catch (_error) {
          toast.error('Failed to fetch logo colors', {
            id: toastId,
            duration: 3000
          })
        } finally {
          isLoadingColors.value = false
        }
      }
    } else {
      // No logos left, reset to default
      backgroundGradient.value = 'linear-gradient(135deg, #6b73ff 0%, #000dff 50%, #ff6ec4 100%)'
    }
  }

  const handleLogoSelected = async (logo: File | CustomLogo, index: number) => {
    // Ensure index is within bounds (only 2 logos allowed)
    if (index < 0 || index >= logos.value.length) {
      console.warn('Invalid logo index:', index)
      return
    }

    isManuallyUpdating.value = true

    // Replace logo at the specified index (don't add new ones)
    if (logo instanceof File) {
      logos.value[index] = {
        file: logo,
        url: URL.createObjectURL(logo),
        logo: null,
        isDeleted: false,
        uploadedPath: undefined
      }
      // For file uploads, parent will handle color fetching after upload
    } else {
      // CustomLogo selected from recent logos - use existing URL/path directly, no upload needed
      const logoUrl = logo.url
        ? logo.url.startsWith('http')
          ? logo.url
          : baseStorageUrl.value + logo.url
        : null
      if (!logoUrl) {
        toast.error('Invalid logo URL', { duration: 3000 })
        return
      }

      // Extract path from URL (remove baseStorageUrl if present)
      const logoPath = logo.url.startsWith('http')
        ? logo.url.replace(baseStorageUrl.value, '')
        : logo.url

      // Replace logo at the specified index with existing path - no upload needed
      logos.value[index] = {
        file: null,
        url: logoUrl,
        logo: logo,
        isDeleted: false,
        uploadedPath: logoPath // Use existing path directly
      }

      // Fetch colors for the logo
      const toastId = toast.loading('Fetching logo colors...', {
        duration: Infinity
      })
      try {
        isLoadingColors.value = true
        const colors = await fetchLogoColors(logoPath)
        if (colors && colors.length) {
          setBackgroundFromColors(colors)
          toast.success('Colors loaded successfully', {
            id: toastId,
            duration: 2000
          })
        } else {
          toast.dismiss(toastId)
        }
      } catch (_error) {
        toast.error('Failed to fetch logo colors', {
          id: toastId,
          duration: 3000
        })
      } finally {
        isLoadingColors.value = false
      }
    }
    // Don't emit here to prevent circular calls - parent will handle it
  }

  defineExpose({
    logos: computed(() => logos.value),
    handleLogoSelected,
    setBackgroundFromColors
  })
</script>

<template>
  <div class="grid h-full grid-cols-12 gap-6">
    <!-- LEFT -->
    <div class="col-span-7 flex flex-col gap-6">
      <!-- Logo Upload -->
      <div class="rounded-xl border bg-background p-4">
        <div class="mb-4 flex items-center justify-between">
          <p
            class="text-sm bg-secondary/60 rounded-2xl py-1 px-2 border border-secondary-forground text-black"
          >
            Preview
          </p>
        </div>

        <div class="flex gap-3 justify-center items-center">
          <div
            v-for="(logo, index) in logos"
            :key="index"
            class="rounded-lg border bg-muted relative"
          >
            <button
              v-if="logo.url && !logo.isDeleted"
              class="absolute top-2 right-2 z-10 rounded-full bg-background border p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              @click.stop="handleRemoveLogo(index)"
            >
              <X class="w-3 h-3" />
            </button>
            <img
              v-if="logo.url && !logo.isDeleted"
              :src="logo.url"
              class="w-[200px] h-[110px] object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              alt="Collection logo"
              @click="emit('upload-logo', index)"
            />
            <div
              v-else
              class="flex flex-col gap-3 w-[200px] h-[110px] justify-center items-center border border-dashed border-muted rounded-lg cursor-pointer hover:border-primary transition-colors"
              @click="emit('upload-logo', index)"
            >
              <IFlexFlatUploadImagePlaceholder />
              Upload logo {{ index + 1 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Products Preview -->
      <div class="flex-1 rounded-xl border bg-background p-4">
        <h3 class="mb-4 text-sm font-medium">Products inside collection</h3>

        <div class="relative overflow-hidden h-full">
          <div class="flex gap-4 overflow-x-auto pb-2">
            <div
              v-for="product in products.length
                ? products
                : (Array.from({ length: 5 }) as CollectionProduct[])"
              :key="product.id ?? Math.random()"
              class="min-w-[350px] rounded-lg border bg-muted p-2 opacity-80"
            >
              <div class="aspect-4/3 bg-muted rounded-md overflow-hidden w-full">
                <img
                  :src="baseStorageUrl + product.product_urls.front_url"
                  class="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <!-- Fade -->
          <div
            class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background"
          />
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="col-span-5">
      <div class="h-full overflow-hidden rounded-xl border relative">
        <div
          class="h-full w-full transition-all duration-500"
          :style="{ background: backgroundGradient }"
        />
        <!-- Loader overlay -->
        <div
          v-if="isLoadingColors"
          class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
        >
          <div class="flex flex-col items-center gap-2">
            <Loader2 class="w-6 h-6 animate-spin text-primary" />
            <p class="text-sm text-muted-foreground">Loading colors...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
