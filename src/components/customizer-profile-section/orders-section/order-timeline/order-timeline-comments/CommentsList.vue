<template>
  <div class="space-y-4">
    <!-- Add comment button -->
    <div v-if="!showAddForm && isaIdx == 0">
      <Button @click="showAddForm = true">
        <MessageCircleIcon class="w-4 h-4" />
        Add Comment
      </Button>
    </div>

    <!-- Add comment form -->
    <div v-if="showAddForm && isaIdx == 0">
      <CommentForm
        mode="add"
        :loading="loading"
        :storage-url="storage_url"
        :upload-temp-file="uploadTempFile"
        :delete-temp-file="deleteTempFile"
        @submit="handleAddComment"
        @cancel="showAddForm = false"
      />
    </div>

    <!-- Comments list -->
    <div v-if="commentTree.length" class="space-y-4">
      <CommentItem
        v-for="comment in commentTree"
        :key="`comment-${comment.id}-${refreshKey}`"
        :comment="comment"
        :storage-url="storage_url"
        :loading="loading"
        :upload-temp-file="uploadTempFile"
        :delete-temp-file="deleteTempFile"
        @edit-comment="handleEditComment"
        @delete-comment="handleDeleteComment"
        @reply-comment="handleReplyComment"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-2 text-muted-foreground">Loading comments...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useComments } from './useComments'
  import { onMounted, provide, ref, watch, computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { MessageCircleIcon } from 'lucide-vue-next'
  import CommentForm from './CommentForm.vue'
  import CommentItem from './CommentItem.vue'
  import { toast } from 'vue-sonner'
  import {
    msg_comment_added,
    msg_comment_updated,
    msg_comment_deleted,
    msg_reply_added,
    msg_failed_to_add_comment,
    msg_failed_to_update_comment,
    msg_failed_to_delete_comment,
    msg_failed_to_add_reply
  } from '@/paraglide/messages'

  import type { Comment } from '@/services/orders/types'
  import type { CommentFormData } from '@/services/orders/types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  interface Props {
    apiUrl: string
    initialComments?: Comment[]
    isaIdx?: number
    order_item_id: number
  }

  const props = withDefaults(defineProps<Props>(), {
    initialComments: () => []
  })

  defineEmits<{
    refreshComments: []
  }>()

  const showAddForm = ref(false)
  const refreshKey = ref(0)
  const storage_url = import.meta.env.VITE_APP_STORAGE_URL
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  provide('refreshKey', refreshKey)

  const {
    // comments,
    commentTree,
    loading,
    uploadTempFile,
    deleteTempFile,
    addComment,
    updateComment,
    deleteComment,
    updateComments
  } = useComments()

  watch(
    () => props.initialComments,
    newComments => {
      if (newComments && newComments.length >= 0) {
        updateComments(newComments)
        refreshKey.value += 1
      }
    },
    { immediate: true, deep: true }
  )

  onMounted(() => {
    if (props.initialComments.length) {
      updateComments(props.initialComments)
    }
  })

  const handleAddComment = async (data: CommentFormData) => {
    try {
      await addComment(data, props.apiUrl, props.order_item_id)
      showAddForm.value = false
      refreshKey.value += 1
      toast.success(msg_comment_added({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } catch (err) {
      console.error('Failed to add comment:', err)
      toast.error(msg_failed_to_add_comment({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }
  }

  const handleEditComment = async (comment: Comment, data: CommentFormData) => {
    try {
      await updateComment(comment.id, data, props.apiUrl, props.order_item_id)
      refreshKey.value += 1
      toast.success(msg_comment_updated({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } catch (err) {
      console.error('Failed to update comment:', err)
      toast.error(msg_failed_to_update_comment({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    try {
      await deleteComment(comment.id)
      refreshKey.value += 1
      toast.success(msg_comment_deleted({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } catch (err) {
      console.error('Failed to delete comment:', err)
      toast.error(msg_failed_to_delete_comment({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }
  }

  const handleReplyComment = async (parentComment: Comment, data: CommentFormData) => {
    try {
      if (!parentComment?.id || !data) return

      // data already contains parent_message_id, parent_message and correct files
      // from CommentForm — no need to reconstruct
      if (!data.message?.trim() && (!data.files || data.files.length === 0)) return

      await addComment(data, props.apiUrl, props.order_item_id)
      refreshKey.value += 1
      toast.success(msg_reply_added({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } catch (err) {
      console.error('Failed to add reply:', err)
      toast.error(msg_failed_to_add_reply({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }
  }
</script>
