<script setup lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import { computed, onMounted, ref } from 'vue'
  import type { CustomLogo } from '@/services/logos/types'
  import ScrollArea from '../ui/scroll-area/ScrollArea.vue'

  defineProps<{
    open: boolean
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'logo-selected', logo: File | CustomLogo): void
  }>()

  const logosStore = useLogosStore()
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  const recentLogos = computed(() => logosStore.recentLogos || [])

  onMounted(async () => {
    if (!logosStore.recentLogos) {
      await logosStore.fetchRecentLogos()
    }
  })

  const handleFileSelect = (file: File) => {
    emit('logo-selected', file)
    emit('close')
  }

  const handleFileInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    if (input) input.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && (file.type.startsWith('image/') || file.name.endsWith('.pdf'))) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const handleClick = () => {
    fileInputRef.value?.click()
  }

  const handleRecentLogoClick = (logo: CustomLogo) => {
    emit('logo-selected', logo)
    emit('close')
  }
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent data-testid="locker-room-upload-logo-dialog" variant="default" class="p-6">
      <!-- Header -->
      <DialogHeader class="mb-2 md:mb-4 flex flex-row items-center justify-between">
        <DialogTitle class="text-lg font-semibold"> Upload logo </DialogTitle>
      </DialogHeader>

      <!-- Upload Area -->
      <div
        class="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-5 md:py-14 text-center transition-colors"
        :class="{
          'border-primary bg-primary/5': isDragging
        }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="handleClick"
      >
        <IFlexFlatUploadImagePlaceholder class="mb-4 h-12 w-12 text-muted-foreground" />

        <p class="text-sm font-medium">
          Drag and drop or
          <span class="cursor-pointer text-primary hover:underline"> click to upload </span>
        </p>

        <p class="mt-1 text-xs text-muted-foreground">
          Supported formats: JPG, PNG, PDF. Max size: 10MB.
        </p>

        <!-- Hidden input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*,.pdf"
          class="hidden"
          @change="handleFileInputChange"
        />
      </div>

      <!-- Recent Logos -->
      <div class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="text-sm font-medium">Recent logos</h4>
          <button class="text-xs text-primary hover:underline">View all</button>
        </div>
        <ScrollArea class="flex-1 overflow-hidden pr-4 h-40">
          <div class="flex gap-2 flex-wrap">
            <div
              v-for="logo in recentLogos"
              :key="logo.id"
              class="flex h-14 w-28 items-center justify-center rounded-lg border bg-background cursor-pointer hover:border-primary transition-colors overflow-hidden"
              @click="handleRecentLogoClick(logo)"
            >
              <img
                v-if="logo.url"
                :src="baseStorageUrl + logo.url"
                class="w-full h-full object-contain"
                alt="Recent logo"
              />
              <span v-else class="text-xs text-muted-foreground"> LOGO </span>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- Divider -->
      <div class="my-2 md:my-6 flex items-center gap-4">
        <Separator class="flex-1" />
        <span class="text-xs text-muted-foreground">or</span>
        <Separator class="flex-1" />
      </div>

      <!-- Choose from library -->
      <Button variant="outline" class="w-full"> Choose from library </Button>
    </DialogContent>
  </Dialog>
</template>
