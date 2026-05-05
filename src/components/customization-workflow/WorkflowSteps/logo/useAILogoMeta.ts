import { reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth/auth.store'

import type { CustomLogo } from '@/services/logos/types'

/** Maps customer_logo id → prompt used for that AI asset (no variation history). */
const promptByLogoId = reactive(new Map<number, string>())

const STORAGE_PREFIX = 'ai_logo_prompts_v2_'
let currentKey: string | null = null
let initialized = false

function storageKey(customerId: number | string | null | undefined): string {
  return STORAGE_PREFIX + (customerId != null ? String(customerId) : 'anon')
}

function hydrate(key: string) {
  promptByLogoId.clear()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const parsed = JSON.parse(raw) as { prompts?: Array<[number | string, string]> }
    for (const [k, p] of parsed.prompts ?? []) {
      if (typeof p === 'string') promptByLogoId.set(Number(k), p)
    }
  } catch (e) {
    console.warn('[useAILogoMeta] Failed to hydrate', e)
  }
}

function persist() {
  if (!currentKey) return
  try {
    localStorage.setItem(
      currentKey,
      JSON.stringify({ prompts: Array.from(promptByLogoId.entries()) })
    )
  } catch (e) {
    console.warn('[useAILogoMeta] Failed to persist', e)
  }
}

function ensureInit() {
  if (initialized) return
  initialized = true

  const authStore = useAuthStore()
  const readKey = () => storageKey(authStore.customer?.id ?? null)
  currentKey = readKey()
  hydrate(currentKey)

  watch(
    () => authStore.customer?.id ?? null,
    () => {
      currentKey = readKey()
      hydrate(currentKey)
    }
  )
}

export function useAILogoMeta() {
  ensureInit()

  function registerAILogo(
    id: number | string,
    prompt: string,
    _url?: string,
    _parentId?: number | string
  ) {
    promptByLogoId.set(Number(id), prompt)
    persist()
  }

  function isAILogo(id: number | string): boolean {
    return promptByLogoId.has(Number(id))
  }

  /** Badge + AI tools: server flag or session (prompt registered for this logo id). */
  function logoShowsAiUi(logo: CustomLogo): boolean {
    if (logo.is_ai_generated) return true
    return promptByLogoId.has(Number(logo.id))
  }

  /** Hydrate prompts from recent-logos API when backend sends `ai_user_prompt`. */
  function syncMetaFromServerLogos(logos: readonly CustomLogo[]) {
    for (const logo of logos) {
      if (!logo.is_ai_generated) continue
      const id = Number(logo.id)
      if (promptByLogoId.has(id)) continue
      const prompt = typeof logo.ai_user_prompt === 'string' ? logo.ai_user_prompt.trim() : ''
      if (prompt) registerAILogo(id, prompt)
    }
  }

  function getAIPrompt(id: number | string): string | null {
    const p = promptByLogoId.get(Number(id))
    if (p == null) return null
    const t = p.trim()
    return t !== '' ? t : null
  }

  function clearAIMeta() {
    promptByLogoId.clear()
    if (currentKey) localStorage.removeItem(currentKey)
  }

  return {
    registerAILogo,
    isAILogo,
    logoShowsAiUi,
    syncMetaFromServerLogos,
    getAIPrompt,
    clearAIMeta
  }
}
