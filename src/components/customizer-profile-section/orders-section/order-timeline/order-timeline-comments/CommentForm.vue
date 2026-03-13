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
        :placeholder="comment_placeholder({}, { locale })"
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
        :disabled="!canSubmit || loading || hasUploadingFiles"
        class="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSubmit"
      >
        <SendIcon class="w-4 h-4" />
        <span v-if="hasUploadingFiles">Uploading...</span>
        <span v-else-if="loading">{{ mode === 'edit' ? 'Updating...' : 'Posting...' }}</span>
        <span v-else>{{ mode === 'edit' ? 'Update' : 'Post' }}</span>
      </button>
    </div>

    <!-- File previews -->
    <div v-if="stagedFiles.length" class="flex flex-wrap gap-2">
      <div v-for="(file, index) in stagedFiles" :key="`file-${index}`" class="relative group">
        <div class="w-16 h-16 bg-muted border border-border rounded-lg overflow-hidden">
          <!-- Uploading spinner overlay -->
          <div
            v-if="file.uploading"
            class="absolute inset-0 bg-background/70 flex items-center justify-center z-10"
          >
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>

          <img
            v-if="isImageFile(file.extension)"
            :src="file.previewUrl"
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
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { comment_placeholder } from '@/paraglide/messages'

  const authStore = useAuthStore()
  const { customer: currentUser } = storeToRefs(authStore)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  // Each staged file: { localId, name, extension, previewUrl, uploading, serverPath, isExisting }
  // serverPath is null while uploading, then set to the path returned by the server
  interface StagedFile {
    localId: string
    name: string
    extension: string
    previewUrl: string
    uploading: boolean
    serverPath: string | null
    isExisting: boolean
  }

  interface Props {
    mode?: 'add' | 'edit' | 'reply'
    parentComment?: Comment
    editComment?: Comment
    loading?: boolean
    storageUrl?: string
    uploadTempFile: (file: File) => Promise<{ path: string; url: string }>
    deleteTempFile: (path: string) => void
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'add',
    storageUrl: import.meta.env.VITE_FILE_URL || '',
    parentComment: undefined,
    editComment: undefined
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

  const stagedFiles = ref<StagedFile[]>([])
  const inputAreaRef = ref<HTMLTextAreaElement | null>(null)
  const isDragging = ref(false)
  let dragCounter = 0

  const hasUploadingFiles = computed(() => stagedFiles.value.some(f => f.uploading))

  watch(
    [() => props.mode, () => props.editComment, () => props.parentComment],
    () => {
      if (props.mode === 'edit' && props.editComment) {
        formData.value.message = props.editComment.message

        // Seed existing files directly — no blob fetching needed
        stagedFiles.value = (props.editComment.files ?? []).map((f: CommentFile) => ({
          localId: crypto.randomUUID(),
          name: f.name,
          extension: f.extension,
          previewUrl: `${props.storageUrl}/${f.url}`,
          uploading: false,
          serverPath: f.url,
          isExisting: true
        }))
      } else if (props.mode === 'reply' && props.parentComment) {
        formData.value.message = ''
        formData.value.parent_message_id = props.parentComment.id
        formData.value.parent_message = props.parentComment.message
        stagedFiles.value = []
      } else {
        formData.value.message = ''
        formData.value.parent_message_id = undefined
        formData.value.parent_message = undefined
        stagedFiles.value = []
      }
    },
    { immediate: true }
  )

  const canSubmit = computed(() => {
    return formData.value.message!.trim() || stagedFiles.value.length > 0
  })

  const getUserInitials = (name: string): string => {
    if (!name) return ''
    const parts = name.split(' ')
    return (parts[0]![0] + (parts[1]?.[0] || '')).toUpperCase()
  }

  const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || ''

  const isImageFile = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)

  const notAllowedTypes = ['php', 'exe', 'bat', 'sh']

  const handleFileUpload = async (event: Event | FileList | File[]) => {
    let files: File[] = []

    if (event instanceof Event) {
      const target = event.target as HTMLInputElement
      files = Array.from(target.files || [])
      target.value = ''
    } else if (event instanceof FileList) files = Array.from(event)
    else if (Array.isArray(event)) files = event

    const valid = files.filter(f => !notAllowedTypes.includes(getFileExtension(f.name)))

    for (const file of valid) {
      const extension = getFileExtension(file.name)
      const name = file.name.replace(/\.[^.]+$/, '')
      const localId = crypto.randomUUID()

      // Push placeholder immediately so the user sees feedback
      stagedFiles.value.push({
        localId,
        name,
        extension,
        previewUrl: isImageFile(extension) ? URL.createObjectURL(file) : '',
        uploading: true,
        serverPath: null,
        isExisting: false
      })

      try {
        const result = await props.uploadTempFile(file)
        const entry = stagedFiles.value.find(f => f.localId === localId)
        if (entry) {
          entry.serverPath = result.path
          entry.previewUrl = isImageFile(extension) ? result.url : ''
          entry.uploading = false
        }
      } catch {
        // Remove the failed placeholder
        stagedFiles.value = stagedFiles.value.filter(f => f.localId !== localId)
      }
    }
  }

  const removeFile = (index: number) => {
    const sf = stagedFiles.value[index]
    if (!sf) return
    stagedFiles.value.splice(index, 1)

    if (sf.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(sf.previewUrl)

    // Delete from server if already uploaded
    if (sf.serverPath) {
      props.deleteTempFile(sf.serverPath)
    }
  }

  const handleSubmit = () => {
    if (!canSubmit.value || hasUploadingFiles.value) return

    // Build files array from staged — same shape the backend expects
    const files = stagedFiles.value
      .filter(sf => !sf.uploading && sf.serverPath)
      .map(sf => ({ url: sf.serverPath!, name: sf.name, extension: sf.extension }))

    // Files that existed before editing but were removed by the user
    const removed_files =
      props.mode === 'edit' && props.editComment?.files
        ? props.editComment.files
            .filter((f: CommentFile) => !stagedFiles.value.some(sf => sf.serverPath === f.url))
            .map((f: CommentFile) => f.url)
        : []

    emit(
      'submit',
      {
        message: formData.value.message!.trim(),
        files, // [{ url, name, extension }] — server paths only
        removed_files,
        parent_message_id: formData.value.parent_message_id,
        parent_message: formData.value.parent_message
      },
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
    stagedFiles.value = []
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
