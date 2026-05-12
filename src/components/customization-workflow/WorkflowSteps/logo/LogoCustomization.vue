<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import { Button } from '@/components/ui/button'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import { useLogosStore } from '@/stores/logos/logos.store'
  import type { CustomLogo } from '@/services/logos/types'
  import { useLogoActions } from './useLogoActions'
  import { useLogos } from './useLogos'
  import { useLogoUpload } from './useLogoUpload'
  import { useLogoAddAnotherUpload } from './useLogoAddAnotherUpload'
  import { generateAILogo } from '@/services/ai/ai-logo-generation'
  import { materializeAiLogoResult } from '@/services/ai/ai-logo-result'
  import { useAILogoMeta } from './useAILogoMeta'
  import { useAILogoLimit } from './useAILogoLimit'
  import { useAiLogoGenerationEnabled } from './useAiLogoGenerationEnabled'
  import {
    logos_empty_drag_drop,
    logos_empty_click_to_upload,
    logos_supported_formats,
    logos_add_logo,
    logos_recent,
    logos_back,
    logos_editor,
    logos_recolor_logo,
    logos_primary,
    logos_more_options,
    logos_recent_show_less,
    logos_recent_view_all,
    logos_recent_thumbnail_alt,
    nav_logo,
    ai_logos_pick_recent
  } from '@/paraglide/messages'
  import { colors_choose_from_locker, colors_separator_or } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { mergeLogoPreservePlacement } from './mergeLogoPreservePlacement'
  import { Trash, Sparkles } from 'lucide-vue-next'
  import LogoUploadingSkeleton from './LogoUploadingSkeleton.vue'
  import LogoCard from './LogoCard.vue'
  import AILogoGenerator from './AILogoGenerator.vue'
  const profileStore = useProfileStore()
  const logosStore = useLogosStore()
  const authStore = useAuthStore()
  const lockerRoomStore = useLockerRoomStore()
  const workflowStore = useWorkflowStore()
  const historyStore = useHistoryStore()
  const customizationStore = useCustomizationStore()
  const isLoggedIn = computed(() => authStore.isAuthenticated)

  // ===== COMPOSABLES =====
  const { customLogos, productKey } = useLogos()
  const {
    applyLogoColors,
    shuffleExtractedColorsForActiveLogo,
    useOriginalColorsAndProceed,
    removeLogo,
    setActiveLogo
  } = useLogoActions()
  const { isDragOver, fileInputRef, onClickUpload, onDragOver, onDragLeave, doUpload } =
    useLogoUpload()

  type SubPanel = 'list' | 'edit'
  const subPanel = ref<SubPanel>('list')
  const showAllRecent = ref(false)
  const displayedRecentLogos = computed(() => {
    if (!isLoggedIn.value) return []
    if (!logosStore.recentLogos) return []
    const reversed = [...logosStore.recentLogos]
    return showAllRecent.value ? reversed : reversed.slice(0, 8)
  })
  const shouldShowRecentSection = computed(
    () =>
      isLoggedIn.value &&
      (logosStore.isLoadingRecentLogos ||
        (logosStore?.recentLogos && logosStore.recentLogos.length > 0))
  )
  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const { registerAILogo, getAIPrompt, logoShowsAiUi } = useAILogoMeta()
  const { syncQuotaAfterGeneration: syncAILogoQuota, hasReachedLimit: hasReachedAiLimit } =
    useAILogoLimit()
  const { isAiLogoGenerationEnabled } = useAiLogoGenerationEnabled()
  const aiGenRef = ref<InstanceType<typeof AILogoGenerator> | null>(null)

  // ===== EMITS =====
  const emit = defineEmits<{
    'select-logo': [logoId: string, logoIndex: number]
    'go-to-placement': []
  }>()

  // ===== COMPUTED =====
  const activeLogos = customLogos
  const hasAnyLogo = computed(() => activeLogos.value.length > 0)

  // ===== ACTIONS =====
  function handleLogoAfterUpload(logo: CustomLogo) {
    setActiveLogo(logo)
    workflowStore.setLogoEditorLogoId(String(logo.id))
    emit('go-to-placement')
  }

  const { handleFileChange } = useLogoAddAnotherUpload(doUpload, handleLogoAfterUpload)

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    onDragLeave()
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      const uploaded = await doUpload(file)
      if (uploaded) {
        handleLogoAfterUpload(uploaded)
      }
    }
  }

  function goToControls() {
    subPanel.value = 'edit'
    // integrate with workflow store if needed
  }
  function goToList() {
    subPanel.value = 'list'
    // integrate with workflow store if needed
  }

  function handleRecentLogoClick(logo: CustomLogo) {
    handleLogoAfterUpload(logo)
  }

  function handleUseRecentAsAIReference(logo: CustomLogo) {
    if (hasReachedAiLimit.value) return
    aiGenRef.value?.setReferenceFromRecentLogo?.({
      customerLogoId: Number(logo.id),
      url: baseStorageUrl.value + logo.url,
      remoteUrl: logo.url
    })
    void nextTick(() => aiGenRef.value?.focusPromptInput?.())
  }

  function handleLogoClick(index: number) {
    const logo = customLogos.value[index]
    if (!logo) return
    emit('select-logo', logo.id.toString(), index)
  }

  function openLogosColorFromList(logo: CustomLogo, logoIndex: number, swatchIndex: number) {
    workflowStore.openLogoEditorWithLogosColor(String(logo.id), logoIndex, swatchIndex)
  }

  function handleAILogoApplied(logo: CustomLogo) {
    setActiveLogo(logo)
    workflowStore.setLogoEditorLogoId(String(logo.id))
    emit('go-to-placement')
  }

  async function handleAILogoRequestApply(payload: {
    prompt: string
    blob?: Blob
    customerLogo?: CustomLogo
  }) {
    try {
      let uploaded: CustomLogo | null = null
      if (payload.customerLogo) {
        logosStore.appendLogoFromAiGeneration(payload.customerLogo)
        uploaded = payload.customerLogo
      } else if (payload.blob) {
        uploaded = await materializeAiLogoResult(payload.blob, doUpload)
      }
      if (uploaded) {
        registerAILogo(uploaded.id, payload.prompt, uploaded.url)
        handleAILogoApplied(uploaded)
        void logosStore.fetchRecentLogos()
      }
    } finally {
      aiGenRef.value?.resetApplyState?.()
    }
  }

  const refiningLogoIds = ref(new Set<number>())
  const regeneratingLogoIds = ref(new Set<number>())

  function isRefining(id: number): boolean {
    return refiningLogoIds.value.has(id)
  }

  function isRegenerating(id: number): boolean {
    return regeneratingLogoIds.value.has(id)
  }

  function buildRefinedPrompt(parentLogo: CustomLogo, refinementPrompt: string): string {
    const refinement = refinementPrompt.trim()
    const base = getAIPrompt(parentLogo.id) ?? parentLogo.ai_user_prompt?.trim() ?? ''
    if (!base) return refinement
    return `${base}\n\nRefinement:\n${refinement}`
  }

  async function handleAIRefine(parentLogo: CustomLogo, userPrompt: string) {
    if (hasReachedAiLimit.value) return
    if (refiningLogoIds.value.has(parentLogo.id)) return

    const refinedPrompt = buildRefinedPrompt(parentLogo, userPrompt)
    // Optimistically update prompt text on current logo while refine is in progress.
    registerAILogo(parentLogo.id, refinedPrompt, parentLogo.url)
    refiningLogoIds.value = new Set(refiningLogoIds.value).add(parentLogo.id)
    try {
      const genResult = await generateAILogo({
        prompt: userPrompt,
        customerLogoId: parentLogo.id,
        mode: 'refine'
      })
      syncAILogoQuota(genResult.remainingQuota)
      const uploaded = await materializeAiLogoResult(genResult.logo, doUpload)
      if (!uploaded) return

      if (!(genResult.logo instanceof Blob)) logosStore.appendLogoFromAiGeneration(uploaded)
      // Keep latest local refine chain immediately; backend prompt can lag until recents refresh.
      const promptToPersist = refinedPrompt
      registerAILogo(uploaded.id, promptToPersist, uploaded.url, parentLogo.id)

      const key = productKey.value
      const idx = key ? customLogos.value.findIndex(l => l.id === parentLogo.id) : -1
      if (key && idx >= 0) {
        const prev = { ...(customLogos.value[idx] as CustomLogo) } as CustomLogo
        const merged = mergeLogoPreservePlacement(prev, uploaded)
        await historyStore.execute('logo.ai-replace', {
          key,
          index: idx,
          prevLogo: prev,
          nextLogo: merged
        })
        customizationStore.pushHistoryState('Refine AI logo')
        setActiveLogo(merged)
        workflowStore.setActiveLogoId(String(merged.id))
        workflowStore.setLogoEditorLogoId(String(merged.id))
        workflowStore.setActiveLogoIndex(idx)
      } else {
        handleAILogoApplied(uploaded)
      }
      void logosStore.fetchRecentLogos()
    } catch (err) {
      console.error('[LogoCustomization] AI refine failed', err)
    } finally {
      const next = new Set(refiningLogoIds.value)
      next.delete(parentLogo.id)
      refiningLogoIds.value = next
    }
  }

  async function handleAIRegenerateLogo(parentLogo: CustomLogo) {
    if (hasReachedAiLimit.value) return
    if (regeneratingLogoIds.value.has(parentLogo.id)) return

    const prompt = getAIPrompt(parentLogo.id) ?? 'Regenerate this logo'
    regeneratingLogoIds.value = new Set(regeneratingLogoIds.value).add(parentLogo.id)
    try {
      const genResult = await generateAILogo({
        prompt,
        customerLogoId: parentLogo.id,
        mode: 'shuffle'
      })
      syncAILogoQuota(genResult.remainingQuota)
      const uploaded = await materializeAiLogoResult(genResult.logo, doUpload)
      if (!uploaded) return

      if (!(genResult.logo instanceof Blob)) logosStore.appendLogoFromAiGeneration(uploaded)
      registerAILogo(uploaded.id, prompt, uploaded.url)

      const key = productKey.value
      const idx = key ? customLogos.value.findIndex(l => l.id === parentLogo.id) : -1
      if (key && idx >= 0) {
        const prev = { ...(customLogos.value[idx] as CustomLogo) } as CustomLogo
        const merged = mergeLogoPreservePlacement(prev, uploaded)
        await historyStore.execute('logo.ai-replace', {
          key,
          index: idx,
          prevLogo: prev,
          nextLogo: merged
        })
        customizationStore.pushHistoryState('Regenerate AI logo')
        setActiveLogo(merged)
        workflowStore.setActiveLogoId(String(merged.id))
        workflowStore.setLogoEditorLogoId(String(merged.id))
        workflowStore.setActiveLogoIndex(idx)
      } else {
        handleAILogoApplied(uploaded)
      }
      void logosStore.fetchRecentLogos()
    } catch (err) {
      console.error('[LogoCustomization] AI shuffle logo failed', err)
    } finally {
      const next = new Set(regeneratingLogoIds.value)
      next.delete(parentLogo.id)
      regeneratingLogoIds.value = next
    }
  }

  // Breadcrumbs only
  const headerConfig = computed(() => ({
    breadcrumbs: [{ label: nav_logo({}, { locale: profileStore.currentLocale }) }]
  }))
  void headerConfig.value
