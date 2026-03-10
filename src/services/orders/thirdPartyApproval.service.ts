import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ActivityFile } from './types'

// Separate axios instance for third-party approval endpoints
// This instance doesn't use CustomerToken header, instead uses auth_token query parameter
export const approvalInstance: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_ENDPOINT}/api`
})

// ============================================================================
// Type Definitions
// ============================================================================

export interface Sample {
  front: string
  back: string
  name: string
  factory_product_id: string | number
}

export interface ApprovalDetail {
  factory_product_id: string | number
  status: 'accepted' | 'rejected'
  feedback: string
}

export interface SubmissionPayload {
  order_item_id: string | number
  approval_details: ApprovalDetail[]
  auth_token: string
}

export interface GetSamplesResponse {
  result: {
    order_item_activity: {
      activity_items: Array<{
        activity_files: ActivityFile[]
        product_info?: {
          name: string
        }
        factory_product_id: string | number
      }>
    }
  }
}

export interface SubmitApprovalResponse {
  success: boolean
  message: string
  result?: unknown
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches third-party design samples for approval (returns axios promise)
 * @param orderItemId - The order item ID from route params
 * @param authToken - Authentication token from query params
 * @returns Axios response promise
 */
export function getThirdPartySamplesApi(
  orderItemId: string | number,
  authToken: string
): Promise<AxiosResponse<GetSamplesResponse>> {
  return approvalInstance.get<GetSamplesResponse>(
    `/admin/get-third-party-design-samples/${orderItemId}`,
    {
      params: {
        auth_token: authToken
      }
    }
  )
}

/**
 * Transforms API response to component-friendly format
 */
export function transformSamplesResponse(data: GetSamplesResponse): Sample[] {
  const activityItems = data.result?.order_item_activity?.activity_items || []

  return activityItems.map(item => {
    const files = item.activity_files || []

    // Find front and back images
    // Typically front images contain "front" in the name, back images contain "back"
    const frontFile = files.find(
      file =>
        file.name.toLowerCase().includes('front') ||
        file.name.toLowerCase().includes('1') ||
        files.indexOf(file) === 0
    )

    const backFile = files.find(
      file =>
        (file.name.toLowerCase().includes('back') || file.name.toLowerCase().includes('2')) &&
        file !== frontFile
    )

    return {
      front: frontFile?.url || '',
      back: backFile?.url || '',
      name: item.product_info?.name || 'Product',
      factory_product_id: item.factory_product_id
    }
  })
}

/**
 * Fetches third-party design samples for approval
 * @param orderItemId - The order item ID from route params
 * @param authToken - Authentication token from query params
 * @returns Transformed samples array
 * @deprecated Use getThirdPartySamplesApi with useTryCatchApi instead
 */
export async function getThirdPartySamples(
  orderItemId: string | number,
  authToken: string
): Promise<Sample[]> {
  const { data } = await getThirdPartySamplesApi(orderItemId, authToken)
  return transformSamplesResponse(data)
}

/**
 * Submits third-party approval decisions (returns axios promise)
 * @param payload - Submission payload with order_item_id and approval_details
 * @returns Axios response promise
 */
export function submitThirdPartyApprovalApi(
  payload: SubmissionPayload
): Promise<AxiosResponse<SubmitApprovalResponse>> {
  return approvalInstance.post<SubmitApprovalResponse>(
    '/admin/approve-reject-third-party-samples',
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Submits third-party approval decisions
 * @param payload - Submission payload with order_item_id and approval_details
 * @returns API response
 * @deprecated Use submitThirdPartyApprovalApi with useTryCatchApi instead
 */
export async function submitThirdPartyApproval(
  payload: SubmissionPayload
): Promise<SubmitApprovalResponse> {
  const { data } = await submitThirdPartyApprovalApi(payload)
  return data
}
