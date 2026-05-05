<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Trash,
    Sparkles,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    ArrowUp,
    Loader2,
    Shuffle,
    X
  } from 'lucide-vue-next'
  import { ColorsPreview } from '@/components/ui/colors-preview'
  import type { CustomLogo } from '@/services/logos/types'
  import { computed, ref, nextTick, watch } from 'vue'
  import { onClickOutside } from '@vueuse/core'
  import { Badge } from '@/components/ui/badge'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { LogoColor } from '@/services/types'
  import {
    logos_uploaded_logo_alt,
    logos_applying,
    logos_apply_colors,
    logos_shuffle_colors,
    logos_use_original,
    logos_no_colors_detected,
    ai_logos_badge,
    ai_logos_prompt_current,
    ai_logos_refine_label,
    ai_logos_refine_placeholder,
    ai_logos_no_prompt,
    ai_logos_shuffle_logo_loading,
    ai_logos_shuffle_logo_tooltip
  } from '@/paraglide/messages'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useAILogoMeta } from './useAILogoMeta'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()
  const { getAIPrompt } = useAILogoMeta()

  const props = withDefaults(
    defineProps<{
      logo: CustomLogo
      index: number
      interactiveLogoColors?: boolean
      highlightedLogoColorIndex?: number | null
      isAi?: boolean
      /** When false, hides refine/regenerate/shuffle (merchant disabled AI logo in settings). */
      showAiActions?: boolean
      /** When true, prompt UI stays open but refine + shuffle (API) are disabled (e.g. daily quota). */
      disableAiRefineRegenerate?: boolean
      isRefining?: boolean
      isRegenerating?: boolean
    }>(),
    {
      interactiveLogoColors: false,
      highlightedLogoColorIndex: null,
      isAi: false,
      showAiActions: true,
      disableAiRefineRegenerate: false,
      isRefining: false,
      isRegenerating: false
    }
  )

  const emit = defineEmits<{
    (e: 'click', index: number): void
    (e: 'delete', logo: CustomLogo): void
    (e: 'apply-colors', logo: CustomLogo): void
    (e: 'shuffle-colors', logo: CustomLogo): void
    (e: 'use-original-and-proceed'): void
    (e: 'logo-color-click', index: number): void
    (e: 'refine', logo: CustomLogo, prompt: string): void
    (e: 'regenerate-logo', logo: CustomLogo): void
  }>()

  const showPrompt = ref(false)
  const copied = ref(false)
  const refinePrompt = ref('')
  const refineInputRef = ref<HTMLTextAreaElement | null>(null)
  const promptTextRef = ref<HTMLElement | null>(null)
  const aiDropdownRoot = ref<HTMLElement | null>(null)

  onClickOutside(aiDropdownRoot, () => {
    if (showPrompt.value) showPrompt.value = false
  })

  const aiPrompt = computed(() => {
    if (!props.isAi) return null
    const fromServer = props.logo.ai_user_prompt
    const fromRegistry = getAIPrompt(Number(props.logo.id))
    const serverPrompt = typeof fromServer === 'string' ? fromServer.trim() : ''
    const registryPrompt = typeof fromRegistry === 'string' ? fromRegistry.trim() : ''

    if (serverPrompt && registryPrompt) {
      // Keep instant local refine updates visible while still allowing fresher server chains to win.
      return registryPrompt.length >= serverPrompt.length ? registryPrompt : serverPrompt
    }
    if (registryPrompt) return registryPrompt
    if (serverPrompt) return serverPrompt
    return null
  })

  watch(aiPrompt, () => {
    if (!showPrompt.value) return
    void nextTick(() => {
      const el = promptTextRef.value
      if (el) el.scrollTop = el.scrollHeight
    })
  })

  watch(
    () => props.isRefining,
    (isNowRefining, wasRefining) => {
      // Auto-close refine modal once refine request completes.
      if (wasRefining && !isNowRefining) {
        showPrompt.value = false
      }
    }
  )
  const previewColors = computed(() => {
    const colors = props.logo.logo_colors || []
    return colors.map((c: LogoColor) => {
      if (Array.isArray(c)) {
        return `rgb(${c.join(',')})`
      }
      return c.hex || 'rgba(0,0,0,0.12)'
    })
  })

  const hasDefaultColors = computed(() => {
    const defaultColors = customizationStore.customization?.default_colors || []
    return defaultColors.some((color: { color?: string | null }) => color.color)
  })

  const customLogosForProduct = computed((): CustomLogo[] => {
    const pid = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    if (pid == null || !map) return []
    return (map as Record<string, CustomLogo[]>)[String(pid)] ?? []
  })

  const isThisLogoColorsApplied = computed(() => {
    if (!hasDefaultColors.value) return false
    const appliedId = workflowStore.activeLogoId
    if (appliedId == null || appliedId === '') return false
    if (String(props.logo.id) !== String(appliedId)) return false
    const pinned = workflowStore.logoApplySourceIndex
    if (pinned != null) {
      return pinned === props.index
    }
    const firstIdx = customLogosForProduct.value.findIndex(l => String(l.id) === String(appliedId))
    return firstIdx === props.index
  })

  function togglePrompt(e: Event) {
    e.stopPropagation()
    showPrompt.value = !showPrompt.value
    if (showPrompt.value) {
      void nextTick(() => {
        const el = promptTextRef.value
        if (el) el.scrollTop = el.scrollHeight
        refineInputRef.value?.focus()
      })
    }
  }

  async function copyPrompt(e: Event) {
    e.stopPropagation()
    if (!aiPrompt.value) return
    await navigator.clipboard.writeText(aiPrompt.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  }

  function submitRefine(e?: Event) {
    e?.stopPropagation()
    const text = refinePrompt.value.trim()
    if (!text || props.isRefining || props.disableAiRefineRegenerate) return
    emit('refine', props.logo, text)
    refinePrompt.value = ''
  }

  function onRefineKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (props.disableAiRefineRegenerate) return
      submitRefine()
    }
  }
