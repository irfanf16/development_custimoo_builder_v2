import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      resolvers: [
        IconsResolver({
          customCollections: ['flex-line', 'flex-duo'],
          componentPrefix: 'i'
        })
      ]
    }),
    Icons({
      compiler: 'vue3',
      defaultClass: 'align-middle',
      // Make SVGs tintable with Tailwind text-*
      customCollections: {
        'flex-line': FileSystemIconLoader(
          'src/icons/streamline/flex-line',
          svg =>
            svg
              // Ensure lines pick up currentColor
              .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
              // Avoid unexpected fills on line icons
              .replace(/fill="[^"]*"/g, 'fill="none"')
              .replace(
                '<svg',
                '<svg stroke="currentColor" fill="none" stroke-width="1.5" width="1em" height="1em"'
              )
        ),
        'flex-duo': FileSystemIconLoader('src/icons/streamline/flex-duo', svg =>
          // Strategy:
          // - Default to primary = currentColor
          // - Anything with opacity gets treated as secondary
          //   (works well for most duo icons; adjust if needed)
          svg
            .replace(/<svg([^>]*)>/, '<svg$1 width="1em" height="1em">')
            .replace(
              /fill="[^"]*"/g,
              'fill="var(--icon-primary, currentColor)"'
            )
            .replace(
              /stroke="[^"]*"/g,
              'stroke="var(--icon-primary, currentColor)"'
            )
            .replace(
              /opacity="0\.[0-9]+"/g,
              'fill="var(--icon-secondary, currentColor)" opacity="1"'
            )
        )
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'process.env': {}
  },
  publicDir: 'public',

  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
      name: 'CustomizerWidget',
      fileName: 'widget',
      formats: ['es']
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'widget.js',
        chunkFileNames: 'widget.js',
        assetFileNames: 'widget.[ext]'
      }
    }
  },
  server: {
    port: 3001
  }
})
