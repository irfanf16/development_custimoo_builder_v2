import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_RuJINHHei9fk6KyeZxbp1NYOUdZfZvvVFyl5Wpdanl5', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2025-11-30',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    capture_exceptions: {
      capture_unhandled_errors: true, // default
      capture_unhandled_rejections: true, // default
      capture_console_errors: false // default
    }
  })

  return { posthog }
}
