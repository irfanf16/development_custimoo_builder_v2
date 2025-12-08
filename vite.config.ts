import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide'
    }),
    vue(),
    tailwindcss(),
    Components({
      // Watch only our icon sources so Vue components stay manual
      dirs: [
        'src/icons/streamline/flex-line',
        'src/icons/streamline/flex-flat',
        'src/icons/other',
        'src/icons/other-fixed-color'
      ],
      types: [],
      resolvers: [
        IconsResolver({
          customCollections: ['flex-line', 'flex-flat', 'other', 'other-fixed-color'],
          componentPrefix: 'i'
        })
      ]
    }),
    Icons({
      compiler: 'vue3',
      defaultClass: 'align-middle',
      // Make SVGs tintable with Tailwind text-*
      customCollections: {
        'flex-line': FileSystemIconLoader('src/icons/streamline/flex-line', svg =>
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
        // Flat icons: two-tone fills; darker accent -> primary, lighter base -> secondary
        'flex-flat': FileSystemIconLoader('src/icons/streamline/flex-flat', svg =>
          svg
            // Normalize viewport sizing
            .replace(/<svg([^>]*)>/, '<svg$1 width="1em" height="1em">')
            // Map accent (dark blue) to primary
            .replace(/fill="#3c6de3"/gi, 'fill="var(--icon-primary, currentColor)"')
            .replace(/stroke="#3c6de3"/gi, 'stroke="var(--icon-primary, currentColor)"')
            // Map base (light blue) to secondary
            .replace(/fill="#7fb0f2"/gi, 'fill="var(--icon-secondary, currentColor)"')
            .replace(/stroke="#7fb0f2"/gi, 'stroke="var(--icon-secondary, currentColor)"')
        ),
        // Icons that can use primary/secondary colors but preserve explicit white
        other: FileSystemIconLoader('src/icons/other', svg =>
          svg
            // Normalize viewport sizing
            .replace(/<svg([^>]*)>/, '<svg$1 width="1em" height="1em">')
            // Allow authors to mark PRIMARY shapes explicitly
            .replace(/fill="currentColor"/gi, 'fill="var(--icon-primary, currentColor)"')
            // Primary color for strokes, but don't override none or white
            .replace(/stroke="(?!none|white)[^"]*"/gi, 'stroke="var(--icon-primary, currentColor)"')
            // Secondary color for fills, but don't override none, white, or explicit primary/currentColor
            .replace(
              /fill="(?!none|white|currentColor|var\(--icon-primary)[^"]*"/gi,
              'fill="var(--icon-secondary, currentColor)"'
            )
            // Handle partially transparent fills: keep explicit white/primary/currentColor as-is (opacity→1), otherwise make secondary
            .replace(/<([^>]*?)fill-opacity="(?:0?\.[0-9]+)"([^>]*?)>/gi, (full, pre, post) => {
              if (
                /fill="white"/i.test(full) ||
                /fill="currentColor"/i.test(full) ||
                /fill="var\(--icon-primary/i.test(full)
              ) {
                return full.replace(/fill-opacity="(?:0?\.[0-9]+)"/i, 'fill-opacity="1"')
              }
              return `<${pre}fill="var(--icon-secondary, currentColor)" fill-opacity="1"${post}>`
            })
            // Handle partially transparent strokes: keep explicit white/primary/currentColor as-is (opacity→1), otherwise make secondary
            .replace(/<([^>]*?)stroke-opacity="(?:0?\.[0-9]+)"([^>]*?)>/gi, (full, pre, post) => {
              if (
                /stroke="white"/i.test(full) ||
                /stroke="currentColor"/i.test(full) ||
                /stroke="var\(--icon-primary/i.test(full)
              ) {
                return full.replace(/stroke-opacity="(?:0?\.[0-9]+)"/i, 'stroke-opacity="1"')
              }
              return `<${pre}stroke="var(--icon-secondary, currentColor)" stroke-opacity="1"${post}>`
            })
            // Generic opacity: treat as secondary unless white or primary/currentColor is explicitly set
            .replace(/<([^>]*?)opacity="(?:0?\.[0-9]+)"([^>]*?)>/gi, (full, pre, post) => {
              if (
                /(fill|stroke)="white"/i.test(full) ||
                /(fill|stroke)="currentColor"/i.test(full) ||
                /(fill|stroke)="var\(--icon-primary/i.test(full)
              ) {
                return full.replace(/opacity="(?:0?\.[0-9]+)"/i, 'opacity="1"')
              }
              return `<${pre}fill="var(--icon-secondary, currentColor)" opacity="1"${post}>`
            })
        ),
        // Icons with fixed colors; keep original fills/strokes, only normalize sizing
        'other-fixed-color': FileSystemIconLoader('src/icons/other-fixed-color', svg =>
          svg.replace(/<svg([^>]*)>/, '<svg$1 width="1em" height="1em">')
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
    'process.env': {},
    // Inject app version from package.json at build time
    __APP_VERSION__: JSON.stringify(
      (
        JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
          version: string
        }
      ).version
    )
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
