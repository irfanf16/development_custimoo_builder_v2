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
  import { onMounted, provide, ref, watch } from 'vue'
  import { Button } from '@/components/ui/button'
  import { MessageCircleIcon } from 'lucide-vue-next'
  import CommentForm from './CommentForm.vue'
  import CommentItem from './CommentItem.vue'

  import type { Comment } from '@/services/orders/types'
  import type { CommentFormData } from '@/services/orders/types'
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

  provide('refreshKey', refreshKey)

  const {
    // comments,
    commentTree,
    loading,
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
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleEditComment = async (
    comment: Comment,
    data: CommentFormData,
    editCommentData: Comment
  ) => {
    try {
      await updateComment(comment.id, data, props.apiUrl, editCommentData, props.order_item_id)
      refreshKey.value += 1
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    try {
      await deleteComment(comment.id)
      refreshKey.value += 1
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const handleReplyComment = async (parentComment: Comment, data: CommentFormData) => {
    try {
      if (!parentComment?.id || !data) return

      const replyData: CommentFormData = {
        message: data.message || '',
        files: data.files || [],
        parent_message_id: parentComment.id,
        parent_message: parentComment.message || ''
      }

      if (!replyData?.message?.trim() && (!replyData.files || replyData.files.length === 0)) {
        return
      }

      await addComment(replyData, props.apiUrl, props.order_item_id)
      refreshKey.value += 1
    } catch (err) {
      console.error('Failed to add reply:', err)
    }
  }
</script>
