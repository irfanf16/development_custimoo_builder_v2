<template>
  <div class="space-y-3">
    <!-- Main comment -->
    <div v-if="!commentState.edit_comment" class="flex gap-3 items-start">
      <div class="flex-1 min-w-0">
        <div class="bg-muted rounded-lg p-4 shadow-sm">
          <!-- Header row: avatar, name, date -->
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium"
            >
              {{ getUserInitials(comment.user) }}
            </div>
            <div class="flex flex-col">
              <span class="font-medium text-sm text-foreground">
                {{ getUserName(comment) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ comment.created_at }}
              </span>
              <span
                ><small class="text-xs text-muted-foreground">{{
                  evaluateRole(comment)
                }}</small></span
              >
            </div>
          </div>

          <!-- Parent message quote (for replies) -->
          <div
            v-if="comment.parent_message"
            class="bg-card border-l-4 border-border p-2 mb-2 text-[14px] italic text-muted-foreground"
            v-html="comment.parent_message"
          ></div>

          <!-- Comment message -->
          <div
            class="mb-2 text-muted-foreground"
            style="font-size: 14px"
            v-html="linkifyText(comment.message)"
          ></div>

          <!-- Action buttons always visible below comment -->
          <div class="flex items-center gap-2 mt-2">
            <!-- Edit button -->
            <button
              v-if="canEditComment(comment)"
              class="px-2 py-1 rounded text-muted-foreground hover:text-foreground"
              @click="toggleEdit"
            >
              <PencilIcon class="w-4 h-4 inline mr-1" />
              Edit
            </button>

            <!-- Delete button -->
            <button
              v-if="canDeleteComment(comment)"
              class="px-2 py-1 rounded text-muted-foreground hover:text-foreground"
              @click="handleDelete"
            >
              <TrashIcon class="w-4 h-4 inline mr-1" />
              Delete
            </button>
            <!-- Reply button -->
            <button
              class="px-2 py-1 rounded text-muted-foreground hover:text-foreground"
              @click="toggleReply"
            >
              <ArrowLeftIcon class="w-4 h-4 inline mr-1" />
              Reply
            </button>
          </div>

          <!-- Comment files -->
          <div v-if="comment.files?.length" class="flex flex-wrap gap-2 mb-2">
            <div
              v-for="(file, index) in comment.files"
              :key="`comment-file-${index}`"
              class="relative group cursor-pointer"
              @click="handleFileClick(file)"
            >
              <div class="w-16 h-12 bg-muted border border-border rounded overflow-hidden">
                <img
                  v-if="isImageFile(file.extension)"
                  :src="`${storageUrl}/${file.url}`"
                  :alt="file.name"
                  class="w-full h-full object-cover pointer-events-none"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <FileIcon class="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <div
                class="absolute bottom-0 left-0 right-0 bg-foreground/50 text-card-foreground text-xs p-1 truncate"
              >
                {{ file.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit form -->
    <div v-if="commentState.edit_comment" class="ml-11">
      <CommentForm
        mode="edit"
        :edit-comment="comment"
        :loading="loading"
        :storage-url="storageUrl"
        @submit="handleEditSubmit"
        @cancel="cancelEdit"
      />
    </div>

    <!-- Reply form -->
    <div v-if="commentState.reply_comment" class="ml-11">
      <CommentForm
        mode="reply"
        :parent-comment="comment"
        :loading="loading"
        :storage-url="storageUrl"
        @submit="handleReplySubmit"
        @cancel="cancelReply"
      />
    </div>

    <!-- Child comments (replies) -->
    <div v-if="comment.children?.length" class="mt-4">
      <div class="ml-8 pl-4 space-y-3 border-l-2 border-border">
        <CommentItem
          v-for="child in comment.children"
          :key="`child-comment-${child.id}-${refreshKey}`"
          :comment="child"
          :storage-url="storageUrl"
          :loading="loading"
          @edit-comment="
            (comment, data, editCommentData) => $emit('editComment', comment, data, editCommentData)
          "
          @delete-comment="comment => $emit('deleteComment', comment)"
          @reply-comment="(parentComment, data) => $emit('replyComment', parentComment, data)"
          @resolve-comment="(comment, actionTaken) => $emit('resolveComment', comment, actionTaken)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { usePermissions } from '@/composables/usePermissions.ts'
  import type { Comment, CommentFile, CommentFormData } from '@/services/orders/types'
  import { ArrowLeftIcon, FileIcon, PencilIcon, TrashIcon } from 'lucide-vue-next'
  import { inject, reactive, ref, watch } from 'vue'
  import CommentForm from './CommentForm.vue'

  interface Props {
    comment: Comment
    storageUrl?: string
    loading?: boolean
    isResolving?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    storageUrl: import.meta.env.VITE_FILE_URL || '',
    loading: false,
    isResolving: false
  })

  const emit = defineEmits<{
    editComment: [comment: Comment, data: CommentFormData, editCommentData: Comment]
    deleteComment: [comment: Comment]
    replyComment: [parentComment: Comment, data: CommentFormData]
    resolveComment: [comment: Comment, actionTaken: boolean]
  }>()

  // Inject refresh key from parent to force re-renders
  const refreshKey = inject('refreshKey', ref(0))

  const commentState = reactive({
    edit_comment: false,
    reply_comment: false,
    show_actions: false
  })

  const { canEditComment, canDeleteComment } = usePermissions()

  const getUserInitials = (user: any): string => {
    if (!user) return ''
    let name = user.name
    if (!name && user.first_name) {
      name = user.first_name
    }
    if (!name) return ''
    const nameArray = name.split(' ')
    const firstLetter = name.charAt(0)
    let lastLetter = ''
    if (nameArray.length > 1) {
      lastLetter = nameArray[nameArray.length - 1].charAt(0)
    }
    return (firstLetter + lastLetter).toUpperCase()
  }

  const handleEditSubmit = (data: CommentFormData, editCommentData?: Comment) => {
    emit('editComment', props.comment as Comment, data, editCommentData as Comment)
    commentState.edit_comment = false
  }

  const handleReplySubmit = (data: CommentFormData) => {
    if (!data) return

    const replyData: CommentFormData = {
      ...data,
      parent_message_id: props.comment.id,
      parent_message: props.comment.message
    }

    emit('replyComment', props.comment, replyData)
    commentState.reply_comment = false
  }

  const handleDelete = async () => {
    emit('deleteComment', props.comment as Comment)
  }

  const handleFileClick = (file: CommentFile) => {
    const url = `${props.storageUrl}/${file.url}`
    window.open(url, '_blank')
  }

  const toggleReply = () => {
    commentState.reply_comment = !commentState.reply_comment
    commentState.edit_comment = false
  }

  const toggleEdit = () => {
    commentState.edit_comment = !commentState.edit_comment
    commentState.reply_comment = false
  }

  const cancelReply = () => {
    commentState.reply_comment = false
  }

  const cancelEdit = () => {
    commentState.edit_comment = false
  }

  watch(
    () => props.comment,
    newComment => {
      commentState.edit_comment = newComment.edit_comment || false
      commentState.reply_comment = newComment.reply_comment || false
      commentState.show_actions = newComment.show_actions || false
    },
    { immediate: true }
  )

  const isImageFile = (extension: string): boolean => {
    if (!extension) return false
    return ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'].includes(extension.toLowerCase())
  }

  // Evaluate the user's role for display under the comment
  const evaluateRole = (activity_comment: any): string => {
    if (Object.prototype.hasOwnProperty.call(activity_comment, 'user') && activity_comment.user) {
      if (Object.prototype.hasOwnProperty.call(activity_comment.user, 'userroles')) {
        if (activity_comment.user.userroles.length > 0) {
          switch (activity_comment.user.userroles[0].name.toLowerCase()) {
            case 'factory':
              return 'Factory'
            case 'admin':
              return 'Merchant'
            case 'superadmin':
              return 'Custimoo Admin'
            case 'orderadministrator':
              return 'Order administrator'
          }
        }
      } else {
        return 'Customer'
      }
    } else {
      return 'Customer'
    }
    return ''
  }

  const getUserName = (comment: any): string => {
    if (comment?.name) {
      return comment.name
    }
    if (comment?.user) {
      if (evaluateRole(comment) === 'Customer') {
        return comment.user?.first_name + ' ' + comment.user?.last_name
      } else {
        return comment.user?.name || 'User'
      }
    } else {
      return 'User'
    }
  }

  function linkifyText(text: string) {
    const urlRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/\S*)?)/gi

    return text.replace(urlRegex, match => {
      let url = match

      // If URL has no protocol, add https://
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }

      return `<a href="${url}" class="text-primary hover:underline " style="font-size:12px !important" target="_blank" rel="noopener noreferrer">${match}</a>`
    })
  }
</script>
