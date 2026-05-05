import type { CustomLogo } from '@/services/logos/types'

function coerceIsAiGenerated(raw: unknown): boolean {
  if (raw === true || raw === 1 || raw === '1') return true
  if (typeof raw === 'string' && raw.toLowerCase() === 'true') return true
  return false
}

function extractAiPrompt(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.ai_user_prompt === 'string' && raw.ai_user_prompt.trim()) {
    return raw.ai_user_prompt
  }
  const meta = raw.ai_logo_meta
  if (!meta || typeof meta !== 'object') return undefined
  const metaPrompt = (meta as Record<string, unknown>).prompt
  if (typeof metaPrompt === 'string' && metaPrompt.trim()) {
    return metaPrompt
  }
  return undefined
}

/** Normalize `is_ai_generated` and prompt metadata from backend payloads. */
export function withNormalizedAiFlags<T extends CustomLogo>(logo: T): T {
  const r = logo as Record<string, unknown>
  const prompt = extractAiPrompt(r)
  return {
    ...logo,
    is_ai_generated: coerceIsAiGenerated(r.is_ai_generated),
    ...(prompt ? { ai_user_prompt: prompt } : {})
  } as T
}
