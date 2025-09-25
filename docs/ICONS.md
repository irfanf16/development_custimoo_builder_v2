## Icons Guide (Lucide, Flex Flat, Flex Line)

This project uses three icon sources:

- **Lucide** (via `lucide-vue-next`)
- **Streamline Flex Flat** (two‑tone) — bundled in full
- **Streamline Flex Line** (outline) — tree‑shaken (only used icons are bundled)

Vite is configured with `unplugin-icons` to load Streamline SVGs as Vue components that render inline SVG and support Tailwind colors.

### Where icons live

- Streamline Flex Flat SVGs: `src/icons/streamline/flex-flat/`
- Streamline Flex Line SVGs: `src/icons/streamline/flex-line/`

### Official Streamline catalogs

- Flex Flat: https://www.streamlinehq.com/icons/flex
- Flex Line: https://www.streamlinehq.com/icons/flex-line

### Naming and usage (Streamline → Vue components)

- Components are auto‑generated with the pattern: `i-{collection}-{file-name-without-.svg}`
- File names must be lowercase kebab‑case. Examples:
  - `src/icons/streamline/flex-line/paint-palette.svg` → `<i-flex-line-paint-palette />`
  - `src/icons/streamline/flex-flat/football.svg` → `<i-flex-flat-football />`

### Quick add (Streamline icons)

1. Find an icon in the official catalog and download the SVG.
2. Save it into the correct folder:
   - Flex Flat → `src/icons/streamline/flex-flat/`
   - Flex Line → `src/icons/streamline/flex-line/`
3. Rename the file to lowercase kebab‑case. Example: `Paint-Palette.svg` → `paint-palette.svg`.
4. Use it in Vue:
   - Flex Line: `<i-flex-line-{file-name} />`
   - Flex Flat: `<i-flex-flat-{file-name} />`
5. If a Flat icon must be always bundled (not tree‑shaken), import it in `src/icons/flex-flat-categories.ts`.

### Coloring and sizing

- All icons render as inline SVG and follow `currentColor`.
- Use Tailwind `text-*` utilities for color and `size-*/w-*/h-*` for size.
- Flex Line (outline): stroke uses `currentColor` (monochrome by default).
- Flex Flat (two‑tone):
  - Primary layer: `var(--icon-primary, currentColor)` → inherits from `text-*`.
  - Secondary layer: `var(--icon-secondary, currentColor)` → set this CSS variable to see the second tone. Defaults to the same as primary if not set (appears monochrome).

Examples:

```vue
<!-- Flex Line (outline, tree-shaken) -->
<i-flex-line-paint-palette class="size-5 text-blue-600" />

<!-- Flex Flat (two-tone, fully bundled) -->
<i-flex-flat-football
  class="size-6 text-emerald-600"
  style="--icon-secondary:#a7f3d0"
/>
```

#### Flex Flat secondary color tips

- Per‑icon (inline):

  ```vue
  <i-flex-flat-tennis
    class="size-5 text-green-600"
    style="--icon-secondary:#b7f7c2"
  />
  ```

- Derived from the primary color (keeps harmony):

  ```vue
  <i-flex-flat-cycling
    class="size-5 text-blue-600"
    :style="{
      '--icon-secondary': 'color-mix(in oklab, currentColor 60%, white)'
    }"
  />
  ```

- Themed (apply to a wrapper so all Flat icons inside get the same secondary):
  ```html
  <div class="[&_*]:text-emerald-600" style="--icon-secondary:#a7f3d0">
    <!-- any i-flex-flat-* inside uses this secondary color -->
  </div>
  ```

### Streamline Flex Flat (bundled in full)

- All Flex Flat icons are force‑included by importing a registry once in `src/bootstrap.ts`:
  - `import '@/icons/flex-flat-categories'`
- That file imports every `virtual:icons/flex-flat/*` icon so none are tree‑shaken.
- You can still use them ad‑hoc in templates with the `i-flex-flat-*` component names.

### Streamline Flex Line (tree‑shaken)

- Only the icons you reference are bundled. Use the `i-flex-line-*` components.
- To add a new Flex Line icon: drop its SVG in `src/icons/streamline/flex-line/` and use the mapped component name.

### Lucide

- Install is already present: `lucide-vue-next`.
- Import only what you use to keep bundles small:

```vue
<script setup lang="ts">
  import { Dumbbell } from 'lucide-vue-next'
</script>

<template>
  <Dumbbell class="size-5 text-zinc-700" :stroke-width="1.5" />
</template>
```

### Troubleshooting

- **TS error: Cannot find module 'virtual:icons/...':**
  - Ensure `src/types/virtual-icons.d.ts` exists.
  - Restart the dev server.
- **Vite error: Icon `flex-line/...` not found:** check the SVG file exists.
- **Linux/macOS mismatch**: filenames must be lowercase.
- **Flex Flat looks monochrome:** set `--icon-secondary` (see examples above).
- **Bundle size concerns:** Flat is fully bundled; Line is tree‑shaken.

### References

- Vite plugin config: `vite.config.ts` (custom collections: `flex-line`, `flex-flat`)
- Flat registry: `src/icons/flex-flat-categories.ts` (forces full Flat bundle)
- Tooltip portal target: `src/bootstrap.ts` (`__CUSTOMIZER_CONTAINER__`)
