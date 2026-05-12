import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        '**/*.d.ts',
        'src/paraglide/**',
        'src/icons/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/**/*.generated.ts',
        'src/vite-env.d.ts'
      ],
      reporter: ['text', 'html']
    }
  }
})
