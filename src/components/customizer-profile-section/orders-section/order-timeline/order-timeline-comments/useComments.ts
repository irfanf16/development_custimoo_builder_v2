import type { Comment, CommentFormData, CommentResponse } from '@/services/orders/types'
import { computed, nextTick, ref } from 'vue'
import ordersService from '@/services/orders/orders.service'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import http from '@/services/api'

const UPLOAD_URL = '/comments/upload-temp-file'
const DELETE_URL = '/comments/delete-temp-file'

export const useComments = () => {
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { composable: 'useComments' } })
  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const treeVersion = ref(0)

  const commentTree = computed(() => {
    const allComments = [...comments.value]

    if (allComments.length === 0) {
      return []
    }

    const commentMap = new Map<number, Comment>()
    const rootComments: Comment[] = []

    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] })
    })

    allComments.forEach(comment => {
      if (comment.parent_message_id) {
        const parent = commentMap.get(Number(comment.parent_message_id))
        if (parent) {
          parent.children!.push(commentMap?.get(comment.id) as Comment)
        } else {
          rootComments.push(commentMap?.get(comment.id) as Comment)
        }
      } else {
        rootComments.push(commentMap?.get(comment.id) as Comment)
      }
    })

    rootComments.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const sortChildren = (comment: Comment) => {
      if (comment.children && comment.children.length > 0) {
        comment.children.sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        comment.children.forEach(sortChildren)
      }
    }

    rootComments.forEach(sortChildren)

    return rootComments
  })

  const updateComments = (newComments: Comment[]) => {
    comments.value = [...newComments]
    treeVersion.value += 1
  }

  const uploadTempFile = async (file: File): Promise<{ path: string; url: string }> => {
    const body = new FormData()
    body.append('file', file)
    const { data } = await http.post<{ result: { path: string; url: string } }>(UPLOAD_URL, body)
    return { path: data.result.path, url: data.result.url }
  }

  const deleteTempFile = (path: string): void => {
    http.delete(DELETE_URL, { data: { path } }).catch(() => {})
  }

  const addComment = async (
    formData: CommentFormData,
    apiUrl: string,
    order_item_id: number
  ): Promise<Comment> => {
    loading.value = true
    error.value = null

    const form = new FormData()

    if (formData.message && formData.message.trim()) {
      form.append('message', formData.message.trim())
    }

    if (formData.parent_message_id) {
      form.append('parent_message_id', formData.parent_message_id.toString())
      if (formData.parent_message) {
        form.append('parent_message', formData.parent_message)
      }
    }

    // Files are already uploaded — send paths as JSON, not File objects
    if (formData.files && formData.files.length > 0) {
      form.append('files', JSON.stringify(formData.files))
    }

    if (!formData.message?.trim() && (!formData.files || formData.files.length === 0)) {
      loading.value = false
      error.value = 'Comment must have either a message or files'
      throw new Error('Comment must have either a message or files')
    }
    form.append('order_item_id', order_item_id.toString())

    const response = await tryCatchApi<CommentResponse>(ordersService.addComment(apiUrl, form), {
      operation: 'addComment',
      order_item_id
    })

    if (response.success && response.content) {
      const newComment = response.content.result.item_activity_comment

      if (formData.parent_message_id && !newComment.parent_message_id) {
        newComment.parent_message_id = formData.parent_message_id
        newComment.parent_message = formData.parent_message || ''
      }

      comments.value.push(newComment)
      treeVersion.value += 1

      await nextTick()
      loading.value = false
      return newComment
    } else {
      error.value = response.axiosError?.response?.data?.message || 'Failed to add comment'
      loading.value = false
      throw new Error(error.value)
    }
  }

  const updateComment = async (
    commentId: number,
    formData: CommentFormData,
    apiUrl: string,
    order_item_id: number
  ): Promise<Comment> => {
    loading.value = true
    error.value = null

    const form = new FormData()
    form.append('message', formData.message || '')
    form.append('order_item_id', order_item_id.toString())

    // Files are already uploaded — send paths as JSON, not File objects
    const newFiles = (formData.files ?? []).filter(
      (f: { url: string; name: string; extension: string }) => f.url?.includes('/temp/')
    )
    if (newFiles.length > 0) {
      form.append('files', JSON.stringify(newFiles))
    }

    if (formData.removed_files && formData.removed_files.length > 0) {
      formData.removed_files.forEach(file => {
        form.append('removed_files[]', file)
      })
    }

    const response = await tryCatchApi<CommentResponse>(
      ordersService.updateComment(apiUrl, commentId, form),
      {
        operation: 'updateComment',
        comment_id: commentId,
        order_item_id
      }
    )

    if (response.success && response.content) {
      const updatedComment = response.content.result.item_activity_comment

      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        const newComments = [...comments.value]
        newComments[index] = updatedComment
        updateComments(newComments)
      }

      await nextTick()
      loading.value = false
      return updatedComment
    } else {
      error.value = response.axiosError?.response?.data?.message || 'Failed to update comment'
      loading.value = false
      throw new Error(error.value)
    }
  }

  const deleteComment = async (commentId: number): Promise<void> => {
    loading.value = true
    error.value = null

    const response = await tryCatchApi<CommentResponse>(ordersService.deleteComment(commentId), {
      operation: 'deleteComment',
      comment_id: commentId
    })

    if (response.success) {
      const newComments = comments.value.filter(c => c.id !== commentId)
      updateComments(newComments)
      await nextTick()
      loading.value = false
    } else {
      error.value = response.axiosError?.response?.data?.message || 'Failed to delete comment'
      loading.value = false
      throw new Error(error.value)
    }
  }

  return {
    comments,
    commentTree,
    loading,
    error,
    uploadTempFile,
    deleteTempFile,
    addComment,
    updateComment,
    deleteComment,
    updateComments
  }
}
