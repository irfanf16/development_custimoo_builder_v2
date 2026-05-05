import axios from 'axios'
import http from '@/services/api'
import type { CustomLogo } from '@/services/logos/types'
import { withNormalizedAiFlags } from '@/services/logos/normalize-customer-logo-ai'

/** Minimal PNG (1x1 px) placeholder for mocked AI logo responses. */
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export type AILogoMode = 'generate' | 'refine' | 'shuffle'

export interface GenerateAILogoOptions {
  /** Plain user prompt (moods are sent separately except in mock mode). */
  prompt: string
  /** Valid API mood slugs: bold, modern, flat, etc. */
  moods?: string[]
  /** Raw base64 image bytes (no data URL prefix). Used with generate-logo as reference_image. */
  referenceB64?: string | null
  /** Public URL the backend can GET (e.g. CDN). Mutually exclusive with reference file in API. */
  referenceImageUrl?: string | null
  /**
   * Existing customer logo id used only on POST ai/generate-logo (e.g. recent logo as style reference).
   * Mutually exclusive with `referenceImageUrl` / `referenceB64` for the generate path.
   */
  referenceCustomerLogoId?: number | null
  /** When set, calls POST ai/refine-logo or ai/redesign-logo based on mode. */
  customerLogoId?: number
  mode?: AILogoMode
}

const AI_TIMEOUT_MS = 180_000

type ApiEnvelope = {
  success?: boolean
  message?: string
  result?: {
    customer_logo?: unknown
    /** Present after successful generate/refine/redesign; `null` means unlimited quota on backend */
    remaining_quota?: number | null
    /** Backward compatibility for occasional backend typo payloads. */
    remainig_quota?: number | null
  }
  /** Backward compatibility for envelopes that place quota at root. */
  remaining_quota?: number | null
  remainig_quota?: number | null
  errors?: unknown
  status_code?: number
}

export type GenerateAILogoResult = {
  logo: CustomLogo | Blob
  /** From API after successful request; omitted in mock mode */
  remainingQuota?: number | null
}

/**
 * AI endpoints return `logo_url` (relative S3 path); the customizer expects `url` like upload APIs.
 * @see generate / redesign JSON: result.customer_logo
 */
function normalizeAiCustomerLogo(raw: unknown): CustomLogo {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid response: missing customer_logo')
  }
  const r = raw as Record<string, unknown>
  const path =
    (typeof r.logo_url === 'string' && r.logo_url) || (typeof r.url === 'string' && r.url) || ''
  if (!path) {
    throw new Error('Invalid customer_logo: missing logo_url')
  }

  return withNormalizedAiFlags({
    ...r,
    url: path,
    logo_colors: Array.isArray(r.logo_colors) ? (r.logo_colors as CustomLogo['logo_colors']) : [],
    logo_name: typeof r.logo_name === 'string' ? r.logo_name : '',
    logo_technology: (r.logo_technology as CustomLogo['logo_technology']) ?? null
  } as unknown as CustomLogo)
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function mockPlaceholderBlob(): Blob {
  return base64ToBlob(PLACEHOLDER_PNG_BASE64, 'image/png')
}

export function shouldUseMockAiLogo(): boolean {
  const mock = import.meta.env.VITE_AI_LOGO_MOCK as string | boolean | undefined
  if (mock === 'true' || mock === true) return true
  const base = import.meta.env.VITE_API_ENDPOINT as string | undefined
  return !base || String(base).trim() === ''
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function appendMoods(form: FormData, moods: string[] | undefined): void {
  if (!moods?.length) return
  moods.forEach((m, i) => {
    if (m) form.append(`mood[${i}]`, m)
  })
}

function extractApiMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'AI logo request failed'
  const d = data as ApiEnvelope & { error?: string }
  if (typeof d.message === 'string' && d.message) return d.message
  const errs = d.errors
  if (Array.isArray(errs) && errs.length > 0) return String(errs[0])
  if (errs && typeof errs === 'object' && !Array.isArray(errs)) {
    const first = Object.values(errs as Record<string, unknown>).flat()[0]
    if (first !== undefined && first !== null) {
      return typeof first === 'string' ? first : JSON.stringify(first)
    }
  }
  if (typeof d.error === 'string') return d.error
  return 'AI logo request failed'
}

