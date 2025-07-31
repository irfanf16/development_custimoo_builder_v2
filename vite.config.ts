import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        widget: fileURLToPath(new URL('./src/main.ts', import.meta.url))
      },
      output: {
        inlineDynamicImports: false,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    cssCodeSplit: false
  },
  server: {
    port: 3001
  }
})
