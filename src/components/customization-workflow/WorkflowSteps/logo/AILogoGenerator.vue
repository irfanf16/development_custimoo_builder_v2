<script setup lang="ts">
  import { ref, computed, onBeforeUnmount } from 'vue'
  import { Button } from '@/components/ui/button'
  import {
    Sparkles,
    RefreshCw,
    Check,
    Lock,
    X,
    Paperclip,
    ArrowUp,
    Shuffle,
    AlertTriangle
  } from 'lucide-vue-next'
  import { useAILogoLimit } from './useAILogoLimit'
  import { useSignIn } from '@/composables/useSignIn'
  import { generateAILogo } from '@/services/ai/ai-logo-generation'
  import type { CustomLogo } from '@/services/logos/types'
  import {
    ai_logos_title,
    ai_logos_sign_in_title,
    ai_logos_sign_in_description,
    ai_logos_sign_in_cta,
    ai_logos_daily_limit_title,
    ai_logos_daily_limit_description,
    ai_logos_daily_usage_strip,
    ai_logos_mood_optional,
    ai_logos_apply,
    ai_logos_applying,
    ai_logos_start_over,
    ai_logos_regenerate,
    ai_logos_preview_alt,
    ai_logos_regenerate_tooltip,
    ai_logos_shuffle_logo_loading
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useLogosStore } from '@/stores/logos/logos.store'

  const profileStore = useProfileStore()
  const logosStore = useLogosStore()
  const { isAuthenticated, openSignInDialog } = useSignIn()

  const emit = defineEmits<{
    'request-apply': [payload: { prompt: string; blob?: Blob; customerLogo?: CustomLogo }]
  }>()

  const { remaining, hasReachedLimit, isUnlimited, dailyLimit, syncQuotaAfterGeneration } =
    useAILogoLimit()

  const usedToday = computed(() => {
    if (isUnlimited.value) return 0
    const total = Math.max(0, dailyLimit.value)
    return Math.min(total, Math.max(0, total - remaining.value))
  })

  const limitLabel = computed(() => {
    if (isUnlimited.value) return null
    return ai_logos_daily_usage_strip(
      {
        // Copy in product expects consumed/total, e.g. 8/8 at limit.
        remaining: String(usedToday.value),
        total: String(dailyLimit.value)
      },
      { locale: profileStore.currentLocale }
    )
  })

  const limitLabelClass = computed(() =>
    remaining.value <= 2 && !isUnlimited.value ? 'text-destructive' : 'text-muted-foreground'
  )

  const inputText = ref('')
  const promptInputRef = ref<HTMLTextAreaElement | null>(null)
  const isGenerating = ref(false)
  const isApplying = ref(false)
  const isShuffling = ref(false)
  const error = ref<string | null>(null)

  const AVG_KEY = 'ai_logo_avg_gen_ms'
  const FALLBACK_AVG_MS = 15000
  const TARGET_PCT = 88

  function readAvg(): number {
    const raw = Number(localStorage.getItem(AVG_KEY))
    if (!Number.isFinite(raw) || raw < 6000 || raw > 60000) return FALLBACK_AVG_MS
    return raw
  }
  function writeAvg(durationMs: number) {
    const prev = readAvg()
    const next = Math.round(prev * 0.7 + durationMs * 0.3)
    localStorage.setItem(AVG_KEY, String(Math.max(6000, Math.min(60000, next))))
  }

  const progress = ref(0)
  let progressTimer: ReturnType<typeof setInterval> | null = null
  let progressStart = 0
  let progressBudgetMs = FALLBACK_AVG_MS

  function startProgress() {
    stopProgress()
    progress.value = 0
    progressStart = Date.now()
    progressBudgetMs = readAvg()
    progressTimer = setInterval(() => {
      const elapsed = Date.now() - progressStart
      const pct = TARGET_PCT * (1 - Math.exp(-elapsed / (progressBudgetMs * 0.6)))
      progress.value = Math.min(TARGET_PCT, pct)
    }, 100)
  }

  function completeProgress() {
    stopProgress()
    progress.value = 100
    setTimeout(() => {
      if (!isGenerating.value && !isShuffling.value) progress.value = 0
    }, 350)
  }

  function stopProgress() {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  interface GenerationEntry {
    id: string
    url: string
    blob: Blob
    prompt: string
    moods: string[]
    timestamp: number
    /** Present when the image already exists on the server (skip re-upload on apply). */
    customerLogo?: CustomLogo
  }
  const current = ref<GenerationEntry | null>(null)

  const activeEntry = computed(() => current.value)

  function clearCurrentPreview() {
    if (current.value) URL.revokeObjectURL(current.value.url)
    current.value = null
  }

  /** Replaces any previous preview (no stacked generation history). */
  function setCurrentPreview(
    blob: Blob,
    userPrompt: string,
    moods: string[],
    customerLogo?: CustomLogo
  ): void {
    clearCurrentPreview()
    current.value = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(blob),
      blob,
      prompt: userPrompt,
      moods,
      timestamp: Date.now(),
      customerLogo
    }
  }

  onBeforeUnmount(() => {
    stopProgress()
    clearCurrentPreview()
    if (referenceImage.value?.source === 'upload') URL.revokeObjectURL(referenceImage.value.url)
  })

  interface Mood {
    id: string
    label: string
    fragment: string
  }
  const MOODS: Mood[] = [
    { id: 'bold', label: 'Bold', fragment: 'bold, high-impact, thick strokes' },
    { id: 'flat', label: 'Flat', fragment: 'flat design, no gradients, solid colors' },
    {
      id: 'cartoonish',
      label: 'Cartoonish',
      fragment: 'cartoonish, exaggerated, fun character style'
    },
    { id: 'minimalist', label: 'Minimalist', fragment: 'minimalist, clean, simple shapes' },
    { id: 'vintage', label: 'Vintage', fragment: 'vintage, retro, 70s-80s aesthetic' },
    { id: 'modern', label: 'Modern', fragment: 'modern, sleek, contemporary' },
    { id: 'geometric', label: 'Geometric', fragment: 'geometric, angular, sharp shapes' },
    { id: 'mascot', label: 'Mascot', fragment: 'mascot-style, character-driven, expressive' },
    { id: 'aggressive', label: 'Aggressive', fragment: 'aggressive, fierce, intense energy' },
    { id: 'playful', label: 'Playful', fragment: 'playful, energetic, lighthearted' }
  ]
  const selectedMoods = ref<Set<string>>(new Set())

  function toggleMood(id: string) {
    if (selectedMoods.value.has(id)) selectedMoods.value.delete(id)
    else selectedMoods.value.add(id)
    selectedMoods.value = new Set(selectedMoods.value)
  }

  function selectedMoodIds(): string[] {
    return MOODS.filter(m => selectedMoods.value.has(m.id)).map(m => m.id)
  }

  interface ReferenceImage {
    url: string
    blob: Blob | null
    source: 'upload' | 'recent'
    name?: string
    /** Recent logo row id - sent as `customer_logo_id` on generate-logo (not as image URL). */
    customerLogoId?: number
    /** Relative storage path (optional; full preview URL is in `url`). */
    remoteUrl?: string
  }
  const referenceImage = ref<ReferenceImage | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)

  function openFilePicker() {
    fileInput.value?.click()
  }

  function acceptReferenceFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      error.value = 'Reference must be an image file.'
      return false
    }
    if (file.size > 8 * 1024 * 1024) {
      error.value = 'Reference image must be under 8 MB.'
      return false
    }
    if (referenceImage.value?.source === 'upload') URL.revokeObjectURL(referenceImage.value.url)
    referenceImage.value = {
      url: URL.createObjectURL(file),
      blob: file,
      source: 'upload',
      name: file.name
    }
    error.value = null
    return true
  }

  function onFileChosen(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    acceptReferenceFile(file)
    input.value = ''
  }

  function setReferenceFromRecentLogo(logo: {
    customerLogoId: number
    url: string
    remoteUrl?: string
  }) {
    if (referenceImage.value?.source === 'upload') URL.revokeObjectURL(referenceImage.value.url)
    referenceImage.value = {
      url: logo.url,
      blob: null,
      source: 'recent',
      customerLogoId: logo.customerLogoId,
      ...(logo.remoteUrl != null && logo.remoteUrl !== '' ? { remoteUrl: logo.remoteUrl } : {})
    }
    error.value = null
  }

  function focusPromptInput() {
    const el = promptInputRef.value
    if (!el) return
    el.focus()
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function clearReference() {
    if (referenceImage.value?.source === 'upload') URL.revokeObjectURL(referenceImage.value.url)
    referenceImage.value = null
  }

  const isDraggingOver = ref(false)
  let dragCounter = 0

  function onDragEnter(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return
    e.preventDefault()
    dragCounter++
    isDraggingOver.value = true
  }

  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    dragCounter = Math.max(0, dragCounter - 1)
    if (dragCounter === 0) isDraggingOver.value = false
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    dragCounter = 0
    isDraggingOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) acceptReferenceFile(file)
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const idx = result.indexOf(',')
        resolve(idx >= 0 ? result.slice(idx + 1) : result)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  }

  async function fetchAsBlob(url: string): Promise<Blob> {
    const r = await fetch(url)
    if (!r.ok) throw new Error('Failed to load reference image')
    return r.blob()
  }

  async function resolveReferenceB64(): Promise<string | null> {
    if (referenceImage.value) {
      const blob = referenceImage.value.blob ?? (await fetchAsBlob(referenceImage.value.url))
      return blobToBase64(blob)
    }
    if (activeEntry.value) {
      return blobToBase64(activeEntry.value.blob)
    }
    return null
  }

  async function runGenerate(userPrompt: string, mode: 'generate' | 'refine' | 'shuffle') {
    const moods =
      mode === 'shuffle' && activeEntry.value ? activeEntry.value.moods : selectedMoodIds()

    let referenceB64: string | null = null
    let referenceImageUrl: string | null = null
    let referenceCustomerLogoId: number | undefined

    if (referenceImage.value?.source === 'recent') {
      if (referenceImage.value.customerLogoId != null) {
        referenceCustomerLogoId = referenceImage.value.customerLogoId
      } else {
        referenceImageUrl = referenceImage.value.url
      }
    } else {
      referenceB64 = await resolveReferenceB64()
    }

    const serverLogoId =
      mode === 'shuffle' && activeEntry.value?.customerLogo?.id != null
        ? activeEntry.value.customerLogo.id
        : undefined

    const genResult = await generateAILogo({
      prompt: userPrompt.trim(),
      moods,
      referenceB64,
      referenceImageUrl,
      referenceCustomerLogoId,
      mode,
      ...(serverLogoId != null ? { customerLogoId: serverLogoId } : {})
    })

    syncQuotaAfterGeneration(genResult.remainingQuota)

    let customerLogo: CustomLogo | undefined
    let previewBlob: Blob
    const logo = genResult.logo
    if (logo instanceof Blob) {
      previewBlob = logo
    } else {
      customerLogo = logo
      const base = import.meta.env.VITE_APP_STORAGE_URL || ''
      const res = await fetch(base + logo.url)
      if (!res.ok) throw new Error('Failed to load generated logo preview')
      previewBlob = await res.blob()
    }

    writeAvg(Date.now() - progressStart)
    setCurrentPreview(previewBlob, userPrompt, moods, customerLogo)
    if (!(logo instanceof Blob)) {
      void logosStore.fetchRecentLogos()
    }
    completeProgress()
    inputText.value = ''
    clearReference()
  }

  const canSubmit = computed(
    () => !!inputText.value.trim() && !isGenerating.value && !hasReachedLimit.value
  )

  async function submit() {
    const userMessage = inputText.value.trim()
    if (!userMessage || isGenerating.value || hasReachedLimit.value) return
    if (!isAuthenticated.value) {
      openSignInDialog()
      return
    }

    isGenerating.value = true
    error.value = null
    startProgress()

    try {
      await runGenerate(userMessage, 'generate')
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to generate logo'
      stopProgress()
      progress.value = 0
    } finally {
      isGenerating.value = false
    }
  }

  async function regenerateSession() {
    if (!activeEntry.value || isShuffling.value || isGenerating.value || hasReachedLimit.value)
      return
    if (!isAuthenticated.value) {
      openSignInDialog()
      return
    }
    isShuffling.value = true
    error.value = null
    startProgress()

    try {
      const userMessage = inputText.value.trim() || activeEntry.value.prompt
      inputText.value = userMessage
      await runGenerate(userMessage, 'shuffle')
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to regenerate'
      stopProgress()
      progress.value = 0
    } finally {
      isShuffling.value = false
    }
  }

  function applyLogo() {
    if (!activeEntry.value || isApplying.value) return
    isApplying.value = true
    const e = activeEntry.value
    emit('request-apply', {
      prompt: e.prompt,
      blob: e.customerLogo ? undefined : e.blob,
      customerLogo: e.customerLogo
    })
  }

  function resetApplyState() {
    isApplying.value = false
  }

  function startOver() {
    clearCurrentPreview()
    inputText.value = ''
    error.value = null
    clearReference()
  }

  function handleSubmitKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const placeholderText = computed(() => {
    if (referenceImage.value || activeEntry.value) {
      return 'Describe the changes you want to make?'
    }
    return "Describe your logo, e.g. 'A bold lion head in gold and black'"
  })

  defineExpose({ resetApplyState, setReferenceFromRecentLogo, focusPromptInput })
