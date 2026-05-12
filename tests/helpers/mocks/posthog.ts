import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// posthog-js stub
// Imported via `import posthog from 'posthog-js'` in
//   src/composables/usePostHog.js  and  src/composables/useTryCatchApi.ts
// ---------------------------------------------------------------------------

const posthog = {
  init: vi.fn(),
  capture: vi.fn(),
  captureException: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  alias: vi.fn(),
  group: vi.fn(),
  setPersonProperties: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  has_opted_in_capturing: vi.fn(() => false),
  has_opted_out_capturing: vi.fn(() => false),
  get_distinct_id: vi.fn(() => 'test-distinct-id'),
  get_session_id: vi.fn(() => 'test-session-id'),
  isFeatureEnabled: vi.fn(() => false),
  getFeatureFlag: vi.fn(() => undefined),
  onFeatureFlags: vi.fn(),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
  debug: vi.fn()
}

export default posthog
export { posthog }
