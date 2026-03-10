<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useThirdPartyApprovalInitialization } from '@/composables/useThirdPartyApprovalInitialization'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { Textarea } from '@/components/ui/textarea'
  import { Label } from '@/components/ui/label'
  import { ZoomOnHover } from '@/components/ui/zoom-on-hover'
  import { toast } from 'vue-sonner'
  import { ChevronLeft, ChevronRight, Check, X } from 'lucide-vue-next'
  import type { ApprovalDetail } from '@/services/orders/thirdPartyApproval.service'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    feedback_placeholder,
    msg_provide_rejection_feedback,
    msg_review_all_samples
  } from '@/paraglide/messages'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const approvalInit = useThirdPartyApprovalInitialization()
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL || ''

  // ============================================================================
  // Local State
  // ============================================================================
  const currentSampleIndex = ref(0)
  const sampleStatus = ref<Array<'accepted' | 'rejected' | null>>([])
  const sampleFeedback = ref<string[]>([])
  const showRejectReasonIndex = ref<number | null>(null)
  const submissionComplete = ref(false)
  const isSubmitting = ref(false)
  const pendingFeedback = ref<string>('')

  // ============================================================================
  // Initialize state arrays when samples are loaded
  // ============================================================================
  watch(
    () => approvalInit.samples.value,
    samples => {
      if (samples.length > 0) {
        sampleStatus.value = new Array(samples.length).fill(null)
        sampleFeedback.value = new Array(samples.length).fill('')
        currentSampleIndex.value = 0
      }
    },
    { immediate: true }
  )

  // ============================================================================
  // Computed Properties
  // ============================================================================
  const currentSample = computed(() => {
    return approvalInit.samples.value[currentSampleIndex.value]
  })

  const frontImageUrl = computed(() => {
    if (!currentSample.value?.front) return ''
    const url = currentSample.value.front
    return url.startsWith('http') ? url : `${storageUrl}${url}`
  })

  const backImageUrl = computed(() => {
    if (!currentSample.value?.back) return ''
    const url = currentSample.value.back
    return url.startsWith('http') ? url : `${storageUrl}${url}`
  })

  const canGoPrevious = computed(() => currentSampleIndex.value > 0)
  const canGoNext = computed(() => currentSampleIndex.value < approvalInit.samples.value.length - 1)

  const allSamplesReviewed = computed(() => {
    const samples = approvalInit.samples.value
    return (
      samples.length > 0 &&
      sampleStatus.value.length === samples.length &&
      sampleStatus.value.every(status => status === 'accepted' || status === 'rejected')
    )
  })

  const currentSampleStatus = computed(() => sampleStatus.value[currentSampleIndex.value])
  const isShowingFeedbackForm = computed(
    () => showRejectReasonIndex.value === currentSampleIndex.value
  )

  // ============================================================================
  // Navigation Functions
  // ============================================================================
  function prevSample() {
    if (canGoPrevious.value) {
      currentSampleIndex.value--
      showRejectReasonIndex.value = null
      pendingFeedback.value = ''
    }
  }

  function nextSample() {
    if (canGoNext.value) {
      currentSampleIndex.value++
      showRejectReasonIndex.value = null
      pendingFeedback.value = ''
    }
  }

  // ============================================================================
  // Action Functions
  // ============================================================================
  function acceptSample() {
    sampleStatus.value[currentSampleIndex.value] = 'accepted'
    sampleFeedback.value[currentSampleIndex.value] = ''
    showRejectReasonIndex.value = null
    pendingFeedback.value = ''

    // Auto-advance to next sample if available
    if (canGoNext.value) {
      setTimeout(() => {
        nextSample()
      }, 300)
    }
  }

  function rejectSample() {
    sampleStatus.value[currentSampleIndex.value] = 'rejected'
    showRejectReasonIndex.value = currentSampleIndex.value
    pendingFeedback.value = sampleFeedback.value[currentSampleIndex.value] || ''
  }

  function submitRejection() {
    if (!pendingFeedback.value.trim()) {
      toast.error(msg_provide_rejection_feedback({}, { locale: locale.value }))
      return
    }

    sampleFeedback.value[currentSampleIndex.value] = pendingFeedback.value.trim()
    showRejectReasonIndex.value = null
    pendingFeedback.value = ''

    // Auto-advance to next sample if available
    if (canGoNext.value) {
      setTimeout(() => {
        nextSample()
      }, 300)
    }
  }

  function cancelRejection() {
    showRejectReasonIndex.value = null
    pendingFeedback.value = ''
  }

  // ============================================================================
  // Submission Function
  // ============================================================================
  async function submitAllSamples() {
    if (!allSamplesReviewed.value) {
      toast.error(msg_review_all_samples({}, { locale: locale.value }))
      return
    }

    const rejectedWithoutFeedback = sampleStatus.value.some(
      (status, idx) => status === 'rejected' && !sampleFeedback.value[idx]?.trim()
    )
    if (rejectedWithoutFeedback) {
      toast.error(msg_provide_rejection_feedback({}, { locale: locale.value }))
      return
    }

    isSubmitting.value = true

    const approvalDetails: ApprovalDetail[] = approvalInit.samples.value.map((sample, idx) => ({
      factory_product_id: sample.factory_product_id,
      status: sampleStatus.value[idx]!,
      feedback: sampleStatus.value[idx] === 'rejected' ? sampleFeedback.value[idx] || '' : ''
    }))

    const result = await approvalInit.submitApproval(approvalDetails)

    if (result.success) {
      submissionComplete.value = true
      toast.success(result.message || 'Your response has been submitted successfully!')
    } else {
      toast.error(result.message || 'An error occurred while submitting your approval.')
    }

    isSubmitting.value = false
  }

  // ============================================================================
  // Image Click Handler
  // ============================================================================
  function openImageInNewTab(imageUrl: string) {
    if (imageUrl) {
      window.open(imageUrl, '_blank')
    }
  }
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">Third Party Approval</h1>
        <p class="text-muted-foreground">Review and approve or reject the product samples below.</p>
      </div>

      <!-- Success State -->
      <div v-if="submissionComplete" class="text-center py-12">
        <div class="mb-4">
          <div
            class="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
          >
            <Check class="size-8 text-primary" />
          </div>
          <h2 class="text-2xl font-semibold mb-2">Submission Successful!</h2>
          <p class="text-muted-foreground">
            Your response has been submitted successfully. Thank you for your review.
          </p>
        </div>
      </div>

      <!-- Sample Review Interface -->
      <div v-else-if="currentSample" class="space-y-6">
        <!-- Sample Counter and Navigation -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            Sample {{ currentSampleIndex + 1 }} of {{ approvalInit.samples.value.length }}
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="icon" :disabled="!canGoPrevious" @click="prevSample">
              <ChevronLeft class="size-4" />
            </Button>
            <Button variant="outline" size="icon" :disabled="!canGoNext" @click="nextSample">
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>

        <!-- Sample Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ currentSample.name }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Images Display -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Front Image -->
              <div class="flex flex-col gap-3">
                <Label class="text-sm font-medium text-center">Front</Label>
                <div
                  class="w-full aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                  @click="openImageInNewTab(frontImageUrl)"
                >
                  <ZoomOnHover
                    v-if="frontImageUrl"
                    :image-src="frontImageUrl"
                    image-alt="Front view"
                    :zoom-factor="2"
                    class="w-full h-full"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"
                  >
                    No front image
                  </div>
                </div>
              </div>

              <!-- Back Image -->
              <div class="flex flex-col gap-3">
                <Label class="text-sm font-medium text-center">Back</Label>
                <div
                  class="w-full aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                  @click="openImageInNewTab(backImageUrl)"
                >
                  <ZoomOnHover
                    v-if="backImageUrl"
                    :image-src="backImageUrl"
                    image-alt="Back view"
                    :zoom-factor="2"
                    class="w-full h-full"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"
                  >
                    No back image
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                class="flex-1"
                :class="{
                  'border-primary bg-primary/10': currentSampleStatus === 'accepted'
                }"
                @click="acceptSample"
              >
                <Check class="size-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                class="flex-1"
                :class="{
                  'border-destructive bg-destructive/10': currentSampleStatus === 'rejected'
                }"
                @click="rejectSample"
              >
                <X class="size-4 mr-2" />
                Reject
              </Button>
            </div>

            <!-- Feedback Form (shown when rejecting) -->
            <div v-if="isShowingFeedbackForm" class="space-y-3 pt-4 border-t">
              <Label for="feedback">Please provide feedback for rejection *</Label>
              <Textarea
                id="feedback"
                v-model="pendingFeedback"
                :placeholder="feedback_placeholder({}, { locale })"
                rows="4"
                class="w-full"
              />
              <div class="flex gap-2">
                <Button variant="outline" @click="cancelRejection">Cancel</Button>
                <Button @click="submitRejection">Submit Feedback</Button>
              </div>
            </div>

            <!-- Status Indicator -->
            <div v-if="currentSampleStatus" class="pt-4 border-t">
              <div
                class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                :class="{
                  'bg-primary/10 text-primary': currentSampleStatus === 'accepted',
                  'bg-destructive/10 text-destructive': currentSampleStatus === 'rejected'
                }"
              >
                <Check v-if="currentSampleStatus === 'accepted'" class="size-4" />
                <X v-else class="size-4" />
                <span class="font-medium">
                  {{ currentSampleStatus === 'accepted' ? 'Accepted' : 'Rejected' }}
                </span>
                <span
                  v-if="currentSampleStatus === 'rejected' && sampleFeedback[currentSampleIndex]"
                  class="text-xs opacity-75"
                >
                  - Feedback submitted
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Submit Button (shown when all samples reviewed) -->
        <div v-if="allSamplesReviewed" class="flex justify-center pt-4">
          <Button size="lg" :disabled="isSubmitting" @click="submitAllSamples">
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit All Reviews</span>
          </Button>
        </div>

        <!-- Progress Indicator -->
        <div class="text-center text-sm text-muted-foreground">
          {{ sampleStatus.filter(s => s !== null).length }} of
          {{ approvalInit.samples.value.length }} samples reviewed
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="approvalInit.samples.value.length === 0" class="text-center py-12">
        <p class="text-muted-foreground">No samples available for review.</p>
      </div>
    </div>
  </div>
</template>
