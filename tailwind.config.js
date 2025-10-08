/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './public/**/*.html'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        brand: [
          'var(--font-brand)',
          'var(--font-sans)',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'var(--font-sans)',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      }
      // Keyframes and animations are now defined in CSS using @theme directive
      // See src/widget-styles.css for all animation definitions
    }
  },
  plugins: [require('tailwindcss-animate')],
  // Ensure proper CSS variable handling for Tailwind CSS 4
  future: {
    hoverOnlyWhenSupported: true
  }
}
