import { paraglideVitePlugin } from '@inlang/paraglide-js'
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
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide'
    }),
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
          // - Secondary layers use var(--icon-secondary, currentColor)
          svg
            .replace(/<svg([^>]*)>/, '<svg$1 width="1em" height="1em">')
            // Strokes are primary
            .replace(
              /stroke="[^"]*"/g,
              'stroke="var(--icon-primary, currentColor)"'
            )
            // All non-none fills are secondary; keep fill="none" untouched
            .replace(
              /fill="(?!none)[^"]*"/g,
              'fill="var(--icon-secondary, currentColor)"'
            )
            // Treat partially opaque layers as secondary color
            .replace(
              /opacity="(?:0?\.[0-9]+)"/g,
              'fill="var(--icon-secondary, currentColor)" opacity="1"'
            )
            .replace(
              /fill-opacity="(?:0?\.[0-9]+)"/g,
              'fill="var(--icon-secondary, currentColor)" fill-opacity="1"'
            )
            .replace(
              /stroke-opacity="(?:0?\.[0-9]+)"/g,
              'stroke="var(--icon-secondary, currentColor)" stroke-opacity="1"'
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
