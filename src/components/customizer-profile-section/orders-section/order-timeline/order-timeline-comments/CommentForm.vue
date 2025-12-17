<template>
  <div
    class="relative bg-muted border border-border rounded-lg p-4 space-y-4"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 🔵 Drag overlay -->
    <transition name="fade">
      <div
        v-if="isDragging"
        class="absolute inset-0 bg-primary/30 bg-opacity-20 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center rounded-lg z-50 pointer-events-none"
      >
        <PaperclipIcon class="w-10 h-10 text-primary mb-2" />
        <span class="text-primary font-medium text-lg">Drop files here</span>
      </div>
    </transition>

    <!-- Parent message preview for replies -->
    <div
      v-if="mode === 'reply' && parentComment"
      class="bg-card border-l-4 border-primary p-3 rounded"
    >
      <div class="text-sm text-muted-foreground mb-1">Replying to:</div>
      <div class="text-sm text-foreground">{{ parentComment.message }}</div>

      <!-- Parent comment files -->
      <div v-if="parentComment.files?.length" class="flex gap-2 mt-2">
        <div
          v-for="(file, index) in parentComment.files"
          :key="`parent-file-${index}`"
          class="relative"
        >
          <img
            v-if="isImageFile(file.extension)"
            :src="`${storageUrl}/${file.url}`"
            :alt="file.name"
            class="w-12 h-12 object-cover rounded border"
          />
          <div
            v-else
            class="w-12 h-12 bg-muted border border-border rounded flex items-center justify-center"
          >
            <FileIcon class="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>

    <!-- Comment form header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium"
        >
          {{ getUserInitials(currentUser?.first_name + ' ' + currentUser?.last_name || '') }}
        </div>
        <span class="text-sm font-medium text-foreground">{{
          currentUser?.first_name + ' ' + currentUser?.last_name
        }}</span>
      </div>

      <button class="text-muted-foreground hover:text-foreground p-1 rounded" @click="handleCancel">
        <XIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Message input -->
    <div>
      <textarea
        ref="inputAreaRef"
        v-model="formData.message"
        placeholder="Write your comment here..."
        rows="3"
        class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
        :disabled="loading"
      />
    </div>

    <!-- File upload and actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <label
          class="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
        >
          <PaperclipIcon class="w-4 h-4" />
          <span>Attach</span>
          <input
            type="file"
            multiple
            class="hidden"
            :disabled="loading"
            @change="handleFileUpload"
          />
        </label>
      </div>

      <button
        :disabled="!canSubmit || loading"
        class="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSubmit"
      >
        <SendIcon class="w-4 h-4" />
        <span v-if="loading">{{ mode === 'edit' ? 'Updating...' : 'Posting...' }}</span>
        <span v-else>{{ mode === 'edit' ? 'Update' : 'Post' }}</span>
      </button>
    </div>

    <!-- File previews -->
    <div v-if="formData.files!.length" class="flex flex-wrap gap-2">
      <div v-for="(file, index) in formData.files" :key="`file-${index}`" class="relative group">
        <div class="w-16 h-16 bg-muted border border-border rounded-lg overflow-hidden">
          <img
            v-if="isImageFile(getFileExtension(file.name))"
            :src="getFilePreview(file)"
            :alt="file.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <FileIcon class="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <button
          class="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          @click="removeFile(index)"
        >
          <XIcon class="w-3 h-3" />
        </button>

        <div
          class="absolute bottom-0 left-0 right-0 bg-foreground/50 text-card-foreground text-xs p-1 truncate"
        >
          {{ file.name }}
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-2">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      <span class="ml-2 text-sm text-muted-foreground">
        {{ mode === 'edit' ? 'Updating comment...' : 'Submitting comment...' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Comment, CommentFile } from '@/services/orders/types'
  import type { CommentFormData } from '@/services/orders/types'
  import { FileIcon, SendIcon, PaperclipIcon, XIcon } from 'lucide-vue-next'
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { customer: currentUser } = storeToRefs(authStore)

  interface Props {
    mode?: 'add' | 'edit' | 'reply'
    parentComment?: Comment
    editComment?: Comment
    loading?: boolean
    storageUrl?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'add',
    storageUrl: import.meta.env.VITE_FILE_URL || ''
  })

  const emit = defineEmits<{
    submit: [data: CommentFormData, editCommentData?: Comment]
    cancel: []
  }>()

  const formData = ref<CommentFormData>({
    message: '',
    files: [],
    parent_message_id: undefined,
    parent_message: undefined
  })

  const inputAreaRef = ref<HTMLTextAreaElement | null>(null)
  const isDragging = ref(false)
  let dragCounter = 0

  watch(
    [() => props.mode, () => props.editComment, () => props.parentComment],
    async () => {
      if (props.mode === 'edit' && props.editComment) {
        formData.value.message = props.editComment.message

        if (props.editComment.files?.length) {
          const filePromises = props.editComment.files.map(async (f: CommentFile) => {
            try {
              // fetch the blob from the file URL
              const response = await fetch(`${props.storageUrl}/${f.url}`)
              const blob = await response.blob()

              // ensure file has correct name with extension
              const fileName = f.extension ? `${f.name}.${f.extension}` : f.name

              // create File object
              return new File([blob], fileName, { type: blob.type })
            } catch (err) {
              console.error('Error loading file:', f.url, err)
              return null
            }
          })

          const files = (await Promise.all(filePromises)).filter(Boolean)
          formData.value.files = files as File[]
        } else {
          formData.value.files = []
        }
      } else if (props.mode === 'reply' && props.parentComment) {
        formData.value.message = ''
        formData.value.parent_message_id = props.parentComment.id
        formData.value.parent_message = props.parentComment.message
        formData.value.files = []
      } else {
        formData.value.message = ''
        formData.value.parent_message_id = undefined
        formData.value.parent_message = undefined
        formData.value.files = []
      }
    },
    { immediate: true }
  )

  const canSubmit = computed(() => {
    return formData.value.message!.trim() || formData.value.files!.length > 0
  })

  const getUserInitials = (name: string): string => {
    if (!name) return ''
    const parts = name.split(' ')
    return (parts[0]![0] + (parts[1]?.[0] || '')).toUpperCase()
  }

  const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || ''

  const isImageFile = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)

  const getFilePreview = (file: File) => URL.createObjectURL(file)

  const notAllowedTypes = ['php', 'exe', 'bat', 'sh']

  const handleFileUpload = (event: Event | FileList | File[]) => {
    let files: File[] = []

    if (event instanceof Event) {
      const target = event.target as HTMLInputElement
      files = Array.from(target.files || [])
      target.value = ''
    } else if (event instanceof FileList) files = Array.from(event)
    else if (Array.isArray(event)) files = event

    const valid = files.filter(f => !notAllowedTypes.includes(getFileExtension(f.name)))
    formData.value.files!.push(...valid)
  }

  const removeFile = (i: number) => {
    const file = formData.value.files![i]

    if (props.mode === 'edit') {
      const originUrl = props.editComment?.files?.find(f => f.url?.includes(file?.name ?? ''))?.url
      if (originUrl) {
        // initialize removed_files if not already
        if (!formData.value.removed_files) {
          formData.value.removed_files = []
        }

        formData.value.removed_files.push(originUrl)
      }
    }

    formData.value.files!.splice(i, 1)
  }

  const handleSubmit = () => {
    if (!canSubmit.value) return
    emit(
      'submit',
      { ...formData.value, message: formData.value.message!.trim() },
      props.editComment
    )
  }

  const handleCancel = () => {
    formData.value = {
      message: '',
      files: [],
      parent_message_id: undefined,
      parent_message: undefined
    }
    emit('cancel')
  }

  // 🧩 Paste files (Ctrl+V)
  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return

    const pasted: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) pasted.push(file)
      }
    }
    if (pasted.length) {
      event.preventDefault()
      handleFileUpload(pasted)
    }
  }

  // 🧲 Drag and Drop Overlay logic
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    dragCounter++
    isDragging.value = true
  }

  const handleDragLeave = () => {
    dragCounter--
    if (dragCounter <= 0) isDragging.value = false
  }

  const toggleOverlay = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      isDragging.value = false
    }
  }
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    dragCounter = 0
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files?.length) handleFileUpload(files)
  }

  // register paste listener
  onMounted(() => {
    inputAreaRef.value?.addEventListener('paste', handlePaste)
    window.addEventListener('keydown', toggleOverlay)
  })
  onBeforeUnmount(() => {
    inputAreaRef.value?.removeEventListener('paste', handlePaste)
    window.removeEventListener('keydown', toggleOverlay)
  })
</script>