</script>

<template>
  <div data-testid="workflow-logo-customization" class="pb-6">
    <Transition name="logos-slide" mode="out-in" appear>
      <div :key="`logos-${subPanel}`">
        <div v-if="subPanel === 'list'" class="flex flex-col gap-4">
          <!-- Empty state uploader (shown when no logos yet) -->
          <div
            v-if="!hasAnyLogo && !logosStore.isLoadingUploadLogo"
            class="relative rounded-xl border border-dashed border-border p-4 md:p-6 flex flex-col items-center justify-center gap-2 text-center mx-4 md:mx-2 transition-colors"
            :class="isDragOver ? 'bg-secondary/20 border-primary/60 ring-2 ring-primary/30' : ''"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="handleDrop"
          >
            <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <i-other-image class="size-12 text-primary icon-secondary-from-primary-50" />
            </div>
            <div class="text-sm font-medium font-brand">
              {{ logos_empty_drag_drop({}, { locale: profileStore.currentLocale }) }}
              <button
                type="button"
                class="text-primary underline underline-offset-2"
                @click="onClickUpload"
              >
                {{ logos_empty_click_to_upload({}, { locale: profileStore.currentLocale }) }}
              </button>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ logos_supported_formats({}, { locale: profileStore.currentLocale }) }}
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*,.pdf,.ai,.eps,.tiff"
              class="hidden"
              @change="handleFileChange"
            />

            <div
              v-if="isLoggedIn"
              class="flex flex-col gap-3 w-full mt-4 pt-4 border-t border-border"
            >
              <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
                <div class="flex-1 h-px bg-border" />
                <span class="px-3 text-foreground font-medium">{{
                  colors_separator_or({}, { locale: profileStore.currentLocale })
                }}</span>
                <div class="flex-1 h-px bg-border" />
              </div>
              <Button
                data-testid="workflow-logo-button-choose-from-locker"
                class="w-full bg-card"
                variant="default"
                @click="lockerRoomStore.setOpenLockerWithIntent('assets')"
              >
                {{ colors_choose_from_locker({}, { locale: profileStore.currentLocale }) }}
              </Button>
            </div>

            <div
              v-if="isAiLogoGenerationEnabled"
              class="flex flex-col gap-3 w-full mt-4 pt-4 pb-4 border-t border-border"
            >
              <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
                <div class="flex-1 h-px bg-border" />
                <span class="px-3 text-foreground font-medium">{{
                  colors_separator_or({}, { locale: profileStore.currentLocale })
                }}</span>
                <div class="flex-1 h-px bg-border" />
              </div>
              <AILogoGenerator ref="aiGenRef" @request-apply="handleAILogoRequestApply" />
            </div>
          </div>
          <LogoUploadingSkeleton v-if="logosStore.isLoadingUploadLogo && !hasAnyLogo" />

          <!-- When logos exist: render each logo with swatches + actions -->
          <div v-if="hasAnyLogo" class="flex flex-col gap-4 mx-4 md:mx-6">
            <LogoCard
              v-for="(logo, index) in customLogos || []"
              :key="`${logo.id}-${index}`"
              :logo="logo"
              :index="index"
              :interactive-logo-colors="(logo.logo_colors?.length ?? 0) > 0"
              :is-ai="logoShowsAiUi(logo)"
              :show-ai-actions="logoShowsAiUi(logo)"
              :disable-ai-refine-regenerate="hasReachedAiLimit"
              :is-refining="isRefining(logo.id)"
              :is-regenerating="isRegenerating(logo.id)"
              @click="handleLogoClick"
              @apply-colors="applyLogoColors(logo, index)"
              @shuffle-colors="lg => shuffleExtractedColorsForActiveLogo(lg, index)"
              @use-original-and-proceed="useOriginalColorsAndProceed()"
              @delete="removeLogo(logo)"
              @logo-color-click="swatchIdx => openLogosColorFromList(logo, index, swatchIdx)"
              @refine="handleAIRefine"
              @regenerate-logo="handleAIRegenerateLogo"
            />

            <div v-if="!logosStore.isLoadingUploadLogo" class="flex flex-col gap-3">
              <Button
                data-testid="workflow-logo-button-add-logo"
                variant="default"
                class="rounded-lg w-full"
                @click="onClickUpload"
              >
                {{ logos_add_logo({}, { locale: profileStore.currentLocale }) }}
              </Button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />
              <template v-if="isLoggedIn">
                <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <div class="flex-1 h-px bg-border" />
                  <span class="px-3 text-foreground font-medium">{{
                    colors_separator_or({}, { locale: profileStore.currentLocale })
                  }}</span>
                  <div class="flex-1 h-px bg-border" />
                </div>
                <Button
                  class="w-full bg-card"
                  variant="secondary"
                  @click="lockerRoomStore.setOpenLockerWithIntent('assets')"
                >
                  {{ colors_choose_from_locker({}, { locale: profileStore.currentLocale }) }}
                </Button>
              </template>

              <div v-if="isAiLogoGenerationEnabled" class="flex flex-col gap-3 w-full pb-4">
                <div class="flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <div class="flex-1 h-px bg-border" />
                  <span class="px-3 text-foreground font-medium">{{
                    colors_separator_or({}, { locale: profileStore.currentLocale })
                  }}</span>
                  <div class="flex-1 h-px bg-border" />
                </div>
                <AILogoGenerator ref="aiGenRef" @request-apply="handleAILogoRequestApply" />
              </div>
            </div>
            <LogoUploadingSkeleton v-else />
          </div>

          <div class="h-px bg-border" />

          <!-- Recent logos -->
          <div v-if="shouldShowRecentSection" class="flex flex-col gap-2 px-4 md:px-2">
            <div class="flex items-center justify-between">
              <div class="text-base leading-none font-semibold font-brand">
                {{ logos_recent({}, { locale: profileStore.currentLocale }) }}
              </div>
              <Button
                v-if="
                  logosStore.recentLogos &&
                  logosStore.recentLogos.length > 4 &&
                  !logosStore.isLoadingRecentLogos
                "
                variant="default"
                class="px-2 py-1 h-7"
                @click="showAllRecent = !showAllRecent"
                >{{
                  showAllRecent
                    ? logos_recent_show_less({}, { locale: profileStore.currentLocale })
                    : logos_recent_view_all({}, { locale: profileStore.currentLocale })
                }}</Button
              >
            </div>
            <!-- Loading skeleton -->
            <div
              v-if="logosStore.isLoadingRecentLogos && displayedRecentLogos?.length === 0"
              class="grid grid-cols-4 gap-2"
            >
              <div
                v-for="i in 4"
                :key="i"
                class="aspect-square rounded-lg border border-border bg-primary/30 animate-pulse"
              />
            </div>
            <!-- List -->
            <div v-else class="grid grid-cols-4 gap-2">
              <button
                v-for="logo in displayedRecentLogos"
                :key="logo.id"
                class="relative group aspect-square rounded-lg border overflow-hidden"
                :class="logoShowsAiUi(logo) ? 'border-primary/40' : 'border-border'"
                :title="logoShowsAiUi(logo) ? 'AI generated logo' : undefined"
                @click="handleRecentLogoClick(logo)"
              >
                <img
                  :src="baseStorageUrl + logo.url"
                  class="w-full h-full object-contain"
                  :alt="logos_recent_thumbnail_alt({}, { locale: profileStore.currentLocale })"
                />
                <Button
                  as="div"
                  variant="default"
                  size="icon"
                  class="absolute top-1 right-1 z-10 h-6 w-6 p-0 opacity-100 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-foreground"
                  @click.stop="logosStore.deleteRecentLogo(logo.id.toString())"
                >
                  <Trash class="size-3 md:size-4" />
                </Button>
                <button
                  v-if="isLoggedIn"
                  type="button"
                  class="absolute bottom-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-foreground backdrop-blur-sm shadow-sm opacity-100 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
                  :disabled="hasReachedAiLimit"
                  :title="ai_logos_pick_recent({}, { locale: profileStore.currentLocale })"
                  :aria-label="ai_logos_pick_recent({}, { locale: profileStore.currentLocale })"
                  @click.stop="handleUseRecentAsAIReference(logo)"
                >
                  <Sparkles class="size-3.5 md:size-4" />
                </button>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="subPanel === 'edit'" class="flex flex-col gap-4">
          <div class="text-sm">
            {{ logos_editor({}, { locale: profileStore.currentLocale }) }}
          </div>
          <div class="flex gap-3">
            <Button variant="default" class="rounded-lg" @click="goToList">{{
              logos_back({}, { locale: profileStore.currentLocale })
            }}</Button>
            <Button variant="default" class="rounded-lg" disabled>{{
              logos_editor({}, { locale: profileStore.currentLocale })
            }}</Button>
          </div>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="text-sm">
            {{ logos_editor({}, { locale: profileStore.currentLocale }) }}
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="recolor">
              <template #trigger>{{
                logos_recolor_logo({}, { locale: profileStore.currentLocale })
              }}</template>
              <div class="flex flex-col gap-2">
                <div class="text-xs">
                  {{ logos_primary({}, { locale: profileStore.currentLocale }) }}
                </div>
                <div class="h-8 bg-muted rounded" />
                <div class="text-xs">
                  {{ logos_more_options({}, { locale: profileStore.currentLocale }) }}
                </div>
                <div class="grid grid-cols-8 gap-1">
                  <div v-for="i in 16" :key="i" class="h-6 bg-muted rounded" />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          <div class="flex gap-3">
            <Button variant="default" class="rounded-lg" @click="goToControls">{{
              logos_back({}, { locale: profileStore.currentLocale })
            }}</Button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .logos-slide-enter-active,
  .logos-slide-leave-active {
    transition:
      opacity 300ms ease,
      transform 300ms ease;
    will-change: opacity, transform;
  }
  .logos-slide-enter-from {
    opacity: 0;
    transform: translateX(32px);
  }
  .logos-slide-enter-to {
    opacity: 1;
    transform: translateX(0);
  }
  .logos-slide-leave-to {
    opacity: 0;
    transform: translateX(-32px);
  }
  .logos-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
  }
</style>
