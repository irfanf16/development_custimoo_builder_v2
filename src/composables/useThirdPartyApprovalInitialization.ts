import { ref, computed, onMounted, readonly } from 'vue'
import { useRoute } from 'vue-router'
import {
  getThirdPartySamplesApi,
  submitThirdPartyApprovalApi,
  transformSamplesResponse,
  type Sample,
  type SubmissionPayload
} from '@/services/orders/thirdPartyApproval.service'
import { useTryCatchApi } from './useTryCatchApi'

// ============================================================================
// Composable
// ============================================================================

export function useThirdPartyApprovalInitialization() {
  const route = useRoute()
  const { tryCatchApi } = useTryCatchApi({
    defaultProperties: { module: 'thirdPartyApproval' }
  })

  // State
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)
  const unauthorized = ref(false)
  const samples = ref<Sample[]>([])

  // Computed route values
  const orderItemId = computed(() => route.params.order_item_id as string)
  const authToken = computed(() => route.query.auth_token as string)

  // ============================================================================
  // Initialization Function
  // ============================================================================

  async function initializeApp(): Promise<void> {
    // Reset state
    isLoading.value = true
    error.value = null
    unauthorized.value = false
    samples.value = []

    // 1. Validate auth_token exists
    if (!authToken.value) {
      unauthorized.value = true
      isLoading.value = false
      return
    }

    // 2. Validate order_item_id exists
    if (!orderItemId.value) {
      error.value = 'Order item ID is required'
      isLoading.value = false
      return
    }

    // 3. Call API to fetch samples using useTryCatchApi
    const response = await tryCatchApi(
      getThirdPartySamplesApi(orderItemId.value, authToken.value),
      {
        operation: 'initializeApp',
        order_item_id: orderItemId.value
      }
    )

    // 4. Handle response
    if (response.success && response.content) {
      samples.value = transformSamplesResponse(response.content)
      isInitialized.value = true
    } else {
      // Handle API errors
      const status = response.status
      const errorData = response.axiosError?.response?.data as { message?: string } | undefined
      const message =
        errorData?.message || 'An error occurred while loading samples. Please try again.'

      if (status === 403) {
        unauthorized.value = true
        error.value =
          message || 'This link has expired or you are not authorized to access this page.'
      } else if (status === 404) {
        error.value = 'Order item not found.'
      } else {
        error.value = message
      }
    }

    isLoading.value = false
  }

  // ============================================================================
  // Submission Function
  // ============================================================================

  async function submitApproval(approvalDetails: SubmissionPayload['approval_details']): Promise<{
    success: boolean
    message?: string
  }> {
    if (!orderItemId.value) {
      return {
        success: false,
        message: 'Order item ID is missing'
      }
    }

    const payload: SubmissionPayload = {
      order_item_id: orderItemId.value,
      approval_details: approvalDetails
    }

    const response = await tryCatchApi(submitThirdPartyApprovalApi(payload), {
      operation: 'submitApproval',
      order_item_id: orderItemId.value,
      approval_details_count: approvalDetails.length
    })

    if (response.success && response.content) {
      const data = response.content as { success?: boolean; message?: string }
      // Backend may not send success; treat 2xx response as success unless success is explicitly false
      return {
        success: data.success !== false,
        message: data.message
      }
    }

    // Handle errors
    const status = response.status
    let errorMessage = 'An error occurred while submitting your approval.'
    const errorData = response.axiosError?.response?.data as { message?: string } | undefined
    const message = errorData?.message || errorMessage

    if (status === 403) {
      errorMessage = 'You are not authorized to submit this approval.'
    } else if (status === 422) {
      errorMessage = message || 'Validation error. Please check your input.'
    } else {
      errorMessage = message
    }

    return {
      success: false,
      message: errorMessage
    }
  }

  // Auto-initialize on mount
  onMounted(() => {
    void initializeApp()
  })

  return {
    // State (readonly refs)
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    error: readonly(error),
    unauthorized: readonly(unauthorized),
    samples,

    // Route values
    orderItemId,
    authToken,

    // Functions
    initializeApp,
    submitApproval
  }
}