</script>

<template>
  <div data-testid="workflow-logo-ai-generator" class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <Sparkles class="size-4 shrink-0 text-primary" />
        <span class="text-sm font-semibold font-brand truncate">{{
          ai_logos_title({}, { locale: profileStore.currentLocale })
        }}</span>
      </div>
      <span
        v-if="isAuthenticated && limitLabel"
        class="text-[11px] shrink-0 text-right leading-tight tabular-nums max-w-[min(200px,52%)]"
        :class="limitLabelClass"
      >
        {{ limitLabel }}
      </span>
    </div>

    <div
      v-if="!isAuthenticated"
      class="rounded-xl bg-muted/50 border border-border px-4 py-5 flex flex-col items-center gap-2 text-center"
    >
      <Lock class="size-6 text-muted-foreground" />
      <p class="text-sm font-semibold text-foreground">
        {{ ai_logos_sign_in_title({}, { locale: profileStore.currentLocale }) }}
      </p>
      <p class="text-xs text-muted-foreground max-w-sm">
        {{ ai_logos_sign_in_description({}, { locale: profileStore.currentLocale }) }}
      </p>
      <Button
        variant="outline"
        size="sm"
        class="mt-1 rounded-lg border-border"
        @click="openSignInDialog"
      >
        {{ ai_logos_sign_in_cta({}, { locale: profileStore.currentLocale }) }}
      </Button>
    </div>

    <template v-else>
      <div
        v-if="hasReachedLimit"
        role="alert"
        class="rounded-xl border border-amber-500/45 bg-amber-500/[0.12] px-3 py-3 text-center shadow-sm dark:border-amber-400/40 dark:bg-amber-400/[0.12]"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center justify-center gap-2 text-amber-950 dark:text-amber-50">
            <AlertTriangle
              class="size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p class="text-sm font-semibold leading-tight">
              {{ ai_logos_daily_limit_title({}, { locale: profileStore.currentLocale }) }}
            </p>
          </div>
          <p class="text-xs leading-snug text-amber-950/85 dark:text-amber-50/90 max-w-md mx-auto">
            {{
              ai_logos_daily_limit_description(
                { daily_limit: String(dailyLimit) },
                { locale: profileStore.currentLocale }
              )
            }}
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[11px] font-medium text-muted-foreground">{{
          ai_logos_mood_optional({}, { locale: profileStore.currentLocale })
        }}</span>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="m in MOODS"
            :key="m.id"
            type="button"
            class="text-[11px] leading-tight rounded-md border px-1.5 py-1 transition-colors select-none"
            :class="
              selectedMoods.has(m.id)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border text-foreground'
            "
            @click="toggleMood(m.id)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div
        v-if="activeEntry || isGenerating || isShuffling || progress > 0"
        class="relative rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-center min-h-[180px]"
      >
        <img
          v-if="activeEntry"
          :src="activeEntry.url"
          :alt="ai_logos_preview_alt({}, { locale: profileStore.currentLocale })"
          class="max-h-[160px] max-w-full object-contain"
        />
        <div
          v-if="isGenerating || isShuffling || progress > 0"
          class="absolute inset-0 rounded-xl bg-background/60 flex flex-col items-center justify-center gap-3 px-6"
        >
          <RefreshCw class="size-6 text-primary animate-spin" />
          <div class="w-full max-w-[220px] h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-150 ease-out"
              :style="{ width: progress + '%' }"
            />
          </div>
          <span class="text-xs text-muted-foreground tabular-nums"
            >{{ Math.round(progress) }}%</span
          >
        </div>
      </div>

      <div
        class="rounded-xl border bg-card transition-colors overflow-hidden"
        :class="isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div v-if="referenceImage" class="px-3 pt-3">
          <div
            class="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 pl-1 pr-2 py-1 max-w-full"
          >
            <img
              :src="referenceImage.url"
              alt=""
              class="size-8 object-contain rounded bg-background shrink-0"
            />
            <span class="text-xs font-medium text-foreground truncate max-w-[140px]">
              {{
                referenceImage.source === 'upload'
                  ? (referenceImage.name ?? 'Uploaded image')
                  : 'From recent logos'
              }}
            </span>
            <button
              type="button"
              class="size-5 rounded hover:bg-muted flex items-center justify-center shrink-0"
              @click="clearReference"
            >
              <X class="size-3" />
            </button>
          </div>
        </div>

        <textarea
          ref="promptInputRef"
          v-model="inputText"
          :placeholder="placeholderText"
          rows="3"
          :disabled="isGenerating"
          class="w-full resize-none bg-transparent border-0 px-3 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-50"
          @keydown="handleSubmitKeydown"
        />

        <div class="flex items-center gap-1 px-2 py-2 border-t border-border/60 min-h-[44px]">
          <Button
            as="div"
            variant="ghost"
            size="icon"
            class="size-8 shrink-0"
            title="Attach image"
            @click="openFilePicker"
          >
            <Paperclip class="size-4" />
          </Button>
          <div class="flex-1" />

          <span
            v-if="isDraggingOver"
            class="text-[10px] text-primary font-medium sr-only sm:not-sr-only sm:max-w-[80px] truncate"
            >Drop</span
          >

          <Button
            variant="default"
            size="icon"
            class="size-8 shrink-0 rounded-md"
            :disabled="!canSubmit"
            @click="submit"
          >
            <RefreshCw v-if="isGenerating" class="size-4 animate-spin" />
            <ArrowUp v-else class="size-4" />
          </Button>
        </div>

        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChosen" />
      </div>

      <div
        v-if="activeEntry"
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:justify-between gap-y-2"
      >
        <button
          type="button"
          class="text-xs text-muted-foreground underline underline-offset-2 self-start sm:self-auto"
          @click="startOver"
        >
          {{ ai_logos_start_over({}, { locale: profileStore.currentLocale }) }}
        </button>
        <div class="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            :disabled="isShuffling || isGenerating || !activeEntry || hasReachedLimit"
            :title="
              isShuffling
                ? ai_logos_shuffle_logo_loading({}, { locale: profileStore.currentLocale })
                : ai_logos_regenerate_tooltip({}, { locale: profileStore.currentLocale })
            "
            :aria-label="
              isShuffling
                ? ai_logos_shuffle_logo_loading({}, { locale: profileStore.currentLocale })
                : ai_logos_regenerate_tooltip({}, { locale: profileStore.currentLocale })
            "
            @click="regenerateSession"
          >
            <Shuffle v-if="!isShuffling" class="size-4 mr-1" />
            <RefreshCw v-else class="size-4 mr-1 animate-spin" />
            {{ ai_logos_regenerate({}, { locale: profileStore.currentLocale }) }}
          </Button>
          <Button
            data-testid="workflow-logo-ai-button-apply"
            variant="default"
            size="sm"
            :disabled="isApplying || isGenerating || isShuffling"
            @click="applyLogo"
          >
            <RefreshCw v-if="isApplying" class="size-4 mr-1.5 animate-spin" />
            <Check v-else class="size-4 mr-1.5" />
            {{
              isApplying
                ? ai_logos_applying({}, { locale: profileStore.currentLocale })
                : ai_logos_apply({}, { locale: profileStore.currentLocale })
            }}
          </Button>
        </div>
      </div>
    </template>

    <div
      v-if="error"
      class="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive"
    >
      {{ error }}
    </div>
  </div>
</template>