function parseCustomerLogo(data: ApiEnvelope): CustomLogo {
  return normalizeAiCustomerLogo(data.result?.customer_logo)
}

function remainingQuotaFromEnvelope(data: ApiEnvelope): number | null | undefined {
  const rq =
    data.result?.remaining_quota ??
    data.result?.remainig_quota ??
    data.remaining_quota ??
    data.remainig_quota
  if (rq === undefined) return undefined
  if (rq === null) return null
  return typeof rq === 'number' ? rq : Number(rq)
}

async function postGenerateLogo(form: FormData): Promise<GenerateAILogoResult> {
  try {
    const { data, status } = await http.post<ApiEnvelope>('ai/generate-logo', form, {
      timeout: AI_TIMEOUT_MS
    })
    if (status !== 200 && status !== 201) {
      throw new Error(extractApiMessage(data))
    }
    if (data.success === false) {
      throw new Error(extractApiMessage(data))
    }
    return {
      logo: parseCustomerLogo(data),
      remainingQuota: remainingQuotaFromEnvelope(data)
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const msg = extractApiMessage(e.response?.data ?? e.message)
      throw new Error(msg)
    }
    throw e instanceof Error ? e : new Error(String(e))
  }
}

async function postRedesignLogo(form: FormData): Promise<GenerateAILogoResult> {
  try {
    const { data, status } = await http.post<ApiEnvelope>('ai/redesign-logo', form, {
      timeout: AI_TIMEOUT_MS
    })
    if (status !== 200 && status !== 201) {
      throw new Error(extractApiMessage(data))
    }
    if (data.success === false) {
      throw new Error(extractApiMessage(data))
    }
    return {
      logo: parseCustomerLogo(data),
      remainingQuota: remainingQuotaFromEnvelope(data)
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const msg = extractApiMessage(e.response?.data ?? e.message)
      throw new Error(msg)
    }
    throw e instanceof Error ? e : new Error(String(e))
  }
}

async function postRefineLogo(form: FormData): Promise<GenerateAILogoResult> {
  try {
    const { data, status } = await http.post<ApiEnvelope>('ai/refine-logo', form, {
      timeout: AI_TIMEOUT_MS
    })
    if (status !== 200 && status !== 201) {
      throw new Error(extractApiMessage(data))
    }
    if (data.success === false) {
      throw new Error(extractApiMessage(data))
    }
    return {
      logo: parseCustomerLogo(data),
      remainingQuota: remainingQuotaFromEnvelope(data)
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const msg = extractApiMessage(e.response?.data ?? e.message)
      throw new Error(msg)
    }
    throw e instanceof Error ? e : new Error(String(e))
  }
}

/**
 * Generates, refines, or redesigns a logo via V2 AI endpoints.
 * Returns `CustomLogo` from the API when not mocked; otherwise a placeholder `Blob`.
 */
export async function generateAILogo(
  options: GenerateAILogoOptions
): Promise<GenerateAILogoResult> {
  if (shouldUseMockAiLogo()) {
    await delay(400)
    return { logo: mockPlaceholderBlob(), remainingQuota: undefined }
  }

  const moods = options.moods?.filter(Boolean) ?? []
  const prompt = options.prompt.trim()

  if (!options.customerLogoId && !prompt) {
    throw new Error('A prompt is required to generate a logo.')
  }

  // --- Refine/Redesign (existing customer logo on server) ---
  if (options.customerLogoId != null) {
    const form = new FormData()
    form.append('customer_logo_id', String(options.customerLogoId))
    if (prompt) form.append('prompt', prompt)
    appendMoods(form, moods)
    if (options.mode === 'refine') return await postRefineLogo(form)
    return await postRedesignLogo(form)
  }

  // --- Generate (new logo; optional reference via server id, URL, or upload) ---
  const form = new FormData()
  form.append('prompt', prompt)
  appendMoods(form, moods)

  const refId = options.referenceCustomerLogoId
  if (refId != null && Number.isFinite(refId)) {
    form.append('customer_logo_id', String(refId))
  } else {
    const url = options.referenceImageUrl?.trim()
    if (url) {
      form.append('reference_image_url', url)
    } else if (options.referenceB64) {
      const blob = base64ToBlob(options.referenceB64, 'image/png')
      form.append('reference_image', new File([blob], 'reference.png', { type: 'image/png' }))
    }
  }

  return await postGenerateLogo(form)
}
