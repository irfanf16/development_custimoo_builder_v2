import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useCompanyStore } from '@/stores/company/company.store'
import { getCompanySettingValue } from '@/lib/companySettingsRead'

const STORAGE_KEY = 'ai_logo_daily_usage_v1'

function isMockAiLogoMode(): boolean {
  const mock = import.meta.env.VITE_AI_LOGO_MOCK as string | boolean | undefined
  if (mock === 'true' || mock === true) return true
  const base = import.meta.env.VITE_API_ENDPOINT as string | undefined
  return !base || String(base).trim() === ''
}

const DEFAULT_DAILY_LIMIT = 10

/** Shared across components; updated when AI APIs return `remaining_quota`. */
const remainingQuotaFromApi = ref<number | null>(null)
/** Backend returns `remaining_quota: null` when daily quota is 0 / unlimited. */
const unlimitedFromApiQuotaResponse = ref(false)

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function readCount(customerId: number | string | null | undefined): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as Record<string, Record<string, number>>
    const day = parsed[todayKey()]
    if (!day) return 0
    const id = customerId != null ? String(customerId) : 'anon'
    return day[id] ?? 0
  } catch {
    return 0
  }
}

function writeCount(customerId: number | string | null | undefined, n: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, Record<string, number>>
    const key = todayKey()
    if (!parsed[key]) parsed[key] = {}
    const id = customerId != null ? String(customerId) : 'anon'
    parsed[key][id] = n
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore quota
  }
}

export function useAILogoLimit() {
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()

  const innerSettings = computed(
    () => companyStore.settings?.settings as Record<string, unknown> | undefined
  )

  const dailyLimit = computed(() => {
    const raw = getCompanySettingValue(innerSettings.value, 'ai_logo_generation_daily_quota')
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(n) && n >= 0) return n

    const env = Number(import.meta.env.VITE_AI_LOGO_DAILY_LIMIT)
    return Number.isFinite(env) && env > 0 ? env : DEFAULT_DAILY_LIMIT
  })

  const isUnlimited = computed(() => {
    const raw = getCompanySettingValue(innerSettings.value, 'ai_logo_generation_unlimited_access')
    if (raw === true) return true
    if (raw === false) return false
    if (import.meta.env.VITE_AI_LOGO_UNLIMITED === 'true') return true
    // Backend treats quota 0 as unlimited
    return dailyLimit.value === 0
  })

  /** Initial remaining from get-settings until an AI endpoint returns `remaining_quota`. */
  const remainingQuotaFromSettings = computed(() => {
    const raw = getCompanySettingValue(innerSettings.value, 'ai_logo_generation_remaining_quota')
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n) || n < 0) return undefined
    return n
  })

  const usedToday = computed(() => readCount(authStore.customer?.id ?? null))

  const remaining = computed(() => {
    if (isUnlimited.value || unlimitedFromApiQuotaResponse.value) return 999
    if (remainingQuotaFromApi.value !== null) {
      return Math.max(0, remainingQuotaFromApi.value)
    }
    const fromSettings = remainingQuotaFromSettings.value
    if (fromSettings !== undefined) {
      return Math.max(0, fromSettings)
    }
    return Math.max(0, dailyLimit.value - usedToday.value)
  })

  const hasReachedLimit = computed(
    () => !isUnlimited.value && !unlimitedFromApiQuotaResponse.value && remaining.value <= 0
  )

  /**
   * Call after each successful AI logo API response (generate / redesign / refine / shuffle).
   * - `number`: remaining credits from API
   * - `null`: API signals unlimited for this merchant (`quota === 0`)
   * - `undefined`: mock mode or missing field - falls back to local usage bump via mock path only
   */
  function syncQuotaAfterGeneration(remainingQuota: number | null | undefined) {
    if (remainingQuota === null) {
      unlimitedFromApiQuotaResponse.value = true
      remainingQuotaFromApi.value = null
      return
    }
    unlimitedFromApiQuotaResponse.value = false

    if (typeof remainingQuota === 'number' && Number.isFinite(remainingQuota)) {
      remainingQuotaFromApi.value = Math.max(0, remainingQuota)
      const lim = dailyLimit.value
      if (lim > 0) {
        const used = Math.max(0, lim - remainingQuotaFromApi.value)
        writeCount(authStore.customer?.id ?? null, used)
      }
      return
    }

    if (isMockAiLogoMode()) {
      const cid = authStore.customer?.id ?? null
      writeCount(cid, readCount(cid) + 1)
    }
  }

  function resetQuotaSessionCache() {
    remainingQuotaFromApi.value = null
    unlimitedFromApiQuotaResponse.value = false
  }

  watch(
    () => authStore.customer?.id,
    () => resetQuotaSessionCache()
  )

  return {
    remaining,
    hasReachedLimit,
    isUnlimited,
    dailyLimit,
    /** @deprecated use syncQuotaAfterGeneration */
    recordGeneration: () => {
      if (isMockAiLogoMode()) {
        const cid = authStore.customer?.id ?? null
        writeCount(cid, readCount(cid) + 1)
      }
    },
    syncQuotaAfterGeneration,
    resetQuotaSessionCache
  }
}