</script>
<template>
  <section
    class="relative group rounded-xl border border-border p-3 flex flex-col gap-3 bg-background cursor-pointer hover:bg-muted/50 transition-colors w-full"
    :class="props.isAi ? 'border-primary/40' : ''"
    @click="emit('click', props.index)"
  >
    <!-- Top: Team Logo (+ AI + shuffle) left, delete right ? same as reference card -->
    <div class="flex w-full min-w-0 items-start justify-between gap-2">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          class="logo-control-chip inline-flex h-7 min-h-7 max-h-7 max-w-[10rem] min-w-0 shrink-0 items-center justify-center overflow-hidden truncate border-border bg-card px-2 py-0 text-[10px] font-medium leading-none hover:bg-muted/60"
        >
          {{ props.logo.name_of_placement }}
        </Badge>
        <template v-if="props.isAi && props.showAiActions">
          <div ref="aiDropdownRoot" class="relative shrink-0">
            <Badge
              variant="outline"
              class="logo-control-chip inline-flex h-7 min-h-7 max-h-7 shrink-0 cursor-pointer select-none items-center justify-center gap-1 border-border bg-card px-2 py-0 text-[10px] font-medium leading-none hover:bg-muted"
              @click.stop="togglePrompt"
            >
              <Sparkles class="size-3 shrink-0 text-primary" />
              {{ ai_logos_badge({}, { locale: profileStore.currentLocale }) }}
              <ChevronUp v-if="showPrompt" class="size-3 text-muted-foreground shrink-0" />
              <ChevronDown v-else class="size-3 text-muted-foreground shrink-0" />
            </Badge>
            <Transition name="prompt-drop">
              <div
                v-if="showPrompt"
                class="fixed inset-0 z-40 flex items-center justify-center p-3 md:absolute md:inset-auto md:top-full md:left-0 md:z-30 md:mt-1 md:block md:p-0"
                @click.stop
              >
                <button
                  type="button"
                  class="absolute inset-0 bg-background/55 backdrop-blur-[1px] md:hidden"
                  aria-label="Close AI prompt panel"
                  @click.stop="showPrompt = false"
                />
                <div
                  class="relative flex w-full max-w-[min(100vw-1.25rem,26rem)] max-h-[78vh] flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-xl md:w-72 md:max-w-[min(100vw-2rem,18rem)] md:max-h-none"
                >
                  <div class="px-3 py-2 flex flex-col gap-2 border-b border-border bg-card/90">
                    <div class="flex items-center justify-between gap-2">
                      <span
                        class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                        >{{
                          ai_logos_prompt_current({}, { locale: profileStore.currentLocale })
                        }}</span
                      >
                      <button
                        type="button"
                        class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                        aria-label="Close AI prompt panel"
                        @click.stop="showPrompt = false"
                      >
                        <X class="size-3 text-muted-foreground" />
                      </button>
                    </div>
                    <p
                      v-if="aiPrompt"
                      ref="promptTextRef"
                      class="max-h-44 overflow-y-auto rounded-md border border-border/70 bg-muted/50 px-2.5 py-2 text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words"
                    >
                      {{ aiPrompt }}
                    </p>
                    <p v-else class="text-xs text-muted-foreground italic">
                      {{ ai_logos_no_prompt({}, { locale: profileStore.currentLocale }) }}
                    </p>
                    <button
                      v-if="aiPrompt"
                      type="button"
                      class="self-end inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted"
                      @click="copyPrompt"
                    >
                      <Check v-if="copied" class="size-3 text-green-500" />
                      <Copy v-else class="size-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div
                    class="flex flex-col gap-1.5 px-3 py-2"
                    :class="props.disableAiRefineRegenerate ? 'opacity-60 pointer-events-none' : ''"
                  >
                    <span class="text-[10px] font-semibold text-muted-foreground uppercase">{{
                      ai_logos_refine_label({}, { locale: profileStore.currentLocale })
                    }}</span>
                    <div
                      class="flex items-end gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 focus-within:border-primary/60"
                    >
                      <textarea
                        ref="refineInputRef"
                        v-model="refinePrompt"
                        rows="2"
                        :disabled="props.isRefining || props.disableAiRefineRegenerate"
                        class="flex-1 resize-none bg-transparent text-xs leading-snug placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                        :placeholder="
                          ai_logos_refine_placeholder({}, { locale: profileStore.currentLocale })
                        "
                        @keydown="onRefineKeydown"
                        @click.stop
                      />
                      <Button
                        variant="default"
                        size="icon"
                        class="size-6 shrink-0"
                        :disabled="
                          !refinePrompt.trim() ||
                          props.isRefining ||
                          props.disableAiRefineRegenerate
                        "
                        @click="submitRefine"
                      >
                        <Loader2 v-if="props.isRefining" class="size-3 animate-spin" />
                        <ArrowUp v-else class="size-3" />
                      </Button>
                    </div>
                    <p v-if="props.isRefining" class="text-[10px] text-muted-foreground">
                      {{ logos_applying({}, { locale: profileStore.currentLocale }) }}
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  size="icon"
                  variant="outline"
                  class="logo-control-chip inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border-border p-0"
                  :disabled="props.isRegenerating || props.disableAiRefineRegenerate"
                  :aria-label="
                    props.isRegenerating
                      ? ai_logos_shuffle_logo_loading({}, { locale: profileStore.currentLocale })
                      : ai_logos_shuffle_logo_tooltip({}, { locale: profileStore.currentLocale })
                  "
                  @click.stop="emit('regenerate-logo', props.logo)"
                >
                  <Loader2 v-if="props.isRegenerating" class="size-3.5 animate-spin" />
                  <Shuffle v-else class="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>
                  {{
                    props.isRegenerating
                      ? ai_logos_shuffle_logo_loading({}, { locale: profileStore.currentLocale })
                      : ai_logos_shuffle_logo_tooltip({}, { locale: profileStore.currentLocale })
                  }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </template>
        <Badge
          v-else-if="props.isAi && !props.showAiActions"
          variant="outline"
          class="logo-control-chip inline-flex h-7 min-h-7 max-h-7 shrink-0 items-center justify-center gap-1 border-border bg-card px-2 py-0 text-[10px] font-medium leading-none"
        >
          <Sparkles class="size-3 shrink-0 text-muted-foreground" />
          {{ ai_logos_badge({}, { locale: profileStore.currentLocale }) }}
        </Badge>
      </div>
      <Button
        as="div"
        variant="ghost"
        size="icon"
        class="shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
        @click.stop="emit('delete', props.logo)"
      >
        <Trash class="size-4" />
      </Button>
    </div>

    <!-- Center: logo preview -->
    <div class="flex w-full justify-center">
      <div class="w-24 h-24 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
        <img
          :src="baseStorageUrl + props.logo.url"
          class="max-h-full object-contain"
          :alt="logos_uploaded_logo_alt({}, { locale: profileStore.currentLocale })"
        />
      </div>
    </div>

    <!-- Bottom: swatches left, actions right (reference layout) -->
    <div
      v-if="props.logo.logo_colors && props.logo.logo_colors.length > 0"
      class="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <ColorsPreview
        class="shrink-0 self-start sm:self-center"
        :colors="previewColors"
        :interactive="props.interactiveLogoColors"
        :selected-swatch-index="props.highlightedLogoColorIndex"
        @swatch-click="idx => emit('logo-color-click', idx)"
      />
      <div
        v-if="isThisLogoColorsApplied"
        class="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2"
      >
        <Button
          size="sm"
          variant="default"
          class="min-h-9 w-full justify-center sm:w-auto"
          @click.stop="emit('use-original-and-proceed')"
        >
          {{ logos_use_original({}, { locale: profileStore.currentLocale }) }}
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="min-h-9 w-full justify-center sm:w-auto"
          @click.stop="emit('shuffle-colors', props.logo)"
        >
          {{ logos_shuffle_colors({}, { locale: profileStore.currentLocale }) }}
        </Button>
      </div>
      <Button
        v-else
        size="sm"
        variant="default"
        class="min-h-9 w-full shrink-0 justify-center sm:w-auto"
        @click.stop="emit('apply-colors', props.logo)"
      >
        {{ logos_apply_colors({}, { locale: profileStore.currentLocale }) }}
      </Button>
    </div>

    <div v-else class="text-sm text-muted-foreground">
      {{ logos_no_colors_detected({}, { locale: profileStore.currentLocale }) }}
    </div>
  </section>
</template>

<style scoped>
  .prompt-drop-enter-active,
  .prompt-drop-leave-active {
    transition:
      opacity 150ms ease,
      transform 150ms ease;
  }
  .prompt-drop-enter-from,
  .prompt-drop-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
